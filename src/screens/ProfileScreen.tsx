// src/screens/ProfileScreen.tsx
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { auth } from "../firebase/firebase";
import { getUserProfile } from "../services/users";
import { styles } from "../styles/indexStyles";

type UserProfile = {
  uid: string;
  displayName: string | null;
  role: string | null;
  orgId: string | null;
};

function prettyRole(role: string | null) {
  const r = (role || "").toLowerCase();
  if (r === "student") return "Student";
  if (r === "facilitator") return "Facilitator";
  if (r === "admin") return "Admin";
  if (r === "defib_device") return "Defib device";
  return role || "—";
}

function prettyOrg(orgId: string | null) {
  if (!orgId) return "—";
  const map: Record<string, string> = {
    student: "Elev (ingen org)",
    unord_hillerod: "U/Nord Hillerød",
    unord_esbjerg: "U/Nord Esbjerg",
    akutberedskabet: "Akutberedskabet",
    falck: "Falck",
  };
  return map[orgId] ?? orgId;
}

export function ProfileScreen({
  onBack,
  onEdit, // optional: wire this to router.push("/profile-edit")
}: {
  onBack: () => void;
  onEdit?: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [p, setP] = useState<UserProfile | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const uid = auth.currentUser?.uid;
      if (!uid) {
        setP(null);
        return;
      }

      const prof = await getUserProfile(uid);
      setP(
        prof
          ? {
              uid,
              displayName: prof.displayName ?? null,
              role: (prof.role as any) ?? null,
              orgId: prof.orgId ?? null,
            }
          : null
      );
    } catch (e: any) {
      console.warn(e);
      Alert.alert("Fejl", e?.message ?? "Kunne ikke hente profilen.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Centered content column */}
      <View style={{ flex: 1, alignItems: "center" }}>
        <View style={{ width: "100%", maxWidth: 520, flex: 1 }}>
          {/* Your in-app header */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onBack} style={styles.smallButton}>
              <Text style={styles.smallButtonText}>←</Text>
            </TouchableOpacity>

            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={styles.title}>Profil</Text>
              <Text style={styles.subtitle}>Din brugerinfo</Text>
            </View>

            {/* Keep spacing symmetric so the title stays centered */}
            <View style={{ width: 44 }}>
              {onEdit ? (
                <TouchableOpacity onPress={onEdit} style={styles.smallButton}>
                  <Text style={styles.smallButtonText}>✏️</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {loading ? (
            <View style={{ marginTop: 20, alignItems: "center" }}>
              <ActivityIndicator />
              <Text style={[styles.textSmall, { marginTop: 10 }]}>Henter profil…</Text>
            </View>
          ) : !p ? (
            <View style={{ marginTop: 20 }}>
              <Text style={styles.text}>Profil ikke fundet.</Text>
              <Text style={[styles.textSmall, { marginTop: 8 }]}>
                Du er måske logget ud, eller profilen mangler i Firestore.
              </Text>

              <TouchableOpacity
                style={[styles.button, { marginTop: 12, backgroundColor: "#60a5fa" }]}
                onPress={load}
              >
                <Text style={styles.buttonText}>Prøv igen</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <ScrollView style={{ marginTop: 12 }}>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Navn</Text>
                  <Text style={styles.text}>{p.displayName || "—"}</Text>
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Organisation</Text>
                  <Text style={styles.text}>{prettyOrg(p.orgId)}</Text>
                  <Text style={[styles.textSmall, { marginTop: 6 }]}>
                    orgId: {p.orgId ?? "—"}
                  </Text>
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Rolle</Text>
                  <Text style={styles.text}>{prettyRole(p.role)}</Text>
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Teknisk</Text>
                  <Text style={styles.textSmall}>uid: {p.uid}</Text>
                </View>
              </ScrollView>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                <TouchableOpacity
                  style={[styles.button, { flex: 1, backgroundColor: "#10b981" }]}
                  onPress={() => {
                    // quick copy-to-clipboard is optional; leaving out for now
                    Alert.alert("OK", "Du kan tilføje copy her, hvis du vil.");
                  }}
                >
                  <Text style={styles.buttonText}>Copy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, { flex: 1, backgroundColor: "#60a5fa" }]}
                  onPress={load}
                >
                  <Text style={styles.buttonText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
