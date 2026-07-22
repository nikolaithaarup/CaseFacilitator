import type { SimulationCommand, SimulationState } from "../../domain/simulation/types";
import type { FacilitatorRole } from "../../security/roles";

export const AUTHORITATIVE_EVENT_SCHEMA_VERSION = 1 as const;

export type AuthoritativeEventType =
  | "SIMULATION_COMMAND"
  | "MONITOR_OBSERVATION"
  | "MONITOR_ACTION";

export interface AuthoritativeSimulationEvent {
  schemaVersion: typeof AUTHORITATIVE_EVENT_SCHEMA_VERSION;
  fictional: true;
  eventId: string;
  sessionId: string;
  fictionalPatientId: string;
  eventType: AuthoritativeEventType;
  actorRole: FacilitatorRole;
  actorId: string;
  correlationId: string;
  createdAtEpochMs: number;
  clientCreatedAtEpochMs?: number;
  idempotencyKey: string;
  payload: {
    command?: SimulationCommand;
    monitorType?: string;
    value?: string | number | boolean;
    unit?: string;
    charged?: boolean;
  };
}

export interface EventAcknowledgement {
  eventId: string;
  correlationId: string;
  status: "ACCEPTED" | "REJECTED" | "DUPLICATE" | "STALE";
  reasonCode?: string;
  processedAtEpochMs: number;
}

export interface AuthoritativeSnapshot {
  schemaVersion: 1;
  fictional: true;
  sessionId: string;
  fictionalPatientId: string;
  scenarioId: string;
  simulationState: SimulationState;
  hlrMode: "BLS" | "ALS";
  processedIdempotencyKeys: readonly string[];
  lastCreatedAtEpochMs: number;
}

export function compareAuthoritativeEvents(
  left: AuthoritativeSimulationEvent,
  right: AuthoritativeSimulationEvent,
): number {
  return left.createdAtEpochMs - right.createdAtEpochMs || left.eventId.localeCompare(right.eventId);
}
