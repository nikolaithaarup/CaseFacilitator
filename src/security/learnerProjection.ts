import {
  FACILITATOR_SCHEMA_VERSION,
  type InstructorObservation,
  type LearnerSafeObservation,
} from "./contracts";

export interface ReleaseObservationInput {
  sessionId: string;
  observation: InstructorObservation;
  releasedAtEpochMs: number;
  releasedByUid: string;
}

export function releaseObservation(
  input: ReleaseObservationInput,
): LearnerSafeObservation {
  const { observation } = input;
  return {
    schemaVersion: FACILITATOR_SCHEMA_VERSION,
    fictional: true,
    sessionId: input.sessionId,
    observationId: observation.observationId,
    kind: observation.kind,
    label: observation.label,
    value: observation.value,
    ...(observation.unit ? { unit: observation.unit } : {}),
    releasedAtEpochMs: input.releasedAtEpochMs,
    releasedByUid: input.releasedByUid,
  };
}
