import type { LearnerSafeObservation } from "../security/contracts";

export const EXTERNAL_FACILITATION_CONTRACT_VERSION = 1 as const;

export interface ExternalOrganisationSessionReference {
  contractVersion: typeof EXTERNAL_FACILITATION_CONTRACT_VERSION;
  externalOrganisationId: string;
  externalSessionId: string;
  correlationId: string;
}

export interface PortalLaunchSubject {
  contractVersion: typeof EXTERNAL_FACILITATION_CONTRACT_VERSION;
  subjectId: string;
  organisationId: string;
  requestedSessionId?: string;
  correlationId: string;
}

export interface ExternalUnitIdentity {
  contractVersion: typeof EXTERNAL_FACILITATION_CONTRACT_VERSION;
  unitId: string;
  displayLabel: string;
  correlationId: string;
}

export interface ReleasedObservationEnvelope {
  contractVersion: typeof EXTERNAL_FACILITATION_CONTRACT_VERSION;
  correlationId: string;
  observation: LearnerSafeObservation;
}

export interface FacilitatorCommandAcknowledgement {
  contractVersion: typeof EXTERNAL_FACILITATION_CONTRACT_VERSION;
  correlationId: string;
  commandId: string;
  status: "ACCEPTED" | "REJECTED" | "DUPLICATE";
  reasonCode?: string;
}

export interface ExternalFacilitationAdapter {
  readonly enabled: boolean;
  publishReleasedObservation(envelope: ReleasedObservationEnvelope): Promise<void>;
  acknowledgeCommand(acknowledgement: FacilitatorCommandAcknowledgement): Promise<void>;
}
