// src/screens/CaseListScreen.tsx
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { CaseScenario } from "../domain/cases/types";
import { styles } from "../styles/indexStyles";

type UserProfile = {
  uid: string;
  displayName?: string;
  role?: string;
  orgId?: string;
};

export function CaseListScreen({
  title,
  profile,
  allCases,
  loadingCases,
  onBack,
  onPickCase,
}: {
  title: string; // "Cases" or "HLR"
  profile: UserProfile | null;
  allCases: CaseScenario[];
  loadingCases: boolean;
  onBack: () => void;
  onPickCase: (c: CaseScenario) => void;
}) {
  const who = profile
    ? `${profile.displayName ?? "Bruger"} • ${profile.orgId ?? "org?"} • ${profile.role ?? "role?"}`
    : "Ingen profil indlæst";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.smallButton}>
          <Text style={styles.smallButtonText}>←</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{who}</Text>
        </View>

        {/* Intentionally empty: no top-right history button */}
        <View style={{ width: 42 }} />
      </View>

      {loadingCases ? (
        <Text style={[styles.text, { marginTop: 12 }]}>Henter cases…</Text>
      ) : (
        <ScrollView style={{ marginTop: 12 }}>
          {allCases.map((c) => (
            <TouchableOpacity key={c.id} style={styles.caseCard} onPress={() => onPickCase(c)}>
              <Text style={styles.caseTitle}>{c.title}</Text>
              {!!c.subtitle && <Text style={styles.caseSubtitle}>{c.subtitle}</Text>}
              <View style={styles.badgeRow}>
                <Text style={styles.badge}>{c.acuity}</Text>
                <Text style={styles.badge}>Sværhedsgrad {c.difficulty}/3</Text>
              </View>
            </TouchableOpacity>
          ))}

          {allCases.length === 0 && <Text style={styles.text}>Ingen cases fundet i Firestore.</Text>}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

export default CaseListScreen;
