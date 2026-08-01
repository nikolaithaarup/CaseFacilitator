# Facilitator Portal bridge

Add these **server-only** Vercel variables (never `EXPO_PUBLIC_*`):

- `SYNAPSE_PORTAL_INTERNAL_URL=https://portal.synapsestudio.dk`
- `FACILITATOR_MODULE_SERVICE_SECRET=<same random secret configured in Portal>`
- `FACILITATOR_LAUNCH_AUDIENCE=synapse-facilitator-v1`
- `FACILITATOR_LAUNCH_REDIRECT_URI=https://facilitator.synapsestudio.dk/launch/callback`
- `PRODUCT_SESSION_SECRET=<separate random 64+ character value>`
- `FIREBASE_SERVICE_ACCOUNT_JSON=<single-line service-account JSON for this product Firebase project>`

The public backend URL can remain unset because the browser now uses same-origin `/api` endpoints. Redeploy after adding variables.

## Portal revocation contract

Portal must call `POST https://facilitator.synapsestudio.dk/api/module-session/revoke`
whenever the corresponding training access is closed, expired, revoked, archived, or
otherwise made non-launchable.

Headers:

- `Authorization: Bearer <FACILITATOR_MODULE_SERVICE_SECRET>`
- `Content-Type: application/json`

Body:

```json
{
  "organisationId": "portal-organisation-id",
  "trainingSessionId": "portal-training-session-id",
  "revocationVersion": 4,
  "reason": "TRAINING_SESSION_CLOSED"
}
```

`organisationId` and `trainingSessionId` are required strings of at most 128
characters. `revocationVersion` is the authoritative non-negative integer from
Portal. Repeating the same request is safe and idempotent. A successful response is:

```json
{
  "ok": true,
  "organisationId": "portal-organisation-id",
  "trainingSessionId": "portal-training-session-id",
  "revocationVersion": 4,
  "affected": 1
}
```

The endpoint deactivates every matching `facilitatorAccessGrants` document. This
immediately makes subsequent protected Firestore operations and module-session
revalidation fail. Existing self-contained browser cookies cannot be deleted by a
server-to-server request, but they become unusable because every restoration checks
the deactivated grant.
