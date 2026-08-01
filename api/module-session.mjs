import {
  admin,
  clearSessionCookie,
  decodeSession,
  json,
  requireActiveFacilitatorGrant,
  Timestamp,
} from "./_lib/bridge.mjs";

export default async function handler(req, res) {
  if (req.method === "DELETE") {
    clearSessionCookie(res);
    return json(res, 200, { ok: true });
  }
  if (req.method !== "GET" && req.method !== "POST") {
    return json(res, 405, { error: "METHOD_NOT_ALLOWED" });
  }
  const stored = decodeSession(req);
  if (!stored || stored.product !== "FACILITATOR") {
    clearSessionCookie(res);
    return json(res, 401, { error: "NO_SESSION" });
  }
  try {
    const { auth, db } = admin();
    const session = stored.session;
    const validation = await requireActiveFacilitatorGrant(db, session);
    if (!validation.ok) {
      clearSessionCookie(res);
      return json(res, validation.status, { error: validation.error });
    }
    await db.doc(`facilitatorAccessGrants/${session.firebaseUid}`).update({
      lastValidatedAt: Timestamp.now(),
    });
    const token = await auth.createCustomToken(session.firebaseUid, {
      facilitatorConnected: true,
      facilitatorSessionId: session.facilitatorSessionId,
      facilitatorRole: validation.grant.authorisedRole,
      facilitatorRevocationVersion: session.revocationVersion,
      facilitatorAccessBinding: session.accessBinding,
    });
    return json(res, 200, { session, firebaseCustomToken: token });
  } catch {
    return json(res, 500, { error: "BRIDGE_ERROR" });
  }
}
