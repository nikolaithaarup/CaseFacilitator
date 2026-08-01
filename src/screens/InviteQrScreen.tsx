// src/screens/InviteQrScreen.tsx
import * as Clipboard from "expo-clipboard";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../styles/indexStyles";

type RoleTab = "FACILITATOR" | "DEFIB";
type LinkKind = "WEB" | "NATIVE";

async function hapticCopyTick() {
  // Optional polish: haptics on native if available
  if (Platform.OS === "web") return;
  try {
    // Lazy import so you don’t *need* expo-haptics installed for web/dev builds
    const Haptics = await import("expo-haptics");
    await Haptics.selectionAsync();
  } catch {
    // no-op
  }
}

function TabButton({
  label,
  active,
  onPress,
  tone = "neutral",
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  tone?: "neutral" | "blue" | "green";
}) {
  const bg =
    tone === "green" ? "#10b981" : tone === "blue" ? "#60a5fa" : "#111827";

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: bg,
        opacity: active ? 1 : 0.35,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "white", fontWeight: "900", fontSize: 14 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function SegButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: active ? "#374151" : "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: active
          ? "rgba(255,255,255,0.18)"
          : "rgba(255,255,255,0.08)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "white", fontWeight: "900", fontSize: 13 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function InviteQrScreen({
  sessionId,

  // Facilitator
  facNativeUrl,
  facWebUrl,

  // Defib
  defNativeUrl,
  defWebUrl,

  onBack,
}: {
  sessionId: string | null;

  facNativeUrl: string | null;
  facWebUrl: string | null;

  defNativeUrl: string | null;
  defWebUrl: string | null;

  onBack: () => void;
}) {
  // Defaults: presentation-friendly
  // ✅ Defib + Web is the common “laptop as defib” flow
  const [tab, setTab] = useState<RoleTab>("DEFIB");
  const [kind, setKind] = useState<LinkKind>("WEB");

  const ready =
    !!sessionId &&
    !!facNativeUrl &&
    !!facWebUrl &&
    !!defNativeUrl &&
    !!defWebUrl;

  const active = useMemo(() => {
    if (!ready) return { title: "", url: "" };

    const isFac = tab === "FACILITATOR";
    const url =
      kind === "WEB"
        ? isFac
          ? facWebUrl!
          : defWebUrl!
        : isFac
        ? facNativeUrl!
        : defNativeUrl!;

    const title = isFac ? "Facilitator invite" : "Defibrillator invite";
    return { title, url };
  }, [ready, tab, kind, facNativeUrl, facWebUrl, defNativeUrl, defWebUrl]);

  const themeColor = tab === "FACILITATOR" ? "#60a5fa" : "#10b981";

const hint = useMemo(() => {
  if (kind === "WEB") {
    return Platform.OS === "web"
      ? "WEB: This link opens here in the browser."
      : "WEB: Use this link on a laptop/desktop browser.";
  }
  return Platform.OS === "web"
    ? "NATIVE: Scan this with the phone/tablet running the app."
    : "NATIVE: Opens the app on this device (Expo Go / installed).";
}, [kind]);


  const laptopMicroHint = useMemo(() => {
    if (kind !== "WEB") return null;
    return "Tip: If scanning is awkward, press COPY LINK and paste it into the laptop browser.";
  }, [kind]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.smallButton}>
          <Text style={styles.smallButtonText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Invite</Text>
          <Text style={styles.subtitle}>
            Choose role + link type, then scan or copy
          </Text>
        </View>
      </View>

      {!ready ? (
        <View style={{ marginTop: 24, alignItems: "center" }}>
          <ActivityIndicator />
          <Text style={[styles.text, { marginTop: 8 }]}>Opretter session…</Text>
        </View>
      ) : (
        <ScrollView style={{ marginTop: 18 }}>
          {/* Role tabs */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TabButton
              label="Facilitator"
              active={tab === "FACILITATOR"}
              onPress={() => setTab("FACILITATOR")}
              tone="blue"
            />
            <TabButton
              label="Defib"
              active={tab === "DEFIB"}
              onPress={() => setTab("DEFIB")}
              tone="green"
            />
          </View>

          {/* Link type segment */}
          <View style={{ marginTop: 12 }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <SegButton
  label="WEB"
  active={kind === "WEB"}
  onPress={() => setKind("WEB")}
/>
<SegButton
  label="NATIVE"
  active={kind === "NATIVE"}
  onPress={() => setKind("NATIVE")}
/>
            </View>

            <Text style={[styles.textSmall, { marginTop: 8, opacity: 0.85 }]}>
              {hint}
            </Text>

            {laptopMicroHint ? (
              <Text
                style={[
                  styles.textSmall,
                  { marginTop: 6, opacity: 0.75, lineHeight: 16 },
                ]}
              >
                {laptopMicroHint}
              </Text>
            ) : null}
          </View>

          {/* Single QR card */}
          <View style={[styles.card, { alignItems: "center", marginTop: 12 }]}>
            <Text style={styles.cardTitle}>{active.title}</Text>

            <View
              style={{
                padding: 12,
                borderRadius: 18,
                backgroundColor: "rgba(255,255,255,0.04)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.10)",
                marginTop: 10,
              }}
            >
              <QRCode value={active.url} size={240} />
            </View>

            {/* ✅ Big square-ish copy button */}
            <TouchableOpacity
              style={{
                width: "100%",
                marginTop: 14,
                paddingVertical: 16,
                borderRadius: 16,
                backgroundColor: themeColor,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={async () => {
                await Clipboard.setStringAsync(active.url);
                await hapticCopyTick();
                Alert.alert("Kopieret", "Invite-link kopieret til udklipsholder.");
              }}
            >
              <Text
                style={{
                  color: "black",
                  fontWeight: "900",
                  fontSize: 16,
                  letterSpacing: 0.3,
                }}
              >
                📋 COPY LINK
              </Text>
            </TouchableOpacity>

            {/* Subtle URL preview (selectable) */}
            <Text
              selectable
              numberOfLines={2}
              style={{
                marginTop: 10,
                fontSize: 12,
                color: "rgba(255,255,255,0.65)",
                textAlign: "center",
                lineHeight: 16,
              }}
            >
              {active.url}
            </Text>
          </View>

          <Text style={[styles.textSmall, { marginTop: 10, textAlign: "center" }]}>
            Session ID: {sessionId}
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}