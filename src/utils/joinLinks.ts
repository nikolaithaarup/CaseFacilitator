// src/utils/joinLinks.ts
import * as Linking from "expo-linking";
import { Platform } from "react-native";

export function parseJoinRole(raw: any): "FACILITATOR" | "DEFIB" {
  const r = String(raw || "").toLowerCase();
  return r === "defib" ? "DEFIB" : "FACILITATOR";
}

export function buildJoinUrl(sessionId: string, role: "facilitator" | "defib") {
  const queryParams = { sessionId, role };

  // Web: stay on "/" so expo-router doesn't 404 (no /join route)
  if (Platform.OS === "web") {
    return Linking.createURL("/", { queryParams });
  }

  // Native: you can keep /join
  return Linking.createURL("join", { queryParams });
}
