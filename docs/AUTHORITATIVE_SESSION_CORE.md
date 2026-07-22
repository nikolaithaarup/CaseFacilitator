# Authoritative standalone simulation and session core

This milestone adds a version-1 authoritative application core while preserving the existing standalone instructor workflow and legacy Firebase persistence. It does **not** deploy Firestore rules, replace deployed collections, enable external adapters, or dual-write canonical data.

## Extracted architecture

- `src/application/session/lifecycle.ts`: central lifecycle graph and transition validation.
- `src/application/session/sessionCore.ts`: membership, capacity, reconnect, revocation, focus, lifecycle authority, and patient-control authority.
- `src/application/simulation/events.ts`: immutable versioned event, acknowledgement, ordering, and restoration snapshot contracts.
- `src/application/simulation/authoritativeCore.ts`: deterministic engine replay, validation, idempotency, stale handling, acknowledgement, and instructor transition feedback.
- `src/application/persistence/gateway.ts`: exclusive legacy-versus-canonical persistence boundary. Exactly one gateway may be active; unsafe dual writes are rejected.
- `src/domain/cases/fallbackRepository.ts`: remote-first, non-mixing case source selection with bundled fictional fallback and provenance.
- `src/services/sessionEvents.ts`: legacy-compatible realtime event subscription. Legacy storage remains the active gateway.

`app/index.tsx` still owns presentation navigation and existing form state. Simulation/session policy and deterministic behavior no longer need to be invented in the screen: they are defined and tested in the application core. Further UI migration can adopt the core incrementally after canonical persistence migration is approved.

## Authoritative event envelope

Every `AuthoritativeSimulationEvent` contains:

- `schemaVersion: 1` and `fictional: true`;
- immutable event ID, session ID, and fictional patient ID;
- event type;
- actor role and actor ID;
- correlation ID;
- server/authoritative creation time plus optional client creation time;
- idempotency key;
- bounded payload containing a typed simulation command and, where relevant, an allowed monitor type/value/unit/charged state.

Events are ordered by `createdAtEpochMs`, then `eventId`. Rebuilding always starts from the scenario's initial state and replays the same ordered engine commands. Duplicate idempotency keys return `DUPLICATE` without evolving state. Malformed, wrong-session, unauthorized, invalid high-impact, and engine-invalid events return a safe rejection. Events outside the five-minute late window return `STALE`; accepted in-window late events trigger deterministic replay.

History is append-only in the core. A rejected event is not inserted into accepted history. Acknowledgements remain separate and include status, correlation, processing time, and safe reason code.

Transition `feedbackToFacilitator` is now collected by the authoritative core and the currently active legacy instructor workflow also surfaces matching transition feedback in the case screen.

## Lifecycle and authority

Lifecycle:

```text
PREPARING -> OPEN -> ACTIVE -> FINISHED -> ARCHIVED
                                  |
                                  +-> ACTIVE (explicit resume)
```

Only an active member whose role is `INSTRUCTOR_LEAD` and whose UID matches the immutable session lead may change lifecycle or authoritative focus. High-impact patient control is lead-only. Assistants retain bounded ordinary patient-control capability but cannot administer, finish, archive, revoke, or change focus. Learners and monitors cannot become lead or control patient development.

Membership uses UID keys and identical reconnect/join operations are idempotent. Conflicting role/unit joins are rejected. Assistant, learner-unit, and monitor-device capacities are checked centrally. Revoked participants and devices cannot reconnect. The lead cannot revoke itself.

## Realtime monitor processing

The existing legacy `sessions/{sessionId}/events` collection is now subscribed to with `onSnapshot` for the entire connected session, not loaded only when summary opens. Events are deterministically sorted by relative time and document ID. This makes accepted monitor/defibrillator activity visible to the lead in realtime and restores it on reconnect.

The authoritative core accepts only these monitor types:

- SpO2/pulse, NIBP, EtCO2, blood glucose, temperature;
- four- and twelve-lead ECG;
- charge and shock.

Monitor events require an active `MONITOR_DEVICE` actor, matching session/patient, bounded payload, and a typed simulation command. Shock additionally requires an `ACTIVE` session and explicit `charged: true`. No monitor event mutates authoritative state except by validated replay through `applySimulationCommand`.

The deployed legacy event collection does not yet have canonical acknowledgement documents. Acknowledgement/rejection is implemented and tested in the core; persisting those acknowledgements awaits the canonical migration to avoid unsafe production dual writes.

## HLR propagation

The setup BLS/ALS selection is controlled by the root workflow rather than screen-local state. It is placed in scenario metadata, legacy session documents, restored session state, CPR command metadata, and saved run records. The authoritative session and restoration snapshot also require an explicit HLR mode.

An authoritative core constructed with a mode different from the session mode throws. ALS is never silently downgraded to BLS. Existing ALS-capable UI actions remain available; no new clinical ALS rules or recommendations were invented.

## Local fictional fallback

Runtime case loading now prefers the complete remote `cases_v3` result. If the remote loader fails or returns no cases, it selects only the bundled generated fictional source, normalizes every case, records `schemaVersion: 1`, `fictional: true`, and provenance `bundled:generated-fictional-v1`, and marks the main menu `LOCAL FICTIONAL MODE`.

Remote and local arrays are never merged. Invalid local cases reject the fallback. The fallback affects instructor case truth only; learner-visible information must still be created through the explicit learner projection allowlist.

## Legacy/canonical compatibility

Actively wired in this milestone:

- legacy Auth, users, `cases_v3`, sessions, live state, events, and run history remain operational;
- legacy events are realtime and carry additive fictional/schema/idempotency metadata;
- HLR mode is additive in new legacy session/run documents and optional when restoring older documents;
- standalone remote-first case loading has a clearly labeled local-only fallback;
- instructor transition feedback is visible.

Not wired:

- `simulationSessions`, `instructorTruth`, `learnerProjection`, canonical event history, snapshots, or acknowledgement persistence;
- canonical Firestore rule deployment;
- Portal/PPJ networking;
- any dual write from legacy to canonical collections.

`EXPO_PUBLIC_CANONICAL_SESSION_CORE=true` selects the canonical persistence mode contract, but no production canonical gateway is provided. This is deliberately failure-safe: it cannot silently write both models. A later migration must implement one tested gateway, emulator-backed transactions, backfill/reconciliation, observability, and rollback before activation.

## Learner confidentiality

The authoritative event and snapshot contracts are instructor/application-core data and are never used as learner DTOs. Learner output remains the explicit `LearnerSafeObservation` allowlist. It excludes:

- hidden diagnosis;
- expected actions;
- scripted progression;
- trigger conditions;
- teaching notes;
- scoring data;
- unreleased observations;
- internal engine state, snapshots, accepted event history, transition feedback, and acknowledgements.

Monitor devices use bounded observation/action DTOs and cannot read instructor truth under the canonical default-deny rules. Existing rules must not be replaced in production until the documented migration and hardening milestone.

## Remaining migration work

- Implement emulator-tested canonical event/snapshot/acknowledgement persistence and transactions.
- Map trusted identities and legacy memberships to canonical roles without client promotion.
- Enforce canonical lifecycle transitions and acknowledgement access in rules or a trusted server boundary.
- Migrate the root workflow fully to a controller/hook and remove remaining duplicated local orchestration only after parity tests.
- Add invitation expiry/replay protection, server timestamps, atomic capacity admission, audit/retention, reconciliation, and rollback.
- Conduct authenticated multi-device browser/device testing against demo Auth/Firestore fixtures.
- Do not deploy canonical rules over legacy production collections before these tasks are complete.
