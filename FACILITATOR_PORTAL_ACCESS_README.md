# SynapseFacilitator Portal-only access foundation

## Behaviour

Production access fails closed unless `EXPO_PUBLIC_FACILITATOR_ALLOW_STANDALONE=true` is explicitly set.
All ordinary routes show a SynapsePortal-required screen. `/launch/callback` remains reachable so the future trusted backend bridge can redeem one-time Portal launch codes.

This package intentionally does not pretend that browser-side URL checks are authentication. Portal launch redemption, Firebase custom-token issuance, HttpOnly product sessions, revalidation, logout and revocation still require a trusted backend.

## Vercel Production variables

```env
EXPO_PUBLIC_FACILITATOR_ALLOW_STANDALONE=false
EXPO_PUBLIC_SYNAPSE_PORTAL_URL=https://portal.synapsestudio.dk
EXPO_PUBLIC_FACILITATOR_LAUNCH_AUDIENCE=synapse-facilitator-v1
```

Leave `EXPO_PUBLIC_FACILITATOR_BACKEND_BASE_URL` unset until the trusted bridge exists.

## Local standalone development

```env
EXPO_PUBLIC_FACILITATOR_ALLOW_STANDALONE=true
```

## Validation

```powershell
npm ci
npm run typecheck
npm run lint
npm test
npm run test:rules
npm run build:web
```
