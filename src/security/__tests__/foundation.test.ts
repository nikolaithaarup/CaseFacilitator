import { DisabledExternalFacilitationAdapter, IntegrationDisabledError } from "../../integrations/disabledAdapter";
import { releaseObservation } from "../learnerProjection";
import { hasCapability } from "../roles";
import { ContractValidationError, validateInstructorTruth, validateLearnerObservation } from "../validation";

const validTruth = {
  schemaVersion: 1 as const,
  fictional: true as const,
  sessionId: "session-a",
  fictionalCaseId: "fictional-case-a",
  patient: { fictionalPatientId: "fictional-patient-a", age: 54, sex: "M" as const },
  hiddenDiagnosis: "Fictional hidden diagnosis",
  expectedActions: ["Fictional expected action"],
  scriptedProgression: ["Fictional progression"],
  triggerConditions: ["Fictional trigger"],
  teachingNotes: ["Instructor-only fictional teaching note"],
  scoringData: { action: 1 },
  unreleasedObservations: [
    { observationId: "obs-hidden", kind: "FINDING" as const, label: "Hidden finding", value: "Hidden" },
  ],
  internalSimulationState: { currentStateId: "S0" },
};

describe("authority model", () => {
  it("grants lead instructors administration and completion authority", () => {
    expect(hasCapability("INSTRUCTOR_LEAD", "ADMINISTER_SESSION")).toBe(true);
    expect(hasCapability("INSTRUCTOR_LEAD", "FINISH_SIMULATION")).toBe(true);
  });

  it("bounds assistant instructors to truth, control, and release duties", () => {
    expect(hasCapability("INSTRUCTOR_ASSISTANT", "VIEW_INSTRUCTOR_TRUTH")).toBe(true);
    expect(hasCapability("INSTRUCTOR_ASSISTANT", "PUBLISH_LEARNER_OBSERVATION")).toBe(true);
    expect(hasCapability("INSTRUCTOR_ASSISTANT", "ADMINISTER_SESSION")).toBe(false);
    expect(hasCapability("INSTRUCTOR_ASSISTANT", "FINISH_SIMULATION")).toBe(false);
  });

  it("limits learner and monitor authority", () => {
    expect(hasCapability("LEARNER_UNIT", "JOIN_UNIT")).toBe(true);
    expect(hasCapability("LEARNER_UNIT", "VIEW_INSTRUCTOR_TRUTH")).toBe(false);
    expect(hasCapability("MONITOR_DEVICE", "SEND_MONITOR_OBSERVATION")).toBe(true);
    expect(hasCapability("MONITOR_DEVICE", "PUBLISH_LEARNER_OBSERVATION")).toBe(false);
  });
});

describe("fictional data validation", () => {
  it("accepts a valid canonical fictional instructor truth", () => {
    expect(validateInstructorTruth(validTruth)).toBe(validTruth);
  });

  it("rejects a missing fictional marker", () => {
    expect(() => validateInstructorTruth({ ...validTruth, fictional: undefined })).toThrow(
      ContractValidationError,
    );
  });

  it("rejects a version mismatch", () => {
    expect(() => validateInstructorTruth({ ...validTruth, schemaVersion: 2 })).toThrow(
      "Unsupported schema version",
    );
  });

  it("rejects malformed fictional cases and live healthcare identifiers", () => {
    expect(() => validateInstructorTruth({ ...validTruth, fictionalCaseId: "real-case" })).toThrow();
    expect(() => validateInstructorTruth({ ...validTruth, nationalId: "123" })).toThrow(
      "Restricted healthcare identifier",
    );
  });
});

describe("learner-safe projection", () => {
  it("releases only the explicit observation DTO", () => {
    const released = releaseObservation({
      sessionId: validTruth.sessionId,
      observation: validTruth.unreleasedObservations[0],
      releasedAtEpochMs: 1_700_000_000_000,
      releasedByUid: "lead-a",
    });

    expect(validateLearnerObservation(released)).toBe(released);
    expect(released).not.toHaveProperty("hiddenDiagnosis");
    expect(released).not.toHaveProperty("teachingNotes");
    expect(released).not.toHaveProperty("expectedActions");
    expect(released).not.toHaveProperty("scriptedProgression");
    expect(released).not.toHaveProperty("internalSimulationState");
  });

  it("keeps the future integration adapter disabled by default", async () => {
    const adapter = new DisabledExternalFacilitationAdapter();
    expect(adapter.enabled).toBe(false);
    await expect(adapter.publishReleasedObservation({
      contractVersion: 1,
      correlationId: "correlation-a",
      observation: releaseObservation({
        sessionId: "session-a",
        observation: validTruth.unreleasedObservations[0],
        releasedAtEpochMs: 1,
        releasedByUid: "lead-a",
      }),
    })).rejects.toBeInstanceOf(IntegrationDisabledError);
  });
});
