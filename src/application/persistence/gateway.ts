import type { AuthoritativeSimulationEvent, EventAcknowledgement } from "../simulation/events";

export type PersistenceMode = "LEGACY" | "CANONICAL_OPT_IN";

export interface SessionEventGateway {
  readonly mode: PersistenceMode;
  appendEvent(event: AuthoritativeSimulationEvent): Promise<EventAcknowledgement | void>;
  subscribe(
    sessionId: string,
    onEvents: (events: readonly AuthoritativeSimulationEvent[]) => void,
    onError: (error: unknown) => void,
  ): () => void;
}

export const configuredPersistenceMode: PersistenceMode =
  process.env.EXPO_PUBLIC_CANONICAL_SESSION_CORE === "true"
    ? "CANONICAL_OPT_IN"
    : "LEGACY";

export function assertNoUnsafeDualWrite(gateways: readonly SessionEventGateway[]): void {
  if (gateways.length !== 1) throw new Error("Exactly one persistence gateway must be active");
}
