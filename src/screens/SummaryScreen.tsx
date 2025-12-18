import * as Clipboard from "expo-clipboard";
import { useMemo } from "react";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AcronymRow } from "../components/AcronymRow";
import type {
  ActionLogEntry,
  CaseScenario,
  EvaluatedAction,
  MidasheLetter,
  OpqrstLetter,
  SamplerLetter,
} from "../domain/cases/types";
import { styles } from "../styles/indexStyles";
import { formatTime, statusColor } from "../utils/format";

function evalTitle(status: "GREEN" | "YELLOW" | "RED") {
  return status === "GREEN" ? "Godt" : status === "YELLOW" ? "Kan forbedres" : "Kritisk";
}

// Try to display a nice label for the “mission”
function expectedLabel(ev: EvaluatedAction): string {
  // If you add `label` to expectedActions in Firestore, this will show it.
  const anyExpected: any = ev.expected as any;
  return (
    anyExpected?.label ||
    anyExpected?.title ||
    anyExpected?.actionLabel ||
    ev.expected?.actionId ||
    "Ukendt"
  );
}

export function SummaryScreen({
  scenario,
  sessionId,
  runId,
  elapsedMs,
  mergedTimeline,
  evaluated,
  extraActions,
  samplerState,
  opqrstState,
  midasheState,

  selectedOrgRole,
  feedbackOpen,
  feedbackText,
  feedbackGrade,
  savingFeedback,

  onOpenFeedback,
  onCloseFeedback,
  onSetFeedbackText,
  onSetFeedbackGrade,
  onSaveSummaryWithFeedback,

  onBackToSetup,
  onBackToCases,
  onRunAgain,
}: {
  scenario: CaseScenario;

  sessionId: string | null;
  runId: string | null;
  elapsedMs: number;

  mergedTimeline: ActionLogEntry[];
  evaluated: EvaluatedAction[];
  extraActions: ActionLogEntry[];

  samplerState: Record<SamplerLetter, boolean>;
  opqrstState: Record<OpqrstLetter, boolean>;
  midasheState: Record<MidasheLetter, boolean>;

  selectedOrgRole: "student" | "school" | "enterprise" | null;

  feedbackOpen: boolean;
  feedbackText: string;
  feedbackGrade: string;
  savingFeedback: boolean;

  onOpenFeedback: () => void;
  onCloseFeedback: () => void;
  onSetFeedbackText: (t: string) => void;
  onSetFeedbackGrade: (t: string) => void;
  onSaveSummaryWithFeedback: () => Promise<void>;

  onBackToSetup: () => void;
  onBackToCases: () => void;
  onRunAgain: () => void;
}) {
  const { greens, yellows, reds } = useMemo(() => {
    const greens = evaluated.filter((e) => e.status === "GREEN");
    const yellows = evaluated.filter((e) => e.status === "YELLOW");
    const reds = evaluated.filter((e) => e.status === "RED");
    return { greens, yellows, reds };
  }, [evaluated]);

  const renderEvalSection = (title: string, items: EvaluatedAction[]) => {
    if (items.length === 0) return null;

    return (
      <View style={{ marginTop: 8 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {items.map((ev, idx) => (
          <View key={`${ev.expected?.actionId ?? "x"}_${idx}`} style={styles.evalItem}>
            <Text style={[styles.evalTitle, { color: statusColor(ev.status) }]}>
              {expectedLabel(ev)}
            </Text>

            <Text style={styles.textSmall}>
              Status: {evalTitle(ev.status)}
              {ev.logEntry?.timeMs != null
                ? ` · Udført: ${formatTime(ev.logEntry.timeMs)}`
                : ` · Ikke udført`}
            </Text>

            <Text style={styles.evalText}>{ev.comment}</Text>

            {/* Optional: show actionId for debugging */}
            {/* <Text style={styles.textSmall}>({ev.expected.actionId})</Text> */}
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Case summary</Text>

        <TouchableOpacity onPress={onBackToSetup} style={styles.smallButton}>
          <Text style={styles.smallButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>{scenario.title}</Text>
      <Text style={styles.subtitle}>
        Patient: {scenario.patientInfo.sex === "M" ? "Mand" : "Kvinde"} · {scenario.patientInfo.age}{" "}
        år
      </Text>

      <ScrollView style={{ marginTop: 8, flex: 1 }}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Diagnose</Text>
          <Text style={styles.text}>{scenario.diagnosis}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Samlet tid</Text>
          <Text style={styles.text}>{formatTime(elapsedMs)}</Text>

          <AcronymRow<SamplerLetter>
            letters={["S", "A", "M", "P", "L", "E", "R"]}
            state={samplerState}
          />
          <AcronymRow<OpqrstLetter> letters={["O", "P", "Q", "R", "S", "T"]} state={opqrstState} />
          <AcronymRow<MidasheLetter>
            letters={["M", "I", "D", "A", "S", "H", "E"]}
            state={midasheState}
          />
        </View>

        <Text style={styles.sectionTitle}>Handlinger (inkl. defib events)</Text>
        {mergedTimeline.length === 0 ? (
          <Text style={styles.text}>Ingen handlinger registreret.</Text>
        ) : (
          mergedTimeline.map((entry) => (
            <View key={entry.id} style={styles.logItem}>
              <Text style={styles.logTime}>{formatTime(entry.timeMs)}</Text>
              <Text style={styles.logText}>{entry.description}</Text>
            </View>
          ))
        )}

        {/* ---- NEW: Bucketed evaluation ---- */}
        {renderEvalSection("Hvad gik godt", greens)}
        {renderEvalSection("Kan forbedres", yellows)}
        {renderEvalSection("Kritisk", reds)}

        {extraActions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Ekstra handlinger</Text>
            {extraActions.map((entry) => (
              <View key={entry.id} style={styles.logItem}>
                <Text style={styles.logTime}>{formatTime(entry.timeMs)}</Text>
                <Text style={styles.logText}>{entry.description}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#10b981", marginTop: 10 }]}
        onPress={onOpenFeedback}
      >
        <Text style={styles.buttonText}>📝 Feedback / vurdering</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#fabc60ff", marginTop: 10 }]}
        onPress={onBackToCases}
      >
        <Text style={styles.buttonText}>Tilbage til cases</Text>
      </TouchableOpacity>

      <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
        <TouchableOpacity
          style={[styles.button, { flex: 1, backgroundColor: "#60a5fa" }]}
          onPress={async () => {
            const totalTime = formatTime(elapsedMs);
            const actionsText =
              mergedTimeline.length === 0
                ? "Ingen handlinger registreret."
                : mergedTimeline
                    .map((e) => `${formatTime(e.timeMs)} – ${e.description}`)
                    .join("\n");

            const samplerText = Object.entries(samplerState)
              .map(([k, v]) => `${k}:${v ? "✓" : "✗"}`)
              .join(" ");
            const opqrstText = Object.entries(opqrstState)
              .map(([k, v]) => `${k}:${v ? "✓" : "✗"}`)
              .join(" ");
            const midasheText = Object.entries(midasheState)
              .map(([k, v]) => `${k}:${v ? "✓" : "✗"}`)
              .join(" ");

            const report = `Case: ${scenario.title}
RunId: ${runId ?? "-"}
SessionId: ${sessionId ?? "-"}
Patient: ${scenario.patientInfo.sex} ${scenario.patientInfo.age} år
Samlet tid: ${totalTime}

${samplerText}
${opqrstText}
${midasheText}

Handlinger:
${actionsText}
`;
            await Clipboard.setStringAsync(report);
            Alert.alert("Kopieret", "Summary er kopieret.");
          }}
        >
          <Text style={styles.buttonText}>Copy summary</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { flex: 1 }]} onPress={onRunAgain}>
          <Text style={styles.buttonText}>Kør igen</Text>
        </TouchableOpacity>
      </View>

      {feedbackOpen && (
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
          }}
        >
          <View style={[styles.card, { maxHeight: "80%" }]}>
            <Text style={styles.cardTitle}>Feedback</Text>

            <Text style={[styles.textSmall, { marginTop: 8 }]}>
              Skriv konkret feedback til holdet / enkeltpersoner:
            </Text>

            <TextInput
              value={feedbackText}
              onChangeText={onSetFeedbackText}
              multiline
              placeholder="Fx: Hurtig ABCDE, men ECG tog for lang tid. Husk at delegere..."
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={[
                styles.text,
                {
                  minHeight: 120,
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.15)",
                },
              ]}
            />

            {selectedOrgRole === "school" && (
              <>
                <Text style={[styles.textSmall, { marginTop: 10 }]}>Karakter (valgfri)</Text>
                <TextInput
                  value={feedbackGrade}
                  onChangeText={onSetFeedbackGrade}
                  placeholder="Fx 7 / 10 / 12 / Bestået"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  style={[
                    styles.text,
                    {
                      marginTop: 6,
                      padding: 10,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.15)",
                    },
                  ]}
                />
              </>
            )}

            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
              <TouchableOpacity
                style={[styles.button, { flex: 1, backgroundColor: "#4b5563" }]}
                disabled={savingFeedback}
                onPress={onCloseFeedback}
              >
                <Text style={styles.buttonText}>Annuller</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { flex: 1, backgroundColor: "#60a5fa" }]}
                disabled={savingFeedback}
                onPress={onSaveSummaryWithFeedback}
              >
                <Text style={styles.buttonText}>{savingFeedback ? "Gemmer…" : "Gem"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
