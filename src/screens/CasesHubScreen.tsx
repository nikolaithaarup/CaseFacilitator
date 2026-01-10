// src/screens/CasesHubScreen.tsx
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles as appStyles } from "../styles/indexStyles";

export default function CasesHubScreen({
  profileLabel,
  onBack,
  onOpenMedical,
  onOpenTrauma,
  onOpenHlr,
}: {
  profileLabel: string;
  onBack: () => void;
  onOpenMedical: () => void;
  onOpenTrauma: () => void;
  onOpenHlr: () => void;
}) {
  return (
    <SafeAreaView style={appStyles.container}>
      <View style={appStyles.headerRow}>
        <TouchableOpacity onPress={onBack} style={appStyles.smallButton}>
          <Text style={appStyles.smallButtonText}>←</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={appStyles.title}>Cases</Text>
          <Text style={appStyles.subtitle}>{profileLabel}</Text>
        </View>

        <View style={{ width: 42 }} />
      </View>

      <View style={s.body}>
        <TouchableOpacity
          style={s.bigButton}
          onPress={() => {
            console.log("CasesHub -> Medicinske");
            onOpenMedical();
          }}
        >
          <Text style={s.bigTitle}>Medicinske cases</Text>
          <Text style={s.bigSubtitle}>Medicinske scenarier</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.bigButton}
          onPress={() => {
            console.log("CasesHub -> Traume");
            onOpenTrauma();
          }}
        >
          <Text style={s.bigTitle}>Traumatiske cases</Text>
          <Text style={s.bigSubtitle}>Traume / skader</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.bigButton}
          onPress={() => {
            console.log("CasesHub -> HLR");
            onOpenHlr();
          }}
        >
          <Text style={s.bigTitle}>HLR</Text>
          <Text style={s.bigSubtitle}>Genoplivning / cardiac arrest</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 14, gap: 14 },
  bigButton: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  bigTitle: { fontSize: 20, fontWeight: "700", color: "white" },
  bigSubtitle: { marginTop: 6, fontSize: 13, opacity: 0.85, color: "white" },
});
