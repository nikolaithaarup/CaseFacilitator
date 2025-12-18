import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CounterRow } from "../components/CounterRow";
import type { OrgChoice } from "../data/orgChoices";
import type { CaseScenario } from "../domain/cases/types";
import { styles } from "../styles/indexStyles";

export type UnitsRunConfig = {
  ambulancer: number;
  akutbil: number;
  laegebil: number;
};

export function CaseSetupScreen({
  selectedOrg,
  selectedCaseTemplate,
  setupSex,
  setupAge,
  units,
  facilitatorsCount,
  onBack,
  onSetSex,
  onSetAge,
  onSetUnits,
  onSetFacilitatorsCount,
  onStartSoloCase,
  onScanQr,
  onCreateSessionInvite,
}: {
  selectedOrg: OrgChoice | null;
  selectedCaseTemplate: CaseScenario | null;

  setupSex: "M" | "K";
  setupAge: number;
  units: UnitsRunConfig;
  facilitatorsCount: number;

  onBack: () => void;
  onSetSex: (s: "M" | "K") => void;
  onSetAge: (n: number) => void;
  onSetUnits: (u: UnitsRunConfig) => void;
  onSetFacilitatorsCount: (n: number) => void;

  onStartSoloCase: (derivedScenario: CaseScenario) => void;
  onScanQr: () => void;
  onCreateSessionInvite: () => Promise<void>;
}) {
  if (!selectedCaseTemplate || !selectedOrg) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.text}>Ingen case valgt.</Text>
        <TouchableOpacity style={styles.button} onPress={onBack}>
          <Text style={styles.buttonText}>Tilbage</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const derivedScenario: CaseScenario = {
    ...selectedCaseTemplate,
    patientInfo: {
      ...selectedCaseTemplate.patientInfo,
      sex: setupSex,
      age: setupAge,
    },
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.smallButton}>
          <Text style={styles.smallButtonText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Case setup</Text>
          <Text style={styles.subtitle}>{selectedCaseTemplate.title}</Text>
        </View>
      </View>

      <ScrollView style={{ marginTop: 12 }}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Patient</Text>

          <Text style={[styles.textSmall, { marginTop: 6 }]}>Køn</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
            <TouchableOpacity
              style={[styles.doseButton, setupSex === "M" && styles.doseButtonActive, { flex: 1 }]}
              onPress={() => onSetSex("M")}
            >
              <Text style={[styles.doseButtonText, setupSex === "M" && { color: "black" }]}>
                Mand
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.doseButton, setupSex === "K" && styles.doseButtonActive, { flex: 1 }]}
              onPress={() => onSetSex("K")}
            >
              <Text style={[styles.doseButtonText, setupSex === "K" && { color: "black" }]}>
                Kvinde
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.textSmall, { marginTop: 10 }]}>Alder</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
            <TouchableOpacity
              style={styles.smallButton}
              onPress={() => onSetAge(Math.max(0, setupAge - 1))}
            >
              <Text style={styles.smallButtonText}>−</Text>
            </TouchableOpacity>

            <TextInput
              value={String(setupAge)}
              onChangeText={(t) => {
                const n = parseInt(t || "0", 10);
                onSetAge(Number.isFinite(n) ? Math.max(0, Math.min(120, n)) : 0);
              }}
              keyboardType="number-pad"
              style={[
                styles.text,
                {
                  minWidth: 70,
                  textAlign: "center",
                  paddingVertical: 6,
                  paddingHorizontal: 8,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.15)",
                },
              ]}
            />

            <TouchableOpacity
              style={styles.smallButton}
              onPress={() => onSetAge(Math.min(120, setupAge + 1))}
            >
              <Text style={styles.smallButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.textSmall, { marginTop: 10 }]}>
            Vises i casen som: {derivedScenario.patientInfo.sex === "M" ? "Mand" : "Kvinde"} ·{" "}
            {derivedScenario.patientInfo.age} år
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ressourcer / enheder</Text>
          <CounterRow
            label="Ambulancer (2-mands)"
            value={units.ambulancer}
            min={0}
            max={20}
            onChange={(n) => onSetUnits({ ...units, ambulancer: n })}
          />
          <CounterRow
            label="Akutbil (1-mands)"
            value={units.akutbil}
            min={0}
            max={20}
            onChange={(n) => onSetUnits({ ...units, akutbil: n })}
          />
          <CounterRow
            label="Lægebil (læge + behandler)"
            value={units.laegebil}
            min={0}
            max={20}
            onChange={(n) => onSetUnits({ ...units, laegebil: n })}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Facilitators & devices</Text>
          <CounterRow
            label="Antal facilitators"
            value={facilitatorsCount}
            min={1}
            max={10}
            onChange={(n) => onSetFacilitatorsCount(n)}
          />

          {facilitatorsCount > 1 && (
            <TouchableOpacity
              style={[styles.button, { marginTop: 10, backgroundColor: "#60a5fa" }]}
              onPress={() => onCreateSessionInvite()}
            >
              <Text style={styles.buttonText}>Create session + Invite (QR)</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            if (units.ambulancer + units.akutbil + units.laegebil <= 0) {
              Alert.alert("Ingen enheder", "Angiv mindst 1 enhed (fx 1 ambulance).");
              return;
            }
            onStartSoloCase(derivedScenario);
          }}
        >
          <Text style={styles.buttonText}>Next → start case</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { marginTop: 10, backgroundColor: "#4b5563" }]}
          onPress={onScanQr}
        >
          <Text style={styles.buttonText}>Scan QR (join session)</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
export default CaseSetupScreen;
