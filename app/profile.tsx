// app/profile.tsx
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth } from "../src/firebase/firebase";

import { getUserProfile, upsertUserProfile, type UserRole } from "../src/services/users";
import { styles } from "../src/styles/indexStyles";

// Keep your existing org list for now (later you can load from Firestore orgs)
type OrgChoice = { id: string; label: string };
const ORG_CHOICES: OrgChoice[] = [
  { id: "student", label: "Elev (ingen org)" },
  { id: "unord_hillerod", label: "U/Nord Hillerød" },
  { id: "unord_esbjerg", label: "U/Nord Esbjerg" },
  { id: "akutberedskabet", label: "Akutberedskabet" },
  { id: "falck", label: "Falck" },
];

const ROLE_CHOICES: { id: UserRole; label: string; help: string }[] = [
  { id: "student", label: "Student", help: "Kan deltage og køre cases, men ikke styre sessioner." },
  {
    id: "facilitator",
    label: "Facilitator",
    help: "Kan oprette/joinne sessions, logge events og feedback.",
  },
  { id: "admin", label: "Admin", help: "Skole/enterprise admin (senere: bruger- og orgstyring)." },
  {
    id: "defib_device",
    label: "Defib device",
    help: "Kun til dedikeret tablet (skriver kun defib-events).",
  },
];

export default function ProfileScreen() {
  const router = useRouter();

  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [displayName, setDisplayName] = useState("");
  const [orgId, setOrgId] = useState<string>(ORG_CHOICES[0].id);
  const [role, setRole] = useState<UserRole>("student");

  const selectedRoleHelp = useMemo(
    () => ROLE_CHOICES.find((r) => r.id === role)?.help ?? "",
    [role],
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          await signInAnonymously(auth);
          return;
        }

        setUid(user.uid);

        const existing = await getUserProfile(user.uid);
        if (existing) {
          setDisplayName(existing.displayName ?? "");
          setOrgId(existing.orgId ?? ORG_CHOICES[0].id);
          setRole((existing.role as UserRole) ?? "student");
        }

        setLoading(false);
      } catch (e: any) {
        console.error(e);
        setLoading(false);
        Alert.alert("Profil fejl", e?.message ?? "Kunne ikke indlæse profilen.");
      }
    });

    return () => unsub();
  }, []);

  const canSave = !!uid && displayName.trim().length >= 2 && !!orgId && !!role;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Profil</Text>
      <Text style={styles.subtitle}>Vælg navn, rolle og organisation.</Text>

      {loading ? (
        <Text style={[styles.text, { marginTop: 12 }]}>Indlæser…</Text>
      ) : (
        <ScrollView style={{ marginTop: 12 }}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Navn</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Fx Nick"
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={[
                styles.text,
                {
                  marginTop: 8,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.15)",
                },
              ]}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Organisation</Text>
            <View style={{ marginTop: 10, gap: 8 }}>
              {ORG_CHOICES.map((o) => (
                <TouchableOpacity
                  key={o.id}
                  style={[styles.caseCard, orgId === o.id && { borderColor: "#60a5fa" }]}
                  onPress={() => setOrgId(o.id)}
                >
                  <Text style={styles.caseTitle}>{o.label}</Text>
                  <Text style={styles.caseSubtitle}>orgId: {o.id}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rolle</Text>
            <Text style={[styles.textSmall, { marginTop: 6 }]}>{selectedRoleHelp}</Text>

            <View style={{ marginTop: 10, gap: 8 }}>
              {ROLE_CHOICES.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.caseCard, role === r.id && { borderColor: "#10b981" }]}
                  onPress={() => setRole(r.id)}
                >
                  <Text style={styles.caseTitle}>{r.label}</Text>
                  <Text style={styles.caseSubtitle}>{r.help}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { marginTop: 10, backgroundColor: canSave ? "#10b981" : "#4b5563" },
            ]}
            disabled={!canSave}
            onPress={async () => {
              try {
                if (!uid) return;

                await upsertUserProfile({
                  uid,
                  displayName,
                  role,
                  orgId,
                });

                Alert.alert("Gemt", "Profilen er gemt.");
                router.replace("/"); // back to app/index.tsx
              } catch (e: any) {
                console.error(e);
                Alert.alert("Kunne ikke gemme", e?.message ?? "Ukendt fejl.");
              }
            }}
          >
            <Text style={styles.buttonText}>Gem profil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { marginTop: 10, backgroundColor: "#60a5fa" }]}
            onPress={() => router.replace("/")}
          >
            <Text style={styles.buttonText}>Tilbage</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
