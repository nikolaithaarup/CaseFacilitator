import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  // You are NOT using (tabs) now, so this should be index
  initialRouteName: "index",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // ✅ kills the white bar everywhere
        contentStyle: { backgroundColor: "#0b1220" }, // ✅ dark background behind screens
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
      {/* only add this if you actually make the route */}
      {/* <Stack.Screen name="profile-edit" /> */}

      <Stack.Screen
        name="modal"
        options={{ presentation: "modal" }}
      />
    </Stack>
  );
}
