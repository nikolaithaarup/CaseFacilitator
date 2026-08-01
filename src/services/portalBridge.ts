import { signInWithCustomToken, signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";

export type FacilitatorBridgeSession = {
  descriptor: unknown;
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

export async function redeemPortalLaunch(code: string, state: string) {
  const result = await request("/api/launch/redeem", {
    method: "POST",
    body: JSON.stringify({ code, state }),
  });
  await signInWithCustomToken(auth, result.firebaseCustomToken);
  return result.session as FacilitatorBridgeSession;
}

export async function restorePortalSession() {
  const result = await request("/api/module-session", { method: "GET" });
  await signInWithCustomToken(auth, result.firebaseCustomToken);
  return result.session as FacilitatorBridgeSession;
}

export async function revalidatePortalSession() {
  const result = await request("/api/module-session/revalidate", { method: "POST" });
  await signInWithCustomToken(auth, result.firebaseCustomToken);
  return result.session as FacilitatorBridgeSession;
}

export async function endPortalSession() {
  await fetch("/api/module-session", { method: "DELETE", credentials: "include" });
}

export async function cleanupFailedPortalLaunch() {
  await Promise.allSettled([endPortalSession(), signOut(auth)]);
}
