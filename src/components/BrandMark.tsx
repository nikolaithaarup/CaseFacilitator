import { StyleSheet, Text, View } from "react-native";

export function BrandMark({ fontSize = 28 }: { fontSize?: number }) {
  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel="Synapse Facilitator">
      <Text style={[styles.word, styles.synapse, { fontSize }]}>Synapse</Text>
      <Text style={[styles.word, styles.facilitator, { fontSize }]}>Facilitator</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  word: { fontWeight: "900" },
  synapse: { color: "#ffffff" },
  facilitator: { color: "#22c55e" },
});
