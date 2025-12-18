import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ORG_CHOICES, type OrgChoice } from "../data/orgChoices";
import { styles } from "../styles/indexStyles";

export function LoginScreen({
  authReady,
  loadingCases,
  onPickOrg,
  onScanQr,
}: {
  authReady: boolean;
  loadingCases: boolean;
  onPickOrg: (org: OrgChoice) => Promise<void>;
  onScanQr: () => void;
}) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Case Facilitator</Text>
      <Text style={styles.subtitle}>Vælg bruger-type / organisation (midlertidig login).</Text>

      {!authReady && (
        <View style={{ marginTop: 16, alignItems: "center" }}>
          <ActivityIndicator />
          <Text style={[styles.text, { marginTop: 8 }]}>Logger ind anonymt…</Text>
        </View>
      )}

      <View style={{ marginTop: 16 }}>
        {ORG_CHOICES.map((org) => (
          <TouchableOpacity
            key={org.id}
            style={styles.caseCard}
            disabled={!authReady}
            onPress={() =>
              onPickOrg(org).catch(() => {
                Alert.alert("Kunne ikke hente cases", "Tjek Firestore regler + internet.");
              })
            }
          >
            <Text style={styles.caseTitle}>{org.label}</Text>
            <Text style={styles.caseSubtitle}>Rolle: {org.role}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loadingCases && (
        <View style={{ marginTop: 12, alignItems: "center" }}>
          <ActivityIndicator />
          <Text style={[styles.text, { marginTop: 8 }]}>Henter cases…</Text>
        </View>
      )}

      <View style={{ marginTop: 18, flexDirection: "row", gap: 8 }}>
        <TouchableOpacity
          style={[styles.button, { flex: 1, backgroundColor: "#60a5fa" }]}
          onPress={onScanQr}
        >
          <Text style={styles.buttonText}>Scan QR (join)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
