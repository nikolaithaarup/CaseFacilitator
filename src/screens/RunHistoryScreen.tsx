// src/screens/RunHistoryScreen.tsx
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../firebase/firebase";
import { listMyRuns, type RunListItem } from "../services/runs";
import { styles } from "../styles/indexStyles";
import { formatTime } from "../utils/format";

export function RunHistoryScreen({
  onBack,
  onOpenRun,
  reloadKey = 0, // ✅ bump this from parent to force reload
}: {
  onBack: () => void;
  onOpenRun: (runId: string) => void;
  reloadKey?: number;
}) {
  const [loading, setLoading] = useState(true);
  const [runs, setRuns] = useState<RunListItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadRuns = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setRuns([]);
      return;
    }
    const r = await listMyRuns(uid, 50);
    setRuns(r);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        await loadRuns();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadRuns, reloadKey]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadRuns();
    } finally {
      setRefreshing(false);
    }
  }, [loadRuns]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.smallButton}>
          <Text style={styles.smallButtonText}>←</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Run history</Text>
          <Text style={styles.subtitle}>Seneste gennemførte cases</Text>
        </View>
      </View>

      <ScrollView
        style={{ marginTop: 12 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && <Text style={styles.text}>Loader…</Text>}

        {!loading && runs.length === 0 && (
          <Text style={styles.text}>Ingen runs gemt endnu.</Text>
        )}

        {runs.map((r) => (
          <TouchableOpacity
            key={r.runId}
            style={styles.caseCard}
            onPress={() => onOpenRun(r.runId)}
          >
            <Text style={styles.caseTitle}>{r.caseTitle ?? "Ukendt case"}</Text>
            <Text style={styles.caseSubtitle}>
              {r.traineeDisplayName ? `Trainee: ${r.traineeDisplayName} · ` : ""}
              Tid: {formatTime(r.totalTimeMs)}
            </Text>
            <View style={styles.badgeRow}>
              <Text style={styles.badge}>
                {r.createdAtEpochMs
                  ? new Date(r.createdAtEpochMs).toLocaleString()
                  : "—"}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
