# Facilitator Portal bridge

Add these **server-only** Vercel variables (never `EXPO_PUBLIC_*`):

- `SYNAPSE_PORTAL_INTERNAL_URL=https://portal.synapsestudio.dk`
- `FACILITATOR_MODULE_SERVICE_SECRET=<same random secret configured in Portal>`
- `FACILITATOR_LAUNCH_AUDIENCE=synapse-facilitator-v1`
- `FACILITATOR_LAUNCH_REDIRECT_URI=https://facilitator.synapsestudio.dk/launch/callback`
- `PRODUCT_SESSION_SECRET=<separate random 64+ character value>`
- `FIREBASE_SERVICE_ACCOUNT_JSON=<single-line service-account JSON for this product Firebase project>`

The public backend URL can remain unset because the browser now uses same-origin `/api` endpoints. Redeploy after adding variables.
