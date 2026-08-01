// app/join.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Platform, Text, View } from "react-native";

export default function JoinRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const sessionId = String(params.sessionId ?? "");
    const role = String(params.role ?? "");

    const target = `/?sessionId=${encodeURIComponent(sessionId)}&role=${encodeURIComponent(role)}`;

    if (Platform.OS === "web") {
      // ✅ Web: do a real browser navigation (no router timing issues)
      window.location.assign(target);
      return;
    }

    // ✅ Native: router is fine
    router.replace(target);
  }, [params, router]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Joining session…</Text>
    </View>
  );
}
