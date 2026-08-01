import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { signOut } from "firebase/auth";
import { Stack, useGlobalSearchParams, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { createContext, useContext, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import "react-native-reanimated";
import { PortalRequiredScreen } from "../src/screens/PortalRequiredScreen";
import { auth } from "../src/firebase/firebase";
import {
  isAuthoritativePortalDenial,
  revalidatePortalSession,
  restorePortalSession,
} from "../src/services/portalBridge";
import {
  isValidDefibJoinRequest,
  type StaffAccessState,
} from "../src/services/staffAccess";

const StaffAccessContext = createContext<StaffAccessState>("AUTH_BOOTSTRAPPING");
export const useStaffAccess = () => useContext(StaffAccessContext);

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
  const params = useGlobalSearchParams<{
    role?: string | string[];
    sessionId?: string | string[];
  }>();
  const isLaunchCallback = pathname === "/launch/callback";
  const isDefibJoin = isValidDefibJoinRequest(
    pathname,
    params.sessionId,
    params.role,
  );
  const [accessState, setAccessState] = useState<StaffAccessState>("AUTH_BOOTSTRAPPING");
  const [connectionIssue, setConnectionIssue] = useState(false);

  useEffect(() => {
    if (isLaunchCallback) return;
    if (isDefibJoin) {
      setAccessState("TEMPORARY_DEFIB");
      return;
    }
    let active = true;
    let retry: ReturnType<typeof setTimeout> | undefined;
    setAccessState("AUTH_BOOTSTRAPPING");
    const restore = async () => {
      try {
        await restorePortalSession();
        if (active) {
          setConnectionIssue(false);
          setAccessState("AUTHORISED_STAFF");
        }
      } catch (error) {
        if (!active) return;
        if (isAuthoritativePortalDenial(error)) {
          await signOut(auth).catch(() => {});
          setConnectionIssue(false);
          setAccessState("ACCESS_REQUIRED");
        } else {
          setConnectionIssue(true);
          retry = setTimeout(restore, 5_000);
        }
      }
    };
    void restore();
    return () => {
      active = false;
      if (retry) clearTimeout(retry);
    };
  }, [isDefibJoin, isLaunchCallback]);

  useEffect(() => {
    if (accessState !== "AUTHORISED_STAFF") return;
    let active = true;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const revalidate = async () => {
      try {
        await revalidatePortalSession();
        if (active) setConnectionIssue(false);
      } catch (error) {
        if (!active) return;
        if (isAuthoritativePortalDenial(error)) {
          await signOut(auth).catch(() => {});
          setConnectionIssue(false);
          setAccessState("ACCESS_REQUIRED");
        } else {
          setConnectionIssue(true);
          retry = setTimeout(revalidate, 5_000);
        }
      }
    };
    const id = setInterval(() => void revalidate(), 60_000);
    return () => {
      active = false;
      clearInterval(id);
      if (retry) clearTimeout(retry);
    };
  }, [accessState]);

  if (!isLaunchCallback && accessState === "AUTH_BOOTSTRAPPING") {
    return (
      <View style={gateStyles.page}>
        <ActivityIndicator color="#45d5c3" />
        <Text style={gateStyles.text}>
          {connectionIssue
            ? "Forbindelsen kunne ikke kontrolleres. Prøver igen…"
            : "Kontrollerer sikker adgang…"}
        </Text>
      </View>
    );
  }
  if (!isLaunchCallback && accessState === "ACCESS_REQUIRED") {
    return <PortalRequiredScreen />;
  }

  return (
    <StaffAccessContext.Provider value={accessState}>
      <View style={gateStyles.stack}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#0b1220" },
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
        {connectionIssue ? (
          <View style={gateStyles.connectionBanner}>
            <Text style={gateStyles.connectionText}>
              Forbindelsen afprøves igen. Beskyttede handlinger kan være afvist.
            </Text>
          </View>
        ) : null}
      </View>
    </StaffAccessContext.Provider>
  );
}

const gateStyles = StyleSheet.create({
  stack: { flex: 1 },
  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#07131d",
  },
  text: { color: "#a8bac4" },
  connectionBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#7c2d12",
    padding: 8,
  },
  connectionText: { color: "#ffedd5", textAlign: "center", fontWeight: "700" },
});
