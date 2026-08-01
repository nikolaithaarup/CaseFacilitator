const fs = require("node:fs");
const path = require("node:path");
const { after, before, beforeEach, describe, test } = require("node:test");
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require("@firebase/rules-unit-testing");
const { Timestamp, deleteDoc, doc, getDoc, setDoc, updateDoc } = require("firebase/firestore");

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
  hlrMode: fixture.hlrMode,
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

function dbFor(uid, token = {}) {
  const staff = ["lead-a", "assistant-a", "lead-b", "new-lead"].includes(uid);
  const sessionId = uid === "lead-b" ? "session-b" : uid === "new-lead" ? "session-c" : "session-a";
  const staffToken = staff ? {
    firebase: { sign_in_provider: "custom" },
    facilitatorConnected: true,
    facilitatorSessionId: sessionId,
    facilitatorRevocationVersion: 1,
    facilitatorAccessBinding: `binding-${uid}`,
  } : {};
  return environment.authenticatedContext(uid, { ...staffToken, ...token }).firestore();
}

const grantDocument = (uid, sessionId, overrides = {}) => ({
  active: true,
  organisationId: sessionId === "session-b" ? "fictional-org-b" : "fictional-org-a",
  trainingSessionId: sessionId,
  facilitatorSessionId: sessionId,
  subjectType: "STAFF",
  subjectId: uid,
  capability: "INSTRUCTOR",
  authorisedRole: "INSTRUCTOR_LEAD",
  leaseExpiresAt: Timestamp.fromDate(new Date("2099-01-01T00:00:00.000Z")),
  revocationVersion: 1,
  accessBinding: `binding-${uid}`,
  ...overrides,
});

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
    await setDoc(doc(db, "facilitatorAccessGrants", "lead-a"), grantDocument("lead-a", "session-a"));
    await setDoc(doc(db, "facilitatorAccessGrants", "assistant-a"), grantDocument("assistant-a", "session-a", { authorisedRole: "INSTRUCTOR_ASSISTANT" }));
    await setDoc(doc(db, "facilitatorAccessGrants", "lead-b"), grantDocument("lead-b", "session-b"));
    await setDoc(doc(db, "simulationSessions", "session-a", "instructorTruth", "current"), truthDocument);
  });
});

after(async () => {
  await environment.cleanup();
});

describe("instructor authority", () => {
  test("trusted instructor may create a session while an ordinary learner identity cannot", async () => {
    const newSession = {
      schemaVersion: 1,
      fictional: true,
      organisationId: "fictional-org-c",
      leadInstructorUid: "new-lead",
      status: "PREPARING",
      hlrMode: "ALS",
      capacity: { assistantInstructors: 1, learnerUnits: 2, monitorDevices: 1 },
      createdAtEpochMs: 1_700_000_004_000,
    };
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "facilitatorAccessGrants", "new-lead"), grantDocument("new-lead", "session-c"));
    });
    await assertSucceeds(setDoc(doc(dbFor("new-lead"), "simulationSessions", "session-c"), newSession));
    await assertFails(setDoc(
      doc(dbFor("learner-outsider"), "simulationSessions", "session-d"),
      { ...newSession, leadInstructorUid: "learner-outsider" },
    ));
  });

  test("connected staff grant is mandatory, current, unexpired and session-bound", async () => {
    const truth = doc(dbFor("lead-a"), "simulationSessions", "session-a", "instructorTruth", "current");
    await assertSucceeds(getDoc(truth));
    const cases = [
      null,
      grantDocument("lead-a", "session-a", { active: false }),
      grantDocument("lead-a", "session-a", { leaseExpiresAt: Timestamp.fromDate(new Date("2000-01-01T00:00:00.000Z")) }),
      grantDocument("lead-a", "session-a", { revocationVersion: 2 }),
      grantDocument("lead-a", "session-a", { trainingSessionId: "session-b", facilitatorSessionId: "session-b" }),
    ];
    for (const grant of cases) {
      await environment.withSecurityRulesDisabled(async (context) => {
        const ref = doc(context.firestore(), "facilitatorAccessGrants", "lead-a");
        if (grant) await setDoc(ref, grant);
        else await deleteDoc(ref);
      });
      await assertFails(getDoc(doc(dbFor("lead-a"), "simulationSessions", "session-a", "instructorTruth", "current")));
    }
  });

  test("Portal revocation immediately denies the next protected operation", async () => {
    await assertSucceeds(getDoc(
      doc(dbFor("lead-a"), "simulationSessions", "session-a", "instructorTruth", "current"),
    ));
    await environment.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), "facilitatorAccessGrants", "lead-a"), {
        active: false,
        revocationVersion: 2,
      });
    });
    await assertFails(getDoc(
      doc(dbFor("lead-a"), "simulationSessions", "session-a", "instructorTruth", "current"),
    ));
  });

  test("lead may read truth and finish its session", async () => {
    const db = dbFor("lead-a");
    await assertSucceeds(getDoc(doc(db, "simulationSessions", "session-a", "instructorTruth", "current")));
    await assertSucceeds(updateDoc(doc(db, "simulationSessions", "session-a"), { status: "FINISHED" }));
  });

  test("lead cannot skip lifecycle states", async () => {
    await assertFails(updateDoc(doc(dbFor("lead-a"), "simulationSessions", "session-a"), { status: "ARCHIVED" }));
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
