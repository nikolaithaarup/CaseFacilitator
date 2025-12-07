// app/index.tsx
import * as Clipboard from "expo-clipboard";
import { useEffect, useMemo, useState } from "react";
import { styles } from "../src/styles/indexStyles";

import {
  Alert,
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

// If you want to actually use the shared header later:
// import Header from "../components/Header";

import { getCasesByPeriod } from "../src/domain/cases/localRepository";
import type {
  AbcdeAction,
  AbcdeLetter,
  ActionLogEntry,
  CaseScenario,
  DoseStrength,
  EvaluatedAction,
  Medication,
  OpqrstLetter,
  PatientState,
  SamplerLetter,
  SchoolPeriod,
  Screen
} from "../src/domain/cases/types";

// ---------- ABCDE actions including interventions ----------

const ABCDE_ACTIONS: AbcdeAction[] = [
  // A – assessment
  { id: "A_LOOK", letter: "A", label: "Inspicer mund/svælg" },
  { id: "A_POSITION", letter: "A", label: "Luftvejslejring / kæbeløft" },
  // A – interventions
  { id: "A_RUBENS", letter: "A", label: "Rubens ballon / poseventilation" },
  { id: "A_NPA", letter: "A", label: "Anlæg NPA" },
  { id: "A_OPA", letter: "A", label: "Anlæg OPA" },
  { id: "A_LMA", letter: "A", label: "Larynxmaske" },

  // B – assessment
  { id: "B_INSPECT", letter: "B", label: "Inspicer thorax / RF" },
  { id: "B_STETHO", letter: "B", label: "Stetoskopér lunger" },
  // B – interventions
  { id: "B_NASAL_O2", letter: "B", label: "Næsebrille O₂" },
  { id: "B_HUDSON", letter: "B", label: "Hudson maske" },
  { id: "B_NEBULISER", letter: "B", label: "Nebulisator (fx Ventoline)" },
  { id: "B_NEEDLE_DECOMP", letter: "B", label: "Nåledekompression" },
  { id: "B_ETT", letter: "B", label: "Tube (intubation)" },
  { id: "B_BINASAL", letter: "B", label: "Binasal tube + kapnografi" },

  // C – assessment / monitoring
  { id: "C_BP", letter: "C", label: "Mål blodtryk" },
  { id: "C_PULSE", letter: "C", label: "Tæl puls / rytme" },
  { id: "C_IV", letter: "C", label: "Anlæg IV-adgang" },
  { id: "C_IO", letter: "C", label: "Anlæg IO-adgang" },
  { id: "C_EKG4", letter: "C", label: "EKG 4-afledninger" },
  { id: "C_EKG12", letter: "C", label: "EKG 12-afledninger" },

  // D – assessment
  { id: "D_GCS", letter: "D", label: "Vurder GCS" },
  { id: "D_BS", letter: "D", label: "Mål blodsukker" },
  { id: "D_PUPILS", letter: "D", label: "Tjek pupiller" },

  // E – assessment
  { id: "E_TEMP", letter: "E", label: "Mål temperatur" },
  { id: "E_TOPTOE", letter: "E", label: "Top-til-tå inspektion" },
];

// ---------- Medications ----------
// All normalDose values are deliberately 0 – replace with REAL doses
// from your official Region H / Akutberedskab guidelines.

const MEDICATIONS: Medication[] = [
  {
    id: "acetylsalicylsyre",
    name: "Acetylsalicylsyre",
    type: "drug",
    normalDose: 0,
    unit: "mg",
    note: "Sæt korrekt dosis i koden",
  },
  {
    id: "medicinsk_ilt",
    name: "Medicinsk ilt",
    type: "oxygen",
    oxygenFlows: [1, 2, 3, 4, 5, 6, 8, 10, 12, 15],
  },
  { id: "oxytocin", name: "Oxytocin", type: "drug", normalDose: 0, unit: "IE" },
  { id: "adrenalin", name: "Adrenalin", type: "drug", normalDose: 0, unit: "mg" },
  { id: "berodual", name: "Berodual", type: "drug", normalDose: 0, unit: "ml" },
  { id: "fentanyl", name: "Fentanyl", type: "drug", normalDose: 0, unit: "µg" },
  { id: "glukagon", name: "Glukagon", type: "drug", normalDose: 0, unit: "mg" },
  {
    id: "glukose_50",
    name: "Glukose 50%",
    type: "drug",
    normalDose: 0,
    unit: "ml",
  },
  {
    id: "glycerylnitrat",
    name: "Glycerylnitrat",
    type: "drug",
    normalDose: 0,
    unit: "mg",
  },
  { id: "heparin", name: "Heparin", type: "drug", normalDose: 0, unit: "IE" },
  { id: "hypo_fit", name: "Hypo-Fit", type: "drug", normalDose: 0, unit: "g" },
  { id: "ibuprofen", name: "Ibuprofen", type: "drug", normalDose: 0, unit: "mg" },
  { id: "midazolam", name: "Midazolam", type: "drug", normalDose: 0, unit: "mg" },
  { id: "naloxon", name: "Naloxon", type: "drug", normalDose: 0, unit: "mg" },
  {
    id: "nacl_iso",
    name: "Natrium-klorid (NaCl iso)",
    type: "drug",
    normalDose: 0,
    unit: "ml",
  },
  {
    id: "ondansetron",
    name: "Ondansetron",
    type: "drug",
    normalDose: 0,
    unit: "mg",
  },
  {
    id: "paracetamol",
    name: "Paracetamol",
    type: "drug",
    normalDose: 0,
    unit: "mg",
  },
  { id: "salbutamol", name: "Salbutamol", type: "drug", normalDose: 0, unit: "mg" },
  {
    id: "solu_cortef",
    name: "Solu-cortef",
    type: "drug",
    normalDose: 0,
    unit: "mg",
  },
  { id: "thiamin", name: "Thiamin", type: "drug", normalDose: 0, unit: "mg" },
  { id: "amiodaron", name: "Amiodaron", type: "drug", normalDose: 0, unit: "mg" },
  {
    id: "glukose_insulin_kalium",
    name: "Glukose-Insulin(-Kalium)",
    type: "drug",
    normalDose: 0,
    unit: "ml",
  },
  {
    id: "isoprenalin",
    name: "Isoprenalin",
    type: "drug",
    normalDose: 0,
    unit: "µg",
  },
  { id: "labetalol", name: "Labetalol", type: "drug", normalDose: 0, unit: "mg" },
  {
    id: "n_acetylcystein",
    name: "N-Acetylcystein",
    type: "drug",
    normalDose: 0,
    unit: "mg",
  },
  {
    id: "s_ketamin",
    name: "S-ketamin",
    type: "drug",
    normalDose: 0,
    unit: "mg",
  },
  { id: "atropin", name: "Atropin", type: "drug", normalDose: 0, unit: "mg" },
  {
    id: "clemastin",
    name: "Clemastin",
    type: "drug",
    normalDose: 0,
    unit: "mg",
  },
  { id: "diazepam", name: "Diazepam", type: "drug", normalDose: 0, unit: "mg" },
  {
    id: "furosemid",
    name: "Furosemid",
    type: "drug",
    normalDose: 0,
    unit: "mg",
  },
  {
    id: "ketorolac",
    name: "Ketorolac",
    type: "drug",
    normalDose: 0,
    unit: "mg",
  },
  {
    id: "solu_medrol",
    name: "Solu-medrol",
    type: "drug",
    normalDose: 0,
    unit: "mg",
  },
  {
    id: "tranexamsyre",
    name: "Tranexamsyre",
    type: "drug",
    normalDose: 0,
    unit: "mg",
  },
];

const DOSE_OPTIONS: { id: DoseStrength; label: string; factor: number }[] = [
  { id: "HALF", label: "½ dosis", factor: 0.5 },
  { id: "NORMAL", label: "Normal dosis", factor: 1 },
  { id: "DOUBLE", label: "Dobbelt dosis", factor: 2 },
];

// ---------- Helpers ----------

function formatTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function statusColor(status: "GREEN" | "YELLOW" | "RED"): string {
  switch (status) {
    case "GREEN":
      return "#10b981";
    case "YELLOW":
      return "#facc15";
    case "RED":
      return "#f97316";
    default:
      return "white";
  }
}

// small helper to show what an action “finds”
function getActionEffectText(
  scenario: CaseScenario,
  action: AbcdeAction,
): string | null {
  const type = scenario.caseType;

  switch (action.id) {
    case "D_BS":
      if (type === "Hypoglykæmi")
        return "Blodsukker: 2,1 mmol/L (markant lavt).";
      if (type === "AKS")
        return "Blodsukker: 6,0 mmol/L (inden for normalområdet).";
      return "Blodsukker: 5,5 mmol/L (normal).";

    case "D_GCS":
      if (type === "Hovedtraume")
        return "GCS: 14 (E4 V4 M6) – let påvirket, hovedpine.";
      if (type === "Hypoglykæmi") return "GCS: 14 – konfus, tøvende svar.";
      return "GCS: 15 – helt klar og orienteret.";

    case "C_EKG12":
      if (type === "SVT")
        return "EKG 12: smal QRS-takykardi ca. 180/min, foreneligt med SVT.";
      if (type === "Nyopstået AFLI")
        return "EKG 12: uregelmæssig rytme uden tydelige P-takker, forenelig med AFLI.";
      if (type === "AKS")
        return "EKG 12: ST-depression lateralt, T-taks inversion – muligt AKS.";
      return "EKG 12: ingen akutte ischæmitegn.";

    case "C_EKG4":
      if (type === "SVT")
        return "EKG 4: regelmæssig hurtig rytme omkring 180/min.";
      if (type === "Nyopstået AFLI")
        return "EKG 4: uregelmæssig uregelmæssig rytme, frekvens ca. 130/min.";
      return "EKG 4: sinusrytme eller let tachykardi.";

    case "B_NEBULISER":
      if (type === "Astma-exacerbation" || type === "KOL-exacerbation")
        return "Efter nebulisator falder RF lidt, og patienten oplever lindring.";
      return "Ingen tydelig effekt på RF.";

    case "B_NASAL_O2":
    case "B_HUDSON":
      if (
        type === "Astma-exacerbation" ||
        type === "KOL-exacerbation" ||
        type === "Anafylaksi" ||
        type === "Sepsis"
      )
        return "SpO₂ stiger et par procent, patienten virker mere rolig.";
      return "SpO₂ forbliver stort set uændret men passende.";

    case "A_RUBENS":
      return "Effektiv ventilation, thorax bevæger sig passende.";

    case "A_NPA":
    case "A_OPA":
      return "Luftvejen sikres bedre, snorken mindskes.";

    case "E_TEMP":
      if (type === "Sepsis") return "Temperatur: 39,1 °C (høj feber).";
      return "Temperatur: 37,2 °C (normal).";

    case "E_TOPTOE":
      if (type === "Hovedtraume")
        return "Palpation viser ømhed på caput, ingen åben fraktur.";
      if (type === "Sepsis")
        return "Der ses varm, rød hud, evt. enkelte petekkier.";
      return "Ingen yderligere fund ved top-til-tå undersøgelse.";

    default:
      return null;
  }
}

function evaluateCase(
  scenario: CaseScenario,
  log: ActionLogEntry[],
): { evaluated: EvaluatedAction[]; extraActions: ActionLogEntry[] } {
  const logByActionId: Record<string, ActionLogEntry[]> = {};
  for (const entry of log) {
    if (!logByActionId[entry.actionId]) logByActionId[entry.actionId] = [];
    logByActionId[entry.actionId].push(entry);
  }

  const evaluated: EvaluatedAction[] = [];

  for (const exp of scenario.expectedActions) {
    const entries = logByActionId[exp.actionId] || [];
    const first = entries[0];

    if (!first) {
      if (exp.importance === "CRITICAL") {
        evaluated.push({
          expected: exp,
          status: "RED",
          comment: "Kritisk tiltag blev aldrig udført.",
        });
      } else if (exp.importance === "IMPORTANT") {
        evaluated.push({
          expected: exp,
          status: "YELLOW",
          comment: "Vigtigt tiltag mangler – kunne styrke behandlingen.",
        });
      }
      continue;
    }

    const timeSec = first.timeMs / 1000;

    if (exp.importance === "FORBIDDEN") {
      evaluated.push({
        expected: exp,
        logEntry: first,
        status: "RED",
        comment: "Tiltag der ikke burde udføres i dette case.",
      });
      continue;
    }

    if (exp.mustBeforeSec && timeSec > exp.mustBeforeSec) {
      evaluated.push({
        expected: exp,
        logEntry: first,
        status: "RED",
        comment: `Udført for sent (efter ${exp.mustBeforeSec} sek).`,
      });
    } else if (
      exp.recommendedBeforeSec &&
      timeSec > exp.recommendedBeforeSec
    ) {
      evaluated.push({
        expected: exp,
        logEntry: first,
        status: "YELLOW",
        comment: "Udført, men senere end anbefalet.",
      });
    } else {
      evaluated.push({
        expected: exp,
        logEntry: first,
        status: "GREEN",
        comment: "Udført passende og til tiden.",
      });
    }
  }

  const expectedIds = new Set(scenario.expectedActions.map((e) => e.actionId));
  const extraActions = log.filter((e) => !expectedIds.has(e.actionId));

  return { evaluated, extraActions };
}

// ---------- Component ----------

export default function Index() {
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedPeriod, setSelectedPeriod] = useState<SchoolPeriod | null>(
    null,
  );
  const [scenario, setScenario] = useState<CaseScenario | null>(null);
  const [currentState, setCurrentState] = useState<PatientState | null>(null);

  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<ActionLogEntry[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<AbcdeLetter>("A");

  const initialSampler: Record<SamplerLetter, boolean> = {
    S: false,
    A: false,
    M: false,
    P: false,
    L: false,
    E: false,
    R: false,
  };
  const initialOpqrst: Record<OpqrstLetter, boolean> = {
    O: false,
    P: false,
    Q: false,
    R: false,
    S: false,
    T: false,
  };

  const [samplerState, setSamplerState] =
    useState<Record<SamplerLetter, boolean>>(initialSampler);
  const [opqrstState, setOpqrstState] =
    useState<Record<OpqrstLetter, boolean>>(initialOpqrst);

  const [abcdeActionsExpanded, setAbcdeActionsExpanded] = useState(true);
  const [samplerExpanded, setSamplerExpanded] = useState(false);
  const [opqrstExpanded, setOpqrstExpanded] = useState(false);
  const [medExpanded, setMedExpanded] = useState(false);

  const [selectedMedication, setSelectedMedication] =
    useState<Medication | null>(null);
  const [selectedDose, setSelectedDose] = useState<DoseStrength | null>(null);
  const [selectedOxygenFlow, setSelectedOxygenFlow] = useState<number | null>(
    null,
  );

  const [popupText, setPopupText] = useState<string | null>(null);

  // timer
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setElapsedMs((prev) => prev + 1000);
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const filteredCases = useMemo(() => {
    if (!selectedPeriod) return [];
    return getCasesByPeriod(selectedPeriod);
  }, [selectedPeriod]);

  const evaluation = useMemo(() => {
    if (!scenario) return { evaluated: [], extraActions: [] };
    return evaluateCase(scenario, log);
  }, [scenario, log]);

  const startCase = (c: CaseScenario) => {
    setScenario(c);
    const initState = c.states.find((s) => s.id === c.initialStateId)!;
    setCurrentState(initState);
    setElapsedMs(0);
    setRunning(false);
    setLog([]);
    setSelectedLetter("A");
    setSamplerState(initialSampler);
    setOpqrstState(initialOpqrst);
    setAbcdeActionsExpanded(true);
    setSamplerExpanded(false);
    setOpqrstExpanded(false);
    setMedExpanded(false);
    setSelectedMedication(null);
    setSelectedDose(null);
    setSelectedOxygenFlow(null);
    setPopupText(null);
    setScreen("caseDetail");
  };

  const handleActionPress = (action: AbcdeAction) => {
    if (!scenario || !currentState) return;

    const transition = scenario.transitions.find(
      (t) => t.fromStateId === currentState.id && t.actionId === action.id,
    );
    const newState =
      transition && scenario.states.find((s) => s.id === transition.toStateId);
    const resultingState = newState || currentState;

    if (newState) {
      setCurrentState(newState);
    }

    const effectText = getActionEffectText(scenario, action);
    if (effectText) {
      setPopupText(effectText);
      setTimeout(() => {
        setPopupText(null);
      }, 3000);
    }

    const description = effectText
      ? `${action.label} – ${effectText}`
      : `${action.label} – ingen tydelig ændring.`;

    const entry: ActionLogEntry = {
      id: `${Date.now()}_${action.id}`,
      timeMs: elapsedMs,
      actionId: action.id,
      description,
      resultingStateId: resultingState.id,
    };

    setLog((prev) => [...prev, entry]);
  };

  const handleRegisterMedication = () => {
    if (!scenario || !currentState) return;
    if (!selectedMedication) {
      Alert.alert("Manglende valg", "Vælg et præparat.");
      return;
    }

    let description = "";
    let actionId = "";

    if (selectedMedication.type === "oxygen") {
      if (!selectedOxygenFlow) {
        Alert.alert("Manglende valg", "Vælg liter/min for ilt.");
        return;
      }
      actionId = `O2_${selectedMedication.id}_${selectedOxygenFlow}`;
      description = `Medicinsk ilt: ${selectedOxygenFlow} L/min.`;
    } else {
      if (!selectedDose) {
        Alert.alert("Manglende valg", "Vælg dosis (½ / normal / dobbelt).");
        return;
      }
      const doseMeta = DOSE_OPTIONS.find((d) => d.id === selectedDose)!;
      const base = selectedMedication.normalDose ?? 0;
      const actual = base * doseMeta.factor;
      const unit = selectedMedication.unit || "enhed";

      description = `Medicin: ${selectedMedication.name} – ${doseMeta.label} (${actual} ${unit}, sæt korrekt dosis i koden).`;
      actionId = `MED_${selectedMedication.id}_${selectedDose}`;
    }

    const entry: ActionLogEntry = {
      id: `${Date.now()}_${actionId}`,
      timeMs: elapsedMs,
      actionId,
      description,
      resultingStateId: currentState.id,
    };

    setLog((prev) => [...prev, entry]);
  };

  const handleFinishCase = () => {
    setRunning(false);
    setScreen("summary");
  };

  const handleCopyReport = async () => {
    if (!scenario) return;
    const totalTime = formatTime(elapsedMs);

    const actionsText =
      log.length === 0
        ? "Ingen handlinger registreret."
        : log
            .map((e) => `${formatTime(e.timeMs)} – ${e.description}`)
            .join("\n");

    const samplerText =
      Object.entries(samplerState)
        .map(([k, v]) => `${k}:${v ? "✓" : "-"}`)
        .join(" ") || "";

    const opqrstText =
      Object.entries(opqrstState)
        .map(([k, v]) => `${k}:${v ? "✓" : "-"}`)
        .join(" ") || "";

    const evalText =
      evaluation.evaluated.length === 0
        ? ""
        : "\n\nVurdering:\n" +
          evaluation.evaluated
            .map((ev) => {
              const status =
                ev.status === "GREEN"
                  ? "Godt"
                  : ev.status === "YELLOW"
                  ? "Kan forbedres"
                  : "Kritisk";
              const timePart = ev.logEntry
                ? ` (udført ${formatTime(ev.logEntry.timeMs)})`
                : " (ikke udført)";
              return `- ${status}${timePart}: ${ev.comment}`;
            })
            .join("\n");

    const report = `Case: ${scenario.title}
${scenario.subtitle}

Diagnose: ${scenario.diagnosis}
Aktionsdiagnoser: ${scenario.actionDiagnoses.join(", ")}

SAMPLER: ${samplerText}
OPQRST: ${opqrstText}

Samlet tid: ${totalTime}

Handlinger:
${actionsText}${evalText}
`;

    await Clipboard.setStringAsync(report);
    Alert.alert("Kopieret", "Summary er kopieret til udklipsholderen.");
  };

  // ---------- Home ----------
  if (screen === "home") {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Case Facilitator</Text>
        <Text style={styles.subtitle}>
          Vælg skoleperiode. Hver periode har 30 cases.
        </Text>

        <View style={{ marginTop: 16 }}>
          <FlatList
            data={[1, 2, 3, 4, 5, 6, 7, 8] as SchoolPeriod[]}
            numColumns={2}
            keyExtractor={(item) => item.toString()}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.periodButton}
                onPress={() => {
                  setSelectedPeriod(item);
                  setScreen("caseList");
                }}
              >
                <Text style={styles.periodTitle}>{item}. skoleperiode</Text>
                <Text style={styles.periodSubtitle}>30 cases</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ---------- Case list ----------
  if (screen === "caseList") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => setScreen("home")}
            style={styles.smallButton}
          >
            <Text style={styles.smallButtonText}>⌂</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {selectedPeriod}. skoleperiode – cases
          </Text>
        </View>
        <Text style={styles.subtitle}>Vælg case.</Text>

        <ScrollView style={{ marginTop: 12 }}>
          {filteredCases.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.caseCard}
              onPress={() => startCase(c)}
            >
              <Text style={styles.caseTitle}>{c.title}</Text>
              <Text style={styles.caseSubtitle}>{c.subtitle}</Text>
              <View style={styles.badgeRow}>
                <Text style={styles.badge}>{c.acuity}</Text>
                <Text style={styles.badge}>
                  Sværhedsgrad {c.difficulty}/3
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // guard
  if (!scenario || !currentState) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.text}>Ingen case valgt.</Text>
      </SafeAreaView>
    );
  }

  // ---------- Summary ----------
  if (screen === "summary") {
    const { evaluated, extraActions } = evaluation;
    const samplerText = Object.entries(samplerState)
      .map(([k, v]) => `${k}:${v ? "✓" : "-"}`)
      .join(" ");
    const opqrstText = Object.entries(opqrstState)
      .map(([k, v]) => `${k}:${v ? "✓" : "-"}`)
      .join(" ");

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => setScreen("caseList")}
            style={styles.smallButton}
          >
            <Text style={styles.smallButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Case summary</Text>
          <TouchableOpacity
            onPress={() => {
              setScenario(null);
              setCurrentState(null);
              setScreen("home");
            }}
            style={styles.smallButton}
          >
            <Text style={styles.smallButtonText}>⌂</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>{scenario.title}</Text>
        <Text style={styles.subtitle}>{scenario.subtitle}</Text>

        <ScrollView style={{ marginTop: 8, flex: 1 }}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Diagnose</Text>
            <Text style={styles.text}>{scenario.diagnosis}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Aktionsdiagnoser</Text>
            {scenario.actionDiagnoses.map((d) => (
              <Text key={d} style={styles.text}>
                • {d}
              </Text>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Samlet tid: {formatTime(elapsedMs)}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>SAMPLER gennemgået</Text>
            <Text style={styles.text}>{samplerText}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>OPQRST gennemgået</Text>
            <Text style={styles.text}>{opqrstText}</Text>
          </View>

          <Text style={styles.sectionTitle}>Handlinger (tidslinje)</Text>
          {log.length === 0 && (
            <Text style={styles.text}>Ingen handlinger registreret.</Text>
          )}
          {log.map((entry) => (
            <View key={entry.id} style={styles.logItem}>
              <Text style={styles.logTime}>
                {formatTime(entry.timeMs)}
              </Text>
              <Text style={styles.logText}>{entry.description}</Text>
            </View>
          ))}

          <Text style={styles.sectionTitle}>Vurdering</Text>
          {evaluated.map((ev, idx) => (
            <View key={idx} style={styles.evalItem}>
              <Text
                style={[
                  styles.evalTitle,
                  { color: statusColor(ev.status) },
                ]}
              >
                {ev.status === "GREEN"
                  ? "Godt"
                  : ev.status === "YELLOW"
                  ? "Kan forbedres"
                  : "Kritisk"}
              </Text>
              <Text style={styles.evalText}>
                Tiltag: {ev.expected.actionId}
                {ev.logEntry
                  ? ` – udført kl. ${formatTime(
                      ev.logEntry.timeMs,
                    )}`
                  : " – ikke udført"}
              </Text>
              <Text style={styles.evalText}>{ev.comment}</Text>
            </View>
          ))}

          {extraActions.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Ekstra handlinger</Text>
              {extraActions.map((entry) => (
                <View key={entry.id} style={styles.logItem}>
                  <Text style={styles.logTime}>
                    {formatTime(entry.timeMs)}
                  </Text>
                  <Text style={styles.logText}>
                    {entry.description}
                  </Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            style={[styles.button, { flex: 1, backgroundColor: "#60a5fa" }]}
            onPress={handleCopyReport}
          >
            <Text style={styles.buttonText}>Copy summary</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { flex: 1 }]}
            onPress={() => {
              startCase(scenario);
            }}
          >
            <Text style={styles.buttonText}>Kør casen igen</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---------- Case detail / live sim ----------
  const actionsForLetter = ABCDE_ACTIONS.filter(
    (a) => a.letter === selectedLetter,
  );

  const samplerLetters: SamplerLetter[] = ["S", "A", "M", "P", "L", "E", "R"];
  const opqrstLetters: OpqrstLetter[] = ["O", "P", "Q", "R", "S", "T"];

  return (
    <SafeAreaView style={styles.container}>
      {/* popup with action effect */}
      {popupText && (
        <View style={styles.popup}>
          <Text style={styles.popupText}>{popupText}</Text>
        </View>
      )}

      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => {
            setRunning(false);
            setScreen("caseList");
          }}
          style={styles.smallButton}
        >
          <Text style={styles.smallButtonText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{scenario.title}</Text>
          <Text style={styles.subtitle}>{scenario.subtitle}</Text>
        </View>
        <Text style={styles.timerText}>{formatTime(elapsedMs)}</Text>
      </View>

      <View style={styles.badgeRow}>
        <Text style={styles.badge}>{scenario.acuity}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Alarmtekst</Text>
        <Text style={styles.text}>{scenario.dispatchText}</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: running ? "#4b5563" : "#10b981",
            marginBottom: 8,
          },
        ]}
        disabled={running}
        onPress={() => setRunning(true)}
      >
        <Text style={styles.buttonText}>
          {running ? "Case i gang" : "GO – start timer"}
        </Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Vitale parametre</Text>
        <Text style={styles.text}>
          HR {currentState.vitals.hr} · RF {currentState.vitals.rr} · BT{" "}
          {currentState.vitals.btSys}/{currentState.vitals.btDia} · SpO₂{" "}
          {currentState.vitals.spo2}% · Smerte{" "}
          {currentState.vitals.painNrs ?? "-"}
        </Text>
      </View>

      {/* ABCDE patient info, always visible */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>ABCDE status</Text>
        <Text style={styles.text}>A: {currentState.abcde.A}</Text>
        <Text style={styles.text}>B: {currentState.abcde.B}</Text>
        <Text style={styles.text}>C: {currentState.abcde.C}</Text>
        <Text style={styles.text}>D: {currentState.abcde.D}</Text>
        <Text style={styles.text}>E: {currentState.abcde.E}</Text>
        {currentState.extraInfo && (
          <Text style={styles.text}>Ekstra: {currentState.extraInfo}</Text>
        )}
      </View>

      {/* Handlinger – ABCDE dropdown */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.dropdownHeader}
          onPress={() => setAbcdeActionsExpanded((prev) => !prev)}
        >
          <Text style={styles.dropdownHeaderText}>Handlinger – ABCDE</Text>
          <Text style={styles.dropdownHeaderText}>
            {abcdeActionsExpanded ? "▲" : "▼"}
          </Text>
        </TouchableOpacity>

        {abcdeActionsExpanded && (
          <>
            <View style={styles.abcdeRow}>
              {(["A", "B", "C", "D", "E"] as AbcdeLetter[]).map((letter) => (
                <TouchableOpacity
                  key={letter}
                  style={[
                    styles.abcdeButton,
                    selectedLetter === letter && styles.abcdeButtonActive,
                  ]}
                  onPress={() => setSelectedLetter(letter)}
                >
                  <Text
                    style={[
                      styles.abcdeButtonText,
                      selectedLetter === letter && {
                        color: "black",
                        fontWeight: "700",
                      },
                    ]}
                  >
                    {letter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <FlatList
              data={actionsForLetter}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleActionPress(item)}
                >
                  <Text style={styles.actionButtonText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </>
        )}
      </View>

      {/* SAMPLER dropdown */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.dropdownHeader}
          onPress={() => setSamplerExpanded((prev) => !prev)}
        >
          <Text style={styles.dropdownHeaderText}>SAMPLER</Text>
          <Text style={styles.dropdownHeaderText}>
            {samplerExpanded ? "▲" : "▼"}
          </Text>
        </TouchableOpacity>
        {samplerExpanded && (
          <View style={styles.abcdeRow}>
            {samplerLetters.map((letter) => (
              <TouchableOpacity
                key={letter}
                style={[
                  styles.samplerButton,
                  samplerState[letter] && styles.samplerButtonActive,
                ]}
                onPress={() =>
                  setSamplerState((prev) => ({
                    ...prev,
                    [letter]: !prev[letter],
                  }))
                }
              >
                <Text
                  style={[
                    styles.samplerButtonText,
                    samplerState[letter] && { color: "black" },
                  ]}
                >
                  {letter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* OPQRST dropdown */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.dropdownHeader}
          onPress={() => setOpqrstExpanded((prev) => !prev)}
        >
          <Text style={styles.dropdownHeaderText}>OPQRST</Text>
          <Text style={styles.dropdownHeaderText}>
            {opqrstExpanded ? "▲" : "▼"}
          </Text>
        </TouchableOpacity>
        {opqrstExpanded && (
          <View style={styles.abcdeRow}>
            {opqrstLetters.map((letter) => (
              <TouchableOpacity
                key={letter}
                style={[
                  styles.samplerButton,
                  opqrstState[letter] && styles.samplerButtonActive,
                ]}
                onPress={() =>
                  setOpqrstState((prev) => ({
                    ...prev,
                    [letter]: !prev[letter],
                  }))
                }
              >
                <Text
                  style={[
                    styles.samplerButtonText,
                    opqrstState[letter] && { color: "black" },
                  ]}
                >
                  {letter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Medicine dropdown */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.dropdownHeader}
          onPress={() => setMedExpanded((prev) => !prev)}
        >
          <Text style={styles.dropdownHeaderText}>Medicin</Text>
          <Text style={styles.dropdownHeaderText}>
            {medExpanded ? "▲" : "▼"}
          </Text>
        </TouchableOpacity>

        {medExpanded && (
          <>
            <Text style={styles.text}>Vælg præparat og dosis.</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 4 }}
            >
              {MEDICATIONS.map((med) => (
                <TouchableOpacity
                  key={med.id}
                  style={[
                    styles.medButton,
                    selectedMedication?.id === med.id &&
                      styles.medButtonActive,
                  ]}
                  onPress={() => {
                    setSelectedMedication(med);
                    setSelectedDose(null);
                    setSelectedOxygenFlow(null);
                  }}
                >
                  <Text
                    style={[
                      styles.medButtonText,
                      selectedMedication?.id === med.id && {
                        color: "black",
                      },
                    ]}
                  >
                    {med.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedMedication && selectedMedication.type === "drug" && (
              <>
                <View style={[styles.abcdeRow, { marginTop: 6 }]}>
                  {DOSE_OPTIONS.map((d) => (
                    <TouchableOpacity
                      key={d.id}
                      style={[
                        styles.doseButton,
                        selectedDose === d.id && styles.doseButtonActive,
                      ]}
                      onPress={() => setSelectedDose(d.id)}
                    >
                      <Text
                        style={[
                          styles.doseButtonText,
                          selectedDose === d.id && { color: "black" },
                        ]}
                      >
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.textSmall}>
                  Alle doser er sat til 0 – indsæt korrekte værdier i koden.
                </Text>
              </>
            )}

            {selectedMedication && selectedMedication.type === "oxygen" && (
              <>
                <Text style={[styles.text, { marginTop: 6 }]}>
                  Vælg liter/min:
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 4 }}
                >
                  {selectedMedication.oxygenFlows?.map((flow) => (
                    <TouchableOpacity
                      key={flow}
                      style={[
                        styles.doseButton,
                        selectedOxygenFlow === flow &&
                          styles.doseButtonActive,
                      ]}
                      onPress={() => setSelectedOxygenFlow(flow)}
                    >
                      <Text
                        style={[
                          styles.doseButtonText,
                          selectedOxygenFlow === flow && { color: "black" },
                        ]}
                      >
                        {flow} L/min
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                {
                  marginTop: 8,
                  backgroundColor: "#38bdf8",
                },
              ]}
              onPress={handleRegisterMedication}
            >
              <Text style={styles.buttonText}>Registrer medicin</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Latest action */}
      <View style={styles.logContainer}>
        <Text style={styles.cardTitle}>Seneste respons</Text>
        {log.length === 0 ? (
          <Text style={styles.text}>Ingen handlinger endnu.</Text>
        ) : (
          <Text style={styles.text}>
            {formatTime(log[log.length - 1].timeMs)} –{" "}
            {log[log.length - 1].description}
          </Text>
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleFinishCase}>
        <Text style={styles.buttonText}>Case færdig → summary</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
