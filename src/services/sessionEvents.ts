import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

export type SessionEventType =   
  | "DEFIB_NIBP"
  | "DEFIB_SAT"
  | "DEFIB_ETCO2"
  | "DEFIB_BS"
  | "DEFIB_TEMP"
  | "DEFIB_EKG4"
  | "DEFIB_EKG12"
  | "DEFIB_CHARGE"
  | "DEFIB_SHOCK"
  | "DEFIB_ANALYZE"
  | "DEFIB_RHYTHM_CALLOUT"
  | "DEFIB_ROSC"
  | "DEFIB_STRIP_SHARED";

export type SessionEvent = {
  type: SessionEventType;
  tRelMs: number;
  payload?: any;
  note?: string;
  source?: "DEFIB" | "FACILITATOR" | "SYSTEM";
};

export async function logSessionEvent(params: {
  sessionId: string;
  type: SessionEventType;
  tRelMs: number;
  payload: Record<string, any>;
  note?: string;
  source: "DEFIB" | "FACILITATOR";
}) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");

  await addDoc(collection(db, "sessions", params.sessionId, "events"), {
    createdAt: serverTimestamp(),
    createdByUid: uid,
    source: params.source,
    type: params.type,
    tRelMs: params.tRelMs,
    payload: params.payload,
    ...(params.note ? { note: params.note } : {}),
  } satisfies SessionEvent);
}

export async function loadSessionEvents(sessionId: string): Promise<SessionEvent[]> {
  const q = query(collection(db, "sessions", sessionId, "events"), orderBy("tRelMs", "asc"));
  const snap = await getDocs(q);
  const out: SessionEvent[] = [];
  snap.forEach((d) => out.push(d.data() as SessionEvent));
  return out;
}
