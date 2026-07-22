import type { HlrLevel } from "../../domain/cases/types";
import type { FacilitatorRole } from "../../security/roles";
import { hasCapability } from "../../security/roles";
import type { SessionLifecycle } from "./lifecycle";
import { transitionSession } from "./lifecycle";

export interface CoreMember {
  uid: string;
  role: FacilitatorRole;
  active: boolean;
  unitId?: string;
  joinedAtEpochMs: number;
  revokedAtEpochMs?: number;
}

export interface CoreSession {
  schemaVersion: 1;
  fictional: true;
  sessionId: string;
  fictionalPatientId: string;
  organisationId: string;
  leadInstructorUid: string;
  lifecycle: SessionLifecycle;
  hlrMode: HlrLevel;
  focus: string;
  capacity: {
    assistantInstructors: number;
    learnerUnits: number;
    monitorDevices: number;
  };
  members: Readonly<Record<string, CoreMember>>;
}

function activeCount(session: CoreSession, role: FacilitatorRole): number {
  return Object.values(session.members).filter((member) => member.active && member.role === role).length;
}

function assertLead(session: CoreSession, actorUid: string): void {
  const actor = session.members[actorUid];
  if (!actor?.active || actor.role !== "INSTRUCTOR_LEAD" || session.leadInstructorUid !== actorUid) {
    throw new Error("Lead instructor authority required");
  }
}

export function joinSessionCore(session: CoreSession, member: CoreMember): CoreSession {
  const existing = session.members[member.uid];
  if (existing?.active) {
    if (existing.role !== member.role || existing.unitId !== member.unitId) {
      throw new Error("Membership conflict");
    }
    return session;
  }
  const capacityKey = member.role === "INSTRUCTOR_ASSISTANT"
    ? "assistantInstructors"
    : member.role === "LEARNER_UNIT"
      ? "learnerUnits"
      : member.role === "MONITOR_DEVICE"
        ? "monitorDevices"
        : null;
  if (member.role === "INSTRUCTOR_LEAD" && member.uid !== session.leadInstructorUid) {
    throw new Error("A learner or device cannot become lead instructor");
  }
  if (capacityKey && activeCount(session, member.role) >= session.capacity[capacityKey]) {
    throw new Error(`Session capacity reached for ${member.role}`);
  }
  return { ...session, members: { ...session.members, [member.uid]: member } };
}

export function revokeSessionMember(
  session: CoreSession,
  actorUid: string,
  memberUid: string,
  atEpochMs: number,
): CoreSession {
  assertLead(session, actorUid);
  if (memberUid === session.leadInstructorUid) throw new Error("Lead cannot be revoked");
  const member = session.members[memberUid];
  if (!member || !member.active) return session;
  return {
    ...session,
    members: {
      ...session.members,
      [memberUid]: { ...member, active: false, revokedAtEpochMs: atEpochMs },
    },
  };
}

export function reconnectSessionMember(session: CoreSession, uid: string): CoreMember {
  const member = session.members[uid];
  if (!member?.active) throw new Error("Membership is missing or revoked");
  return member;
}

export function changeSessionFocus(session: CoreSession, actorUid: string, focus: string): CoreSession {
  assertLead(session, actorUid);
  return { ...session, focus };
}

export function moveSessionLifecycle(
  session: CoreSession,
  actorUid: string,
  target: SessionLifecycle,
): CoreSession {
  assertLead(session, actorUid);
  return { ...session, lifecycle: transitionSession(session.lifecycle, target) };
}

export function mayControlPatient(session: CoreSession, actorUid: string, highImpact = false): boolean {
  const member = session.members[actorUid];
  if (!member?.active) return false;
  if (highImpact) return member.role === "INSTRUCTOR_LEAD";
  return hasCapability(member.role, "CONTROL_PATIENT_DEVELOPMENT");
}
