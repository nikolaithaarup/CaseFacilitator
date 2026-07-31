# SynapseFacilitator modernization foundation

## What was changed in this audit ZIP

This package is a **safe first modernization pass**, not a claim that the entire product is production-ready.

Implemented:

- removed the tracked, hard-coded Firebase web configuration and replaced it with validated `EXPO_PUBLIC_FIREBASE_*` environment variables;
- added `.env.example` and correct browser/native Firebase Auth persistence selection;
- renamed the web/product metadata to SynapseFacilitator and added Danish web metadata;
- added a Vercel-ready Expo web export (`npm run build:web`, output `dist`);
- refreshed the standalone entry screen and menu tiles using the Synapse dark teal visual language and keyboard-accessible controls;
- formalised a versioned, product-independent canonical defibrillator event;
- made defibrillator events deterministic/idempotent at the existing session-event boundary;
- stored canonical device-event data whether or not PPJ is currently connected or licensed;
- stopped silently swallowing failed defibrillator persistence writes;
- added contract tests for SpO2/pulse, NIBP and 12-lead events.

## Important findings

### 1. Two architectural generations coexist

The active UI mainly uses the legacy `sessions/{sessionId}` services. The newer security/domain foundation uses `simulationSessions/{sessionId}` and stronger role contracts. These must be reconciled deliberately; changing collection paths wholesale would break the functioning application.

### 2. The login cannot safely be deleted yet

The email/password screen is now labelled as a temporary standalone development/demo entrance. It remains because the current application requires a Firebase identity and profile to create and administer sessions. Remove it only when the Portal launch-code/session exchange is operational.

### 3. Device events were previously only timeline records

Defibrillator actions were appended with a random Firestore document ID and an untyped payload. There was no stable PPJ-facing observation envelope, and write errors were swallowed. The new `canonicalDeviceEvent` is stored alongside the legacy event so current screens remain compatible while PPJ integration can consume a stable contract later.

### 4. PPJ delivery is not complete

This pass creates and persists a canonical event but does not write directly into the PPJ database. That final bridge needs one of:

- a trusted backend/event relay; or
- a shared simulation database with explicit PPJ-compatible rules and receipts.

Facilitator should not check PPJ purchase state before creating events. Entitlement controls whether PPJ may consume the events, not whether the events exist.

### 5. Several very large screens remain

`app/index.tsx`, `CaseDetailScreen.tsx`, `DefibScreen.tsx`, and `RunDetailScreen.tsx` should be decomposed incrementally after workflow tests exist. A visual rewrite before this would carry significant regression risk.

## Recommended next phases

1. Run the supplied checks locally and repair any repository-specific failures.
2. Deploy a private Vercel preview using the environment variables in `.env.example`.
3. Add emulator integration tests that call the real `logSessionEvent` service.
4. Define the trusted PPJ event-relay/receipt contract and compare it with current SynapsePPJ Vitaldata structures.
5. Reconcile legacy `sessions` with authoritative `simulationSessions` without a flag-day migration.
6. Implement Portal launch mode, then remove the standalone login from customer-facing production.
7. Modernise the active-session workspace and case-management UI screen by screen.

## Vercel settings

- Framework: Other
- Build command: `npm run build:web`
- Output directory: `dist`
- Node.js: 22.x

Add the six required Firebase browser variables from `.env.example`. Do not add Firebase Admin credentials to the browser project.
