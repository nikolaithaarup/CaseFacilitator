// src/screens/RunDetailScreen.tsx
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";

import { AcronymRow } from "../components/AcronymRow";
import type { CaseScenario, EvaluatedAction, MidasheLetter, OpqrstLetter, SamplerLetter } from "../domain/cases/types";
import type { RunDoc } from "../services/runs";
import { deleteMyRunById, loadMyRunById } from "../services/runs";
import { styles } from "../styles/indexStyles";
import { evaluateCase } from "../utils/caseEvaluation";
import { formatTime, statusColor } from "../utils/format";

function evalTitle(status: "GREEN" | "YELLOW" | "RED") {
  return status === "GREEN" ? "Godt" : status === "YELLOW" ? "Kan forbedres" : "Kritisk";
}

function expectedLabel(ev: EvaluatedAction): string {
  const anyExpected: any = ev.expected as any;
  return (
    anyExpected?.label ||
    anyExpected?.title ||
    anyExpected?.actionLabel ||
    ev.expected?.actionId ||
    "Ukendt"
  );
}

function csvEscape(v: any): string {
  const s = String(v ?? "");
  // RFC4180-ish: wrap in quotes if it contains comma, quote, newline
  if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function RunDetailScreen({
  runId,
  onBack,
  onDeleted,
}: {
  runId: string;
  onBack: () => void;
  onDeleted?: () => void;
}) {
  const [run, setRun] = useState<RunDoc | null>(null);
  const [scenario, setScenario] = useState<CaseScenario | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingScenario, setLoadingScenario] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // --- Load run ---
  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    loadMyRunById(runId)
      .then((r) => {
        if (!cancelled) setRun(r);
      })
      .catch((e) => {
        console.warn(e);
        Alert.alert("Kunne ikke hente", "Måske mangler du rettigheder?");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [runId]);

  // --- Load scenario (to recompute evaluation like SummaryScreen) ---
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!run?.caseId) {
        setScenario(null);
        return;
      }

      setLoadingScenario(true);
      try {
        const ref = doc(db, "cases_v2", run.caseId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          if (!cancelled) setScenario(null);
          return;
        }
        const data: any = snap.data();
        if (!cancelled) setScenario(data as CaseScenario);
      } catch (e) {
        console.warn("load scenario failed:", e);
        if (!cancelled) setScenario(null);
      } finally {
        if (!cancelled) setLoadingScenario(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [run?.caseId]);

  const timeline = useMemo(() => run?.timeline ?? [], [run]);

  const evaluated = useMemo(() => {
    if (!scenario) return [] as EvaluatedAction[];
    const res = evaluateCase(scenario, timeline);
    return res.evaluated ?? [];
  }, [scenario, timeline]);

  const { greens, yellows, reds } = useMemo(() => {
    const greens = evaluated.filter((e) => e.status === "GREEN");
    const yellows = evaluated.filter((e) => e.status === "YELLOW");
    const reds = evaluated.filter((e) => e.status === "RED");
    return { greens, yellows, reds };
  }, [evaluated]);

  const confirmDelete = () => {
    Alert.alert("Slet run?", "Denne handling kan ikke fortrydes.", [
      { text: "Annuller", style: "cancel" },
      {
        text: "Slet",
        style: "destructive",
        onPress: async () => {
          try {
            setDeleting(true);
            await deleteMyRunById(runId);
            onDeleted?.();
            onBack();
          } catch (e: any) {
            console.warn(e);
            Alert.alert("Kunne ikke slette", e?.message ?? "Ukendt fejl.");
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

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
          </View>
        ))}
      </View>
    );
  };

  const buildCopyText = () => {
    if (!run) return "";

    const sampler = run.acronyms?.sampler ?? ({} as Record<SamplerLetter, boolean>);
    const opqrst = run.acronyms?.opqrst ?? ({} as Record<OpqrstLetter, boolean>);
    const midashe = run.acronyms?.midashe ?? ({} as Record<MidasheLetter, boolean>);

    const samplerText = Object.entries(sampler)
      .map(([k, v]) => `${k}:${v ? "✓" : "✗"}`)
      .join(" ");
    const opqrstText = Object.entries(opqrst)
      .map(([k, v]) => `${k}:${v ? "✓" : "✗"}`)
      .join(" ");
    const midasheText = Object.entries(midashe)
      .map(([k, v]) => `${k}:${v ? "✓" : "✗"}`)
      .join(" ");

    const actionsText =
      timeline.length === 0
        ? "Ingen handlinger registreret."
        : timeline.map((e) => `${formatTime(e.timeMs)} – ${e.description}`).join("\n");

    const evalText =
      scenario && evaluated.length
        ? evaluated
            .map((ev) => {
              const when = ev.logEntry?.timeMs != null ? formatTime(ev.logEntry.timeMs) : "Ikke udført";
              return `${evalTitle(ev.status)}; ${expectedLabel(ev)}; ${when}; ${ev.comment}`;
            })
            .join("\n")
        : "(Ingen evaluering tilgængelig på dette run endnu.)";

    return `Case: ${run.caseTitle ?? "-"}
RunId: ${run.runId}
Dato: ${run.createdAtEpochMs ? new Date(run.createdAtEpochMs).toLocaleString() : "-"}
Trainee: ${run.traineeDisplayName ?? "-"}
Samlet tid: ${formatTime(run.totalTimeMs)}

SAMPLER: ${samplerText}
OPQRST: ${opqrstText}
MIDASHE: ${midasheText}

Feedback:
${run.feedbackText?.trim() ? run.feedbackText : "Ingen feedback."}
${run.feedbackGrade ? `Karakter: ${run.feedbackGrade}` : ""}

Evaluering:
${evalText}

Handlinger:
${actionsText}
`;
  };

  const exportCsv = async () => {
    if (!run) return;

    // One CSV with multiple logical sections separated by blank lines
    const lines: string[] = [];
    lines.push("SECTION,KEY,VALUE");
    lines.push(`META,runId,${csvEscape(run.runId)}`);
    lines.push(`META,caseTitle,${csvEscape(run.caseTitle ?? "")}`);
    lines.push(`META,caseId,${csvEscape(run.caseId ?? "")}`);
    lines.push(`META,createdAt,${csvEscape(run.createdAtEpochMs ? new Date(run.createdAtEpochMs).toISOString() : "")}`);
    lines.push(`META,traineeDisplayName,${csvEscape(run.traineeDisplayName ?? "")}`);
    lines.push(`META,totalTime,${csvEscape(formatTime(run.totalTimeMs))}`);
    lines.push("");

    lines.push("SECTION,ACRONYM,LETTER,DONE");
    const sampler = run.acronyms?.sampler ?? ({} as Record<SamplerLetter, boolean>);
    const opqrst = run.acronyms?.opqrst ?? ({} as Record<OpqrstLetter, boolean>);
    const midashe = run.acronyms?.midashe ?? ({} as Record<MidasheLetter, boolean>);

    Object.entries(sampler).forEach(([k, v]) => lines.push(`ACRONYM,SAMPLER,${csvEscape(k)},${v ? "1" : "0"}`));
    Object.entries(opqrst).forEach(([k, v]) => lines.push(`ACRONYM,OPQRST,${csvEscape(k)},${v ? "1" : "0"}`));
    Object.entries(midashe).forEach(([k, v]) => lines.push(`ACRONYM,MIDASHE,${csvEscape(k)},${v ? "1" : "0"}`));
    lines.push("");

    lines.push("SECTION,FEEDBACK,TEXT,GRADE");
    lines.push(`FEEDBACK,feedback,${csvEscape(run.feedbackText ?? "")},${csvEscape(run.feedbackGrade ?? "")}`);
    lines.push("");

    lines.push("SECTION,EVAL,STATUS,EXPECTED,PERFORMED_AT,COMMENT");
    if (scenario && evaluated.length) {
      evaluated.forEach((ev) => {
        lines.push(
          [
            "EVAL",
            "row",
            csvEscape(ev.status),
            csvEscape(expectedLabel(ev)),
            csvEscape(ev.logEntry?.timeMs != null ? formatTime(ev.logEntry.timeMs) : "Ikke udført"),
            csvEscape(ev.comment ?? ""),
          ].join(",")
        );
      });
    } else {
      lines.push("EVAL,row,NO_SCENARIO_OR_EMPTY,,,,");
    }
    lines.push("");

    lines.push("SECTION,TIMELINE,TIME,DESCRIPTION,ACTION_ID");
    timeline.forEach((t) => {
      lines.push(
        [
          "TIMELINE",
          "event",
          csvEscape(formatTime(t.timeMs)),
          csvEscape(t.description),
          csvEscape(t.actionId ?? ""),
        ].join(",")
      );
    });

    const csv = lines.join("\n");

    // Write + share
    try {
      const filename = `run_${run.runId}.csv`;
      const uri = FileSystem.cacheDirectory + filename;
      await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        await Clipboard.setStringAsync(csv);
        Alert.alert("Eksport", "Deling er ikke tilgængelig her. CSV er kopieret til clipboard.");
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: "text/csv",
        dialogTitle: "Eksportér run som CSV",
        UTI: "public.comma-separated-values-text",
      });
    } catch (e: any) {
      console.warn(e);
      Alert.alert("Kunne ikke eksportere", e?.message ?? "Ukendt fejl.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator />
        <Text style={[styles.textSmall, { marginTop: 10 }]}>Henter run…</Text>
      </SafeAreaView>
    );
  }

  if (!run) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.text}>Run ikke fundet.</Text>
        <TouchableOpacity style={styles.button} onPress={onBack}>
          <Text style={styles.buttonText}>Tilbage</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const samplerState = run.acronyms?.sampler ?? ({
    S: false, A: false, M: false, P: false, L: false, E: false, R: false,
  } as Record<SamplerLetter, boolean>);

  const opqrstState = run.acronyms?.opqrst ?? ({
    O: false, P: false, Q: false, R: false, S: false, T: false,
  } as Record<OpqrstLetter, boolean>);

  const midasheState = run.acronyms?.midashe ?? ({
    M: false, I: false, D: false, A: false, S: false, H: false, E: false,
  } as Record<MidasheLetter, boolean>);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back left, delete right */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.smallButton}>
          <Text style={styles.smallButtonText}>←</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Case summary</Text>
          <Text style={styles.subtitle}>{run.caseTitle ?? "Ukendt case"}</Text>
          <Text style={styles.subtitle}>
            {run.traineeDisplayName ? `Elev: ${run.traineeDisplayName} · ` : ""}
            {run.createdAtEpochMs ? new Date(run.createdAtEpochMs).toLocaleString() : "—"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={confirmDelete}
          style={styles.smallButton}
          disabled={deleting}
        >
          <Text style={styles.smallButtonText}>{deleting ? "…" : "🗑️"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ marginTop: 8, flex: 1 }}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Samlet tid</Text>
          <Text style={styles.text}>{formatTime(run.totalTimeMs)}</Text>

          <AcronymRow
            letters={["S", "A", "M", "P", "L", "E", "R"] as SamplerLetter[]}
            state={samplerState}
          />
          <AcronymRow
            letters={["O", "P", "Q", "R", "S", "T"] as OpqrstLetter[]}
            state={opqrstState}
          />
          <AcronymRow
            letters={["M", "I", "D", "A", "S", "H", "E"] as MidasheLetter[]}
            state={midasheState}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Feedback</Text>
          <Text style={styles.text}>
            {run.feedbackText?.trim() ? run.feedbackText : "Ingen feedback."}
          </Text>
          {run.feedbackGrade ? (
            <Text style={[styles.textSmall, { marginTop: 6 }]}>
              Karakter: {run.feedbackGrade}
            </Text>
          ) : null}
        </View>

        {/* Evaluation sections (recomputed) */}
        {loadingScenario ? (
          <Text style={styles.textSmall}>Henter case data til evaluering…</Text>
        ) : !scenario ? (
          <Text style={styles.textSmall}>
            (Ingen "Gik godt / Kan forbedres / Kritisk" tilgængelig på dette run endnu.)
          </Text>
        ) : (
          <>
            {renderEvalSection("Hvad gik godt", greens)}
            {renderEvalSection("Kan forbedres", yellows)}
            {renderEvalSection("Kritisk", reds)}
          </>
        )}

        <Text style={styles.sectionTitle}>Handlinger</Text>
        {timeline.length === 0 ? (
          <Text style={styles.text}>Ingen handlinger registreret.</Text>
        ) : (
          timeline.map((entry) => (
            <View key={entry.id} style={styles.logItem}>
              <Text style={styles.logTime}>{formatTime(entry.timeMs)}</Text>
              <Text style={styles.logText}>{entry.description}</Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom actions: Copy + Export */}
      <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
        <TouchableOpacity
          style={[styles.button, { flex: 1, backgroundColor: "#10b981" }]}
          onPress={async () => {
            const text = buildCopyText();
            await Clipboard.setStringAsync(text);
            Alert.alert("Kopieret", "Run-data er kopieret.");
          }}
        >
          <Text style={styles.buttonText}>Copy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { flex: 1, backgroundColor: "#60a5fa" }]}
          onPress={exportCsv}
        >
          <Text style={styles.buttonText}>Eksportér CSV</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}


// ✅ SUPER IMPORTANT: export default too, so either import style works
export default RunDetailScreen;
