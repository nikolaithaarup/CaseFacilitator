import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { publicEnvironment } from "../src/config/env";
import { PortalRequiredScreen } from "../src/screens/PortalRequiredScreen";
import { restorePortalSession } from "../src/services/portalBridge";

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
  const pathname = usePathname();
  const isLaunchCallback = pathname === "/launch/callback";
  const [portalState, setPortalState] = useState<"CHECKING" | "ACTIVE" | "MISSING">(publicEnvironment.access.allowStandalone ? "ACTIVE" : "CHECKING");
  useEffect(() => { if (publicEnvironment.access.allowStandalone || isLaunchCallback) return; let active=true; restorePortalSession().then(session => { if(active) setPortalState(session ? "ACTIVE" : "MISSING"); }); return () => { active=false; }; }, [isLaunchCallback]);
  if (!publicEnvironment.access.allowStandalone && !isLaunchCallback && portalState !== "ACTIVE") {
    return portalState === "CHECKING" ? null : <PortalRequiredScreen />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false, // ✅ kills the white bar everywhere
        contentStyle: { backgroundColor: "#0b1220" }, // ✅ dark background behind screens
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="launch/callback" />
      {/* only add this if you actually make the route */}
      {/* <Stack.Screen name="profile-edit" /> */}

      <Stack.Screen
        name="modal"
        options={{ presentation: "modal" }}
      />
    </Stack>
  );
}
