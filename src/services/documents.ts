import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase";

export type DocumentItem = {
  id: string;
  title: string;
  subtitle?: string | null;
  kind: "DRIVE_FOLDER" | "LINK";
  url: string;
  visibility: "PUBLIC" | "ORG" | "USER";
  orgId?: string | null;
  sortOrder?: number | null;
};

export async function listDocumentsForOrg(orgId: string): Promise<DocumentItem[]> {
  // MVP: ORG docs only (fast + simple)
  const q = query(
    collection(db, "documents"),
    where("visibility", "==", "ORG"),
    where("orgId", "==", orgId),
    orderBy("sortOrder", "asc")
  );

  const snap = await getDocs(q);
  const out: DocumentItem[] = [];
  snap.forEach((d) => {
    const data: any = d.data();
    out.push({
      id: d.id,
      title: data.title ?? "Untitled",
      subtitle: data.subtitle ?? null,
      kind: data.kind ?? "LINK",
      url: data.url,
      visibility: data.visibility,
      orgId: data.orgId ?? null,
      sortOrder: data.sortOrder ?? 999,
    });
  });
  return out;
}
