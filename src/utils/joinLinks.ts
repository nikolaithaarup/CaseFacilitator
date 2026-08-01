// src/utils/joinLinks.ts
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { Platform } from "react-native";

export function parseJoinRole(raw: any): "FACILITATOR" | "DEFIB" {
  const r = String(raw || "").toLowerCase();
  return r === "defib" ? "DEFIB" : "FACILITATOR";
}

/**
 * Build URLs that actually work:
 * - Native: exp://.../--/join?sessionId=...&role=...
 * - Web dev: http://<host>:<port>/?sessionId=...&role=...
 *
 * IMPORTANT:
 * Your web build is a single-page app state-machine (no /join route),
 * so /--/join will 404 before React loads. Root + query avoids that.
 */
export function buildJoinUrls(
  sessionId: string,
  role: "facilitator" | "defib"
): { nativeUrl: string; webUrl: string } {
  const nativeUrl = Linking.createURL("join", {
    queryParams: { sessionId, role },
  });

  const hostUri =
    (Constants.expoConfig as any)?.hostUri ||
    (Constants as any)?.expoConfig?.hostUri ||
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any)?.manifest?.hostUri ||
    null;

  // ✅ WEB: use ROOT + query params, not /--/join
  const webUrlFromHost =
    hostUri && typeof hostUri === "string"
      ? `http://${hostUri}/?sessionId=${encodeURIComponent(
          sessionId
        )}&role=${encodeURIComponent(role)}`
      : null;

  // If you ever host on a real web origin, this will use window.location.origin
  const webFallback =
    Platform.OS === "web"
      ? Linking.createURL("", { queryParams: { sessionId, role } })
      : "http://localhost:8081/";

  const webUrl = webUrlFromHost || webFallback;

  return { nativeUrl, webUrl };
}