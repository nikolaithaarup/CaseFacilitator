import { signInWithCustomToken, signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";

export type FacilitatorBridgeSession = {
  descriptor: { entitlement: { organisationId: string; subjectType: string; subjectId: string } };
  facilitatorSessionId: string;
  firebaseUid: string;
  leaseExpiresAt: string;
  revocationVersion: number;
  accessBinding: string;
  status: "ACTIVE";
};

export class PortalSessionError extends Error {
  constructor(readonly status: number) {
    super("Portaladgang blev afvist.");
  }
}

export function isAuthoritativePortalDenial(error: unknown): boolean {
  return error instanceof PortalSessionError && (error.status === 401 || error.status === 403);
}

async function request(path: string, init: RequestInit) {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (!response.ok) throw new PortalSessionError(response.status);
  return response.json();
}

async function acceptPortalIdentity(result: {
  firebaseCustomToken: string;
  session: FacilitatorBridgeSession;
}): Promise<FacilitatorBridgeSession> {
  const { session } = result;
  const current = auth.currentUser;

  // Revalidating a valid lease must not sign the instructor in again every minute.
  // Firebase sign-in broadcasts an auth change and resets the running workspace.
  if (current?.uid === session.firebaseUid) {
    const token = await current.getIdTokenResult();
    const claims = token.claims;
    if (
      claims.facilitatorConnected === true &&
      claims.facilitatorSessionId === session.facilitatorSessionId &&
      claims.facilitatorAccessBinding === session.accessBinding &&
      claims.facilitatorRevocationVersion === session.revocationVersion
    ) {
      return session;
    }
  }

  await signInWithCustomToken(auth, result.firebaseCustomToken);
  return session;
}

export async function redeemPortalLaunch(code: string, state: string) {
  const result = await request("/api/launch/redeem", {
    method: "POST",
    body: JSON.stringify({ code, state }),
  });
  return acceptPortalIdentity(result);
}

export async function restorePortalSession() {
  const result = await request("/api/module-session", { method: "GET" });
  return acceptPortalIdentity(result);
}

export async function revalidatePortalSession() {
  const result = await request("/api/module-session/revalidate", { method: "POST" });
  return acceptPortalIdentity(result);
}

export async function endPortalSession() {
  await fetch("/api/module-session", { method: "DELETE", credentials: "include" });
}

export async function cleanupFailedPortalLaunch() {
  await Promise.allSettled([endPortalSession(), signOut(auth)]);
}
