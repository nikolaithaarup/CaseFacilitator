// src/screens/DefibScreen.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
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
  | "EKG12"
  | "CHARGE"
  | "SHOCK";

type DefibEventType =
  | "DEFIB_NIBP"
  | "DEFIB_SAT"
  | "DEFIB_ETCO2"
  | "DEFIB_BS"
  | "DEFIB_TEMP"
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
  etco2?: { etco2: number | null; rf: number | null };
  bs?: { bs: number | null };
  temp?: { temp: number | null };
  ekg12?: { key: string };
};

// --- ZOLL-ish color palette for the vital tiles (not buttons) ---
const ZOLL = {
  bg: "#050a13",
  border: "rgba(255,255,255,0.10)",

  spo2: "#facc15",
  hr: "#84cc16",
  nibp: "#38bdf8",
  etco2: "#ec4899",
  temp: "#e5e7eb",
  bs: "#e5e7eb",
} as const;

type VitalTone = "SPO2" | "HR" | "NIBP" | "ETCO2" | "TEMP" | "BS";

const vitalTone = (t: VitalTone) => {
  const accent =
    t === "SPO2"
      ? ZOLL.spo2
      : t === "HR"
        ? ZOLL.hr
        : t === "NIBP"
          ? ZOLL.nibp
          : t === "ETCO2"
            ? ZOLL.etco2
            : t === "TEMP"
              ? ZOLL.temp
              : ZOLL.bs;

  return {
    accent,
    panelBg: "rgba(0,0,0,0.45)",
    border: "rgba(255,255,255,0.10)",
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

const Etco2RfBox = ({ et, rf }: { et: string; rf: string }) => {
  const c = vitalTone("ETCO2");

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: ZOLL.bg,
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: ZOLL.border,
        minHeight: 78,
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
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

      <View style={{ flexDirection: "row", gap: 14, marginLeft: 6 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              color: "rgba(255,255,255,0.85)",
              fontWeight: "900",
              fontSize: 12,
            }}
            numberOfLines={1}
          >
            EtCO₂ (kPa)
          </Text>
          <Text
            style={{
              color: c.accent,
              fontWeight: "900",
              fontSize: 26,
              marginTop: 6,
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
          >
            {et}
          </Text>
        </View>

        <View style={{ flex: 1, minWidth: 0, alignItems: "flex-end" }}>
          <Text
            style={{
              color: "rgba(255,255,255,0.85)",
              fontWeight: "900",
              fontSize: 12,
            }}
            numberOfLines={1}
          >
            RF (/min)
          </Text>
          <Text
            style={{
              color: c.accent,
              fontWeight: "900",
              fontSize: 26,
              marginTop: 6,
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
          >
            {rf}
          </Text>
        </View>
      </View>
    </View>
  );
};

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

  onLogDefib: (
    type: DefibEventType,
    payload: Record<string, unknown>,
    note?: string,
  ) => Promise<void>;
  sessionRelNowMs: () => number;
}) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width >= height;

  const started = !!sessionDoc?.startedAtEpochMs;
  const disabledAll = !defibOn || !started || !sessionId;
  const disabledBusy = disabledAll || defibBusy !== null;

  // --- Orientation unlock baseline ---
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

  // Image availability based on rhythmKey (case-selected), but display only after user action.
  const caseEkgImg = rhythmKey ? (ekgImageLookup as any)[rhythmKey] : null;
  const ekg12Enabled = !!caseEkgImg;

  const [measured, setMeasured] = useState<Measured>({});

  // Overlay
  const [ekgOverlayOpen, setEkgOverlayOpen] = useState(false);

  // Wiggle tick (SAT/Pulse + EtCO2/RF)
  const [wiggleTick, setWiggleTick] = useState(0);
  useEffect(() => {
    if (!defibOn) return;
    if (!started) return;

    const id = setInterval(() => {
      setWiggleTick((t) => (t + 1) % 1_000_000);
    }, 1000);

    return () => clearInterval(id);
  }, [defibOn, started]);

  // --- EKG12 progress (12s) ---
  const EKG12_DURATION_MS = 12_000;
  const [ekg12Progress, setEkg12Progress] = useState(0); // 0..1
  const ekg12IntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ekg12StartedAtRef = useRef<number>(0);

  function stopEkg12ProgressTimer() {
    if (ekg12IntervalRef.current) {
      clearInterval(ekg12IntervalRef.current);
      ekg12IntervalRef.current = null;
    }
  }

  // --- Charging / Joules (from your photo) ---
  const JOULE_OPTIONS = [
    10, 15, 20, 30, 50, 70, 85, 100, 120, 150, 200,
  ] as const;
  type Joules = (typeof JOULE_OPTIONS)[number];

  const [showJoulePicker, setShowJoulePicker] = useState(false);
  const [selectedJoules, setSelectedJoules] = useState<Joules>(120);

  const [chargedJoules, setChargedJoules] = useState<Joules | null>(null);
  const isCharged = chargedJoules != null;

  const [chargeProgress, setChargeProgress] = useState(0); // 0..1
  const chargeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chargeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chargeStartedAtRef = useRef<number>(0);
  const chargingTargetRef = useRef<Joules>(120);

  function stopChargeTimers() {
    if (chargeIntervalRef.current) {
      clearInterval(chargeIntervalRef.current);
      chargeIntervalRef.current = null;
    }
    if (chargeTimeoutRef.current) {
      clearTimeout(chargeTimeoutRef.current);
      chargeTimeoutRef.current = null;
    }
  }

  function nextJoules(current: Joules): Joules {
    const idx = JOULE_OPTIONS.indexOf(current);
    if (idx < 0) return current;
    return JOULE_OPTIONS[Math.min(idx + 1, JOULE_OPTIONS.length - 1)];
  }

  // Reset on power off
  useEffect(() => {
    if (!defibOn) {
      setMeasured({});
      setWiggleTick(0);
      setEkgOverlayOpen(false);
      onSetEkgKey(null);

      stopEkg12ProgressTimer();
      setEkg12Progress(0);
      ekg12StartedAtRef.current = 0;

      stopChargeTimers();
      setShowJoulePicker(false);
      setChargeProgress(0);
      setChargedJoules(null);
      setSelectedJoules(120);
      chargingTargetRef.current = 120;
    }
  }, [defibOn, onSetEkgKey]);

  useEffect(() => {
    return () => {
      stopEkg12ProgressTimer();
      stopChargeTimers();
    };
  }, []);

  function reportPersistenceFailure(error: unknown) {
    console.warn("Defibrillator event could not be persisted", error);
    Alert.alert(
      "Målingen blev ikke gemt",
      "Målingen vises på monitoren, men kunne ikke gemmes i simulationsloggen. Kontrollér forbindelsen og prøv igen.",
    );
  }

  // --- Share EKG strip (uses the case image, but only meaningful after EKG run) ---
  async function shareEkgStrip() {
    if (!caseEkgImg) {
      Alert.alert(
        "Ingen EKG",
        "Der er ikke noget EKG-billede til denne case endnu.",
      );
      return;
    }

    try {
      const asset = Asset.fromModule(caseEkgImg);
      if (!asset.localUri) await asset.downloadAsync();

      const src = asset.localUri;
      if (!src) throw new Error("Kunne ikke finde lokal EKG-fil.");

      const dest = `${FileSystem.cacheDirectory}ekg_${rhythmKey}_${Date.now()}.png`;
      await FileSystem.copyAsync({ from: src, to: dest });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert(
          "Sharing ikke tilgængeligt",
          "Din enhed kan ikke dele filer.",
        );
        return;
      }

      await Sharing.shareAsync(dest);

      await onLogDefib(
        "DEFIB_STRIP_SHARED",
        { ekgKey: rhythmKey },
        "EKG shared",
      );
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
    const bg =
      tone === "danger" ? "#ef4444" : tone === "warn" ? "#f59e0b" : "#111827";

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
        sat: {
          spo2: clamp(Math.round(spo2), 0, 100),
          hr: clamp(Math.round(hr), 0, 250),
        },
      }));

      onSetDisplay(`SpO₂ ${Math.round(spo2)}% · Pulse ${Math.round(hr)}/min`);
      onSetBusy(null);

      try {
        await onLogDefib(
          "DEFIB_SAT",
          { spo2: Math.round(spo2), hr: Math.round(hr) },
          "SpO2 + pulse",
        );
      } catch (error) {
        reportPersistenceFailure(error);
      }
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

      setMeasured((p) => ({ ...p, nibp: { sys, dia } }));

      onSetDisplay(`NIBP: ${sys}/${dia}`);
      onSetBusy(null);

      try {
        await onLogDefib("DEFIB_NIBP", { btSys: sys, btDia: dia }, "NIBP");
      } catch (error) {
        reportPersistenceFailure(error);
      }
    }, 4200);
  }

  async function measureEtco2() {
    if (!sessionId) return;
    onSetBusy("ETCO2");
    onSetDisplay("Measuring EtCO₂…");

    setTimeout(async () => {
      const v = vitRef.current;

      const et0 = (v as any)?.etco2 ?? liveEtco2 ?? null;
      const rr0 = (v as any)?.rr ?? null;

      const etBase = isFiniteNumber(et0) ? Number(et0) : null;
      const rfBase = isFiniteNumber(rr0) ? Math.round(Number(rr0)) : null;

      setMeasured((p) => ({ ...p, etco2: { etco2: etBase, rf: rfBase } }));

      onSetDisplay(
        etBase != null || rfBase != null
          ? `EtCO₂: ${etBase != null ? fmtEtco2(etBase) : "—"} kPa · RF: ${rfBase != null ? rfBase : "—"}/min`
          : "EtCO₂/RF: —",
      );

      onSetBusy(null);

      try {
        await onLogDefib(
          "DEFIB_ETCO2",
          { etco2: etBase, rf: rfBase },
          "EtCO2 + RF",
        );
      } catch (error) {
        reportPersistenceFailure(error);
      }
    }, 3200);
  }

  async function measureBs() {
    if (!sessionId) return;
    onSetBusy("BS");
    onSetDisplay("Measuring Blood sugar…");

    setTimeout(async () => {
      const v = vitRef.current;
      const bs0 = (v as any)?.bs ?? liveBs ?? null;

      const bs = isFiniteNumber(bs0)
        ? clamp(jitterFloat(Number(bs0), 0.2), 0, 40)
        : null;

      setMeasured((p) => ({ ...p, bs: { bs } }));

      onSetDisplay(
        bs != null ? `BS: ${Number(bs).toFixed(1)} mmol/L` : "BS: —",
      );
      onSetBusy(null);

      try {
        await onLogDefib("DEFIB_BS", { bs }, "Blood sugar");
      } catch (error) {
        reportPersistenceFailure(error);
      }
    }, 2800);
  }

  async function measureTemp() {
    if (!sessionId) return;
    onSetBusy("TEMP");
    onSetDisplay("Measuring Temperature…");

    setTimeout(async () => {
      const v = vitRef.current;
      const t0 = (v as any)?.temp ?? liveTemp ?? null;

      const temp = isFiniteNumber(t0)
        ? clamp(jitterFloat(Number(t0), 0.1), 25, 45)
        : null;

      setMeasured((p) => ({ ...p, temp: { temp } }));

      onSetDisplay(
        temp != null ? `Temp: ${Number(temp).toFixed(1)} °C` : "Temp: —",
      );
      onSetBusy(null);

      try {
        await onLogDefib("DEFIB_TEMP", { temp }, "Temperature");
      } catch (error) {
        reportPersistenceFailure(error);
      }
    }, 2600);
  }

  // ✅ EKG12: takes 12 seconds, progress shown in STATUS box, then opens overlay
  async function runEkg12() {
    if (!sessionId) return;

    if (!caseEkgImg) {
      Alert.alert(
        "Ingen EKG",
        "Der er ikke et EKG-billede til denne case endnu.",
      );
      return;
    }

    if (defibBusy !== null) return;

    // hide joule picker while running EKG
    setShowJoulePicker(false);

    onSetBusy("EKG12");
    onSetDisplay("Running EKG 12…");
    setEkg12Progress(0);

    stopEkg12ProgressTimer();
    ekg12StartedAtRef.current = Date.now();

    ekg12IntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - ekg12StartedAtRef.current;
      const p = clamp(elapsed / EKG12_DURATION_MS, 0, 1);
      setEkg12Progress(p);
      if (p >= 1) stopEkg12ProgressTimer();
    }, 100);

    setTimeout(async () => {
      stopEkg12ProgressTimer();
      setEkg12Progress(1);

      onSetBusy(null);
      onSetDisplay(`EKG 12 ready (${rhythmKey})`);

      setMeasured((p) => ({ ...p, ekg12: { key: rhythmKey } }));

      onSetEkgKey(rhythmKey);
      setEkgOverlayOpen(true);

      try {
        await onLogDefib("DEFIB_EKG12", { ekgKey: rhythmKey }, "EKG12");
      } catch (error) {
        reportPersistenceFailure(error);
      }

      setTimeout(() => setEkg12Progress(0), 800);
    }, EKG12_DURATION_MS);
  }

  function jouleDurationMs(j: number) {
    // 200J => 13s, linear down.
    return Math.round(13_000 * (j / 200));
  }

  async function startChargeToSelected() {
    if (!sessionId) return;
    if (defibBusy !== null) return;

    const j = selectedJoules;

    // clear previous and start charging
    setChargedJoules(null);
    setChargeProgress(0);
    chargingTargetRef.current = j;

    const duration = jouleDurationMs(j);

    onSetBusy("CHARGE");
    onSetDisplay(`Charging to ${j}J…`);

    // close picker once charging starts
    setShowJoulePicker(false);

    stopChargeTimers();
    chargeStartedAtRef.current = Date.now();

    chargeIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - chargeStartedAtRef.current;
      const p = clamp(elapsed / duration, 0, 1);
      setChargeProgress(p);
      if (p >= 1) {
        if (chargeIntervalRef.current) {
          clearInterval(chargeIntervalRef.current);
          chargeIntervalRef.current = null;
        }
      }
    }, 100);

    chargeTimeoutRef.current = setTimeout(async () => {
      stopChargeTimers();
      setChargeProgress(1);

      setChargedJoules(j);
      onSetBusy(null);
      onSetDisplay(`Charged ${j}J ✓`);

      try {
        await onLogDefib(
          "DEFIB_CHARGE",
          { charged: true, joules: j },
          `Charge ${j}J`,
        );
      } catch (error) {
        reportPersistenceFailure(error);
      }
    }, duration);
  }

  function onPressChargeButton() {
    if (disabledAll) return;
    if (defibBusy !== null) return;

    // If picker is closed -> open it
    if (!showJoulePicker) {
      setShowJoulePicker(true);
      onSetDisplay(`Select joules (selected: ${selectedJoules}J)`);
      return;
    }

    // If picker is open -> pressing CHARGE starts charging to selected joules
    void startChargeToSelected();
  }

  async function doShock() {
    if (!sessionId) return;

    if (!isCharged || chargedJoules == null) {
      Alert.alert("Ikke opladet", "Vælg joule og oplad først.");
      return;
    }

    onSetBusy("SHOCK");
    onSetDisplay(`Delivering shock… (${chargedJoules}J)`);

    const joulesDelivered = chargedJoules;

    setTimeout(async () => {
      setChargedJoules(null);
      onSetBusy(null);
      setChargeProgress(0);
      onSetDisplay(`Shock delivered (${joulesDelivered}J)`);

      // bump next selection: 120 -> 150 -> 200 (then stay 200)
      // bump to next joule option (clamped at max)
      setSelectedJoules((prev) => nextJoules(prev));

      try {
        await onLogDefib(
          "DEFIB_SHOCK",
          { joules: joulesDelivered },
          `Shock ${joulesDelivered}J`,
        );
      } catch (error) {
        reportPersistenceFailure(error);
      }
    }, 800);
  }

  async function doDischarge() {
    if (!sessionId) return;

    // cancel any charge in progress
    stopChargeTimers();
    setChargeProgress(0);

    // clear charged state
    const hadCharge =
      chargedJoules != null || defibBusy === "CHARGE" || isCharged;
    setChargedJoules(null);

    // close picker
    setShowJoulePicker(false);

    // release busy if we were charging
    if (defibBusy === "CHARGE") onSetBusy(null);

    onSetDisplay(
      hadCharge ? "Afladt (discharged)" : "Ingen opladning at aflade",
    );

    try {
      await onLogDefib(
        "DEFIB_CHARGE",
        { charged: false, joules: 0, discharged: true },
        "Discharge",
      );
    } catch {}
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

  const bpValue = measured.nibp
    ? `${fmtInt(measured.nibp.sys)}/${fmtInt(measured.nibp.dia)}`
    : "—";

  const etco2Value = useMemo(() => {
    const et = measured.etco2?.etco2;
    if (et == null) return "—";
    void wiggleTick;
    const w = clamp(jitterFloat(et, 0.2), 0, 80);
    return `${fmtEtco2(w)}`;
  }, [measured.etco2, wiggleTick]);

  const rfValue = useMemo(() => {
    const rf = measured.etco2?.rf;
    if (rf == null) return "—";
    void wiggleTick;
    return `${fmtInt(clamp(jitterInt(rf, 2), 0, 80))}`;
  }, [measured.etco2, wiggleTick]);

  const bsValue =
    measured.bs?.bs != null ? `${Number(measured.bs.bs).toFixed(1)}` : "—";
  const tempValue =
    measured.temp?.temp != null
      ? `${Number(measured.temp.temp).toFixed(1)}`
      : "—";

  const railWidth = isLandscape ? 200 : 170;

  const hasUserRunEkg = !!defibEkgKey;

  const showEkg12Progress = defibBusy === "EKG12";
  const showChargeProgress = defibBusy === "CHARGE" || isCharged;

  return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      style={[styles.container, { paddingTop: 0 }]}
    >
      {/* EKG OVERLAY */}
      <Modal visible={ekgOverlayOpen} animationType="fade" transparent>
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.92)",
            padding: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
                EKG 12 · {rhythmKey}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.75)", marginTop: 4 }}>
                Tap close to return
              </Text>
            </View>

            <TouchableOpacity
              onPress={async () => {
                setEkgOverlayOpen(false);
                try {
                  await ScreenOrientation.unlockAsync();
                } catch {}
              }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: "rgba(255,255,255,0.08)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "900", fontSize: 18 }}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, justifyContent: "center" }}>
            {caseEkgImg ? (
              <Image
                source={caseEkgImg}
                resizeMode="contain"
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 14,
                  backgroundColor: "#050a13",
                }}
              />
            ) : (
              <Text style={{ color: "white" }}>No EKG image available</Text>
            )}
          </View>

          <View style={{ marginTop: 12 }}>
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: "#374151",
                  borderRadius: 16,
                  paddingVertical: 14,
                },
              ]}
              disabled={disabledAll}
              onPress={shareEkgStrip}
            >
              <Text style={styles.buttonText}>Save/Share EKG</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Top bar */}
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}
      >
        <TouchableOpacity onPress={onBack} style={styles.smallButton}>
          <Text style={styles.smallButtonText}>←</Text>
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.title, { marginBottom: 2 }]}>
            DEFIB / MONITOR
          </Text>
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
          <Text style={{ color: "black", fontWeight: "900" }}>
            {defibOn ? "ON" : "OFF"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main */}
      <View
        style={{
          flex: 1,
          flexDirection: isLandscape ? "row" : "column",
          gap: 12,
        }}
      >
        {/* LEFT RAIL */}
        <View style={{ width: railWidth }}>
          <TouchableOpacity />
          <RailButton label="SAT / Puls" busyKey="SAT" onPress={measureSat} />
          <RailButton label="NIBP" busyKey="NIBP" onPress={measureNibp} />
          <RailButton label="EtCO₂" busyKey="ETCO2" onPress={measureEtco2} />
          <RailButton label="Blodsukker" busyKey="BS" onPress={measureBs} />
          <RailButton label="Temperatur" busyKey="TEMP" onPress={measureTemp} />

          <View style={{ height: 6 }} />

          <RailButton
            label="EKG 12"
            busyKey="EKG12"
            disabled={!ekg12Enabled}
            onPress={runEkg12}
          />

          {/* Charge / Shock / Discharge below EKG12 */}
          <RailButton
            label={
              isCharged
                ? `CHARGED (${chargedJoules}J)`
                : showJoulePicker
                  ? "CHARGE (start)"
                  : "CHARGE"
            }
            busyKey="CHARGE"
            tone="warn"
            onPress={onPressChargeButton}
          />

          <RailButton
            label="SHOCK"
            busyKey="SHOCK"
            tone="danger"
            disabled={!isCharged}
            onPress={doShock}
          />

          <RailButton
            label="Aflad"
            busyKey="CHARGE"
            tone="neutral"
            disabled={!isCharged && defibBusy !== "CHARGE"}
            onPress={doDischarge}
          />
        </View>

        {/* RIGHT SIDE */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <ValueBox title="SpO₂" value={satValue} big tone="SPO2" />
            <ValueBox title="Puls (/min)" value={pulseValue} big tone="HR" />
            <ValueBox title="NIBP" value={bpValue} big tone="NIBP" />
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <Etco2RfBox et={etco2Value} rf={rfValue} />
            <ValueBox title="Blodsukker (mmol/L)" value={bsValue} tone="BS" />
            <ValueBox title="Temp (°C)" value={tempValue} tone="TEMP" />
          </View>

          {/* STATUS BOX */}
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
            <Text
              style={{
                color: "rgba(255,255,255,0.75)",
                fontWeight: "900",
                fontSize: 12,
              }}
            >
              STATUS
            </Text>

            <Text
              style={{
                color: "white",
                fontWeight: "800",
                marginTop: 6,
                flexWrap: "wrap",
              }}
            >
              {defibDisplay || "—"}
            </Text>

            {/* ✅ PROGRESS + JOULES UI NOW LIVES INSIDE STATUS BOX */}
            {showEkg12Progress ? (
              <View style={{ marginTop: 12 }}>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.75)",
                    fontWeight: "900",
                    fontSize: 12,
                  }}
                >
                  EKG 12
                </Text>

                <View
                  style={{
                    marginTop: 8,
                    height: 12,
                    borderRadius: 999,
                    backgroundColor: "rgba(255,255,255,0.10)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.12)",
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: "100%",
                      width: `${Math.round(clamp(ekg12Progress, 0, 1) * 100)}%`,
                      backgroundColor: "#38bdf8",
                    }}
                  />
                </View>

                <Text
                  style={{
                    color: "rgba(255,255,255,0.70)",
                    fontSize: 12,
                    marginTop: 6,
                    fontWeight: "800",
                  }}
                >
                  {Math.max(
                    0,
                    Math.ceil((EKG12_DURATION_MS * (1 - ekg12Progress)) / 1000),
                  )}
                  s
                </Text>
              </View>
            ) : null}

            {!showEkg12Progress && showJoulePicker ? (
              <View style={{ marginTop: 12 }}>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.75)",
                    fontWeight: "900",
                    fontSize: 12,
                  }}
                >
                  CHARGE (J)
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingVertical: 10 }}
                >
                  {JOULE_OPTIONS.map((j) => {
                    const selected = j === selectedJoules;

                    return (
                      <TouchableOpacity
                        key={j}
                        disabled={disabledAll || disabledBusy}
                        onPress={() => {
                          setSelectedJoules(j);
                          chargingTargetRef.current = j;
                          onSetDisplay(
                            `Selected ${j}J. Press CHARGE to start.`,
                          );
                        }}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 14,
                          borderRadius: 14,
                          backgroundColor: selected
                            ? "#f59e0b"
                            : "rgba(255,255,255,0.08)",
                          borderWidth: 1,
                          borderColor: selected
                            ? "rgba(255,255,255,0.18)"
                            : "rgba(255,255,255,0.12)",
                          opacity: disabledAll || disabledBusy ? 0.35 : 1,
                          minWidth: 58,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: "white",
                            fontWeight: "900",
                            fontSize: 13,
                          }}
                        >
                          {j}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text
                  style={{
                    color: "rgba(255,255,255,0.65)",
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  Valgt:{" "}
                  <Text style={{ color: "white", fontWeight: "900" }}>
                    {selectedJoules}J
                  </Text>{" "}
                  · Tryk CHARGE igen for at oplade
                </Text>
              </View>
            ) : null}

            {!showEkg12Progress && !showJoulePicker && showChargeProgress ? (
              <View style={{ marginTop: 12 }}>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.75)",
                    fontWeight: "900",
                    fontSize: 12,
                  }}
                >
                  {defibBusy === "CHARGE" ? "CHARGING" : "CHARGED"}
                </Text>

                <View
                  style={{
                    marginTop: 8,
                    height: 12,
                    borderRadius: 999,
                    backgroundColor: "rgba(255,255,255,0.10)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.12)",
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: "100%",
                      width: `${Math.round(clamp(chargeProgress, 0, 1) * 100)}%`,
                      backgroundColor: "#f59e0b",
                    }}
                  />
                </View>

                <Text
                  style={{
                    color: "rgba(255,255,255,0.70)",
                    fontSize: 12,
                    marginTop: 6,
                    fontWeight: "800",
                  }}
                >
                  {defibBusy === "CHARGE"
                    ? `${Math.max(
                        0,
                        Math.ceil(
                          (jouleDurationMs(chargingTargetRef.current) *
                            (1 - chargeProgress)) /
                            1000,
                        ),
                      )}s · ${chargingTargetRef.current}J`
                    : `READY · ${chargedJoules ?? chargingTargetRef.current}J`}
                </Text>
              </View>
            ) : null}

            <Text
              style={{
                color: "rgba(255,255,255,0.65)",
                marginTop: 10,
                flexWrap: "wrap",
              }}
            >
              Live rhythmKey:{" "}
              <Text style={{ color: "white", fontWeight: "900" }}>
                {rhythmKey}
              </Text>
              {" · "}
              Session:{" "}
              <Text style={{ color: "white", fontWeight: "900" }}>
                {started ? "RUNNING" : "NOT STARTED"}
              </Text>
              {" · "}
              Charge:{" "}
              <Text style={{ color: "white", fontWeight: "900" }}>
                {isCharged ? `READY (${chargedJoules}J)` : "NOT READY"}
              </Text>
            </Text>

            {/* EKG area */}
            <View style={{ marginTop: 10 }}>
              <Text
                style={{
                  color: "rgba(255,255,255,0.75)",
                  fontWeight: "900",
                  fontSize: 12,
                }}
              >
                EKG
              </Text>

              {hasUserRunEkg ? (
                <View style={{ marginTop: 8 }}>
                  <Text style={{ color: "rgba(255,255,255,0.80)" }}>
                    EKG ready:{" "}
                    <Text style={{ color: "white", fontWeight: "900" }}>
                      {defibEkgKey}
                    </Text>
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.button,
                      { marginTop: 10, backgroundColor: "#374151" },
                    ]}
                    disabled={disabledAll || !caseEkgImg}
                    onPress={() => setEkgOverlayOpen(true)}
                  >
                    <Text style={styles.buttonText}>Open EKG</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text
                  style={{
                    color: "rgba(255,255,255,0.55)",
                    marginTop: 8,
                    flexWrap: "wrap",
                  }}
                >
                  Press EKG 12 to view the case EKG.
                  {caseEkgImg
                    ? ""
                    : " (No EKG image available for this case yet.)"}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
