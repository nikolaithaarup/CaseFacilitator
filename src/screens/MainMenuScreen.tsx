// src/screens/MainMenuScreen.tsx
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MenuTile } from "../components/MenuTile";
import { styles as appStyles } from "../styles/indexStyles";

const APP_LOGO = require("../../assets/her-icon.png");

export function MainMenuScreen({
  profileLabel,
  onLogout,
  onOpenProfile,
  onOpenCases,
  onOpenScanQr,
  onOpenDocuments,
  onOpenHistory,
  onOpenSettings,
  onOpenContact,
}: {
  profileLabel: string;
  onLogout: () => void;
  onOpenProfile: () => void;
  onOpenCases: () => void;
  onOpenScanQr: () => void;
  onOpenDocuments: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenContact: () => void;
}) {
  return (
    <SafeAreaView style={appStyles.container}>
      {/* Logout top-left */}
      <View style={s.logoutRow}>
        <TouchableOpacity onPress={onLogout} style={appStyles.smallButton}>
          <Text style={appStyles.smallButtonText}>⎋</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Logo + title + username */}
        <View style={s.centerBlock}>
          <Image source={APP_LOGO} style={s.logo} resizeMode="contain" />
          <Text style={[appStyles.title, s.centerText]}>CaseFacilitator</Text>
          <Text style={[appStyles.subtitle, s.centerText]}>{profileLabel}</Text>
        </View>

        {/* Tiles */}
        <View style={s.grid}>
          <MenuTile label="Profile" iconEmoji="👤" onPress={onOpenProfile} />
          <MenuTile label="Cases" iconEmoji="🗂️" onPress={onOpenCases} />
          <MenuTile label="Scan QR kode" iconEmoji="📷" onPress={onOpenScanQr} />
          <MenuTile label="Dokumenter" iconEmoji="📄" onPress={onOpenDocuments} />
          <MenuTile label="History" iconEmoji="📚" onPress={onOpenHistory} />
          <MenuTile label="Settings" iconEmoji="⚙️" onPress={onOpenSettings} />
          <MenuTile label="Contact" iconEmoji="✉️" onPress={onOpenContact} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  logoutRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  content: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingBottom: 24,
    paddingTop: 12,
  },

  centerBlock: {
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 14,
  },

  logo: {
    width: 86,
    height: 86,
    marginBottom: 8,
  },

  centerText: {
    textAlign: "center",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
});

export default MainMenuScreen;
