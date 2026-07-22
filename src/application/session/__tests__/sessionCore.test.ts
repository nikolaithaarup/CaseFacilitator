import { canTransitionSession, transitionSession } from "../lifecycle";
import {
  changeSessionFocus,
  joinSessionCore,
  moveSessionLifecycle,
  reconnectSessionMember,
  revokeSessionMember,
  type CoreSession,
} from "../sessionCore";

const baseSession = (): CoreSession => ({
  schemaVersion: 1,
  fictional: true,
  sessionId: "session-a",
  fictionalPatientId: "fictional-patient-a",
  organisationId: "fictional-org-a",
  leadInstructorUid: "lead-a",
  lifecycle: "PREPARING",
  hlrMode: "ALS",
  focus: "ALL",
  capacity: { assistantInstructors: 1, learnerUnits: 1, monitorDevices: 1 },
  members: {
    "lead-a": { uid: "lead-a", role: "INSTRUCTOR_LEAD", active: true, joinedAtEpochMs: 1 },
    "assistant-a": { uid: "assistant-a", role: "INSTRUCTOR_ASSISTANT", active: true, joinedAtEpochMs: 1 },
  },
});

describe("session lifecycle", () => {
  it("supports valid start, finish, resume, and archive paths", () => {
    expect(canTransitionSession("PREPARING", "OPEN")).toBe(true);
    expect(transitionSession("OPEN", "ACTIVE")).toBe("ACTIVE");
    expect(transitionSession("ACTIVE", "FINISHED")).toBe("FINISHED");
    expect(transitionSession("FINISHED", "ACTIVE")).toBe("ACTIVE");
    expect(transitionSession("FINISHED", "ARCHIVED")).toBe("ARCHIVED");
  });

  it("rejects invalid lifecycle transitions", () => {
    expect(() => transitionSession("PREPARING", "ACTIVE")).toThrow("Invalid session lifecycle");
    expect(() => transitionSession("ARCHIVED", "ACTIVE")).toThrow();
  });
});

describe("membership and authority", () => {
  it("makes identical joins idempotent and rejects conflicts/capacity overflow", () => {
    const session = baseSession();
    const learner = { uid: "learner-a", role: "LEARNER_UNIT" as const, active: true, unitId: "unit-a", joinedAtEpochMs: 2 };
    const joined = joinSessionCore(session, learner);
    expect(joinSessionCore(joined, learner)).toBe(joined);
    expect(() => joinSessionCore(joined, { ...learner, uid: "learner-b" })).toThrow("capacity");
    expect(() => joinSessionCore(joined, { ...learner, role: "INSTRUCTOR_LEAD" })).toThrow();
  });

  it("limits focus/lifecycle authority to lead and bounds assistants", () => {
    const session = baseSession();
    expect(changeSessionFocus(session, "lead-a", "AMBULANCE_1").focus).toBe("AMBULANCE_1");
    expect(() => changeSessionFocus(session, "assistant-a", "ALL")).toThrow("Lead");
    expect(moveSessionLifecycle(session, "lead-a", "OPEN").lifecycle).toBe("OPEN");
    expect(() => moveSessionLifecycle(session, "assistant-a", "OPEN")).toThrow("Lead");
  });

  it("supports reconnect and denies revoked participants/devices", () => {
    const joined = joinSessionCore(baseSession(), {
      uid: "monitor-a", role: "MONITOR_DEVICE", active: true, joinedAtEpochMs: 2,
    });
    expect(reconnectSessionMember(joined, "monitor-a").role).toBe("MONITOR_DEVICE");
    const revoked = revokeSessionMember(joined, "lead-a", "monitor-a", 3);
    expect(() => reconnectSessionMember(revoked, "monitor-a")).toThrow("revoked");
  });
});
