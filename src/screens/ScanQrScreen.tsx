import { CameraView, type PermissionResponse } from "expo-camera";
import * as Linking from "expo-linking";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../styles/indexStyles";
import { parseJoinRole } from "../utils/joinLinks";

export function ScanQrScreen({
  perm,
  requestPerm,
  onBack,
  onParsedInvite,
}: {
  perm: PermissionResponse | null;
  requestPerm: () => Promise<PermissionResponse>;
  onBack: () => void;
  onParsedInvite: (args: { sessionId: string; role: "FACILITATOR" | "DEFIB" }) => void;
}) {
  const hasPerm = perm?.granted;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.smallButton}>
          <Text style={styles.smallButtonText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Scan QR</Text>
          <Text style={styles.subtitle}>Join session (facilitator or defib)</Text>
        </View>
      </View>

      {!hasPerm ? (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.text}>Camera permission kræves for at scanne QR.</Text>
          <TouchableOpacity style={[styles.button, { marginTop: 12 }]} onPress={requestPerm}>
            <Text style={styles.buttonText}>Allow camera</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ marginTop: 12, flex: 1, borderRadius: 16, overflow: "hidden" }}>
          <CameraView
            style={{ flex: 1 }}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={({ data }) => {
              try {
                const parsed = Linking.parse(data);
                if (parsed?.path !== "join") {
                  Alert.alert(
                    "Ikke en CaseFacilitator QR",
                    "Denne QR ser ikke ud til at være en session-invite.",
                  );
                  return;
                }
                const sid = (parsed.queryParams?.sessionId as string) || null;
                if (!sid) {
                  Alert.alert("Ugyldig invite", "Mangler sessionId i QR.");
                  return;
                }
                const role = parseJoinRole(parsed.queryParams?.role);
                onParsedInvite({ sessionId: sid, role });
              } catch (e) {
                console.error(e);
                Alert.alert("Scan fejl", "Kunne ikke læse QR.");
              }
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
