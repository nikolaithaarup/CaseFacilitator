import type { CaseScenario } from "../../../domain/cases/types";
import type { CoreSession } from "../../session/sessionCore";
import { AuthoritativeSimulationCore } from "../authoritativeCore";
import type { AuthoritativeSimulationEvent } from "../events";

const scenario: CaseScenario = {
  id: "fictional-case-a", title: "Fictional", subtitle: "", dispatchText: "",
  schoolPeriods: [1], acuity: "AKUT", difficulty: 1, diagnosis: "Hidden fictional",
  actionDiagnoses: [], caseType: "HLR", category: "HLR", meta: { hlrLevel: "ALS" },
  patientInfo: { age: 50, sex: "M", chiefComplaint: "Fictional", history: "", meds: [] },
  initialStateId: "S0",
  states: [
    { id: "S0", vitals: { hr: 100, rr: 20, btSys: 100, btDia: 60, spo2: 90 }, abcde: { A: "", B: "", C: "", D: "", E: "" } },
    { id: "S1", vitals: { hr: 90, rr: 18, btSys: 110, btDia: 65, spo2: 94 }, abcde: { A: "", B: "better", C: "", D: "", E: "" } },
    { id: "S2", vitals: { hr: 80, rr: 16, btSys: 120, btDia: 70, spo2: 98 }, abcde: { A: "", B: "best", C: "", D: "", E: "" } },
  ],
  transitions: [
    { id: "t1", fromStateId: "S0", toStateId: "S1", actionId: "ACTION_1", feedbackToFacilitator: "First feedback" },
    { id: "t2", fromStateId: "S1", toStateId: "S2", actionId: "ACTION_2", feedbackToFacilitator: "Second feedback" },
  ], expectedActions: [],
};

const session = (): CoreSession => ({
  schemaVersion: 1, fictional: true, sessionId: "session-a",
  fictionalPatientId: "fictional-patient-a", organisationId: "fictional-org-a",
  leadInstructorUid: "lead-a", lifecycle: "ACTIVE", hlrMode: "ALS", focus: "ALL",
  capacity: { assistantInstructors: 1, learnerUnits: 1, monitorDevices: 1 },
  members: {
    "lead-a": { uid: "lead-a", role: "INSTRUCTOR_LEAD", active: true, joinedAtEpochMs: 1 },
    "assistant-a": { uid: "assistant-a", role: "INSTRUCTOR_ASSISTANT", active: true, joinedAtEpochMs: 1 },
    "learner-a": { uid: "learner-a", role: "LEARNER_UNIT", active: true, joinedAtEpochMs: 1 },
    "monitor-a": { uid: "monitor-a", role: "MONITOR_DEVICE", active: true, joinedAtEpochMs: 1 },
    "revoked-monitor": { uid: "revoked-monitor", role: "MONITOR_DEVICE", active: false, joinedAtEpochMs: 1 },
  },
});

function event(overrides: Partial<AuthoritativeSimulationEvent> = {}): AuthoritativeSimulationEvent {
  return {
    schemaVersion: 1, fictional: true, eventId: "event-1", sessionId: "session-a",
    fictionalPatientId: "fictional-patient-a", eventType: "SIMULATION_COMMAND",
    actorRole: "INSTRUCTOR_LEAD", actorId: "lead-a", correlationId: "corr-1",
    createdAtEpochMs: 100, idempotencyKey: "key-1",
    payload: { command: { type: "ACTION", commandId: "cmd-1", actionId: "ACTION_1", occurredAtMs: 100, description: "Action" } },
    ...overrides,
  };
}

describe("authoritative simulation", () => {
  it("processes idempotently and exposes transition feedback", () => {
    const core = new AuthoritativeSimulationCore(session(), scenario, "ALS");
    expect(core.ingest(event()).status).toBe("ACCEPTED");
    expect(core.ingest({ ...event(), eventId: "event-duplicate" }).status).toBe("DUPLICATE");
    expect(core.current().snapshot.simulationState.patient.id).toBe("S1");
    expect(core.current().snapshot.simulationState.revision).toBe(1);
    expect(core.current().transitionFeedback).toEqual(["First feedback"]);
  });

  it("orders events deterministically and reconstructs on reconnect", () => {
    const second = event({
      eventId: "event-2", correlationId: "corr-2", idempotencyKey: "key-2", createdAtEpochMs: 200,
      payload: { command: { type: "ACTION", commandId: "cmd-2", actionId: "ACTION_2", occurredAtMs: 200, description: "Second" } },
    });
    const core = new AuthoritativeSimulationCore(session(), scenario, "ALS");
    core.restore([second, event()]);
    expect(core.current().events.map((item) => item.eventId)).toEqual(["event-1", "event-2"]);
    expect(core.current().snapshot.simulationState.patient.id).toBe("S2");
    const restored = new AuthoritativeSimulationCore(session(), scenario, "ALS");
    restored.restore(core.current().events);
    expect(restored.current().snapshot).toEqual(core.current().snapshot);
  });

  it("rejects malformed and unauthorized events", () => {
    const core = new AuthoritativeSimulationCore(session(), scenario, "ALS");
    expect(core.ingest(event({ sessionId: "other" })).status).toBe("REJECTED");
    expect(core.ingest(event({ actorId: "learner-a", actorRole: "LEARNER_UNIT" })).status).toBe("REJECTED");
    expect(core.ingest(event({ actorId: "revoked-monitor", actorRole: "MONITOR_DEVICE" })).status).toBe("REJECTED");
  });

  it("accepts authorized realtime monitor events and validates shock", () => {
    const core = new AuthoritativeSimulationCore(session(), scenario, "ALS");
    const monitor = event({
      eventType: "MONITOR_OBSERVATION", actorId: "monitor-a", actorRole: "MONITOR_DEVICE",
      payload: { monitorType: "DEFIB_SAT", value: 94, unit: "%", command: { type: "DEFIBRILLATOR", commandId: "m1", actionId: "ACTION_1", occurredAtMs: 100, description: "SpO2" } },
    });
    expect(core.ingest(monitor).status).toBe("ACCEPTED");
    const shock = event({
      eventId: "shock", idempotencyKey: "shock-key", eventType: "MONITOR_ACTION",
      actorId: "monitor-a", actorRole: "MONITOR_DEVICE",
      payload: { monitorType: "DEFIB_SHOCK", charged: false, command: { type: "DEFIBRILLATOR", commandId: "shock", actionId: "DEFIB_SHOCK", occurredAtMs: 200, description: "Shock" } },
    });
    expect(core.ingest(shock).reasonCode).toBe("SHOCK_NOT_VALIDATED");
  });

  it("does not silently downgrade ALS to BLS", () => {
    expect(() => new AuthoritativeSimulationCore(session(), scenario, "BLS")).toThrow("no silent fallback");
  });
});
