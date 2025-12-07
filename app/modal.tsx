import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Case Facilitator – modal</Text>
      <Text style={styles.text}>
        Her kan du senere lave indstillinger, hjælpetekst eller andet indhold.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#020617", // same vibe as your other screens
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    color: "#e5e7eb",
  },
});
