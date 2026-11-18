import * as Linking from "expo-linking";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandMark } from "../components/BrandMark";

const APP_LOGO = require("../../assets/her-icon.png");

interface Props {
  profileLabel: string;
  onLogout: () => void;
  onOpenProfile: () => void;
  onOpenCases: () => void;
  onOpenScanQr: () => void;
  onOpenDocuments: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenContact: () => void;
}

function MenuAction({
  title,
  description,
  icon,
  onPress,
}: {
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [s.action, pressed && s.pressed]}
    >
      <Text style={s.actionIcon} accessibilityElementsHidden>{icon}</Text>
      <View style={s.actionCopy}>
        <Text style={s.actionTitle}>{title}</Text>
        <Text style={s.actionDescription}>{description}</Text>
      </View>
      <Text style={s.arrow} accessibilityElementsHidden>›</Text>
    </Pressable>
  );
}

export function MainMenuScreen({
  profileLabel,
  onLogout,
  onOpenProfile,
  onOpenCases,
  onOpenContact,
}: Props) {
  return (
    <SafeAreaView style={s.page}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.header}>
          <Image source={APP_LOGO} resizeMode="contain" style={s.logo} />
          <BrandMark fontSize={29} />
          <Text style={s.subtitle}>Styr scenarier og undervisning</Text>
          <Text style={s.identity}>{profileLabel}</Text>
        </View>

        <View style={s.actions}>
          <MenuAction
            title="Cases"
            description="Vælg og gennemfør en simulation"
            icon="▦"
            onPress={onOpenCases}
          />
          <MenuAction
            title="Min konto"
            description="Se din adgang via SynapsePortal"
            icon="◉"
            onPress={onOpenProfile}
          />
          <MenuAction
            title="Kontakt"
            description="Feedback, fejl og forbedringsforslag"
            icon="✉"
            onPress={onOpenContact}
          />
        </View>

        <View style={s.footer}>
          <Pressable
            accessibilityRole="link"
            onPress={() => void Linking.openURL("https://portal.synapsestudio.dk/portal")}
            style={s.portalLink}
          >
            <Text style={s.portalText}>Åbn SynapsePortal</Text>
            <Text style={s.portalArrow}>↗</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onLogout} style={s.logout}>
            <Text style={s.logoutText}>Log ud af Facilitator</Text>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            onPress={() => void Linking.openURL("https://synapsestudio.dk")}
          >
            <Text style={s.credit}>En del af Synapse Studio</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#07131d" },
  content: { flexGrow: 1, width: "100%", maxWidth: 650, alignSelf: "center", paddingHorizontal: 22, paddingTop: 30, paddingBottom: 32 },
  header: { alignItems: "center", paddingBottom: 31 },
  logo: { width: 78, height: 78, marginBottom: 14 },
  subtitle: { marginTop: 12, fontSize: 15, color: "#afc2ca", textAlign: "center" },
  identity: { marginTop: 13, color: "#4de3c7", fontSize: 13, textAlign: "center" },
  actions: { gap: 10 },
  action: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 16, borderWidth: 1, borderColor: "#23404b", backgroundColor: "#0c202b", minHeight: 86, paddingHorizontal: 18, paddingVertical: 15 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.995 }] },
  actionIcon: { width: 30, color: "#4de3c7", fontSize: 25, textAlign: "center" },
  actionCopy: { flex: 1, gap: 5 },
  actionTitle: { color: "#f8fafc", fontSize: 17, fontWeight: "700" },
  actionDescription: { color: "#a9bec9", fontSize: 13, lineHeight: 18 },
  arrow: { color: "#8badba", fontSize: 28 },
  footer: { gap: 14, marginTop: 33, alignItems: "center" },
  portalLink: { flexDirection: "row", gap: 7, minHeight: 44, alignItems: "center", justifyContent: "center" },
  portalText: { fontWeight: "700", color: "#4de3c7", fontSize: 15 },
  portalArrow: { fontSize: 17, color: "#4de3c7" },
  logout: { minHeight: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 15 },
  logoutText: { fontSize: 14, color: "#bbcbd2" },
  credit: { marginTop: 16, color: "#7f9eaa", fontSize: 12 },
});

export default MainMenuScreen;
