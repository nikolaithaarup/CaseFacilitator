import type { CaseScenario, PatientVitals } from "../cases/types";
import type {
  SimulationCommand,
  SimulationEvent,
  SimulationResult,
  SimulationState,
} from "./types";

const VITAL_KEYS: (keyof PatientVitals)[] = [
  "hr",
  "rr",
  "btSys",
  "btDia",
  "spo2",
  "etco2",
  "temp",
  "bs",
  "gcs",
  "painNrs",
];

export function createSimulationState(scenario: CaseScenario): SimulationState {
  const patient = scenario.states.find((state) => state.id === scenario.initialStateId);
  if (!patient) {
    throw new Error(`Case ${scenario.id} has no state ${scenario.initialStateId}`);
  }
  return { scenarioId: scenario.id, patient, revision: 0 };
}

export function applySimulationCommand(
  scenario: CaseScenario,
  current: SimulationState,
  command: SimulationCommand,
): SimulationResult {
  if (current.scenarioId !== scenario.id) {
    throw new Error("Simulation state does not belong to this case");
  }

  const transition = scenario.transitions.find(
    (candidate) =>
      candidate.fromStateId === current.patient.id &&
      candidate.actionId === command.actionId,
  );
  const target = transition
    ? scenario.states.find((state) => state.id === transition.toStateId)
    : undefined;
  if (transition && !target) {
    throw new Error(
      `Transition ${transition.id} points to missing state ${transition.toStateId}`,
    );
  }

  const patient = target ?? current.patient;
  const revision = current.revision + 1;
  const baseEvent = {
    commandId: command.commandId,
    scenarioId: scenario.id,
    revision,
    occurredAtMs: command.occurredAtMs,
  };
  const events: SimulationEvent[] = [
    {
      ...baseEvent,
      eventId: `${command.commandId}:action`,
      type: "ACTION_APPLIED",
      commandType: command.type,
      actionId: command.actionId,
      fromStateId: current.patient.id,
      resultingStateId: patient.id,
      transitionApplied: Boolean(target),
    },
  ];

  if (target) {
    events.push({
      ...baseEvent,
      eventId: `${command.commandId}:state`,
      type: "PATIENT_STATE_CHANGED",
      fromStateId: current.patient.id,
      toStateId: target.id,
    });

    const changedFields = changedVitalFields(current.patient.vitals, target.vitals);
    if (changedFields.length > 0) {
      events.push({
        ...baseEvent,
        eventId: `${command.commandId}:vitals`,
        type: "PATIENT_VITALS_CHANGED",
        changedFields,
        previousVitals: current.patient.vitals,
        vitals: target.vitals,
      });
    }
  }

  return {
    state: { scenarioId: scenario.id, patient, revision },
    events,
  };
}

function changedVitalFields(
  previous: PatientVitals,
  next: PatientVitals,
): (keyof PatientVitals)[] {
  return VITAL_KEYS.filter((key) => previous[key] !== next[key]);
}
