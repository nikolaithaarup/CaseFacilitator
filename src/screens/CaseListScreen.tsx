import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { OrgChoice } from "../data/orgChoices";
import type { CaseScenario } from "../domain/cases/types";
import { styles } from "../styles/indexStyles";

export function CaseListScreen({
  selectedOrg,
  allCases,
  onBackToLogin,
  onPickCase,
}: {
  selectedOrg: OrgChoice | null;
  allCases: CaseScenario[];
  onBackToLogin: () => void;
  onPickCase: (c: CaseScenario) => void;
}) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBackToLogin} style={styles.smallButton}>
          <Text style={styles.smallButtonText}>←</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Cases</Text>
          <Text style={styles.subtitle}>
            {selectedOrg ? `Logget ind som: ${selectedOrg.label}` : ""}
          </Text>
        </View>
      </View>

      <ScrollView style={{ marginTop: 12 }}>
        {allCases.map((c) => (
          <TouchableOpacity key={c.id} style={styles.caseCard} onPress={() => onPickCase(c)}>
            <Text style={styles.caseTitle}>{c.title}</Text>
            <Text style={styles.caseSubtitle}>{c.subtitle}</Text>
            <View style={styles.badgeRow}>
              <Text style={styles.badge}>{c.acuity}</Text>
              <Text style={styles.badge}>Sværhedsgrad {c.difficulty}/3</Text>
            </View>
          </TouchableOpacity>
        ))}

        {allCases.length === 0 && <Text style={styles.text}>Ingen cases fundet i Firestore.</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}
export default CaseListScreen;
