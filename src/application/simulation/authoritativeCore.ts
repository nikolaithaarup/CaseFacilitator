import type { CaseScenario, HlrLevel } from "../../domain/cases/types";
import { applySimulationCommand, createSimulationState } from "../../domain/simulation/engine";
import type { SimulationState } from "../../domain/simulation/types";
import type { CoreSession } from "../session/sessionCore";
import { mayControlPatient } from "../session/sessionCore";
import {
  AUTHORITATIVE_EVENT_SCHEMA_VERSION,
  compareAuthoritativeEvents,
  type AuthoritativeSimulationEvent,
  type AuthoritativeSnapshot,
  type EventAcknowledgement,
} from "./events";

const ALLOWED_MONITOR_TYPES = new Set([
  "DEFIB_SAT", "DEFIB_NIBP", "DEFIB_ETCO2", "DEFIB_BS", "DEFIB_TEMP",
  "DEFIB_EKG4", "DEFIB_EKG12", "DEFIB_CHARGE", "DEFIB_SHOCK",
]);
const MAX_PAYLOAD_BYTES = 8_192;
const MAX_LATE_MS = 5 * 60 * 1_000;

export interface ProcessedAuthoritativeState {
  snapshot: AuthoritativeSnapshot;
  events: readonly AuthoritativeSimulationEvent[];
  acknowledgements: readonly EventAcknowledgement[];
  transitionFeedback: readonly string[];
}

export class AuthoritativeSimulationCore {
  private events: AuthoritativeSimulationEvent[] = [];
  private state: SimulationState;
  private acknowledgements: EventAcknowledgement[] = [];
  private feedback: string[] = [];

  constructor(
    private readonly session: CoreSession,
    private readonly scenario: CaseScenario,
    private readonly hlrMode: HlrLevel,
  ) {
    if (session.hlrMode !== hlrMode) throw new Error("HLR mode mismatch; no silent fallback is allowed");
    this.state = createSimulationState(scenario);
  }

  ingest(event: AuthoritativeSimulationEvent, processedAtEpochMs = Date.now()): EventAcknowledgement {
    const rejection = this.validate(event);
    if (rejection) return this.ack(event, "REJECTED", rejection, processedAtEpochMs);
    if (this.events.some((item) => item.idempotencyKey === event.idempotencyKey)) {
      return this.ack(event, "DUPLICATE", "IDEMPOTENCY_KEY_ALREADY_PROCESSED", processedAtEpochMs);
    }
    const newest = this.events.at(-1)?.createdAtEpochMs ?? 0;
    if (newest && event.createdAtEpochMs < newest - MAX_LATE_MS) {
      return this.ack(event, "STALE", "EVENT_OUTSIDE_LATE_WINDOW", processedAtEpochMs);
    }
    this.events = [...this.events, event].sort(compareAuthoritativeEvents);
    try {
      this.rebuild();
      return this.ack(event, "ACCEPTED", undefined, processedAtEpochMs);
    } catch {
      this.events = this.events.filter((item) => item.eventId !== event.eventId);
      this.rebuild();
      return this.ack(event, "REJECTED", "INVALID_SIMULATION_TRANSITION", processedAtEpochMs);
    }
  }

  restore(events: readonly AuthoritativeSimulationEvent[]): void {
    this.events = [];
    this.acknowledgements = [];
    for (const event of [...events].sort(compareAuthoritativeEvents)) this.ingest(event, event.createdAtEpochMs);
  }

  current(): ProcessedAuthoritativeState {
    return {
      snapshot: {
        schemaVersion: 1,
        fictional: true,
        sessionId: this.session.sessionId,
        fictionalPatientId: this.session.fictionalPatientId,
        scenarioId: this.scenario.id,
        simulationState: this.state,
        hlrMode: this.hlrMode,
        processedIdempotencyKeys: this.events.map((event) => event.idempotencyKey),
        lastCreatedAtEpochMs: this.events.at(-1)?.createdAtEpochMs ?? 0,
      },
      events: this.events,
      acknowledgements: this.acknowledgements,
      transitionFeedback: this.feedback,
    };
  }

  private validate(event: AuthoritativeSimulationEvent): string | null {
    if (event.schemaVersion !== AUTHORITATIVE_EVENT_SCHEMA_VERSION || event.fictional !== true) return "INVALID_SCHEMA";
    if (event.sessionId !== this.session.sessionId || event.fictionalPatientId !== this.session.fictionalPatientId) return "WRONG_SESSION_OR_PATIENT";
    if (!event.eventId || !event.idempotencyKey || !event.correlationId || JSON.stringify(event.payload).length > MAX_PAYLOAD_BYTES) return "MALFORMED_EVENT";
    const member = this.session.members[event.actorId];
    if (!member?.active || member.role !== event.actorRole) return "ACTOR_NOT_AUTHORIZED";
    if (event.eventType === "SIMULATION_COMMAND" && !mayControlPatient(this.session, event.actorId)) return "CONTROL_NOT_AUTHORIZED";
    if (event.eventType.startsWith("MONITOR") && event.actorRole !== "MONITOR_DEVICE") return "MONITOR_ROLE_REQUIRED";
    if (event.eventType.startsWith("MONITOR") && !ALLOWED_MONITOR_TYPES.has(String(event.payload.monitorType))) return "MONITOR_TYPE_NOT_ALLOWED";
    if (event.payload.monitorType === "DEFIB_SHOCK" && (this.session.lifecycle !== "ACTIVE" || event.payload.charged !== true)) return "SHOCK_NOT_VALIDATED";
    if (!event.payload.command) return "COMMAND_REQUIRED";
    return null;
  }

  private rebuild(): void {
    let state = createSimulationState(this.scenario);
    const feedback: string[] = [];
    for (const event of this.events) {
      const command = event.payload.command!;
      const transition = this.scenario.transitions.find(
        (item) => item.fromStateId === state.patient.id && item.actionId === command.actionId,
      );
      const result = applySimulationCommand(this.scenario, state, command);
      state = result.state;
      if (transition?.feedbackToFacilitator) feedback.push(transition.feedbackToFacilitator);
    }
    this.state = state;
    this.feedback = feedback;
  }

  private ack(
    event: AuthoritativeSimulationEvent,
    status: EventAcknowledgement["status"],
    reasonCode: string | undefined,
    processedAtEpochMs: number,
  ): EventAcknowledgement {
    const acknowledgement = {
      eventId: event.eventId,
      correlationId: event.correlationId,
      status,
      ...(reasonCode ? { reasonCode } : {}),
      processedAtEpochMs,
    };
    this.acknowledgements = [...this.acknowledgements, acknowledgement];
    return acknowledgement;
  }
}
