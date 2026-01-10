import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../styles/indexStyles";

export function LandingScreen({
  authReady,
  onLogin,
  onGoToOrgPicker,
}: {
  authReady: boolean;
  onLogin: (username: string, password: string) => Promise<void>;
  onGoToOrgPicker: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!authReady) return;

    if (!username.trim() || !password.trim()) {
      Alert.alert("Mangler info", "Skriv både brugernavn og kodeord.");
      return;
    }

    try {
      setBusy(true);
      await onLogin(username.trim(), password);
      onGoToOrgPicker?.();
    } catch (e: any) {
      console.warn(e);
      Alert.alert("Login fejlede", e?.message ?? "Forkert brugernavn eller kodeord.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ alignItems: "center", marginTop: 18, marginBottom: 14 }}>
        {/* NOTE: change the require path to your real CaseFacilitator icon */}
        <Image
          source={require("../../assets/her-icon.png")}
          style={styles.landingLogo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { marginTop: 10 }]}>CaseFacilitator</Text>
        <Text style={[styles.subtitle, { textAlign: "center", marginTop: 6 }]}>
          Log ind for at vælge organisation og starte en simulation.
        </Text>
      </View>

      {!authReady && (
        <View style={{ marginTop: 12, alignItems: "center" }}>
          <ActivityIndicator />
          <Text style={[styles.text, { marginTop: 8 }]}>Forbinder til Firebase…</Text>
        </View>
      )}

      <View style={{ marginTop: 10 }}>
        <Text style={styles.sectionTitle}>Brugernavn</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Fx UnordH"
          placeholderTextColor="#9ca3af"
          style={styles.textInput}
          editable={authReady && !busy}
        />

        <Text style={styles.sectionTitle}>Kodeord</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor="#9ca3af"
          style={styles.textInput}
          editable={authReady && !busy}
        />

        <TouchableOpacity
          style={[
            styles.button,
            { opacity: authReady && !busy ? 1 : 0.6, marginTop: 14 },
          ]}
          disabled={!authReady || busy}
          onPress={submit}
        >
          <Text style={styles.buttonText}>{busy ? "Logger ind..." : "Log ind"}</Text>
        </TouchableOpacity>

        {/* Settings later – placeholder */}
        <TouchableOpacity
          style={[styles.caseCard, { marginTop: 10 }]}
          onPress={() => Alert.alert("Settings", "Kommer senere 🙂")}
        >
          <Text style={styles.caseTitle}>Indstillinger</Text>
          <Text style={styles.caseSubtitle}>Tema, server, mm. (kommer senere)</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.textSmall, { marginTop: 18, textAlign: "center" }]}>
        Dev-login: username bliver til email: username@casefacilitator.local
      </Text>
    </SafeAreaView>
  );
}
