import type {
  ActionLogMetadata,
  AssistanceChoice,
  PatientState,
  PatientVitals,
} from "../cases/types";

export interface SimulationState {
  scenarioId: string;
  patient: PatientState;
  revision: number;
}

interface CommandBase {
  commandId: string;
  actionId: string;
  occurredAtMs: number;
  description: string;
  metadata?: ActionLogMetadata;
}

export type SimulationCommand =
  | (CommandBase & { type: "ACTION" })
  | (CommandBase & { type: "MEDICATION" })
  | (CommandBase & { type: "CPR" })
  | (CommandBase & { type: "ASSISTANCE"; assistance: AssistanceChoice | boolean })
  | (CommandBase & { type: "DEFIBRILLATOR" });

interface EventBase {
  eventId: string;
  commandId: string;
  scenarioId: string;
  revision: number;
  occurredAtMs: number;
}

export type SimulationEvent =
  | (EventBase & {
      type: "ACTION_APPLIED";
      commandType: SimulationCommand["type"];
      actionId: string;
      fromStateId: string;
      resultingStateId: string;
      transitionApplied: boolean;
    })
  | (EventBase & {
      type: "PATIENT_STATE_CHANGED";
      fromStateId: string;
      toStateId: string;
    })
  | (EventBase & {
      type: "PATIENT_VITALS_CHANGED";
      changedFields: (keyof PatientVitals)[];
      previousVitals: PatientVitals;
      vitals: PatientVitals;
    });

export interface SimulationResult {
  state: SimulationState;
  events: SimulationEvent[];
}
