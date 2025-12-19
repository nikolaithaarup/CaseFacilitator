// src/screens/CaseDetailScreen.tsx
import { useMemo, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ✅ named imports
import { ABCDE_ACTIONS } from "../data/abcdeActions";
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

// --- Local types for the new feature ---
export type AssistanceChoice = "EKSTRA_AMBULANCE" | "AKUTBIL" | "LAEGEBIL";

type AckState = {
  key: string;
  icon: string;
} | null;

function assistanceLabel(choice: AssistanceChoice): string {
  return choice === "EKSTRA_AMBULANCE"
    ? "Ekstra ambulance"
    : choice === "AKUTBIL"
    ? "Akutbil"
    : "Lægebil";
}

export function CaseDetailScreen({
  scenario,
  currentState,
  elapsedMs,
  running,
  popupText,

  selectedLetter,
  setSelectedLetter,

  abcdeActionsExpanded,
  setAbcdeActionsExpanded,
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

  // ✅ NEW: triage + assistance
  onLogTriage,
  assistanceModalOpen,
  setAssistanceModalOpen,
  selectedAssistance,
  setSelectedAssistance,
  onConfirmAssistance,

  onBackToSetup,
  onStartTimer,
  onActionPress,
  onRegisterMedication,
  onFinishCaseToSummary,
}: {
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

  // ✅ NEW: triage + assistance
  onLogTriage: (isCritical: boolean) => void;

  assistanceModalOpen: boolean;
  setAssistanceModalOpen: (v: boolean) => void;

  selectedAssistance: AssistanceChoice | null;
  setSelectedAssistance: (v: AssistanceChoice | null) => void;

  onConfirmAssistance: (choice: AssistanceChoice) => void;

  onBackToSetup: () => void;
  onStartTimer: () => Promise<void>;
  onActionPress: (action: AbcdeAction) => void;
  onRegisterMedication: () => void;
  onFinishCaseToSummary: () => void;
}) {
  // ✅ HARD GUARDS
  const safeActions = Array.isArray(ABCDE_ACTIONS) ? ABCDE_ACTIONS : [];
  const safeMeds = Array.isArray(MEDICATIONS) ? MEDICATIONS : [];

  const actionsForLetter = useMemo(
    () => safeActions.filter((a) => a.letter === selectedLetter),
    [safeActions, selectedLetter]
  );

  const caseStarted = running || elapsedMs > 0;
  const locked = !caseStarted;

  const samplerLetters: SamplerLetter[] = ["S", "A", "M", "P", "L", "E", "R"];
  const opqrstLetters: OpqrstLetter[] = ["O", "P", "Q", "R", "S", "T"];
  const midasheLetters: MidasheLetter[] = ["M", "I", "D", "A", "S", "H", "E"];

  const guardLocked = () => {
    if (locked) {
      Alert.alert(
        "Start casen først",
        "Tryk på 'GO – start timer' før du bruger funktionerne."
      );
      return true;
    }
    return false;
  };

  // ✅ computed options: "½ dosis: X unit" etc
  const doseOptions = getDoseOptionsForMedication(selectedMedication);

  // ✅ Ack “tick” overlay
  const [ack, setAck] = useState<AckState>(null);

  const flashAck = (key: string, icon: string) => {
    setAck({ key, icon });
    setTimeout(() => setAck(null), 650);
  };

  // If modal opens and nothing is chosen yet, don’t force a choice.
  // But if you WANT a default preselect, uncomment below:
  // useEffect(() => {
  //   if (assistanceModalOpen && selectedAssistance == null) {
  //     setSelectedAssistance("EKSTRA_AMBULANCE");
  //   }
  // }, [assistanceModalOpen, selectedAssistance, setSelectedAssistance]);

  const selectedAssistanceText = selectedAssistance
    ? assistanceLabel(selectedAssistance)
    : null;

  return (
    <SafeAreaView style={styles.container}>
      {popupText && (
        <View style={styles.popup}>
          <Text style={styles.popupText}>{popupText}</Text>
        </View>
      )}

      {/* ✅ Ack overlay (place near top-right) */}
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
          <Text style={{ color: "black", fontWeight: "700", fontSize: 16 }}>
            {ack.icon}
          </Text>
        </View>
      )}

      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBackToSetup} style={styles.smallButton}>
          <Text style={styles.smallButtonText}>←</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{scenario.title}</Text>
          <Text style={styles.subtitle}>
            Patient: {scenario.patientInfo.sex === "M" ? "Mand" : "Kvinde"} ·{" "}
            {scenario.patientInfo.age} år
          </Text>
        </View>

        <Text style={styles.timerText}>{formatTime(elapsedMs)}</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
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
          onPress={() => onStartTimer()}
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

        {/* ✅ NEW: TRIAGE + ASSISTANCE buttons (above ABCDE actions) */}
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

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: "#fabc60ff", opacity: locked ? 0.5 : 1 },
              ]}
              disabled={locked}
              onPress={() => {
                if (guardLocked()) return;
                setAssistanceModalOpen(true);
              }}
            >
              <Text style={styles.buttonText}>
                {selectedAssistanceText
                  ? `Tilkald assistance: ${selectedAssistanceText}`
                  : "Tilkald assistance"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- ABCDE actions --- */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.dropdownHeader}
            onPress={() => setAbcdeActionsExpanded(!abcdeActionsExpanded)}
          >
            <Text style={styles.dropdownHeaderText}>Handlinger – ABCDE</Text>
            <Text style={styles.dropdownHeaderText}>
              {abcdeActionsExpanded ? "▲" : "▼"}
            </Text>
          </TouchableOpacity>

          {abcdeActionsExpanded && (
            <>
              <View style={[styles.abcdeRow, locked && { opacity: 0.45 }]}>
                {(["A", "B", "C", "D", "E"] as AbcdeLetter[]).map((letter) => (
                  <TouchableOpacity
                    key={letter}
                    style={[
                      styles.abcdeButton,
                      selectedLetter === letter && styles.abcdeButtonActive,
                    ]}
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

              <View
                style={{ marginTop: 10, gap: 8, opacity: locked ? 0.45 : 1 }}
              >
                {actionsForLetter.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.actionButton}
                    disabled={locked}
                    onPress={() => {
                      if (guardLocked()) return;
                      onActionPress(item);
                      flashAck(`abcde-action-${item.id}`, "✔️");
                    }}
                  >
                    <Text style={styles.actionButtonText}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        {/* --- SAMPLER --- */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.dropdownHeader}
            onPress={() => setSamplerExpanded(!samplerExpanded)}
          >
            <Text style={styles.dropdownHeaderText}>SAMPLER</Text>
            <Text style={styles.dropdownHeaderText}>
              {samplerExpanded ? "▲" : "▼"}
            </Text>
          </TouchableOpacity>

          {samplerExpanded && (
            <View style={[styles.abcdeRow, locked && { opacity: 0.45 }]}>
              {samplerLetters.map((letter) => (
                <TouchableOpacity
                  key={letter}
                  style={[
                    styles.samplerButton,
                    samplerState[letter] && styles.samplerButtonActive,
                  ]}
                  disabled={locked}
                  onPress={() => {
                    if (guardLocked()) return;
                    setSamplerState({
                      ...samplerState,
                      [letter]: !samplerState[letter],
                    });
                    flashAck(`sampler-${letter}`, "✔️");
                  }}
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

        {/* --- OPQRST --- */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.dropdownHeader}
            onPress={() => setOpqrstExpanded(!opqrstExpanded)}
          >
            <Text style={styles.dropdownHeaderText}>OPQRST</Text>
            <Text style={styles.dropdownHeaderText}>
              {opqrstExpanded ? "▲" : "▼"}
            </Text>
          </TouchableOpacity>

          {opqrstExpanded && (
            <View style={[styles.abcdeRow, locked && { opacity: 0.45 }]}>
              {opqrstLetters.map((letter) => (
                <TouchableOpacity
                  key={letter}
                  style={[
                    styles.samplerButton,
                    opqrstState[letter] && styles.samplerButtonActive,
                  ]}
                  disabled={locked}
                  onPress={() => {
                    if (guardLocked()) return;
                    setOpqrstState({
                      ...opqrstState,
                      [letter]: !opqrstState[letter],
                    });
                    flashAck(`opqrst-${letter}`, "✔️");
                  }}
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

        {/* --- MIDASHE --- */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.dropdownHeader}
            onPress={() => setMidasheExpanded(!midasheExpanded)}
          >
            <Text style={styles.dropdownHeaderText}>MIDASHE</Text>
            <Text style={styles.dropdownHeaderText}>
              {midasheExpanded ? "▲" : "▼"}
            </Text>
          </TouchableOpacity>

          {midasheExpanded && (
            <View style={[styles.abcdeRow, locked && { opacity: 0.45 }]}>
              {midasheLetters.map((letter) => (
                <TouchableOpacity
                  key={letter}
                  style={[
                    styles.samplerButton,
                    midasheState[letter] && styles.samplerButtonActive,
                  ]}
                  disabled={locked}
                  onPress={() => {
                    if (guardLocked()) return;
                    setMidasheState({
                      ...midasheState,
                      [letter]: !midasheState[letter],
                    });
                    flashAck(`midashe-${letter}`, "✔️");
                  }}
                >
                  <Text
                    style={[
                      styles.samplerButtonText,
                      midasheState[letter] && { color: "black" },
                    ]}
                  >
                    {letter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* --- MEDS --- */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.dropdownHeader}
            onPress={() => setMedExpanded(!medExpanded)}
          >
            <Text style={styles.dropdownHeaderText}>Medicin</Text>
            <Text style={styles.dropdownHeaderText}>
              {medExpanded ? "▲" : "▼"}
            </Text>
          </TouchableOpacity>

          {medExpanded && (
            <>
              <Text style={styles.text}>Vælg præparat og dosis.</Text>

              <View style={[{ marginTop: 6 }, locked && { opacity: 0.45 }]}>
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
                  {safeMeds.map((med) => {
                    const selected = selectedMedication?.id === med.id;

                    return (
                      <TouchableOpacity
                        key={med.id}
                        style={[
                          styles.medButton,
                          { alignSelf: "flex-start" },
                          selected && styles.medButtonActive,
                        ]}
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
                        >
                          {med.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* DRUG: computed dose options with actual values */}
              {selectedMedication && selectedMedication.type === "drug" && (
                <View
                  style={[
                    styles.abcdeRow,
                    { marginTop: 6 },
                    locked && { opacity: 0.45 },
                  ]}
                >
                  {doseOptions.map((d) => (
                    <TouchableOpacity
                      key={String(d.id)}
                      style={[
                        styles.doseButton,
                        selectedDose === d.id && styles.doseButtonActive,
                      ]}
                      disabled={locked}
                      onPress={() => {
                        if (guardLocked()) return;
                        setSelectedDose(d.id);
                        flashAck(`dose-${String(d.id)}`, "✔️");
                      }}
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
              )}

              {/* OXYGEN: show flow buttons */}
              {selectedMedication && selectedMedication.type === "oxygen" && (
                <>
                  <Text style={[styles.text, { marginTop: 6 }]}>
                    Vælg liter/min:
                  </Text>
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
                        style={[
                          styles.doseButton,
                          selectedOxygenFlow === flow &&
                            styles.doseButtonActive,
                        ]}
                        disabled={locked}
                        onPress={() => {
                          if (guardLocked()) return;
                          setSelectedOxygenFlow(flow);
                          flashAck(`o2-${flow}`, "✔️");
                        }}
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
                    opacity: locked ? 0.5 : 1,
                  },
                ]}
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
          <TouchableOpacity
            style={styles.button}
            onPress={onFinishCaseToSummary}
          >
            <Text style={styles.buttonText}>Case færdig → summary</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ✅ NEW: Assistance modal */}
      {assistanceModalOpen && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            justifyContent: "center",
            padding: 16,
            zIndex: 200,
          }}
        >
          <View style={[styles.card, { maxHeight: "80%" }]}>
            <Text style={styles.cardTitle}>Tilkald assistance</Text>

            <Text style={[styles.text, { marginTop: 6 }]}>Vælg en enhed:</Text>

            <View style={{ marginTop: 10, gap: 8 }}>
              {(
                [
                  { id: "EKSTRA_AMBULANCE", label: "Ekstra ambulance" },
                  { id: "AKUTBIL", label: "Akutbil" },
                  { id: "LAEGEBIL", label: "Lægebil" },
                ] as const
              ).map((opt) => {
                const picked = selectedAssistance === opt.id;

                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.actionButton,
                      picked && {
                        borderColor: "rgba(16,185,129,0.9)",
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => {
                      setSelectedAssistance(opt.id);
                      flashAck(`assist-pick-${opt.id}`, "✔️");
                    }}
                  >
                    <Text style={styles.actionButtonText}>
                      {picked ? `✓ ${opt.label}` : opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
              <TouchableOpacity
                style={[styles.button, { flex: 1, backgroundColor: "#4b5563" }]}
                onPress={() => setAssistanceModalOpen(false)}
              >
                <Text style={styles.buttonText}>Luk</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    flex: 1,
                    backgroundColor: "#60a5fa",
                    opacity: selectedAssistance ? 1 : 0.5,
                  },
                ]}
                disabled={!selectedAssistance}
                onPress={() => {
                  if (!selectedAssistance) return;

                  onConfirmAssistance(selectedAssistance);
                  flashAck("assist-confirm", "✔️");

                  setAssistanceModalOpen(false);
                  // ✅ Keep selectedAssistance so it shows on the main button next time
                }}
              >
                <Text style={styles.buttonText}>Bekræft</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
