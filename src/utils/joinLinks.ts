import * as Linking from "expo-linking";

export function parseJoinRole(raw: any): "FACILITATOR" | "DEFIB" {
  const r = String(raw || "").toLowerCase();
  return r === "defib" ? "DEFIB" : "FACILITATOR";
}

export function buildJoinUrl(sessionId: string, role: "facilitator" | "defib") {
  return Linking.createURL("join", { queryParams: { sessionId, role } });
}
