# SynapseFacilitator fixed audit ZIP

This ZIP contains a conservative modernization foundation applied to the uploaded repository.

Start here:

1. Read `docs/MODERNIZATION_AUDIT.md`.
2. Copy `.env.example` to `.env.local` and insert the existing Firebase browser configuration.
3. Run `npm install` or `npm ci` on your own computer.
4. Run `npm run verify`.
5. Start locally with `npm run web`.

## Files intentionally changed or added

- `.env.example`
- `app/+html.tsx`
- `app.json`
- `package.json`
- `vercel.json`
- `src/config/env.ts`
- `src/firebase/firebase.ts`
- `src/integrations/deviceEvents.ts`
- `src/integrations/__tests__/deviceEvents.test.ts`
- `src/services/sessionEvents.ts`
- `src/screens/DefibScreen.tsx`
- Portal access is enforced by `app/_layout.tsx` and `src/screens/PortalRequiredScreen.tsx`.
- `src/components/MenuTile.tsx`
- `docs/MODERNIZATION_AUDIT.md`
- `docs/DEVICE_EVENT_CONTRACT.md`

The old standalone credential flow has not been deleted because there is not yet a working Portal launch replacement. It is now clearly presented as temporary standalone access.

## Verification performed here

- JSON configuration files parsed successfully.
- The canonical device-event module compiled independently under strict TypeScript.
- A runtime smoke test verified SpO2/pulse event mapping.
- A secret-pattern scan found no hard-coded Firebase API key or private key in the returned source.

Full `npm ci` could not be completed in the analysis environment because its internal npm mirror returned a 404 for a locked transitive package. Therefore the complete Expo typecheck/lint/test/build suite must be run locally before replacing your working repository.
