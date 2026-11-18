import * as Linking from "expo-linking";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePortalSession } from "../../app/_layout";

export function ProfileScreen({ onBack }: { onBack: () => void; onEdit?: () => void }) {
  const portalSession = usePortalSession();

  return (
    <SafeAreaView style={s.page}>
      <ScrollView contentContainerStyle={s.content}>
        <Pressable accessibilityRole="button" accessibilityLabel="Tilbage" onPress={onBack} style={s.back}>
          <Text style={s.backText}>← Tilbage</Text>
        </Pressable>
        <Text style={s.eyebrow}>SYNAPSEPORTAL</Text>
        <Text style={s.title}>Min konto</Text>
        <Text style={s.description}>
          Din adgang til SynapseFacilitator administreres via SynapsePortal.
        </Text>

        <View style={s.details}>
          <View style={s.detail}>
            <Text style={s.label}>Adgang</Text>
            <Text style={s.value}>{portalSession ? "Aktiv instruktøradgang" : "Kontrolleres via Portal"}</Text>
          </View>
          <View style={s.line} />
          <View style={s.detail}>
            <Text style={s.label}>Log ind</Text>
            <Text style={s.value}>SynapsePortal</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Åbn kontoen i SynapsePortal"
          style={({ pressed }) => [s.button, pressed && { opacity: 0.85 }]}
          onPress={() => void Linking.openURL("https://portal.synapsestudio.dk/portal/account")}
        >
          <Text style={s.buttonText}>Administrer min konto ↗</Text>
        </Pressable>
        <Text style={s.note}>
          Organisation, rolle og rettigheder ændres i Portal – ikke her.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#07131d" },
  content: { flexGrow: 1, width: "100%", maxWidth: 620, alignSelf: "center", paddingHorizontal: 22, paddingTop: 22, paddingBottom: 36 },
  back: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start", paddingRight: 18 },
  backText: { color: "#c1d4db", fontSize: 15 },
  eyebrow: { marginTop: 28, color: "#4de3c7", fontWeight: "800", fontSize: 12, letterSpacing: 1.3 },
  title: { marginTop: 9, fontSize: 30, fontWeight: "800", color: "#f8fafc" },
  description: { marginTop: 12, color: "#b3c7cf", fontSize: 16, lineHeight: 25 },
  details: { marginTop: 26, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#29404b" },
  detail: { paddingVertical: 19, flexDirection: "row", gap: 12, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" },
  line: { height: 1, backgroundColor: "#29404b" },
  label: { color: "#9fb7c3", fontSize: 14 },
  value: { color: "#f1f5f9", fontSize: 14, fontWeight: "700" },
  button: { marginTop: 28, minHeight: 52, borderRadius: 13, backgroundColor: "#45d5c3", justifyContent: "center", alignItems: "center", paddingHorizontal: 16 },
  buttonText: { color: "#092523", fontSize: 15, fontWeight: "800" },
  note: { marginTop: 20, color: "#8aa4b0", fontSize: 13, lineHeight: 21 },
});
