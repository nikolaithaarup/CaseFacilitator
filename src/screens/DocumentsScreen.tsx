import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../firebase/firebase";
import { listDocumentsForOrg, type DocumentItem } from "../services/documents";
import { getUserProfile } from "../services/users";
import { styles } from "../styles/indexStyles";

export function DocumentsScreen({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [orgLabel, setOrgLabel] = useState<string>("");

  const load = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setDocs([]);
      setOrgLabel("");
      return;
    }

    const profile = await getUserProfile(uid);
    const orgId = profile?.orgId ?? null;

    if (!orgId) {
      setDocs([]);
      setOrgLabel("Ingen organisation på profilen");
      return;
    }

    setOrgLabel(orgId);
    const items = await listDocumentsForOrg(orgId);
    setDocs(items);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch (e: any) {
        console.warn(e);
        Alert.alert("Fejl", e?.message ?? "Kunne ikke hente dokumenter.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.smallButton}>
          <Text style={styles.smallButtonText}>←</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Dokumenter</Text>
          <Text style={styles.subtitle}>
            {orgLabel ? `Organisation: ${orgLabel}` : "Indlæser organisation…"}
          </Text>
        </View>

        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        style={{ marginTop: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && (
          <View style={{ marginTop: 16 }}>
            <ActivityIndicator />
            <Text style={[styles.textSmall, { marginTop: 10 }]}>Henter dokumenter…</Text>
          </View>
        )}

        {!loading && docs.length === 0 && (
          <View style={styles.card}>
            <Text style={styles.text}>Ingen dokumenter fundet for din organisation.</Text>
            <Text style={styles.textSmall}>(Tip: tjek at din user profile orgId matcher dokumenternes orgId)</Text>
          </View>
        )}

        {docs.map((d) => (
          <View key={d.id} style={styles.caseCard}>
            <Text style={styles.caseTitle}>{d.title}</Text>
            {d.subtitle ? <Text style={styles.caseSubtitle}>{d.subtitle}</Text> : null}

            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              <TouchableOpacity
                style={[styles.button, { flex: 1, backgroundColor: "#60a5fa", marginBottom: 0 }]}
                onPress={async () => {
                  try {
                    const ok = await Linking.canOpenURL(d.url);
                    if (!ok) {
                      Alert.alert("Kan ikke åbne", "Linket kunne ikke åbnes på denne enhed.");
                      return;
                    }
                    await Linking.openURL(d.url);
                  } catch (e: any) {
                    console.warn(e);
                    Alert.alert("Fejl", e?.message ?? "Kunne ikke åbne link.");
                  }
                }}
              >
                <Text style={styles.buttonText}>Åbn</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { flex: 1, backgroundColor: "#10b981", marginBottom: 0 }]}
                onPress={async () => {
                  await Clipboard.setStringAsync(d.url);
                  Alert.alert("Kopieret", "Link kopieret til udklipsholder.");
                }}
              >
                <Text style={styles.buttonText}>Kopiér link</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

export default DocumentsScreen;
