import { admin, json, readJson, Timestamp, verifyServiceBearer } from "../_lib/bridge.mjs";

const validId = (value) => typeof value === "string" && value.length > 0 && value.length <= 128;
export const revokedGrantVersion = (current, requested) =>
  Math.max(current ?? 0, requested);

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "METHOD_NOT_ALLOWED" });
  if (!verifyServiceBearer(req, "FACILITATOR_MODULE_SERVICE_SECRET")) {
    return json(res, 401, { error: "UNAUTHENTICATED" });
  }
  try {
    const body = await readJson(req);
    if (!validId(body.organisationId) || !validId(body.trainingSessionId) ||
        !Number.isSafeInteger(body.revocationVersion) || body.revocationVersion < 0) {
      return json(res, 400, { error: "INVALID_REVOCATION" });
    }
    const { db } = admin();
    const snapshot = await db.collection("facilitatorAccessGrants")
      .where("organisationId", "==", body.organisationId)
      .where("trainingSessionId", "==", body.trainingSessionId)
      .get();
    let affected = 0;
    for (let offset = 0; offset < snapshot.docs.length; offset += 450) {
      const batch = db.batch();
      for (const document of snapshot.docs.slice(offset, offset + 450)) {
        const current = document.data();
        batch.update(document.ref, {
          active: false,
          revocationVersion: revokedGrantVersion(current.revocationVersion, body.revocationVersion),
          revokedReason: String(body.reason || "PORTAL_ACCESS_CLOSED").slice(0, 128),
          revokedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        affected += 1;
      }
      await batch.commit();
    }
    return json(res, 200, {
      ok: true,
      organisationId: body.organisationId,
      trainingSessionId: body.trainingSessionId,
      revocationVersion: body.revocationVersion,
      affected,
    });
  } catch {
    return json(res, 500, { error: "REVOCATION_FAILED" });
  }
}
