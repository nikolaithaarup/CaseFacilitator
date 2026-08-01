// src/utils/joinLinks.ts
import * as Linking from "expo-linking";
import { Platform } from "react-native";

export function parseJoinRole(raw: unknown): "FACILITATOR" | "DEFIB" {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return String(value ?? "").toLowerCase() === "defib"
    ? "DEFIB"
    : "FACILITATOR";
}

function queryParams(sessionId: string, role: "facilitator" | "defib") {
  return {
    sessionId,
    role,
  };
}

/**
 * Returns the most appropriate join URL for the current platform.
 */
export function buildJoinUrl(
  sessionId: string,
  role: "facilitator" | "defib",
): string {
  if (Platform.OS === "web") {
    return Linking.createURL("/", {
      queryParams: queryParams(sessionId, role),
    });
  }

  return Linking.createURL("join", {
    queryParams: queryParams(sessionId, role),
  });
}

/**
 * Returns both URLs for QR/invite interfaces that need to offer
 * separate native and browser destinations.
 */
export function buildJoinUrls(
  sessionId: string,
  role: "facilitator" | "defib",
): {
  nativeUrl: string;
  webUrl: string;
} {
  const nativeUrl = Linking.createURL("join", {
    queryParams: queryParams(sessionId, role),
  });

  let webUrl: string;

  if (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    window.location?.origin
  ) {
    const url = new URL("/", window.location.origin);
    url.searchParams.set("sessionId", sessionId);
    url.searchParams.set("role", role);
    webUrl = url.toString();
  } else {
    webUrl = Linking.createURL("/", {
      queryParams: queryParams(sessionId, role),
    });
  }

  return {
    nativeUrl,
    webUrl,
  };
}
