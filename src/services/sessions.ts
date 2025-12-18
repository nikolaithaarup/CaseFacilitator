import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

export type FacilitatorFocus = "ALL" | "AMBULANCE_1" | "AMBULANCE_2" | "AKUTBIL" | "LAEGEBIL";

export type SessionUnits = {
  ambulancer: number;
  akutbil: number;
  laegebil: number;
};

export type SessionPatient = {
  sex: "M" | "K";
  age: number;
};

export type SessionDoc = {
  caseId: string;
  status: "SETUP" | "RUNNING" | "FINISHED";
  createdAt: any;
  createdByUid: string;
  orgId: string;
  facilitatorsCount: number;
  units: SessionUnits;
  patient: SessionPatient;

  // set when lead presses GO (epoch ms from lead device)
  startedAtEpochMs?: number;
};

export async function createSession(params: {
  caseId: string;
  orgId: string;
  facilitatorsCount: number;
  units: SessionUnits;
  patient: SessionPatient;
}): Promise<{ sessionId: string }> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");

  const ref = await addDoc(collection(db, "sessions"), {
    caseId: params.caseId,
    status: "SETUP",
    createdAt: serverTimestamp(),
    createdByUid: uid,
    orgId: params.orgId,
    facilitatorsCount: params.facilitatorsCount,
    units: params.units,
    patient: params.patient,
  } satisfies SessionDoc);

  // ✅ New: membership doc used by security rules
  await setDoc(doc(db, "sessions", ref.id, "members", uid), {
    uid,
    role: "facilitator", // matches rules: facilitator/admin/etc
    focus: "ALL",
    isLead: true,
    joinedAt: serverTimestamp(),
  });

  // Keep your existing facilitator doc (UI/legacy)
  await setDoc(doc(db, "sessions", ref.id, "facilitators", uid), {
    uid,
    role: "LEAD",
    focus: "ALL",
    joinedAt: serverTimestamp(),
  });

  return { sessionId: ref.id };
}

export async function setSessionRunning(sessionId: string) {
  // leader sets a shared reference time
  await updateDoc(doc(db, "sessions", sessionId), {
    status: "RUNNING",
    startedAtEpochMs: Date.now(),
  });
}

export function listenToSession(
  sessionId: string,
  onData: (data: SessionDoc | null) => void,
  onError: (e: any) => void,
) {
  return onSnapshot(
    doc(db, "sessions", sessionId),
    (snap) => onData(snap.exists() ? (snap.data() as SessionDoc) : null),
    onError,
  );
}

export async function joinSession(params: {
  sessionId: string;
  role: "FACILITATOR" | "DEFIB";
}): Promise<SessionDoc> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");

  const snap = await getDoc(doc(db, "sessions", params.sessionId));
  if (!snap.exists()) throw new Error("Session not found");

  // Track device role (your existing behavior)
  await setDoc(
    doc(db, "sessions", params.sessionId, "devices", uid),
    { uid, role: params.role, joinedAt: serverTimestamp() },
    { merge: true },
  );

  // ✅ New: create/merge members doc used by rules
  const memberRole = params.role === "DEFIB" ? "defib_device" : "facilitator";

  await setDoc(
    doc(db, "sessions", params.sessionId, "members", uid),
    {
      uid,
      role: memberRole,
      focus: "ALL",
      isLead: false,
      joinedAt: serverTimestamp(),
    },
    { merge: true },
  );

  // If facilitator, keep your existing facilitator doc (assistant default)
  if (params.role === "FACILITATOR") {
    await setDoc(
      doc(db, "sessions", params.sessionId, "facilitators", uid),
      { uid, role: "ASSISTANT", focus: "ALL", joinedAt: serverTimestamp() },
      { merge: true },
    );
  }

  return snap.data() as SessionDoc;
}

export async function setFacilitatorFocus(sessionId: string, focus: FacilitatorFocus) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");

  // ✅ rules use members
  await setDoc(doc(db, "sessions", sessionId, "members", uid), { focus }, { merge: true });

  // keep your old location too (so current UI doesn’t break)
  await setDoc(doc(db, "sessions", sessionId, "facilitators", uid), { focus }, { merge: true });
}
