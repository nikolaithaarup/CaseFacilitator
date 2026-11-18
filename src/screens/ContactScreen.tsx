import * as Linking from "expo-linking";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CONTACT_EMAIL = "contact@synapsestudio.dk";

export function ContactScreen({ onBack }: { onBack: () => void }) {
  const [message, setMessage] = useState("");

  const composeEmail = async () => {
    if (!message.trim()) {
      Alert.alert("Mangler besked", "Skriv en kort besked først.");
      return;
    }

    const subject = encodeURIComponent("Feedback til SynapseFacilitator");
    const body = encodeURIComponent(message.trim());
    try {
      await Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`);
      // Opening a mail client does not prove that the user sent the message.
    } catch {
      Alert.alert("Kunne ikke åbne mail", `Skriv direkte til ${CONTACT_EMAIL}.`);
    }
  };

  return (
    <SafeAreaView style={s.page}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" onPress={onBack} style={s.back}>
          <Text style={s.backText}>← Tilbage</Text>
        </Pressable>
        <Text style={s.eyebrow}>SYNAPSE STUDIO</Text>
        <Text style={s.title}>Kontakt</Text>
        <Text style={s.description}>
          Har du fundet en fejl eller har du et forslag til undervisningen? Skriv til os.
        </Text>

        <Text style={s.label}>Besked</Text>
        <TextInput
          accessibilityLabel="Din besked"
          value={message}
          onChangeText={setMessage}
          multiline
          style={s.input}
          textAlignVertical="top"
          placeholder="Hvad kan forbedres?"
          placeholderTextColor="#819eab"
        />
        <Text style={s.note}>
          Undlad patientoplysninger, følsomme helbredsdata og fortroligt arbejdsmateriale.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void composeEmail()}
          style={({ pressed }) => [s.button, pressed && { opacity: 0.85 }]}
        >
          <Text style={s.buttonText}>Åbn mailapp</Text>
        </Pressable>
        <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(`mailto:${CONTACT_EMAIL}`)} style={s.mailLink}>
          <Text style={s.mailText}>{CONTACT_EMAIL}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#07131d" },
  content: { flexGrow: 1, width: "100%", maxWidth: 620, alignSelf: "center", paddingHorizontal: 22, paddingTop: 22, paddingBottom: 36 },
  back: { minHeight: 44, alignSelf: "flex-start", justifyContent: "center" },
  backText: { color: "#c1d4db", fontSize: 15 },
  eyebrow: { marginTop: 28, color: "#4de3c7", fontWeight: "800", fontSize: 12, letterSpacing: 1.3 },
  title: { marginTop: 9, fontSize: 30, fontWeight: "800", color: "#f8fafc" },
  description: { marginTop: 12, color: "#b3c7cf", fontSize: 16, lineHeight: 25 },
  label: { marginTop: 28, color: "#f1f5f9", fontSize: 15, fontWeight: "700" },
  input: { marginTop: 10, minHeight: 145, borderWidth: 1, borderColor: "#355663", borderRadius: 13, color: "#f1f5f9", paddingHorizontal: 15, paddingVertical: 14, fontSize: 16, lineHeight: 23, backgroundColor: "#0b202b" },
  note: { marginTop: 14, color: "#9cb4bd", fontSize: 13, lineHeight: 21 },
  button: { marginTop: 25, backgroundColor: "#45d5c3", minHeight: 52, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#092523", fontSize: 16, fontWeight: "800" },
  mailLink: { minHeight: 50, alignItems: "center", justifyContent: "center" },
  mailText: { color: "#b8d0d8", fontSize: 14 },
});

export default ContactScreen;
