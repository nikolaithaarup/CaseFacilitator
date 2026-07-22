const fs = require("node:fs");
const path = require("node:path");
const { after, before, beforeEach, describe, test } = require("node:test");
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require("@firebase/rules-unit-testing");
const { doc, getDoc, setDoc, updateDoc } = require("firebase/firestore");

const PROJECT_ID = "demo-synapse-facilitator";
const fixtures = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../firebase/emulator-seed/fixtures.json"), "utf8"),
);
let environment;

const sessionDocument = (fixture) => ({
  schemaVersion: 1,
  fictional: true,
  organisationId: fixture.organisationId,
  leadInstructorUid: fixture.leadInstructorUid,
  status: fixture.status,
  capacity: fixture.capacity,
  createdAtEpochMs: 1_700_000_000_000,
});

const membershipDocument = (fixture) => ({
  schemaVersion: 1,
  uid: fixture.uid,
  role: fixture.role,
  active: fixture.active,
  joinedAtEpochMs: 1_700_000_000_000,
  ...(fixture.active ? {} : { revokedAtEpochMs: 1_700_000_001_000, revokedByUid: "lead-a" }),
});

const truthDocument = {
  schemaVersion: 1,
  fictional: true,
  sessionId: "session-a",
  fictionalCaseId: "fictional-case-a",
  hiddenDiagnosis: "Instructor-only fictional diagnosis",
  teachingNotes: ["Instructor-only fictional note"],
  expectedActions: ["Instructor-only expected action"],
  unreleasedObservations: [{ observationId: "hidden-a", label: "Unreleased" }],
  internalSimulationState: { stateId: "S0" },
};

const releasedDocument = {
  schemaVersion: 1,
  fictional: true,
  sessionId: "session-a",
  observationId: "released-a",
  kind: "VITAL_SIGN",
  label: "Released fictional pulse",
  value: 88,
  unit: "/min",
  releasedAtEpochMs: 1_700_000_002_000,
  releasedByUid: "lead-a",
};

function dbFor(uid) {
  return environment.authenticatedContext(uid).firestore();
}

before(async () => {
  environment = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: fs.readFileSync(path.resolve(__dirname, "../firestore.rules"), "utf8") },
  });
});

beforeEach(async () => {
  await environment.clearFirestore();
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    for (const fixture of fixtures.sessions) {
      await setDoc(doc(db, "simulationSessions", fixture.sessionId), sessionDocument(fixture));
    }
    for (const fixture of fixtures.participants) {
      await setDoc(
        doc(db, "simulationSessions", fixture.sessionId, "members", fixture.uid),
        membershipDocument(fixture),
      );
    }
    await setDoc(doc(db, "simulationSessions", "session-a", "instructorTruth", "current"), truthDocument);
  });
});

after(async () => {
  await environment.cleanup();
});

describe("instructor authority", () => {
  test("lead may read truth and finish its session", async () => {
    const db = dbFor("lead-a");
    await assertSucceeds(getDoc(doc(db, "simulationSessions", "session-a", "instructorTruth", "current")));
    await assertSucceeds(updateDoc(doc(db, "simulationSessions", "session-a"), { status: "FINISHED" }));
  });

  test("assistant may read truth and release an observation but cannot administer", async () => {
    const db = dbFor("assistant-a");
    await assertSucceeds(getDoc(doc(db, "simulationSessions", "session-a", "instructorTruth", "current")));
    await assertSucceeds(setDoc(
      doc(db, "simulationSessions", "session-a", "learnerProjection", "released-a"),
      { ...releasedDocument, releasedByUid: "assistant-a" },
    ));
    await assertFails(updateDoc(doc(db, "simulationSessions", "session-a"), { status: "FINISHED" }));
  });
});

describe("learner projection boundary", () => {
  test("learner cannot read hidden diagnosis, notes, expected actions, or unreleased observations", async () => {
    const db = dbFor("learner-a");
    await assertFails(getDoc(doc(db, "simulationSessions", "session-a", "instructorTruth", "current")));
  });

  test("released observations become learner-readable", async () => {
    const leadDb = dbFor("lead-a");
    await assertSucceeds(setDoc(
      doc(leadDb, "simulationSessions", "session-a", "learnerProjection", "released-a"),
      releasedDocument,
    ));
    await assertSucceeds(getDoc(
      doc(dbFor("learner-a"), "simulationSessions", "session-a", "learnerProjection", "released-a"),
    ));
  });

  test("cross-session reads are denied", async () => {
    await assertFails(getDoc(doc(dbFor("learner-b"), "simulationSessions", "session-a", "learnerProjection", "released-a")));
  });

  test("learner cannot promote itself or finish a session", async () => {
    const db = dbFor("learner-a");
    await assertFails(updateDoc(
      doc(db, "simulationSessions", "session-a", "members", "learner-a"),
      { role: "INSTRUCTOR_LEAD" },
    ));
    await assertFails(updateDoc(doc(db, "simulationSessions", "session-a"), { status: "FINISHED" }));
  });

  test("revoked learner cannot read projection", async () => {
    await assertFails(getDoc(
      doc(dbFor("revoked-learner"), "simulationSessions", "session-a", "learnerProjection", "released-a"),
    ));
  });
});

describe("monitor boundary", () => {
  const monitorObservation = {
    schemaVersion: 1,
    fictional: true,
    sessionId: "session-a",
    observationId: "monitor-a-1",
    kind: "MONITOR_VALUE",
    label: "Fictional SpO2 measurement",
    value: 96,
    unit: "%",
    observedAtEpochMs: 1_700_000_003_000,
    createdByUid: "monitor-a",
  };

  test("monitor may create its own observation but cannot read instructor truth", async () => {
    const db = dbFor("monitor-a");
    await assertSucceeds(setDoc(
      doc(db, "simulationSessions", "session-a", "monitorObservations", "monitor-a-1"),
      monitorObservation,
    ));
    await assertFails(getDoc(doc(db, "simulationSessions", "session-a", "instructorTruth", "current")));
  });

  test("monitor cannot spoof another device and revoked monitor is denied", async () => {
    await assertFails(setDoc(
      doc(dbFor("monitor-a"), "simulationSessions", "session-a", "monitorObservations", "spoofed"),
      { ...monitorObservation, observationId: "spoofed", createdByUid: "another-device" },
    ));
    await assertFails(setDoc(
      doc(dbFor("revoked-monitor"), "simulationSessions", "session-a", "monitorObservations", "revoked"),
      { ...monitorObservation, observationId: "revoked", createdByUid: "revoked-monitor" },
    ));
  });
});

describe("canonical contract enforcement", () => {
  test("projection rejects missing fictional marker and version mismatch", async () => {
    const db = dbFor("lead-a");
    await assertFails(setDoc(
      doc(db, "simulationSessions", "session-a", "learnerProjection", "missing-marker"),
      { ...releasedDocument, observationId: "missing-marker", fictional: false },
    ));
    await assertFails(setDoc(
      doc(db, "simulationSessions", "session-a", "learnerProjection", "wrong-version"),
      { ...releasedDocument, observationId: "wrong-version", schemaVersion: 2 },
    ));
  });

  test("projection rejects nested instructor data and session shell rejects hidden fields", async () => {
    const db = dbFor("lead-a");
    await assertFails(setDoc(
      doc(db, "simulationSessions", "session-a", "learnerProjection", "smuggled"),
      {
        ...releasedDocument,
        observationId: "smuggled",
        value: { hiddenDiagnosis: "must never be learner-readable" },
      },
    ));
    await assertFails(updateDoc(
      doc(db, "simulationSessions", "session-a"),
      { hiddenDiagnosis: "must live only below instructorTruth" },
    ));
  });
});
