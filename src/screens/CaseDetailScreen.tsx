// src/screens/CaseDetailScreen.tsx
import { useMemo, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MEDICATIONS, getDoseOptionsForMedication } from "../data/medications";

import type {
  AbcdeAction,
  AbcdeLetter,
  CaseScenario,
  DoseStrength,
  Medication,
  MidasheLetter,
  OpqrstLetter,
  PatientState,
  SamplerLetter,
} from "../domain/cases/types";

import { styles } from "../styles/indexStyles";
import { formatTime } from "../utils/format";

export type CaseCategory = "MEDICAL" | "TRAUMA" | "HLR";

type AckState = { key: string; icon: string } | null;

// ------------------------
// MEDICAL actions (curated)
// ------------------------

const MEDICAL_ACTIONS: AbcdeAction[] = [
  { id: "A_AVPU_GCS_ASSESS", label: "AVPU", letter: "A" },
  { id: "A_SE_LYT_FOEL_AIRWAY", label: "Se–lyt–føl", letter: "A" },
  { id: "A_LOOK_FOR_STRIDOR_SWELLING", label: "Inspicér mund", letter: "A" },
  { id: "A_JAW_CHIN_LIFT", label: "Kæbeløft", letter: "A" },
  { id: "A_SUCTION_OR_FINGERSWEEP", label: "Sug / fingersweep", letter: "A" },
  { id: "A_OPA", label: "OPA", letter: "A" },
  { id: "A_NPA", label: "NPA", letter: "A" },
  { id: "A_HEIMLICH_BACKBLOWS", label: "Heimlich", letter: "A" },

  { id: "B_RESP_RATE_QUALITY", label: "Vurdér RF", letter: "B" },
  { id: "B_AUSCULTATE_LUNGS", label: "Auskultér lunger", letter: "B" },
  { id: "B_POSITIONING", label: "Lejring", letter: "B" },
  { id: "B_PSYCHOLOGICAL_FIRST_AID", label: "Psykisk førstehjælp", letter: "B" },
  { id: "B_OXYGEN_TITRATE", label: "Næsebrille / hudsonmaske", letter: "B" },
  { id: "B_BVM_SUPPORT", label: "Ventilér / støtteventilér", letter: "B" },
  { id: "B_NEBULIZED_SALBUTAMOL", label: "Nebulisator", letter: "B" },

  { id: "C_LOOK_FEEL_BLEEDING", label: "Se & føl: større blødning / hård abdomen", letter: "C" },
  { id: "C_SKIN_TEMP_COLOR_SWEAT", label: "Hud: farve/temperatur/klamtsved", letter: "C" },
  { id: "C_CRT_MEASURE", label: "Kapillærrespons", letter: "C" },
  { id: "C_PULSE_ASSESS", label: "Puls", letter: "C" },
  { id: "C_POSITION_LEGS_UP", label: "Lejring", letter: "C" },
  { id: "C_IV_ACCESS", label: "PVK", letter: "C" },
  { id: "C_STOP_BLEEDING", label: "Stands blødning", letter: "C" },

  { id: "D_GCS", label: "GCS", letter: "D" },
  { id: "D_NEURO_EXAM_STROKE", label: "Neurologisk undersøgelse", letter: "D" },
  { id: "D_PUPILS", label: "Pupiller", letter: "D" },

  { id: "E_TOP_TO_TOE", label: "Top-til-tå undersøgelse", letter: "E" },
  { id: "E_PREVENT_HYPOTHERMIA", label: "Tæpper", letter: "E" },
  { id: "E_COOLING_HYPERTHERMIA", label: "Afkøl", letter: "E" },
  { id: "E_BURNS_COOLING", label: "Skyl med saltvand", letter: "E" },
  { id: "E_SPLINT_STABILIZE", label: "Stabiliser brud/luksation", letter: "E" },
];

// ------------------------
// ITLS (Trauma) catalogs
// ------------------------

const ITLS_EXAM_ACTIONS: AbcdeAction[] = [
  { id: "ITLS_SCENE_SIZEUP", label: "Scene size-up", letter: "A" },
  { id: "ITLS_INITIAL_ASSESSMENT", label: "Initial assessment", letter: "A" },
  { id: "ITLS_DECISION_RAPID_TRAUMA_SURVEY", label: "Rapid trauma survey (general/ukendt MOI)", letter: "A" },
  { id: "ITLS_DECISION_FOCUSED_EXAM", label: "Focused exam (lokaliseret MOI)", letter: "A" },
  { id: "ITLS_LOAD_AND_GO", label: "Load & Go / Stay & Play", letter: "A" },
  { id: "ITLS_SECONDARY_SURVEY", label: "Secondary survey", letter: "D" },
  { id: "ITLS_ONGOING_EXAM", label: "Reevaluering", letter: "D" },
];

const ITLS_TREATMENTS: AbcdeAction[] = [
  { id: "CSPINE_STABILIZATION", label: "C-spine stabilisering", letter: "A" },
  { id: "JAW_THRUST", label: "Kæbeløft", letter: "A" },
  { id: "SUCTION", label: "Sug", letter: "A" },
  { id: "OPA", label: "OPA", letter: "A" },
  { id: "NPA", label: "NPA", letter: "A" },
  { id: "LARYNX_MASK", label: "Larynxmaske (LMA)", letter: "A" },

  { id: "OXYGEN_APPLIED", label: "Ilt", letter: "B" },
  { id: "BVM", label: "Ventiler", letter: "B" },
  { id: "NEEDLE_DECOMPRESSION", label: "Nåledekompression", letter: "B" },
  { id: "CHEST_SEAL", label: "Chest seal", letter: "B" },

  { id: "CONTROL_MAJOR_BLEEDING", label: "Stop større blødning", letter: "C" },
  { id: "TOURNIQUET", label: "Tourniquet", letter: "C" },
  { id: "IV_ACCESS", label: "IV adgang", letter: "C" },
  { id: "IO_ACCESS", label: "IO adgang", letter: "C" },
  { id: "PELVIC_BINDER", label: "Bækkenslynge / bækkenbælte", letter: "C" },

  { id: "PUPILS_CHECK", label: "Pupiller / neurologisk undersøgelse", letter: "D" },

  { id: "EXPOSE_EXAMINE", label: "Top-til-tå", letter: "E" },
  { id: "KEEP_WARM", label: "Forebyg hypotermi", letter: "E" },
];

// HLR meds (base allowlist)
const HLR_MED_IDS = new Set([
  "MED_ADRENALIN_IV",
  "MED_AMIODARON",
  "MED_ATROPIN",
  "MED_GLUKOSE_50",
  "MED_MEDICINSK_ILT",
]);

type ItlsTab = "UNDERSOEGELSE" | "BEHANDLING";
type HlrLevel = "BLS" | "ALS";

function getScenarioHlrLevel(scenario: any, fallback: HlrLevel): HlrLevel {
  const v = scenario?.meta?.hlrLevel;
  return v === "ALS" ? "ALS" : v === "BLS" ? "BLS" : fallback;
}

export function CaseDetailScreen({
  mode = "MEDICAL",
  scenario,
  currentState,
  elapsedMs,
  running,
  popupText,

  selectedLetter,
  setSelectedLetter,

  abcdeActionsExpanded,
  setAbcdeActionsExpanded,

  // still passed in, but acronyms are always visible now
  samplerExpanded,
  setSamplerExpanded,
  opqrstExpanded,
  setOpqrstExpanded,
  midasheExpanded,
  setMidasheExpanded,

  medExpanded,
  setMedExpanded,

  samplerState,
  setSamplerState,
  opqrstState,
  setOpqrstState,
  midasheState,
  setMidasheState,

  selectedMedication,
  setSelectedMedication,
  selectedDose,
  setSelectedDose,
  selectedOxygenFlow,
  setSelectedOxygenFlow,

  onLogTriage,

  // kept for compatibility, but HLR level is now read from scenario.meta when available
  cprLevel,
  onLogCprCallout,

  // ✅ NEW: single registration button (no modal / no choice)
  onRegisterAssistance,

  onBackToSetup,
  onStartTimer,
  onActionPress,
  onRegisterMedication,
  onFinishCaseToSummary,
}: {
  mode?: CaseCategory;

  scenario: CaseScenario;
  currentState: PatientState;

  elapsedMs: number;
  running: boolean;
  popupText: string | null;

  selectedLetter: AbcdeLetter;
  setSelectedLetter: (l: AbcdeLetter) => void;

  abcdeActionsExpanded: boolean;
  setAbcdeActionsExpanded: (v: boolean) => void;

  samplerExpanded: boolean;
  setSamplerExpanded: (v: boolean) => void;
  opqrstExpanded: boolean;
  setOpqrstExpanded: (v: boolean) => void;
  midasheExpanded: boolean;
  setMidasheExpanded: (v: boolean) => void;

  medExpanded: boolean;
  setMedExpanded: (v: boolean) => void;

  samplerState: Record<SamplerLetter, boolean>;
  setSamplerState: (s: Record<SamplerLetter, boolean>) => void;
  opqrstState: Record<OpqrstLetter, boolean>;
  setOpqrstState: (s: Record<OpqrstLetter, boolean>) => void;
  midasheState: Record<MidasheLetter, boolean>;
  setMidasheState: (s: Record<MidasheLetter, boolean>) => void;

  selectedMedication: Medication | null;
  setSelectedMedication: (m: Medication | null) => void;
  selectedDose: DoseStrength | null;
  setSelectedDose: (d: DoseStrength | null) => void;
  selectedOxygenFlow: number | null;
  setSelectedOxygenFlow: (n: number | null) => void;

  onLogTriage: (isCritical: boolean) => void;

  cprLevel: HlrLevel;
  onLogCprCallout: (
    type:
      | "ARREST_RECOGNIZED"
      | "CPR_STARTED"
      | "PADS_ON"
      | "RHYTHM_CHECK"
      | "AIRWAY"
      | "IV_IO"
      | "ROSC",
    extra?: any
  ) => void;

  onRegisterAssistance: () => void;

  onBackToSetup: () => void;
  onStartTimer: () => Promise<void>;
  onActionPress: (action: AbcdeAction) => void;
  onRegisterMedication: () => void;
  onFinishCaseToSummary: () => void;
}) {
  const isMedical = mode === "MEDICAL";
  const isTrauma = mode === "TRAUMA";
  const isHlr = mode === "HLR";

  const showAcronyms = isMedical || isTrauma;
  const showMedicalHandlinger = isMedical;
  const showItlsPanel = isTrauma;
  const showHlrPanel = isHlr;

  const hlrLevel = getScenarioHlrLevel(scenario as any, cprLevel);

  // Local ITLS UI state
  const [itlsExpanded, setItlsExpanded] = useState(true);
  const [itlsTab, setItlsTab] = useState<ItlsTab>("UNDERSOEGELSE");
  const [traumaTreatLetter, setTraumaTreatLetter] = useState<AbcdeLetter>("A");

  const fmt1 = (n: unknown) => {
    const v = Number(n);
    return Number.isFinite(v) ? v.toFixed(1) : "—";
  };

  // Choose meds by mode
  const medCatalog: Medication[] = useMemo(() => {
    const meds = Array.isArray(MEDICATIONS) ? MEDICATIONS : [];

    if (!isHlr) return meds;

    // HLR: allowlist + oxygen
    const base = meds.filter((m: any) => HLR_MED_IDS.has(String(m.id)) || m.type === "oxygen");

    // BLS: typically no IV/IO drugs — keep oxygen only (and any "MED_MEDICINSK_ILT" if it's a drug in your catalog)
    if (hlrLevel === "BLS") {
      return base.filter((m: any) => m.type === "oxygen" || String(m.id) === "MED_MEDICINSK_ILT");
    }

    // ALS: full HLR allowlist
    return base;
  }, [isHlr, hlrLevel]);

  const actionsForLetter = useMemo(() => {
    return MEDICAL_ACTIONS.filter((a) => a.letter === selectedLetter);
  }, [selectedLetter]);

  const itlsTreatForLetter = useMemo(
    () => ITLS_TREATMENTS.filter((a) => a.letter === traumaTreatLetter),
    [traumaTreatLetter]
  );

  const caseStarted = running || elapsedMs > 0;
  const locked = !caseStarted;

  const samplerLetters: SamplerLetter[] = ["S", "A", "M", "P", "L", "E", "R"];
  const opqrstLetters: OpqrstLetter[] = ["O", "P", "Q", "R", "S", "T"];
  const midasheLetters: MidasheLetter[] = ["M", "I", "D", "A", "S", "H", "E"];

  const guardLocked = () => {
    if (locked) {
      Alert.alert("Start casen først", "Tryk på 'GO – start timer' før du bruger funktionerne.");
      return true;
    }
    return false;
  };

  const doseOptions = getDoseOptionsForMedication(selectedMedication);

  const [ack, setAck] = useState<AckState>(null);
  const flashAck = (key: string, icon: string) => {
    setAck({ key, icon });
    setTimeout(() => setAck(null), 650);
  };

  const handleBackPress = () => {
    if (!caseStarted) {
      onBackToSetup();
      return;
    }

    Alert.alert(
      "Forlad case?",
      "Casen er i gang. Hvis du går tilbage nu, mister du den igangværende session (timer og handlinger).",
      [
        { text: "Bliv", style: "cancel" },
        { text: "Forlad", style: "destructive", onPress: onBackToSetup },
      ]
    );
  };

  const GAP = 8;
  const gridItemStyle = (cols: number) => ({
    width: `${100 / cols}%`,
    paddingRight: GAP,
    marginBottom: GAP,
  });

  const gridRowStyle = {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    marginRight: -GAP,
  };

  const SmallTabButton = ({
    active,
    label,
    onPress,
  }: {
    active: boolean;
    label: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={locked}
      style={[
        styles.button,
        {
          flex: 1,
          paddingVertical: 10,
          backgroundColor: active ? "#60a5fa" : "#4b5563",
          opacity: locked ? 0.5 : 1,
        },
      ]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );

  // ✅ HLR actions: BLS hides IV/IO button
  const hlrButtons = useMemo(() => {
    const base: { id: Parameters<typeof onLogCprCallout>[0]; label: string }[] = [
      { id: "ARREST_RECOGNIZED", label: "Arrest erkendt" },
      { id: "CPR_STARTED", label: "HLR startet" },
      { id: "PADS_ON", label: "Pads påsat" },
      { id: "RHYTHM_CHECK", label: "Rytmetjek" },
      { id: "AIRWAY", label: "Luftvej håndteret" },
      // IV/IO only for ALS
      ...(hlrLevel === "ALS" ? [{ id: "IV_IO" as const, label: "IV/IO etableret" }] : []),
      { id: "ROSC", label: "ROSC" },
    ];
    return base;
  }, [hlrLevel, onLogCprCallout]);

  return (
    <SafeAreaView style={styles.container}>
      {popupText && (
        <View style={styles.popup}>
          <Text style={styles.popupText}>{popupText}</Text>
        </View>
      )}

      {ack && (
        <View
          style={{
            position: "absolute",
            top: 90,
            right: 16,
            backgroundColor: "rgba(16,185,129,0.9)",
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 16,
            zIndex: 100,
          }}
        >
          <Text style={{ color: "black", fontWeight: "700", fontSize: 16 }}>{ack.icon}</Text>
        </View>
      )}

      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleBackPress} style={styles.smallButton}>
          <Text style={styles.smallButtonText}>←</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {scenario.title} {isTrauma ? "· (Traume)" : isHlr ? "· (HLR)" : ""}
          </Text>
          <Text style={styles.subtitle}>
            Patient: {scenario.patientInfo.sex === "M" ? "Mand" : "Kvinde"} · {scenario.patientInfo.age} år
          </Text>
        </View>

        <Text style={styles.timerText}>{formatTime(elapsedMs)}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Alarmtekst</Text>
          <Text style={styles.text}>{scenario.dispatchText}</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: running ? "#4b5563" : "#10b981", marginBottom: 8 }]}
          disabled={running}
          onPress={() => onStartTimer()}
        >
          <Text style={styles.buttonText}>{running ? "Case i gang" : "GO – start timer"}</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vitale parametre</Text>
          <Text style={styles.text}>
            HR {currentState.vitals.hr} · RF {currentState.vitals.rr} · BT {currentState.vitals.btSys}/
            {currentState.vitals.btDia} · SpO₂ {currentState.vitals.spo2}% · EtCO₂{" "}
            {fmt1((currentState.vitals as any).etco2)} kPa · Temp {fmt1((currentState.vitals as any).temp)} °C · BS{" "}
            {fmt1((currentState.vitals as any).bs)} mmol/L · Smerte {currentState.vitals.painNrs ?? "-"}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>ABCDE status</Text>
          <Text style={styles.text}>A: {currentState.abcde.A}</Text>
          <Text style={styles.text}>B: {currentState.abcde.B}</Text>
          <Text style={styles.text}>C: {currentState.abcde.C}</Text>
          <Text style={styles.text}>D: {currentState.abcde.D}</Text>
          <Text style={styles.text}>E: {currentState.abcde.E}</Text>
          {currentState.extraInfo && <Text style={styles.text}>Ekstra: {currentState.extraInfo}</Text>}
        </View>

        {/* TRIAGE + ASSISTANCE (all modes) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hurtig vurdering</Text>

          <View style={[{ gap: 8, marginTop: 8 }, locked && { opacity: 0.45 }]}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                style={[styles.button, { flex: 1, backgroundColor: "#ef4444" }]}
                disabled={locked}
                onPress={() => {
                  if (guardLocked()) return;
                  onLogTriage(true);
                  flashAck("triage-critical", "✔️");
                }}
              >
                <Text style={styles.buttonText}>Kritisk</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { flex: 1, backgroundColor: "#10b981" }]}
                disabled={locked}
                onPress={() => {
                  if (guardLocked()) return;
                  onLogTriage(false);
                  flashAck("triage-noncritical", "✔️");
                }}
              >
                <Text style={styles.buttonText}>Ikke-kritisk</Text>
              </TouchableOpacity>
            </View>

            {/* ✅ Single registration button (no modal / no choice) */}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#fabc60ff", opacity: locked ? 0.5 : 1 }]}
              disabled={locked}
              onPress={() => {
                if (guardLocked()) return;
                onRegisterAssistance();
                flashAck("assist-registered", "📟");
              }}
            >
              <Text style={styles.buttonText}>Registrer assistance</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* HLR PANEL */}
        {showHlrPanel && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>HLR handlinger</Text>

            <View style={[{ gap: 8, marginTop: 8 }, locked && { opacity: 0.45 }]}>
              {hlrButtons.map((x) => (
                <TouchableOpacity
                  key={x.id}
                  style={styles.actionButton}
                  disabled={locked}
                  onPress={() => {
                    if (guardLocked()) return;
                    onLogCprCallout(x.id);
                    flashAck(`cpr-${x.id}`, "✔️");
                  }}
                >
                  <Text style={styles.actionButtonText}>{x.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.textSmall, { marginTop: 10 }]}>Niveau: {hlrLevel}</Text>
          </View>
        )}

        {/* TRAUMA: ITLS PANEL */}
        {showItlsPanel && (
          <View style={styles.card}>
            <TouchableOpacity style={styles.dropdownHeader} onPress={() => setItlsExpanded((p) => !p)}>
              <Text style={styles.dropdownHeaderText}>ITLS</Text>
              <Text style={styles.dropdownHeaderText}>{itlsExpanded ? "▲" : "▼"}</Text>
            </TouchableOpacity>

            {itlsExpanded && (
              <>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                  <SmallTabButton
                    active={itlsTab === "UNDERSOEGELSE"}
                    label="Undersøgelse"
                    onPress={() => setItlsTab("UNDERSOEGELSE")}
                  />
                  <SmallTabButton
                    active={itlsTab === "BEHANDLING"}
                    label="Behandling"
                    onPress={() => setItlsTab("BEHANDLING")}
                  />
                </View>

                {itlsTab === "UNDERSOEGELSE" && (
                  <View style={[{ marginTop: 12 }, locked && { opacity: 0.45 }]}>
                    <View style={gridRowStyle}>
                      {ITLS_EXAM_ACTIONS.map((item) => (
                        <View key={item.id} style={gridItemStyle(2)}>
                          <TouchableOpacity
                            style={styles.actionButton}
                            disabled={locked}
                            onPress={() => {
                              if (guardLocked()) return;
                              onActionPress(item);
                              flashAck(`itls-exam-${item.id}`, "✔️");
                            }}
                          >
                            <Text style={styles.actionButtonText}>{item.label}</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {itlsTab === "BEHANDLING" && (
                  <>
                    <View style={[styles.abcdeRow, { marginTop: 12 }, locked && { opacity: 0.45 }]}>
                      {(["A", "B", "C", "D", "E"] as AbcdeLetter[]).map((letter) => (
                        <TouchableOpacity
                          key={letter}
                          style={[styles.abcdeButton, traumaTreatLetter === letter && styles.abcdeButtonActive]}
                          disabled={locked}
                          onPress={() => {
                            if (guardLocked()) return;
                            setTraumaTreatLetter(letter);
                            flashAck(`itls-treat-letter-${letter}`, "👍");
                          }}
                        >
                          <Text
                            style={[
                              styles.abcdeButtonText,
                              traumaTreatLetter === letter && { color: "black", fontWeight: "700" },
                            ]}
                          >
                            {letter}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <View style={[{ marginTop: 10 }, locked && { opacity: 0.45 }]}>
                      <View style={gridRowStyle}>
                        {itlsTreatForLetter.map((item) => (
                          <View key={item.id} style={gridItemStyle(2)}>
                            <TouchableOpacity
                              style={styles.actionButton}
                              disabled={locked}
                              onPress={() => {
                                if (guardLocked()) return;
                                onActionPress(item);
                                flashAck(`itls-treat-${item.id}`, "✔️");
                              }}
                            >
                              <Text style={styles.actionButtonText}>{item.label}</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    </View>
                  </>
                )}
              </>
            )}
          </View>
        )}

        {/* MEDICAL: Handlinger – ABCDE (curated) */}
        {showMedicalHandlinger && (
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.dropdownHeader}
              onPress={() => setAbcdeActionsExpanded(!abcdeActionsExpanded)}
            >
              <Text style={styles.dropdownHeaderText}>Handlinger – ABCDE</Text>
              <Text style={styles.dropdownHeaderText}>{abcdeActionsExpanded ? "▲" : "▼"}</Text>
            </TouchableOpacity>

            {abcdeActionsExpanded && (
              <>
                <View style={[styles.abcdeRow, locked && { opacity: 0.45 }]}>
                  {(["A", "B", "C", "D", "E"] as AbcdeLetter[]).map((letter) => (
                    <TouchableOpacity
                      key={letter}
                      style={[styles.abcdeButton, selectedLetter === letter && styles.abcdeButtonActive]}
                      disabled={locked}
                      onPress={() => {
                        if (guardLocked()) return;
                        setSelectedLetter(letter);
                        flashAck(`abcde-letter-${letter}`, "👍");
                      }}
                    >
                      <Text
                        style={[
                          styles.abcdeButtonText,
                          selectedLetter === letter && { color: "black", fontWeight: "700" },
                        ]}
                      >
                        {letter}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={[{ marginTop: 10 }, locked && { opacity: 0.45 }]}>
                  <View style={gridRowStyle}>
                    {actionsForLetter.map((item) => (
                      <View key={item.id} style={gridItemStyle(2)}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          disabled={locked}
                          onPress={() => {
                            if (guardLocked()) return;
                            onActionPress(item);
                            flashAck(`action-${item.id}`, "✔️");
                          }}
                        >
                          <Text style={styles.actionButtonText}>{item.label}</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}
          </View>
        )}

        {/* ACRONYMS (always visible) */}
        {showAcronyms && (
          <>
            <View style={styles.card}>
              <View style={[styles.abcdeRow, locked && { opacity: 0.45 }]}>
                {samplerLetters.map((letter) => (
                  <TouchableOpacity
                    key={letter}
                    style={[styles.samplerButton, samplerState[letter] && styles.samplerButtonActive]}
                    disabled={locked}
                    onPress={() => {
                      if (guardLocked()) return;
                      setSamplerState({ ...samplerState, [letter]: !samplerState[letter] });
                      flashAck(`sampler-${letter}`, "✔️");
                    }}
                  >
                    <Text style={[styles.samplerButtonText, samplerState[letter] && { color: "black" }]}>
                      {letter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <View style={[styles.abcdeRow, locked && { opacity: 0.45 }]}>
                {opqrstLetters.map((letter) => (
                  <TouchableOpacity
                    key={letter}
                    style={[styles.samplerButton, opqrstState[letter] && styles.samplerButtonActive]}
                    disabled={locked}
                    onPress={() => {
                      if (guardLocked()) return;
                      setOpqrstState({ ...opqrstState, [letter]: !opqrstState[letter] });
                      flashAck(`opqrst-${letter}`, "✔️");
                    }}
                  >
                    <Text style={[styles.samplerButtonText, opqrstState[letter] && { color: "black" }]}>
                      {letter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <View style={[styles.abcdeRow, locked && { opacity: 0.45 }]}>
                {midasheLetters.map((letter) => (
                  <TouchableOpacity
                    key={letter}
                    style={[styles.samplerButton, midasheState[letter] && styles.samplerButtonActive]}
                    disabled={locked}
                    onPress={() => {
                      if (guardLocked()) return;
                      setMidasheState({ ...midasheState, [letter]: !midasheState[letter] });
                      flashAck(`midashe-${letter}`, "✔️");
                    }}
                  >
                    <Text style={[styles.samplerButtonText, midasheState[letter] && { color: "black" }]}>
                      {letter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {/* MEDS */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.dropdownHeader} onPress={() => setMedExpanded(!medExpanded)}>
            <Text style={styles.dropdownHeaderText}>Medicin</Text>
            <Text style={styles.dropdownHeaderText}>{medExpanded ? "▲" : "▼"}</Text>
          </TouchableOpacity>

          {medExpanded && (
            <>
              <Text style={styles.text}>Vælg præparat og dosis.</Text>

              <View style={[{ marginTop: 6 }, locked && { opacity: 0.45 }]}>
                <View style={gridRowStyle}>
                  {medCatalog.map((med) => {
                    const selected = selectedMedication?.id === med.id;

                    return (
                      <View key={med.id} style={gridItemStyle(3)}>
                        <TouchableOpacity
                          style={[styles.medButton, selected && styles.medButtonActive]}
                          disabled={locked}
                          onPress={() => {
                            if (guardLocked()) return;
                            setSelectedMedication(med);
                            setSelectedDose(null);
                            setSelectedOxygenFlow(null);
                            flashAck(`med-${med.id}`, "✔️");
                          }}
                        >
                          <Text
                            style={[
                              styles.medButtonText,
                              selected && { color: "black", fontWeight: "700" },
                            ]}
                            numberOfLines={2}
                          >
                            {med.name}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </View>

              {selectedMedication && selectedMedication.type === "drug" && (
                <View style={[styles.abcdeRow, { marginTop: 6 }, locked && { opacity: 0.45 }]}>
                  {doseOptions.map((d) => (
                    <TouchableOpacity
                      key={String(d.id)}
                      style={[styles.doseButton, selectedDose === d.id && styles.doseButtonActive]}
                      disabled={locked}
                      onPress={() => {
                        if (guardLocked()) return;
                        setSelectedDose(d.id);
                        flashAck(`dose-${String(d.id)}`, "✔️");
                      }}
                    >
                      <Text style={[styles.doseButtonText, selectedDose === d.id && { color: "black" }]}>
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {selectedMedication && selectedMedication.type === "oxygen" && (
                <>
                  <Text style={[styles.text, { marginTop: 6 }]}>Vælg liter/min:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={[{ marginTop: 4 }, locked && { opacity: 0.45 }]}
                  >
                    {(Array.isArray((selectedMedication as any).oxygenFlows)
                      ? (selectedMedication as any).oxygenFlows
                      : []
                    ).map((flow: number) => (
                      <TouchableOpacity
                        key={flow}
                        style={[styles.doseButton, selectedOxygenFlow === flow && styles.doseButtonActive]}
                        disabled={locked}
                        onPress={() => {
                          if (guardLocked()) return;
                          setSelectedOxygenFlow(flow);
                          flashAck(`o2-${flow}`, "✔️");
                        }}
                      >
                        <Text style={[styles.doseButtonText, selectedOxygenFlow === flow && { color: "black" }]}>
                          {flow} L/min
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              <TouchableOpacity
                style={[styles.button, { marginTop: 8, backgroundColor: "#38bdf8", opacity: locked ? 0.5 : 1 }]}
                disabled={locked}
                onPress={() => {
                  if (guardLocked()) return;
                  onRegisterMedication();
                  flashAck("register-med", "✔️");
                }}
              >
                <Text style={styles.buttonText}>Registrer medicin</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {caseStarted && (
          <TouchableOpacity style={styles.button} onPress={onFinishCaseToSummary}>
            <Text style={styles.buttonText}>Case færdig → summary</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default CaseDetailScreen;
