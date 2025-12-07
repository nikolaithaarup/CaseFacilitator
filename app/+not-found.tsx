// app/+not-found.tsx
import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Denne side findes ikke.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Tilbage til forsiden</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#020617",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#e5e7eb",
    marginBottom: 16,
    textAlign: "center",
  },
  link: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#38bdf8",
  },
  linkText: {
    color: "#38bdf8",
    fontWeight: "500",
  },
});
