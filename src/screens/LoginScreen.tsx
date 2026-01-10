import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ORG_CHOICES, type OrgChoice } from "../data/orgChoices";
import { styles } from "../styles/indexStyles";

export function LoginScreen({
  canPickOrg,
  loadingCases,
  onPickOrg,
  onScanQr,
  onLogout,
}: {
  canPickOrg: boolean; // ✅ clearer name: signed in + firebase ready
  loadingCases: boolean;
  onPickOrg: (org: OrgChoice) => Promise<void>;
  onScanQr: () => void;
  onLogout: () => void;
}) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Case Facilitator</Text>
          <Text style={styles.subtitle}>Vælg organisation / rolle.</Text>
        </View>

        <TouchableOpacity
          style={styles.smallButton}
          onPress={onLogout}
          disabled={!canPickOrg}
        >
          <Text style={styles.smallButtonText}>⎋</Text>
        </TouchableOpacity>
      </View>

      {!canPickOrg && (
        <View style={{ marginTop: 16, alignItems: "center" }}>
          <ActivityIndicator />
          <Text style={[styles.text, { marginTop: 8 }]}>
            Log ind for at fortsætte…
          </Text>
        </View>
      )}

      <View style={{ marginTop: 16 }}>
        {ORG_CHOICES.map((org) => (
          <TouchableOpacity
            key={org.id}
            style={[styles.caseCard, { opacity: canPickOrg ? 1 : 0.5 }]}
            disabled={!canPickOrg}
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
          style={[
            styles.button,
            { flex: 1, backgroundColor: "#60a5fa", opacity: canPickOrg ? 1 : 0.5 },
          ]}
          onPress={onScanQr}
          disabled={!canPickOrg}
        >
          <Text style={styles.buttonText}>Scan QR (join)</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.textSmall, { marginTop: 10 }]}>
        Tip: Tryk ⎋ for at logge ud og teste en anden bruger.
      </Text>
    </SafeAreaView>
  );
}
