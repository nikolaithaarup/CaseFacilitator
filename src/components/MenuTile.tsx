import { Pressable, StyleSheet, Text, View } from "react-native";

export function MenuTile({
  label,
  iconEmoji,
  onPress,
}: {
  label: string;
  iconEmoji: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={s.tile}>
      <View style={s.iconBox}>
        <Text style={s.iconText}>{iconEmoji}</Text>
      </View>
      <Text style={s.label}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  tile: {
    width: "33.3333%",
    padding: 10,
    alignItems: "center",
  },
  iconBox: {
    width: 78,
    height: 78,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 34,
  },
  label: {
    marginTop: 8,
    fontSize: 14,
    color: "#e9ecef",
    textAlign: "center",
  },
});

export default MenuTile;
