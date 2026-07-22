import type { FacilitatorRole } from "./roles";

export const FACILITATOR_SCHEMA_VERSION = 1 as const;
export type FacilitatorSchemaVersion = typeof FACILITATOR_SCHEMA_VERSION;

export interface FictionalMarker {
  schemaVersion: FacilitatorSchemaVersion;
  fictional: true;
}

export interface CanonicalFictionalPatient {
  fictionalPatientId: string;
  age: number;
  sex: "M" | "K";
  displayName?: string;
}

export interface InstructorSimulationTruth extends FictionalMarker {
  sessionId: string;
  fictionalCaseId: string;
  patient: CanonicalFictionalPatient;
  hiddenDiagnosis: string;
  expectedActions: readonly string[];
  scriptedProgression: readonly string[];
  triggerConditions: readonly string[];
  teachingNotes: readonly string[];
  scoringData: Readonly<Record<string, number>>;
  unreleasedObservations: readonly InstructorObservation[];
  internalSimulationState: Readonly<Record<string, unknown>>;
}

export type ObservationKind =
  | "FINDING"
  | "VITAL_SIGN"
  | "MONITOR_VALUE"
  | "EVENT";

export interface InstructorObservation {
  observationId: string;
  kind: ObservationKind;
  label: string;
  value: string | number | boolean;
  unit?: string;
}

export interface LearnerSafeObservation extends FictionalMarker {
  sessionId: string;
  observationId: string;
  kind: ObservationKind;
  label: string;
  value: string | number | boolean;
  unit?: string;
  releasedAtEpochMs: number;
  releasedByUid: string;
}

export interface SessionCapacity {
  assistantInstructors: number;
  learnerUnits: number;
  monitorDevices: number;
}

export interface CanonicalSimulationSession extends FictionalMarker {
  sessionId: string;
  organisationId: string;
  leadInstructorUid: string;
  status: "ACTIVE" | "FINISHED" | "ARCHIVED";
  capacity: SessionCapacity;
  createdAtEpochMs: number;
  externalReference?: string;
}

export interface SessionMembership {
  schemaVersion: FacilitatorSchemaVersion;
  uid: string;
  role: FacilitatorRole;
  active: boolean;
  unitId?: string;
  joinedAtEpochMs: number;
  revokedAtEpochMs?: number;
  revokedByUid?: string;
}
