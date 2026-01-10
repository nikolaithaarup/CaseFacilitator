// src/screens/ContactScreen.tsx
import Constants from "expo-constants";
import * as Device from "expo-device";
import { useMemo, useState } from "react";
import {
    Alert,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Reuse your CaseFacilitator styles
import { styles } from "../styles/indexStyles";

// ✅ Set this to your CaseFacilitator backend base URL
const API_BASE_URL = "https://flashmedic-backend.onrender.com";
// Endpoint expected: POST /contact/send

export function ContactScreen({ onBack }: { onBack: () => void }) {
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [sending, setSending] = useState(false);

  const appName = Constants.expoConfig?.name ?? "CaseFacilitator";
  const appVersion = Constants.expoConfig?.version ?? "ukendt version";

  const deviceInfo = useMemo(() => {
    const parts = [
      Device.manufacturer,
      Device.modelName,
      Device.osName,
      Device.osVersion,
    ].filter(Boolean);
    return parts.join(" ");
  }, []);

  const handleSend = async () => {
    if (!contactMessage.trim()) {
      Alert.alert("Fejl", "Skriv venligst en besked.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/contact/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName.trim() || null,
          email: contactEmail.trim() || null,
          message: contactMessage.trim(),
          appName,
          appVersion,
          platform: Platform.OS,
          deviceInfo: deviceInfo || "Ukendt enhed",
        }),
      });

      if (!res.ok) throw new Error("Serverfejl");

      Alert.alert("Tak!", "Din besked er sendt til udvikleren.");
      setContactName("");
      setContactEmail("");
      setContactMessage("");
      onBack();
    } catch (e) {
      Alert.alert("Fejl", "Kunne ikke sende beskeden. Tjek internet og prøv igen.");
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header: same pattern as your other pages */}
      <View style={styles.headerRow}>
        <Pressable onPress={onBack} style={styles.smallButton}>
          <Text style={styles.smallButtonText}>←</Text>
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Kontakt</Text>
          <Text style={styles.subtitle}>Send feedback til CaseFacilitator-teamet</Text>
        </View>
      </View>

      {/* Content starts lower than the header */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 18, // <-- pushes content down a bit
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.text, { marginTop: 4 }]}>
          App: {appName} – v{appVersion}{"\n"}
          Enhed: {deviceInfo || "Ukendt enhed"} ({Platform.OS})
        </Text>

        <Text style={[styles.text, { marginTop: 14 }]}>
          Ris, ros og konkrete forbedringsforslag modtages meget gerne — det gør appen bedre for alle.
        </Text>

        <Text style={[styles.text, { marginTop: 22 }]}>Navn (valgfri)</Text>
        <TextInput
          value={contactName}
          onChangeText={setContactName}
          style={styles.textInput}
          placeholder="Fx Nikolai"
          placeholderTextColor="#adb5bd"
        />

        <Text style={[styles.text, { marginTop: 14 }]}>Email (valgfri)</Text>
        <TextInput
          value={contactEmail}
          onChangeText={setContactEmail}
          style={styles.textInput}
          placeholder="Fx nikolai@example.com"
          placeholderTextColor="#adb5bd"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={[styles.text, { marginTop: 14 }]}>Besked</Text>
        <TextInput
          value={contactMessage}
          onChangeText={setContactMessage}
          style={[
            styles.textInput,
            {
              height: 140,
              textAlignVertical: "top",
            },
          ]}
          placeholder="Skriv din besked her..."
          placeholderTextColor="#adb5bd"
          multiline
        />

        <Pressable
          style={[styles.button, { marginTop: 18, opacity: sending ? 0.7 : 1 }]}
          onPress={handleSend}
          disabled={sending}
        >
          <Text style={styles.buttonText}>{sending ? "SENDER..." : "SEND"}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

export default ContactScreen;
