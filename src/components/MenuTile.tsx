import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

export function MenuTile({
  label,
  iconEmoji,
  onPress,
}: {
  label: string;
  iconEmoji: string;
  onPress: () => void;
}) {
  const { width } = useWindowDimensions();
  const columns = width >= 1000 ? 4 : width >= 620 ? 3 : 2;

  return (
    <View style={{ width: `${100 / columns}%`, padding: 8 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => [s.tile, pressed && s.pressed]}
      >
        <View style={s.iconBox}>
          <Text style={s.iconText}>{iconEmoji}</Text>
        </View>
        <Text style={s.label}>{label}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  tile: {
    minHeight: 132,
    padding: 14,
    borderRadius: 20,
    backgroundColor: "#0d2230",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
  focused: { borderWidth: 3, borderColor: "#45d5c3" },
  iconBox: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: "rgba(69,213,195,0.10)",
    borderWidth: 1,
    borderColor: "rgba(69,213,195,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { fontSize: 30 },
  label: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "800",
    color: "#eaf3f6",
    textAlign: "center",
  },
});

export default MenuTile;
