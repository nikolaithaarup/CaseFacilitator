// components/Header.tsx
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { styles } from "../src/styles/indexStyles";

type HeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onHome?: () => void;
};

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBack,
  onHome,
}) => {
  return (
    <View style={styles.headerRow}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.smallButton}>
          <Text style={styles.smallButtonText}>←</Text>
        </TouchableOpacity>
      ) : (
        // keep layout aligned when no back button
        <View style={styles.smallButton} />
      )}

      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {onHome ? (
        <TouchableOpacity onPress={onHome} style={styles.smallButton}>
          <Text style={styles.smallButtonText}>⌂</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.smallButton} />
      )}
    </View>
  );
};

export default Header;