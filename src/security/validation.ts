import {
  FACILITATOR_SCHEMA_VERSION,
  type InstructorSimulationTruth,
  type LearnerSafeObservation,
} from "./contracts";

const IDENTIFIER_PATTERN = /^(cpr|cprNumber|ssn|nationalId|healthcareId|medicalRecordNumber)$/i;
const CASE_ID_PATTERN = /^fictional[-_:a-z0-9]{1,120}$/i;
const MAX_TITLE_LENGTH = 200;
const MAX_TEXT_LENGTH = 4_000;

export class ContractValidationError extends Error {}

function assertVersionedFictional(value: unknown): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ContractValidationError("Contract must be an object");
  }
  const record = value as Record<string, unknown>;
  if (record.schemaVersion !== FACILITATOR_SCHEMA_VERSION) {
    throw new ContractValidationError("Unsupported schema version");
  }
  if (record.fictional !== true) {
    throw new ContractValidationError("Fictional marker is required");
  }
  rejectRestrictedIdentifiers(record);
}

function rejectRestrictedIdentifiers(value: unknown, path = "root"): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectRestrictedIdentifiers(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (IDENTIFIER_PATTERN.test(key)) {
      throw new ContractValidationError(`Restricted healthcare identifier at ${path}.${key}`);
    }
    rejectRestrictedIdentifiers(child, `${path}.${key}`);
  }
}

function assertText(value: unknown, label: string, max = MAX_TEXT_LENGTH): asserts value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > max) {
    throw new ContractValidationError(`${label} must contain 1-${max} characters`);
  }
}

export function validateInstructorTruth(value: unknown): InstructorSimulationTruth {
  assertVersionedFictional(value);
  const truth = value as unknown as InstructorSimulationTruth;
  if (!CASE_ID_PATTERN.test(String(truth.fictionalCaseId ?? ""))) {
    throw new ContractValidationError("A fictional case identity is required");
  }
  if (!truth.patient || !CASE_ID_PATTERN.test(String(truth.patient.fictionalPatientId ?? ""))) {
    throw new ContractValidationError("A fictional patient identity is required");
  }
  if (!Number.isInteger(truth.patient.age) || truth.patient.age < 0 || truth.patient.age > 120) {
    throw new ContractValidationError("Patient age must be an integer from 0 to 120");
  }
  if (truth.patient.sex !== "M" && truth.patient.sex !== "K") {
    throw new ContractValidationError("Patient sex must be M or K");
  }
  if (truth.patient.displayName) assertText(truth.patient.displayName, "displayName", MAX_TITLE_LENGTH);
  assertText(truth.hiddenDiagnosis, "hiddenDiagnosis");
  for (const field of [truth.expectedActions, truth.scriptedProgression, truth.triggerConditions, truth.teachingNotes]) {
    if (!Array.isArray(field)) throw new ContractValidationError("Instructor arrays are required");
    field.forEach((text) => assertText(text, "instructor text"));
  }
  truth.unreleasedObservations.forEach(validateObservationShape);
  return truth;
}

function validateObservationShape(observation: {
  observationId: string;
  kind: string;
  label: string;
  value: unknown;
}): void {
  assertText(observation.observationId, "observationId", 128);
  assertText(observation.label, "observation label", MAX_TITLE_LENGTH);
  if (!["FINDING", "VITAL_SIGN", "MONITOR_VALUE", "EVENT"].includes(observation.kind)) {
    throw new ContractValidationError("Unsupported observation kind");
  }
  if (!["string", "number", "boolean"].includes(typeof observation.value)) {
    throw new ContractValidationError("Observation value must be scalar");
  }
  if (typeof observation.value === "number" && !Number.isFinite(observation.value)) {
    throw new ContractValidationError("Observation number must be finite");
  }
}

export function validateLearnerObservation(value: unknown): LearnerSafeObservation {
  assertVersionedFictional(value);
  const observation = value as unknown as LearnerSafeObservation;
  validateObservationShape(observation);
  assertText(observation.sessionId, "sessionId", 128);
  assertText(observation.releasedByUid, "releasedByUid", 128);
  if (!Number.isFinite(observation.releasedAtEpochMs)) {
    throw new ContractValidationError("Release timestamp is required");
  }
  return observation;
}
