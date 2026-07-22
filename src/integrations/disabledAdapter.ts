import type {
  ExternalFacilitationAdapter,
  FacilitatorCommandAcknowledgement,
  ReleasedObservationEnvelope,
} from "./contracts";

export class IntegrationDisabledError extends Error {
  constructor() {
    super("External facilitation integration is disabled");
  }
}

export class DisabledExternalFacilitationAdapter implements ExternalFacilitationAdapter {
  readonly enabled = false;

  async publishReleasedObservation(_envelope: ReleasedObservationEnvelope): Promise<void> {
    throw new IntegrationDisabledError();
  }

  async acknowledgeCommand(
    _acknowledgement: FacilitatorCommandAcknowledgement,
  ): Promise<void> {
    throw new IntegrationDisabledError();
  }
}
