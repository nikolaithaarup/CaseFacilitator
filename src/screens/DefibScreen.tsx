import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ekgImageLookup } from "../data/ekg/ekgLookup";
import type { SessionDoc } from "../services/sessions";
import type { SessionLiveState } from "../services/sessionState";
import { styles } from "../styles/indexStyles";
import { formatTime } from "../utils/format";

export function DefibScreen({
  sessionId,
  sessionDoc,
  liveState,
  defibOn,
  defibBusy,
  defibDisplay,
  defibEkgKey,
  onBack,
  onTogglePower,
  onSetBusy,
  onSetDisplay,
  onSetEkgKey,
  onLogDefib,
  sessionRelNowMs,
}: {
  sessionId: string | null;
  sessionDoc: SessionDoc | null;
  liveState: SessionLiveState | null;

  defibOn: boolean;
  defibBusy: null | "NIBP" | "SAT" | "ECG" | "ETCO2";
  defibDisplay: string;
  defibEkgKey: string | null;

  onBack: () => void;
  onTogglePower: () => void;
  onSetBusy: (v: null | "NIBP" | "SAT" | "ECG" | "ETCO2") => void;
  onSetDisplay: (s: string) => void;
  onSetEkgKey: (k: string | null) => void;

  onLogDefib: (
    type: "DEFIB_NIBP" | "DEFIB_SAT" | "DEFIB_ECG" | "DEFIB_ETCO2",
    payload: any,
    note?: string,
  ) => Promise<void>;

  sessionRelNowMs: () => number;
}) {
  const started = !!sessionDoc?.startedAtEpochMs;
  const vit = liveState?.vitals;
  const rhythmKey = liveState?.rhythmKey ?? "SINUS";
  const ekgImg = defibEkgKey ? (ekgImageLookup as any)[defibEkgKey] : null;

  const defibButton = (label: string, busyKey: typeof defibBusy, onPress: () => void) => (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: defibOn ? "#111827" : "#4b5563",
          opacity: defibOn ? 1 : 0.6,
        },
      ]}
      disabled={!defibOn || defibBusy !== null || !started}
      onPress={onPress}
    >
      <Text style={styles.buttonText}>{defibBusy === busyKey ? `${label}…` : label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.smallButton}>
          <Text style={styles.smallButtonText}>←</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>DEFIB</Text>
          <Text style={styles.subtitle}>
            {sessionId ? `Session: ${sessionId}` : "Ingen session"}
          </Text>
        </View>

        <Text style={styles.timerText}>{started ? formatTime(sessionRelNowMs()) : "--:--"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Status</Text>
        <Text style={styles.text}>
          Power: {defibOn ? "ON" : "OFF"} · Session: {started ? "RUNNING" : "Not started"}
        </Text>
        <Text style={styles.textSmall}>
          Live vitals:{" "}
          {vit
            ? `HR ${vit.hr} · SpO₂ ${vit.spo2}% · BT ${vit.btSys}/${vit.btDia}`
            : "Ingen live data endnu"}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: defibOn ? "#10b981" : "#ef4444" }]}
        onPress={onTogglePower}
      >
        <Text style={styles.buttonText}>
          {defibOn ? "ON (tap to turn OFF)" : "OFF (tap to turn ON)"}
        </Text>
      </TouchableOpacity>

      <View style={{ marginTop: 10, gap: 8 }}>
        {defibButton("NIBP", "NIBP", async () => {
          if (!vit || !sessionId) return;
          onSetBusy("NIBP");
          onSetDisplay("Measuring NIBP…");
          setTimeout(async () => {
            const payload = { btSys: vit.btSys, btDia: vit.btDia };
            onSetDisplay(`NIBP: ${vit.btSys}/${vit.btDia}`);
            onSetBusy(null);
            try {
              await onLogDefib("DEFIB_NIBP", payload, "NIBP measurement");
            } catch (e) {
              console.warn(e);
            }
          }, 5000);
        })}

        {defibButton("SAT + Pulse", "SAT", async () => {
          if (!vit || !sessionId) return;
          onSetBusy("SAT");
          onSetDisplay("Measuring SpO₂…");
          setTimeout(async () => {
            const payload = { spo2: vit.spo2, hr: vit.hr };
            onSetDisplay(`SpO₂ ${vit.spo2}% · Puls ${vit.hr}/min`);
            onSetBusy(null);
            try {
              await onLogDefib("DEFIB_SAT", payload, "SpO2 measurement");
            } catch (e) {
              console.warn(e);
            }
          }, 3000);
        })}

        {defibButton("EtCO₂", "ETCO2", async () => {
          if (!sessionId) return;
          onSetBusy("ETCO2");
          onSetDisplay("Measuring EtCO₂…");
          setTimeout(async () => {
            const etco2 = 4.8;
            const payload = { etco2 };
            onSetDisplay(`EtCO₂: ${etco2} kPa`);
            onSetBusy(null);
            try {
              await onLogDefib("DEFIB_ETCO2", payload, "EtCO2 measurement");
            } catch (e) {
              console.warn(e);
            }
          }, 4000);
        })}

        {defibButton("EKG", "ECG", async () => {
          if (!sessionId) return;
          onSetBusy("ECG");
          onSetDisplay("Running EKG…");
          onSetEkgKey(null);
          setTimeout(async () => {
            const rk = rhythmKey;
            const payload = { rhythmKey: rk };
            onSetDisplay(`EKG ready: ${rk}`);
            onSetEkgKey(rk);
            onSetBusy(null);
            try {
              await onLogDefib("DEFIB_ECG", payload, "EKG acquisition");
            } catch (e) {
              console.warn(e);
            }
          }, 12000);
        })}
      </View>

      <View style={[styles.card, { marginTop: 12 }]}>
        <Text style={styles.cardTitle}>Display</Text>
        <Text style={styles.text}>{defibDisplay || "—"}</Text>

        {ekgImg ? (
          <Image
            source={ekgImg}
            resizeMode="contain"
            style={{ width: "100%", height: 240, marginTop: 10, borderRadius: 12 }}
          />
        ) : (
          <Text style={[styles.textSmall, { marginTop: 8 }]}>
            (EKG image appears here when a mapped rhythmKey exists in ekgLookup)
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}
