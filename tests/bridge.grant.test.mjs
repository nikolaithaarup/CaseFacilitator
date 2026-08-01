import assert from "node:assert/strict";
import test from "node:test";
import { validateFacilitatorGrant } from "../api/_lib/bridge.mjs";
import { revokedGrantVersion } from "../api/module-session/revoke.mjs";

const now = 1_700_000_000_000;
const session = {
  firebaseUid: "fac-a",
  facilitatorSessionId: "session-a",
  revocationVersion: 3,
  accessBinding: "binding-a",
};
const grant = {
  active: true,
  subjectType: "STAFF",
  capability: "INSTRUCTOR",
  trainingSessionId: "session-a",
  facilitatorSessionId: "session-a",
  revocationVersion: 3,
  accessBinding: "binding-a",
  leaseExpiresAt: { toMillis: () => now + 60_000 },
};

test("module-session validation accepts only the current authoritative grant", () => {
  assert.equal(validateFacilitatorGrant(grant, session, now), true);
  assert.equal(validateFacilitatorGrant({ ...grant, active: false }, session, now), false);
  assert.equal(validateFacilitatorGrant({ ...grant, revocationVersion: 4 }, session, now), false);
  assert.equal(validateFacilitatorGrant({ ...grant, trainingSessionId: "other" }, session, now), false);
  assert.equal(validateFacilitatorGrant({ ...grant, leaseExpiresAt: { toMillis: () => now } }, session, now), false);
});

test("Portal revocation version update is idempotent and never moves backwards", () => {
  assert.equal(revokedGrantVersion(3, 4), 4);
  assert.equal(revokedGrantVersion(4, 4), 4);
  assert.equal(revokedGrantVersion(5, 4), 5);
});
