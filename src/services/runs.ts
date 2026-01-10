// src/services/runs.ts
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import type {
  ActionLogEntry,
  MidasheLetter,
  OpqrstLetter,
  SamplerLetter,
} from "../domain/cases/types";

import type { EvaluatedAction } from "../domain/cases/types";

import { auth, db } from "../firebase/firebase";

export type RunDoc = {
  runId: string;

  createdAt: any; // serverTimestamp
  createdAtEpochMs: number;

  ownerUid: string;

  orgId: string | null;
  sessionId: string | null;

  caseId: string | null;
  caseTitle: string | null;

  focus: string | null;

  totalTimeMs: number;
  timeline: ActionLogEntry[];

  diagnosis?: string | null;

  evaluated?: EvaluatedAction[]; // ✅ NEW (greens/yellows/reds)

  acronyms: {
    sampler: Record<SamplerLetter, boolean>;
    opqrst: Record<OpqrstLetter, boolean>;
    midashe: Record<MidasheLetter, boolean>;
  };

  feedbackText: string | null;
  feedbackGrade: string | null;

  traineeDisplayName: string | null;

  participants?: Array<{
    role: "AMBULANCE" | "AKUTBIL" | "LAEGEBIL" | "DEFIB" | "FACILITATOR";
    displayName?: string | null;
    uid?: string | null;
  }>;
};

export type RunListItem = {
  runId: string;
  caseTitle: string | null;
  totalTimeMs: number;
  createdAtEpochMs: number;
  traineeDisplayName: string | null;
  sessionId?: string | null; // optional, handy for deletions
};

function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");
  return uid;
}

export async function saveRun(
  input: Omit<RunDoc, "createdAt" | "createdAtEpochMs" | "ownerUid">
) {
  const uid = requireUid();

  const payload: RunDoc = {
    ...input,
    ownerUid: uid,
    createdAt: serverTimestamp(),
    createdAtEpochMs: Date.now(),
  };

  // ✅ Team view: session mirror
  if (input.sessionId) {
    const ref = doc(db, "sessions", input.sessionId, "runs", input.runId);
    await setDoc(ref, payload, { merge: true });
  }

  // ✅ Personal history
  const userRef = doc(db, "users", uid, "runs", input.runId);
  await setDoc(userRef, payload, { merge: true });

  return payload;
}

export async function loadSessionRuns(sessionId: string): Promise<RunDoc[]> {
  const q = query(
    collection(db, "sessions", sessionId, "runs"),
    orderBy("createdAtEpochMs", "desc")
  );

  const snap = await getDocs(q);
  const out: RunDoc[] = [];
  snap.forEach((d) => out.push(d.data() as RunDoc));
  return out;
}

export async function loadMyRuns(limitN = 50): Promise<RunDoc[]> {
  const uid = requireUid();

  const q = query(
    collection(db, "users", uid, "runs"),
    orderBy("createdAtEpochMs", "desc"),
    limit(limitN)
  );

  const snap = await getDocs(q);
  const out: RunDoc[] = [];
  snap.forEach((d) => out.push(d.data() as RunDoc));
  return out;
}

export async function loadMyRunById(runId: string): Promise<RunDoc | null> {
  const uid = requireUid();

  const ref = doc(db, "users", uid, "runs", runId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as RunDoc) : null;
}

export async function listMyRuns(
  uid: string,
  take = 50
): Promise<RunListItem[]> {
  const q = query(
    collection(db, "users", uid, "runs"),
    orderBy("createdAtEpochMs", "desc"),
    limit(take)
  );

  const snap = await getDocs(q);
  const out: RunListItem[] = [];

  snap.forEach((d) => {
    const data: any = d.data();
    out.push({
      runId: data.runId ?? d.id,
      caseTitle: data.caseTitle ?? null,
      totalTimeMs: data.totalTimeMs ?? 0,
      createdAtEpochMs: data.createdAtEpochMs ?? 0,
      traineeDisplayName: data.traineeDisplayName ?? null,
      sessionId: data.sessionId ?? null,
    });
  });

  return out;
}

/**
 * Delete a run from the current user's history.
 * Optionally also delete the mirrored run under the session, if it exists.
 */
export async function deleteMyRunById(runId: string): Promise<void> {
  const uid = requireUid();

  // First fetch the run so we know if there's a session mirror
  const ref = doc(db, "users", uid, "runs", runId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    // Already gone — treat as success
    return;
  }

  const data = snap.data() as RunDoc;
  const sessionId = data.sessionId ?? null;

  // ✅ Delete from personal history
  await deleteDoc(ref);

  // ✅ Best-effort: delete from session mirror if applicable
  if (sessionId) {
    try {
      await deleteDoc(doc(db, "sessions", sessionId, "runs", runId));
    } catch {
      // ignore: you might not have permission, or it might not exist
    }
  }
}
