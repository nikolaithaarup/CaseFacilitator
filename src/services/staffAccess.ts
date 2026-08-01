export type StaffAccessState =
  | "AUTH_BOOTSTRAPPING"
  | "AUTHORISED_STAFF"
  | "TEMPORARY_DEFIB"
  | "ACCESS_REQUIRED";

export function isTemporaryDefibRequest(role: unknown): boolean {
  return String(role ?? "").trim().toLowerCase() === "defib";
}

export function isValidDefibJoinRequest(
  pathname: string,
  sessionId: unknown,
  role: unknown,
): boolean {
  const value = Array.isArray(sessionId) ? sessionId[0] : sessionId;
  return (
    pathname === "/join" &&
    isTemporaryDefibRequest(role) &&
    typeof value === "string" &&
    /^[A-Za-z0-9_-]{1,128}$/.test(value)
  );
}

export function mayEnterStaffUi(state: StaffAccessState): boolean {
  return state === "AUTHORISED_STAFF";
}
