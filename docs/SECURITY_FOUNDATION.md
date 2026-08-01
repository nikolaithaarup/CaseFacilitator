# SynapseFacilitator security and learner-projection foundation

This document describes the version-1 local security foundation. It is not a production-deployment instruction. The checked-in Firebase configuration targets only the reserved demo project ID `demo-synapse-facilitator`, and the external integration adapter is disabled and contains no networking.

## Security invariants

1. All canonical data is explicitly marked `fictional: true` and `schemaVersion: 1`.
2. Instructor truth and learner projection are stored in different Firestore documents and paths. Firestore cannot hide individual fields, so no instructor-only field may be added to a learner-projection document.
3. Access depends on active session membership and canonical role. Hidden UI is never an authorization mechanism.
4. Only the lead can administer, finish, or archive a session and assign/revoke membership.
5. Assistants may read instructor truth, control development, and intentionally publish observations; they cannot administer or finish the session.
6. Learner units may read only the session shell, their own membership, and explicitly released projection documents.
7. Monitor devices may read released projection documents and append correctly attributed monitor observations; they cannot read instructor truth or overwrite observations.
8. Revocation (`active: false`) immediately removes canonical session access.
9. Cross-session access is denied because every check resolves membership beneath the target session.
10. All unspecified Firestore paths are denied.

## Canonical role model

| Role | Create/configure | View truth | Control development | Release observations | Administer | Join unit | Send monitor data | Finish/archive |
|---|---|---|---|---|---|---|---|---|
| `INSTRUCTOR_LEAD` | Yes | Yes | Yes | Yes | Yes | No | No | Yes |
| `INSTRUCTOR_ASSISTANT` | No | Yes | Yes | Yes | No | No | No | No |
| `LEARNER_UNIT` | No | No | No | No | No | Yes | No | No |
| `MONITOR_DEVICE` | No | No | No | No | No | No | Yes | No |

The TypeScript matrix is in `src/security/roles.ts`; equivalent stored-data authority is enforced in `firestore.rules`. Client checks improve feedback but cannot replace rules or a trusted server boundary.

## Firestore structure

```text
simulationCases/{caseId}                       canonical case truth; trusted instructor claim only
simulationSessions/{sessionId}                 fictional session shell, lead, status, bounded capacities
  members/{uid}                                role, active/revoked state, optional unit identity
  instructorTruth/{documentId}                 instructor-only simulation truth
  learnerProjection/{observationId}            intentionally released learner-safe observation
  monitorObservations/{observationId}           append-only device observations, instructor-readable
  facilitatorCommands/{commandId}              instructor-only commands/acknowledgements
```

The existing runtime collections (`cases_v3`, `sessions`, `users`, and their legacy subcollections) remain unchanged in this milestone. The canonical paths are a safe foundation and compatibility target; these rules must not be deployed over an existing environment until legacy migration and production hardening are complete.

### Instructor-only fields

`InstructorSimulationTruth` may contain and the learner DTO intentionally cannot contain:

- `hiddenDiagnosis`
- `expectedActions`
- `scriptedProgression`
- `triggerConditions`
- `teachingNotes`
- `scoringData`
- `unreleasedObservations`
- `internalSimulationState`

The learner projection is an allowlist containing only version/fictional markers, session and observation identifiers, observation kind/label/scalar value/unit, and release audit fields. `releaseObservation` constructs a new object rather than removing hidden fields from truth.

## Fictional-data requirements

New canonical truth and released observations require schema version 1 and `fictional: true`. Validation rejects missing/version-mismatched markers, malformed fictional case/patient identities, age outside 0–120, unsupported sex values, empty/oversized text, non-scalar or non-finite observations, and keys representing live healthcare identifiers such as CPR/national/healthcare/medical-record identifiers.

Canonical fictional case and patient IDs must begin with `fictional`. Existing case records are accepted only through future compatibility mapping; this milestone does not rewrite seeded clinical scenarios. The validator does not invent clinical advice or dosing rules. It uses existing app bounds only for fictional age/sex and structural observation safety.

## Session access model

- A session declares one immutable lead UID, organization scope, `ACTIVE`/`FINISHED`/`ARCHIVED` status, and bounded maximums: 10 assistants, 20 learner units, and 10 monitor devices.
- Membership IDs are UIDs, making membership assignment idempotent. Only the lead may create or update membership.
- A member cannot promote itself. Lead-role membership must match the session's immutable lead UID.
- Revocation is an update to `active: false` with audit fields. Documents are not deleted through client rules.
- Rules validate capacity configuration. Actual admission counts require a trusted transaction/server boundary before canonical session creation is wired into runtime; clients must not be trusted to count concurrent members.

## Local emulator workflow

Prerequisites: Node/npm and Java available to Firebase's Firestore emulator.

```text
npm install
npm run test:rules
npm run emulators
```

`npm run test:rules` uses `firebase emulators:exec`, starts only the local Firestore emulator on `127.0.0.1:8080`, seeds fictional fixtures from `firebase/emulator-seed/fixtures.json` under disabled rules, runs authorization tests, and stops the emulator. Both `.firebaserc` and scripts pin the reserved `demo-` project ID. Do not replace it with a production or staging project for tests.

For local application/browser verification, set `EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true` before starting or exporting Expo, then run `npm run emulators`. This switches the Firebase client itself to the demo project configuration and connects Auth at `127.0.0.1:9099` and Firestore at `127.0.0.1:8080`. Never use deployed Firebase configuration for automated verification.

## Versioned external contracts

`src/integrations/contracts.ts` defines product-neutral version-1 types for external organization/session references, launch subjects, unit identities, released-observation envelopes, correlation IDs, and facilitator command acknowledgements. These types carry only learner-safe observations.

`DisabledExternalFacilitationAdapter` is the only implementation. `enabled` is always false, and every attempted operation rejects with `IntegrationDisabledError`. There are no endpoints, credentials, network calls, or SynapsePortal/SynapsePPJ SDKs.

## Legacy naming compatibility

New display branding is centralized in `BrandMark`: “Synapse” is white and “Facilitator” is green. Legacy operational identifiers are intentionally unchanged:

| Class | Remaining identifier | Treatment |
|---|---|---|
| Repository | directory/remote `CaseFacilitator` | Preserve |
| npm | `casefacilitator` | Preserve |
| Expo/native | name/slug `CaseFacilitator`, scheme `casefacilitator`, Android ID | Preserve until migration plan |
| Firebase | project/auth/storage `casefacilitator` | Preserve; emulator uses separate demo ID |
| Authentication | Portal-issued Firebase custom token | Required for permanent staff access |
| Local persistence | `casefacilitator:runs` | Preserve to retain history |
| Deep links/QR | legacy URI scheme and copy | Preserve until dual-scheme migration |
| UI/technical comments | legacy login, modal, contact, scan copy/comments | Classified display debt; no broad rename here |
| Seed tools | legacy credential/path examples | Preserve as tooling history pending credential migration |

## Production hardening required

Before deploying canonical rules or connecting runtime services:

- merge/migrate legacy runtime collections without breaking standalone workflows;
- use trusted Firebase custom claims or a trusted service for instructor identity and role assignment;
- enforce capacity counts and admission atomically in a trusted transaction boundary;
- define invitation authentication, expiry, replay protection, and device enrollment;
- add App Check, audit logging, retention/deletion policy, monitoring, backups, and incident procedures;
- validate organization ownership and session lead assignment server-side;
- add rule coverage for queries and any new collection before it is used;
- obtain clinical/privacy/security review of fictional fixtures and release semantics;
- configure separate, reviewed production Firebase project aliases outside the demo-only test configuration;
- perform a migration rehearsal and retain rollback capability.
