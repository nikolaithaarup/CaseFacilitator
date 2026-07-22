import { addDoc, collection, getDocs, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
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
  | "DEFIB_STRIP_SHARED"
  | "ASSISTANCE_REGISTERED";

export type SessionEvent = {
  eventId?: string;
  idempotencyKey?: string;
  type: SessionEventType;
  tRelMs: number;
  payload?: Record<string, unknown>;
  note?: string;
  source?: "DEFIB" | "FACILITATOR" | "SYSTEM";
  createdAt?: unknown;
  createdByUid?: string;
};

export async function logSessionEvent(params: {
  sessionId: string;
  type: SessionEventType;
  tRelMs: number;
  payload: Record<string, any>;
  note?: string;
  source: "DEFIB" | "FACILITATOR";
  idempotencyKey?: string;
}) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");

  const idempotencyKey = params.idempotencyKey ?? `${uid}:${params.type}:${params.tRelMs}`;
  const ref = await addDoc(collection(db, "sessions", params.sessionId, "events"), {
    idempotencyKey, schemaVersion: 1, fictional: true,
    createdAt: serverTimestamp(), createdByUid: uid, source: params.source,
    type: params.type, tRelMs: params.tRelMs, payload: params.payload,
    ...(params.note ? { note: params.note } : {}),
  } satisfies SessionEvent & { schemaVersion: 1; fictional: true });
  return { status: "ACCEPTED" as const, eventId: ref.id };
}

export async function loadSessionEvents(sessionId: string): Promise<SessionEvent[]> {
  const q = query(collection(db, "sessions", sessionId, "events"), orderBy("tRelMs", "asc"));
  const snap = await getDocs(q);
  const out: SessionEvent[] = [];
  snap.forEach((d) => out.push({ eventId: d.id, ...(d.data() as SessionEvent) }));
  return out;
}

export function listenSessionEvents(
  sessionId: string,
  onData: (events: SessionEvent[]) => void,
  onError: (error: unknown) => void,
) {
  const q = query(collection(db, "sessions", sessionId, "events"), orderBy("tRelMs", "asc"));
  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map((item) => ({ eventId: item.id, ...(item.data() as SessionEvent) }));
    events.sort((left, right) => left.tRelMs - right.tRelMs || String(left.eventId).localeCompare(String(right.eventId)));
    onData(events);
  }, onError);
}
