// src/screens/DefibScreen.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import * as ScreenOrientation from "expo-screen-orientation";
import * as Sharing from "expo-sharing";

import type { SessionDoc } from "../services/sessions";
import type { SessionLiveState } from "../services/sessionState";
import { styles } from "../styles/indexStyles";
import { formatTime } from "../utils/format";

import { ekgImageLookup } from "../data/ekg/ekgLookup";

type BusyKey =
  | null
  | "NIBP"
  | "SAT"
  | "ETCO2"
  | "BS"
  | "TEMP"
  | "EKG4"
  | "EKG12"
  | "CHARGE"
  | "SHOCK";

type DefibEventType =
  | "DEFIB_NIBP"
  | "DEFIB_SAT"
  | "DEFIB_ETCO2"
  | "DEFIB_BS"
  | "DEFIB_TEMP"
  | "DEFIB_EKG4"
  | "DEFIB_EKG12"
  | "DEFIB_CHARGE"
  | "DEFIB_SHOCK"
  | "DEFIB_STRIP_SHARED";

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function isFiniteNumber(x: any) {
  const n = Number(x);
  return Number.isFinite(n);
}

function jitterInt(base: number, spread: number) {
  const j = Math.round((Math.random() * 2 - 1) * spread);
  return base + j;
}

function jitterFloat(base: number, spread: number) {
  const j = (Math.random() * 2 - 1) * spread;
  return base + j;
}

function fmtInt(n: any) {
  return isFiniteNumber(n) ? String(Math.round(Number(n))) : "—";
}

function fmtEtco2(n: any) {
  return isFiniteNumber(n) ? Number(n).toFixed(1) : "—";
}

type Measured = {
  sat?: { spo2: number; hr: number };
  nibp?: { sys: number; dia: number };
  etco2?: { etco2: number | null };
  bs?: { bs: number | null };
  temp?: { temp: number | null };
  ekg4?: { key: string };
  ekg12?: { key: string };
};

// --- ZOLL-ish color palette for the vital tiles (not buttons) ---
const ZOLL = {
  bg: "#050a13", // deep monitor glass
  border: "rgba(255,255,255,0.10)",

  // vitals
  spo2: "#facc15", // yellow
  hr: "#84cc16", // green
  nibp: "#38bdf8", // cyan/blue
  etco2: "#ec4899", // magenta/pink
  temp: "#e5e7eb", // light gray/white
  bs: "#e5e7eb", // keep neutral unless you want something else
} as const;

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
  defibBusy: BusyKey;
  defibDisplay: string;
  defibEkgKey: string | null;

  onBack: () => void;
  onTogglePower: () => void;
  onSetBusy: (v: BusyKey) => void;
  onSetDisplay: (s: string) => void;
  onSetEkgKey: (k: string | null) => void;

  onLogDefib: (type: DefibEventType, payload: any, note?: string) => Promise<void>;
  sessionRelNowMs: () => number;
}) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width >= height;

  const started = !!sessionDoc?.startedAtEpochMs;
  const disabledAll = !defibOn || !started || !sessionId;
  const disabledBusy = disabledAll || defibBusy !== null;

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        await ScreenOrientation.unlockAsync();
        if (alive) {
          await ScreenOrientation.getOrientationAsync();
        }
      } catch (e) {
        console.warn("ScreenOrientation unlock failed:", e);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const vit = liveState?.vitals ?? null;

  const vitRef = useRef<typeof vit>(vit);
  useEffect(() => {
    vitRef.current = vit;
  }, [vit]);

  const liveEtco2 = (vit as any)?.etco2 ?? (liveState as any)?.etco2 ?? null;
  const liveTemp = (vit as any)?.temp ?? null;
  const liveBs = (vit as any)?.bs ?? null;

  const rhythmKey = liveState?.rhythmKey ?? "SINUS";

  const ekgKeyCandidate = defibEkgKey ?? rhythmKey;
  const ekgImg = ekgKeyCandidate ? (ekgImageLookup as any)[ekgKeyCandidate] : null;

  const ekg4Enabled = !!ekgImg;
  const ekg12Enabled = !!ekgImg;

  const [charged, setCharged] = useState(false);
  const [measured, setMeasured] = useState<Measured>({});

  // Wiggle tick (SAT/Pulse + EtCO2 only)
  const [wiggleTick, setWiggleTick] = useState(0);
  useEffect(() => {
    if (!defibOn) return;
    if (!started) return;

    const id = setInterval(() => {
      setWiggleTick((t) => (t + 1) % 1_000_000);
    }, 1000);

    return () => clearInterval(id);
  }, [defibOn, started]);

  useEffect(() => {
    if (!defibOn) {
      setCharged(false);
      setMeasured({});
      setWiggleTick(0);
    }
  }, [defibOn]);

  async function shareEkgStrip() {
    if (!ekgImg) {
      Alert.alert("Ingen EKG", "Der er ikke noget EKG-billede til dette key.");
      return;
    }

    try {
      const asset = Asset.fromModule(ekgImg);
      if (!asset.localUri) await asset.downloadAsync();

      const src = asset.localUri;
      if (!src) throw new Error("Kunne ikke finde lokal EKG-fil.");

      const dest = `${FileSystem.cacheDirectory}ekg_${ekgKeyCandidate}_${Date.now()}.png`;
      await FileSystem.copyAsync({ from: src, to: dest });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert("Sharing ikke tilgængeligt", "Din enhed kan ikke dele filer.");
        return;
      }

      await Sharing.shareAsync(dest);

      await onLogDefib("DEFIB_STRIP_SHARED", { ekgKey: ekgKeyCandidate }, "EKG strip shared");
    } catch (e: any) {
      console.warn(e);
      Alert.alert("Kunne ikke dele strip", e?.message ?? "Ukendt fejl.");
    }
  }

  function RailButton({
    label,
    busyKey,
    disabled,
    onPress,
    tone = "neutral",
    compact = false,
    flex = false,
  }: {
    label: string;
    busyKey: Exclude<BusyKey, null>;
    disabled?: boolean;
    onPress: () => void;
    tone?: "neutral" | "warn" | "danger";
    compact?: boolean;
    flex?: boolean;
  }) {
    const bg = tone === "danger" ? "#ef4444" : tone === "warn" ? "#f59e0b" : "#111827";

    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabledBusy || disabled}
        style={{
          ...(flex ? { flex: 1 } : null),
          paddingVertical: compact ? 10 : 12,
          paddingHorizontal: 12,
          borderRadius: 14,
          marginBottom: compact ? 0 : 10,
          backgroundColor: bg,
          opacity: disabledBusy || disabled ? 0.35 : 1,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <Text style={{ color: "white", fontWeight: "900" }} numberOfLines={1}>
          {defibBusy === busyKey ? `${label}…` : label}
        </Text>
      </TouchableOpacity>
    );
  }

  async function measureSat() {
    if (!sessionId) return;
    onSetBusy("SAT");
    onSetDisplay("Measuring SpO₂ + Pulse…");

    setTimeout(async () => {
      const v = vitRef.current;
      if (!v) {
        onSetDisplay("SpO₂/Pulse: — (no live data)");
        onSetBusy(null);
        return;
      }

      const spo2 = isFiniteNumber(v.spo2) ? Number(v.spo2) : 0;
      const hr = isFiniteNumber(v.hr) ? Number(v.hr) : 0;

      setMeasured((p) => ({
        ...p,
        sat: { spo2: clamp(Math.round(spo2), 0, 100), hr: clamp(Math.round(hr), 0, 250) },
      }));

      onSetDisplay(`SpO₂ ${Math.round(spo2)}% · Pulse ${Math.round(hr)}/min`);
      onSetBusy(null);

      try {
        await onLogDefib("DEFIB_SAT", { spo2: Math.round(spo2), hr: Math.round(hr) }, "SpO2 + pulse");
      } catch {}
    }, 2200);
  }

  async function measureNibp() {
    if (!sessionId) return;
    onSetBusy("NIBP");
    onSetDisplay("Measuring NIBP…");

    setTimeout(async () => {
      const v = vitRef.current;
      if (!v) {
        onSetDisplay("NIBP: — (no live data)");
        onSetBusy(null);
        return;
      }

      const sys0 = isFiniteNumber(v.btSys) ? Number(v.btSys) : 0;
      const dia0 = isFiniteNumber(v.btDia) ? Number(v.btDia) : 0;

      const sys = clamp(jitterInt(Math.round(sys0), 5), 0, 260);
      const dia = clamp(jitterInt(Math.round(dia0), 5), 0, 200);

      setMeasured((p) => ({
        ...p,
        nibp: { sys, dia },
      }));

      onSetDisplay(`NIBP: ${sys}/${dia}`);
      onSetBusy(null);

      try {
        await onLogDefib("DEFIB_NIBP", { btSys: sys, btDia: dia }, "NIBP");
      } catch {}
    }, 4200);
  }

  async function measureEtco2() {
    if (!sessionId) return;
    onSetBusy("ETCO2");
    onSetDisplay("Measuring EtCO₂…");

    setTimeout(async () => {
      const v = vitRef.current;
      const et0 = (v as any)?.etco2 ?? liveEtco2 ?? null;

      const base = isFiniteNumber(et0) ? Number(et0) : null;

      setMeasured((p) => ({
        ...p,
        etco2: { etco2: base },
      }));

      onSetDisplay(base != null ? `EtCO₂: ${fmtEtco2(base)} kPa` : "EtCO₂: —");
      onSetBusy(null);

      try {
        await onLogDefib("DEFIB_ETCO2", { etco2: base }, "EtCO2");
      } catch {}
    }, 3200);
  }

  async function measureBs() {
    if (!sessionId) return;
    onSetBusy("BS");
    onSetDisplay("Measuring Blood sugar…");

    setTimeout(async () => {
      const v = vitRef.current;
      const bs0 = (v as any)?.bs ?? liveBs ?? null;

      const bs =
        isFiniteNumber(bs0) ? clamp(jitterFloat(Number(bs0), 0.2), 0, 40) : null;

      setMeasured((p) => ({
        ...p,
        bs: { bs },
      }));

      onSetDisplay(bs != null ? `BS: ${Number(bs).toFixed(1)} mmol/L` : "BS: —");
      onSetBusy(null);

      try {
        await onLogDefib("DEFIB_BS", { bs }, "Blood sugar");
      } catch {}
    }, 2800);
  }

  async function measureTemp() {
    if (!sessionId) return;
    onSetBusy("TEMP");
    onSetDisplay("Measuring Temperature…");

    setTimeout(async () => {
      const v = vitRef.current;
      const t0 = (v as any)?.temp ?? liveTemp ?? null;

      const temp =
        isFiniteNumber(t0) ? clamp(jitterFloat(Number(t0), 0.1), 25, 45) : null;

      setMeasured((p) => ({
        ...p,
        temp: { temp },
      }));

      onSetDisplay(temp != null ? `Temp: ${Number(temp).toFixed(1)} °C` : "Temp: —");
      onSetBusy(null);

      try {
        await onLogDefib("DEFIB_TEMP", { temp }, "Temperature");
      } catch {}
    }, 2600);
  }

  async function runEkg(kind: "EKG4" | "EKG12") {
    if (!sessionId) return;
    onSetBusy(kind);
    onSetDisplay(`Running ${kind}…`);
    onSetEkgKey(null);

    setTimeout(async () => {
      const key = ekgKeyCandidate;
      onSetEkgKey(key);
      onSetDisplay(`${kind} ready (${key})`);
      onSetBusy(null);

      setMeasured((p) => ({
        ...p,
        ...(kind === "EKG4" ? { ekg4: { key } } : { ekg12: { key } }),
      }));

      try {
        await onLogDefib(kind === "EKG4" ? "DEFIB_EKG4" : "DEFIB_EKG12", { ekgKey: key }, kind);
      } catch {}
    }, kind === "EKG12" ? 12000 : 7000);
  }

  async function doCharge() {
    if (!sessionId) return;
    onSetBusy("CHARGE");
    onSetDisplay("Charging…");
    setCharged(false);

    setTimeout(async () => {
      setCharged(true);
      onSetBusy(null);
      onSetDisplay("Charged ✓");

      try {
        await onLogDefib("DEFIB_CHARGE", { charged: true }, "Charge");
      } catch {}
    }, 2200);
  }

  async function doShock() {
    if (!sessionId) return;

    if (!charged) {
      Alert.alert("Ikke opladet", "Tryk CHARGE først.");
      return;
    }

    onSetBusy("SHOCK");
    onSetDisplay("Delivering shock…");

    setTimeout(async () => {
      setCharged(false);
      onSetBusy(null);
      onSetDisplay("Shock delivered");

      try {
        await onLogDefib("DEFIB_SHOCK", { joules: 200 }, "Shock 200J");
      } catch {}
    }, 800);
  }

  // Display values
  const satValue = useMemo(() => {
    if (!measured.sat) return "—";
    void wiggleTick;
    return `${fmtInt(clamp(jitterInt(measured.sat.spo2, 3), 0, 100))}%`;
  }, [measured.sat, wiggleTick]);

  const pulseValue = useMemo(() => {
    if (!measured.sat) return "—";
    void wiggleTick;
    return `${fmtInt(clamp(jitterInt(measured.sat.hr, 5), 0, 250))}`;
  }, [measured.sat, wiggleTick]);

  const bpValue = measured.nibp ? `${fmtInt(measured.nibp.sys)}/${fmtInt(measured.nibp.dia)}` : "—";

  const etco2Value = useMemo(() => {
    if (measured.etco2?.etco2 == null) return "—";
    void wiggleTick;
    const w = clamp(jitterFloat(measured.etco2.etco2, 0.2), 0, 80);
    return `${fmtEtco2(w)}`;
  }, [measured.etco2, wiggleTick]);

  const bsValue = measured.bs?.bs != null ? `${Number(measured.bs.bs).toFixed(1)}` : "—";
  const tempValue = measured.temp?.temp != null ? `${Number(measured.temp.temp).toFixed(1)}` : "—";

  const railWidth = isLandscape ? 200 : 170;

  // ✅ Colorized vital tiles (ZOLL-ish)
  type VitalTone = "SPO2" | "HR" | "NIBP" | "ETCO2" | "TEMP" | "BS";
  const vitalTone = (t: VitalTone) => {
    const accent =
      t === "SPO2" ? ZOLL.spo2 :
      t === "HR" ? ZOLL.hr :
      t === "NIBP" ? ZOLL.nibp :
      t === "ETCO2" ? ZOLL.etco2 :
      t === "TEMP" ? ZOLL.temp :
      ZOLL.bs;

    return {
      accent,
      // subtle tinted panel to feel like a monitor module
      panelBg: "rgba(0,0,0,0.45)",
      // a tiny hint of the accent in the border
      border: "rgba(255,255,255,0.10)",
      // optional: a soft left strip accent
      strip: accent,
    };
  };

  const ValueBox = ({
    title,
    value,
    big = false,
    tone,
  }: {
    title: string;
    value: string;
    big?: boolean;
    tone: VitalTone;
  }) => {
    const c = vitalTone(tone);

    return (
      <View
        style={{
          flex: 1,
          backgroundColor: ZOLL.bg,
          borderRadius: 14,
          padding: 12,
          borderWidth: 1,
          borderColor: ZOLL.border,
          minHeight: big ? 92 : 78,
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* left accent strip like ZOLL modules */}
        <View
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 6,
            backgroundColor: c.strip,
            opacity: 0.9,
          }}
        />

        <Text
          style={{
            color: "rgba(255,255,255,0.85)",
            fontWeight: "900",
            fontSize: 12,
            flexShrink: 1,
            marginLeft: 6,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>

        <Text
          style={{
            color: c.accent,
            fontWeight: "900",
            fontSize: big ? 34 : 26,
            marginTop: 6,
            flexShrink: 1,
            marginLeft: 6,
          }}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
        >
          {value}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={[styles.container, { paddingTop: 0 }]}>
      {/* Top bar */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
        <TouchableOpacity onPress={onBack} style={styles.smallButton}>
          <Text style={styles.smallButtonText}>←</Text>
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.title, { marginBottom: 2 }]}>DEFIB / MONITOR</Text>
          <Text style={styles.subtitle}>
            {sessionId ? `Session: ${sessionId}` : "Ingen session"} ·{" "}
            {started ? formatTime(sessionRelNowMs()) : "--:--"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onTogglePower}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 999,
            backgroundColor: defibOn ? "#10b981" : "#ef4444",
          }}
        >
          <Text style={{ color: "black", fontWeight: "900" }}>{defibOn ? "ON" : "OFF"}</Text>
        </TouchableOpacity>
      </View>

      {/* Main */}
      <View style={{ flex: 1, flexDirection: isLandscape ? "row" : "column", gap: 12 }}>
        <View style={{ width: railWidth }}>
          <TouchableOpacity />
          <RailButton label="SAT / Puls" busyKey="SAT" onPress={measureSat} />
          <RailButton label="BP (NIBP)" busyKey="NIBP" onPress={measureNibp} />
          <RailButton label="EtCO₂" busyKey="ETCO2" onPress={measureEtco2} />
          <RailButton label="BS" busyKey="BS" onPress={measureBs} />
          <RailButton label="T (Temp)" busyKey="TEMP" onPress={measureTemp} />

          <View style={{ height: 6 }} />

          <RailButton label="EKG 4" busyKey="EKG4" disabled={!ekg4Enabled} onPress={() => runEkg("EKG4")} />
          <RailButton label="EKG 12" busyKey="EKG12" disabled={!ekg12Enabled} onPress={() => runEkg("EKG12")} />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <ValueBox title="SpO₂" value={satValue} big tone="SPO2" />
            <ValueBox title="Pulse" value={pulseValue} big tone="HR" />
            <ValueBox title="NIBP" value={bpValue} big tone="NIBP" />
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <ValueBox title="EtCO₂ (kPa)" value={etco2Value} tone="ETCO2" />
            <ValueBox title="BS (mmol/L)" value={bsValue} tone="BS" />
            <ValueBox title="Temp (°C)" value={tempValue} tone="TEMP" />
          </View>

          <View
            style={{
              marginTop: 10,
              backgroundColor: "#0b1220",
              borderRadius: 14,
              padding: 12,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
              minWidth: 0,
            }}
          >
            <Text style={{ color: "rgba(255,255,255,0.75)", fontWeight: "900", fontSize: 12 }}>
              STATUS
            </Text>

            <Text style={{ color: "white", fontWeight: "800", marginTop: 6, flexWrap: "wrap" }}>
              {defibDisplay || "—"}
            </Text>

            {/* Charge / Shock buttons side-by-side */}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <RailButton
                label={charged ? "CHARGED" : "CHARGE"}
                busyKey="CHARGE"
                tone="warn"
                onPress={doCharge}
                compact
                flex
              />
              <RailButton
                label="SHOCK"
                busyKey="SHOCK"
                tone="danger"
                disabled={!charged}
                onPress={doShock}
                compact
                flex
              />
            </View>

            <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 10, flexWrap: "wrap" }}>
              Live rhythmKey: <Text style={{ color: "white", fontWeight: "900" }}>{rhythmKey}</Text>
              {" · "}
              Session:{" "}
              <Text style={{ color: "white", fontWeight: "900" }}>{started ? "RUNNING" : "NOT STARTED"}</Text>
              {" · "}
              Charge: <Text style={{ color: "white", fontWeight: "900" }}>{charged ? "READY" : "NOT READY"}</Text>
            </Text>

            <View style={{ marginTop: 10 }}>
              <Text style={{ color: "rgba(255,255,255,0.75)", fontWeight: "900", fontSize: 12 }}>
                EKG DISPLAY
              </Text>

              {ekgImg ? (
                <>
                  <Image
                    source={ekgImg}
                    resizeMode="contain"
                    style={{
                      width: "100%",
                      height: clamp(Math.round(height * (isLandscape ? 0.34 : 0.26)), 140, 260),
                      marginTop: 8,
                      borderRadius: 12,
                      backgroundColor: "#050a13",
                    }}
                  />

                  <TouchableOpacity
                    style={[styles.button, { marginTop: 10, backgroundColor: "#4b5563" }]}
                    disabled={disabledAll}
                    onPress={shareEkgStrip}
                  >
                    <Text style={styles.buttonText}>Save/Share EKG strip</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={{ color: "rgba(255,255,255,0.55)", marginTop: 8, flexWrap: "wrap" }}>
                  EKG 4 / EKG 12 disabled: no image for key{" "}
                  <Text style={{ color: "white", fontWeight: "900" }}>{ekgKeyCandidate}</Text>
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
