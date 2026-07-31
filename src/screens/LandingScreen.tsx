import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandMark } from "../components/BrandMark";

export function LandingScreen({
  authReady,
  onLogin,
  onGoToOrgPicker,
}: {
  authReady: boolean;
  onLogin: (username: string, password: string) => Promise<void>;
  onGoToOrgPicker?: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!authReady || busy) return;
    if (!username.trim() || !password.trim()) {
      Alert.alert("Mangler oplysninger", "Skriv både brugernavn og kodeord.");
      return;
    }

    try {
      setBusy(true);
      await onLogin(username.trim(), password);
      onGoToOrgPicker?.();
    } catch (error: any) {
      Alert.alert(
        "Kunne ikke åbne standalone-miljøet",
        error?.message ?? "Kontrollér loginoplysningerne og prøv igen.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.page}>
      <View style={s.shell}>
        <View style={s.hero}>
          <View style={s.logoFrame}>
            <Image
              source={require("../../assets/her-icon.png")}
              style={s.logo}
              resizeMode="contain"
            />
          </View>
          <BrandMark fontSize={34} />
          <Text style={s.kicker}>INSTRUKTØR- OG SIMULATIONSSTYRING</Text>
          <Text style={s.description}>
            Opret cases, styr simulationen og frigiv fiktive observationer til
            tilknyttede læringssystemer.
          </Text>
        </View>

        <View style={s.warning} accessibilityRole="text">
          <Text style={s.warningTitle}>SIMULATION</Text>
          <Text style={s.warningText}>
            Må ikke anvendes til patientbehandling.
          </Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardEyebrow}>MIDLERTIDIG ADGANG</Text>
          <Text style={s.cardTitle}>Standalone-login</Text>
          <Text style={s.cardText}>
            Denne adgang beholdes kun som udviklings- og demonstrationsvej,
            indtil sikker opstart fra SynapsePortal er implementeret.
          </Text>

          {!authReady ? (
            <View style={s.loadingRow}>
              <ActivityIndicator color="#45d5c3" />
              <Text style={s.loadingText}>Forbinder til Firebase…</Text>
            </View>
          ) : (
            <>
              <Text style={s.label}>Brugernavn</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Brugernavn eller e-mail"
                placeholderTextColor="#6f8592"
                style={s.input}
                editable={!busy}
                returnKeyType="next"
              />

              <Text style={s.label}>Kodeord</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor="#6f8592"
                style={s.input}
                editable={!busy}
                returnKeyType="go"
                onSubmitEditing={submit}
              />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Åbn SynapseFacilitator"
                onPress={submit}
                disabled={busy}
                style={({ pressed }) => [
                  s.primaryButton,
                  pressed && s.primaryPressed,
                  busy && s.disabled,
                ]}
              >
                <Text style={s.primaryText}>
                  {busy ? "Åbner…" : "Åbn Facilitator"}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#07131d",
    paddingHorizontal: 18,
  },
  shell: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingVertical: 28,
  },
  hero: { alignItems: "center", paddingHorizontal: 12 },
  logoFrame: {
    width: 94,
    height: 94,
    borderRadius: 26,
    padding: 10,
    backgroundColor: "#0e2430",
    borderWidth: 1,
    borderColor: "rgba(69,213,195,0.28)",
    marginBottom: 14,
  },
  logo: { width: "100%", height: "100%" },
  kicker: {
    color: "#45d5c3",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.8,
    marginTop: 10,
    textAlign: "center",
  },
  description: {
    color: "#a8bac4",
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 600,
    textAlign: "center",
    marginTop: 10,
  },
  warning: {
    marginTop: 24,
    borderRadius: 14,
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
  card: {
    marginTop: 18,
    backgroundColor: "#0b1c27",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
    padding: 22,
  },
  cardEyebrow: {
    color: "#45d5c3",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  cardTitle: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 5,
  },
  cardText: {
    color: "#9eb0bb",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
    marginBottom: 18,
  },
  loadingRow: {
    minHeight: 90,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: { color: "#9eb0bb" },
  label: {
    color: "#dbe7ec",
    fontWeight: "800",
    marginBottom: 7,
    marginTop: 12,
  },
  input: {
    width: "100%",
    minHeight: 50,
    backgroundColor: "#07131d",
    borderRadius: 13,
    paddingHorizontal: 14,
    color: "#f8fafc",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.25)",
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#45d5c3",
    marginTop: 20,
  },
  primaryPressed: { transform: [{ scale: 0.99 }], opacity: 0.92 },
  focused: { borderWidth: 3, borderColor: "#f8fafc" },
  disabled: { opacity: 0.55 },
  primaryText: { color: "#06201d", fontSize: 16, fontWeight: "900" },
});
