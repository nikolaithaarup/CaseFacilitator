import { normalizeCaseScenario } from "../../cases/normalize";
import type { CaseScenario } from "../../cases/types";
import { applySimulationCommand, createSimulationState } from "../engine";

const scenario: CaseScenario = {
  id: "case-1",
  title: "Test case",
  subtitle: "",
  dispatchText: "",
  schoolPeriods: [1],
  acuity: "AKUT",
  difficulty: 1,
  diagnosis: "Test",
  actionDiagnoses: [],
  caseType: "TEST",
  category: "MEDICAL",
  patientInfo: {
    age: 50,
    sex: "M",
    chiefComplaint: "Test",
    history: "",
    meds: [],
  },
  initialStateId: "S0",
  states: [
    {
      id: "S0",
      vitals: { hr: 100, rr: 20, btSys: 100, btDia: 60, spo2: 92 },
      abcde: { A: "", B: "", C: "", D: "", E: "" },
    },
    {
      id: "S1",
      vitals: { hr: 80, rr: 16, btSys: 120, btDia: 70, spo2: 97 },
      abcde: { A: "", B: "Improved", C: "", D: "", E: "" },
    },
  ],
  transitions: [
    {
      id: "oxygen-improves",
      fromStateId: "S0",
      toStateId: "S1",
      actionId: "MED_OXYGEN",
      feedbackToFacilitator: "",
    },
  ],
  expectedActions: [],
};

describe("simulation engine", () => {
  it("applies a valid state transition and emits resulting events", () => {
    const result = applySimulationCommand(scenario, createSimulationState(scenario), {
      type: "ACTION",
      commandId: "cmd-1",
      actionId: "MED_OXYGEN",
      occurredAtMs: 1000,
      description: "Give oxygen",
    });

    expect(result.state.patient.id).toBe("S1");
    expect(result.state.revision).toBe(1);
    expect(result.events.map((event) => event.type)).toEqual([
      "ACTION_APPLIED",
      "PATIENT_STATE_CHANGED",
      "PATIENT_VITALS_CHANGED",
    ]);
  });

  it("records an action with no transition without changing patient state", () => {
    const result = applySimulationCommand(scenario, createSimulationState(scenario), {
      type: "ACTION",
      commandId: "cmd-2",
      actionId: "A_LOOK",
      occurredAtMs: 2000,
      description: "Look",
    });

    expect(result.state.patient.id).toBe("S0");
    expect(result.state.revision).toBe(1);
    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toMatchObject({
      type: "ACTION_APPLIED",
      transitionApplied: false,
    });
  });

  it("uses the same transition semantics for medication commands", () => {
    const result = applySimulationCommand(scenario, createSimulationState(scenario), {
      type: "MEDICATION",
      commandId: "cmd-3",
      actionId: "MED_OXYGEN",
      occurredAtMs: 3000,
      description: "Medication",
      metadata: { oxygenFlow: 10 },
    });

    expect(result.state.patient.id).toBe("S1");
    expect(result.events[0]).toMatchObject({ commandType: "MEDICATION" });
  });

  it("increments revisions for each accepted command", () => {
    const first = applySimulationCommand(scenario, createSimulationState(scenario), {
      type: "ACTION",
      commandId: "cmd-4",
      actionId: "A_LOOK",
      occurredAtMs: 1,
      description: "Look",
    });
    const second = applySimulationCommand(scenario, first.state, {
      type: "ACTION",
      commandId: "cmd-5",
      actionId: "A_LISTEN",
      occurredAtMs: 2,
      description: "Listen",
    });

    expect(second.state.revision).toBe(2);
  });

  it("emits the exact vital fields changed by a transition", () => {
    const result = applySimulationCommand(scenario, createSimulationState(scenario), {
      type: "ACTION",
      commandId: "cmd-6",
      actionId: "MED_OXYGEN",
      occurredAtMs: 1,
      description: "Oxygen",
    });
    const event = result.events.find((candidate) => candidate.type === "PATIENT_VITALS_CHANGED");

    expect(event).toMatchObject({
      changedFields: ["hr", "rr", "btSys", "btDia", "spo2"],
    });
  });
});

describe("case normalization", () => {
  it("maps tempC and safely preserves unavailable legacy monitor values", () => {
    const normalized = normalizeCaseScenario({
      ...scenario,
      states: [
        {
          id: "S0",
          vitals: {
            hr: 90,
            rr: 18,
            btSys: 110,
            btDia: 70,
            spo2: 95,
            tempC: 36.4,
          },
          abcde: { A: "", B: "", C: "", D: "", E: "" },
        },
      ],
      initialStateId: "S0",
      transitions: [],
    });

    expect(normalized.states[0].vitals).toEqual({
      hr: 90,
      rr: 18,
      btSys: 110,
      btDia: 70,
      spo2: 95,
      temp: 36.4,
    });
    expect(normalized.states[0].vitals.etco2).toBeUndefined();
    expect(normalized.states[0].vitals.bs).toBeUndefined();
  });
});
