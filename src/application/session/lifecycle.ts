export const SESSION_LIFECYCLES = [
  "PREPARING",
  "OPEN",
  "ACTIVE",
  "FINISHED",
  "ARCHIVED",
] as const;

export type SessionLifecycle = (typeof SESSION_LIFECYCLES)[number];

const TRANSITIONS: Record<SessionLifecycle, readonly SessionLifecycle[]> = {
  PREPARING: ["OPEN"],
  OPEN: ["ACTIVE"],
  ACTIVE: ["FINISHED"],
  FINISHED: ["ACTIVE", "ARCHIVED"],
  ARCHIVED: [],
};

export function canTransitionSession(
  from: SessionLifecycle,
  to: SessionLifecycle,
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function transitionSession(
  from: SessionLifecycle,
  to: SessionLifecycle,
): SessionLifecycle {
  if (!canTransitionSession(from, to)) {
    throw new Error(`Invalid session lifecycle transition: ${from} -> ${to}`);
  }
  return to;
}
