import * as Linking from "expo-linking";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { publicEnvironment } from "../config/env";
import { BrandMark } from "../components/BrandMark";

export function PortalRequiredScreen() {
  const openPortal = () => {
    void Linking.openURL(publicEnvironment.access.portalUrl);
  };

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.card}>
        <BrandMark fontSize={34} />
        <Text style={styles.eyebrow}>SIKKER PRODUKTADGANG</Text>
        <Text style={styles.title}>Åbn SynapseFacilitator via SynapsePortal</Text>
        <Text style={styles.body}>
          Direkte adgang er deaktiveret. Log ind i SynapsePortal og åbn
          Facilitator fra den organisation og session, du har fået adgang til.
        </Text>
        <View style={styles.warning}>
          <Text style={styles.warningTitle}>SIMULATION</Text>
          <Text style={styles.warningText}>Må ikke anvendes til patientbehandling.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Åbn SynapsePortal"
          onPress={openPortal}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>Gå til SynapsePortal</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#07131d",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 680,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(69,213,195,0.28)",
    backgroundColor: "#0b1c27",
    padding: 28,
    alignItems: "center",
  },
  eyebrow: {
    color: "#45d5c3",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.6,
    marginTop: 16,
    textAlign: "center",
  },
  title: {
    color: "#f8fafc",
    fontSize: 28,
    lineHeight: 35,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 9,
  },
  body: {
    color: "#a8bac4",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginTop: 14,
    maxWidth: 560,
  },
  warning: {
    marginTop: 22,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.45)",
    backgroundColor: "rgba(124,45,18,0.25)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 7,
  },
  warningTitle: { color: "#fb923c", fontWeight: "900", letterSpacing: 1 },
  warningText: { color: "#fed7aa", fontWeight: "700" },
  button: {
    minHeight: 52,
    minWidth: 230,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#45d5c3",
    marginTop: 24,
    paddingHorizontal: 22,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  buttonText: { color: "#06201d", fontSize: 16, fontWeight: "900" },
});
