export const FACILITATOR_ROLES = [
  "INSTRUCTOR_LEAD",
  "INSTRUCTOR_ASSISTANT",
  "LEARNER_UNIT",
  "MONITOR_DEVICE",
] as const;

export type FacilitatorRole = (typeof FACILITATOR_ROLES)[number];

export const FACILITATOR_CAPABILITIES = [
  "CREATE_SIMULATION",
  "CONFIGURE_SIMULATION",
  "VIEW_INSTRUCTOR_TRUTH",
  "CONTROL_PATIENT_DEVELOPMENT",
  "PUBLISH_LEARNER_OBSERVATION",
  "ADMINISTER_SESSION",
  "JOIN_UNIT",
  "SEND_MONITOR_OBSERVATION",
  "FINISH_SIMULATION",
  "ARCHIVE_SIMULATION",
] as const;

export type FacilitatorCapability = (typeof FACILITATOR_CAPABILITIES)[number];

const AUTHORITY: Record<FacilitatorRole, ReadonlySet<FacilitatorCapability>> = {
  INSTRUCTOR_LEAD: new Set(FACILITATOR_CAPABILITIES.filter(
    (capability) => capability !== "JOIN_UNIT" && capability !== "SEND_MONITOR_OBSERVATION",
  )),
  INSTRUCTOR_ASSISTANT: new Set([
    "VIEW_INSTRUCTOR_TRUTH",
    "CONTROL_PATIENT_DEVELOPMENT",
    "PUBLISH_LEARNER_OBSERVATION",
  ]),
  LEARNER_UNIT: new Set(["JOIN_UNIT"]),
  MONITOR_DEVICE: new Set(["SEND_MONITOR_OBSERVATION"]),
};

export function hasCapability(
  role: FacilitatorRole,
  capability: FacilitatorCapability,
): boolean {
  return AUTHORITY[role].has(capability);
}

export function assertCapability(
  role: FacilitatorRole,
  capability: FacilitatorCapability,
): void {
  if (!hasCapability(role, capability)) {
    throw new Error(`${role} is not authorized for ${capability}`);
  }
}
