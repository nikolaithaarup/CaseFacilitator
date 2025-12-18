import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import type { PatientState } from "../domain/cases/types";
import { auth, db } from "../firebase/firebase";

function stripUndefined<T>(value: T): T {
  // Firestore rejects undefined; JSON stringify drops undefined keys.
  return JSON.parse(JSON.stringify(value));
}

export type SessionLiveState = {
  vitals: PatientState["vitals"];
  abcde: PatientState["abcde"];
  extraInfo?: string;
  rhythmKey?: string;
  updatedAt: any;
};

export async function publishLiveState(params: {
  sessionId: string;
  currentState: PatientState;
  rhythmKey?: string;
}) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");

  const ref = doc(db, "sessions", params.sessionId, "state", "current");
  const payload: SessionLiveState = {
    vitals: params.currentState.vitals,
    abcde: params.currentState.abcde,
    ...(params.currentState.extraInfo ? { extraInfo: params.currentState.extraInfo } : {}),
    ...(params.rhythmKey ? { rhythmKey: params.rhythmKey } : {}),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, stripUndefined(payload), { merge: true });
}

export function listenLiveState(
  sessionId: string,
  onData: (data: SessionLiveState | null) => void,
  onError: (e: any) => void,
) {
  const ref = doc(db, "sessions", sessionId, "state", "current");
  return onSnapshot(
    ref,
    (snap) => onData(snap.exists() ? (snap.data() as SessionLiveState) : null),
    onError,
  );
}
