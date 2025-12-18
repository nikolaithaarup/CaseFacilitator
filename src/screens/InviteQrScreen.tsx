import * as Clipboard from "expo-clipboard";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../styles/indexStyles";

export function InviteQrScreen({
  sessionId,
  facUrl,
  defUrl,
  onBack,
}: {
  sessionId: string | null;
  facUrl: string | null;
  defUrl: string | null;
  onBack: () => void;
}) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.smallButton}>
          <Text style={styles.smallButtonText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Invite</Text>
          <Text style={styles.subtitle}>Scan QR to join the same session</Text>
        </View>
      </View>

      {!sessionId || !facUrl || !defUrl ? (
        <View style={{ marginTop: 24, alignItems: "center" }}>
          <ActivityIndicator />
          <Text style={[styles.text, { marginTop: 8 }]}>Opretter session…</Text>
        </View>
      ) : (
        <ScrollView style={{ marginTop: 18 }}>
          <View style={[styles.card, { alignItems: "center" }]}>
            <Text style={styles.cardTitle}>Facilitator invite</Text>
            <QRCode value={facUrl} size={220} />
            <TouchableOpacity
              style={[styles.button, { marginTop: 12, backgroundColor: "#60a5fa" }]}
              onPress={async () => {
                await Clipboard.setStringAsync(facUrl);
                Alert.alert("Kopieret", "Facilitator invite link kopieret.");
              }}
            >
              <Text style={styles.buttonText}>Copy facilitator link</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { alignItems: "center" }]}>
            <Text style={styles.cardTitle}>Defibrillator invite</Text>
            <QRCode value={defUrl} size={220} />
            <TouchableOpacity
              style={[styles.button, { marginTop: 12, backgroundColor: "#10b981" }]}
              onPress={async () => {
                await Clipboard.setStringAsync(defUrl);
                Alert.alert("Kopieret", "Defib invite link kopieret.");
              }}
            >
              <Text style={styles.buttonText}>Copy defib link</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.textSmall, { marginTop: 8, textAlign: "center" }]}>
            Session ID: {sessionId}
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
