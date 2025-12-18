import { Alert, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { FacilitatorFocus } from "../services/sessions";
import { styles } from "../styles/indexStyles";

export function PickFocusScreen({
  sessionId,
  pickedFocus,
  onPickFocus,
  onJoin,
}: {
  sessionId: string | null;
  pickedFocus: FacilitatorFocus;
  onPickFocus: (f: FacilitatorFocus) => void;
  onJoin: () => Promise<void>;
}) {
  const focusOptions: FacilitatorFocus[] = [
    "ALL",
    "AMBULANCE_1",
    "AMBULANCE_2",
    "AKUTBIL",
    "LAEGEBIL",
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Vælg fokus</Text>
      <Text style={styles.subtitle}>Du skal vælge hvem du vurderer i sessionen.</Text>

      <View style={{ marginTop: 12 }}>
        {focusOptions.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.caseCard, pickedFocus === f && { borderColor: "#60a5fa" }]}
            onPress={() => onPickFocus(f)}
          >
            <Text style={styles.caseTitle}>{f}</Text>
            <Text style={styles.caseSubtitle}>
              {f === "ALL" ? "Alle deltagere" : "Kun denne enhed"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={async () => {
          if (!sessionId) {
            Alert.alert("Mangler session", "Ingen sessionId fundet.");
            return;
          }
          await onJoin();
        }}
      >
        <Text style={styles.buttonText}>Join session</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
