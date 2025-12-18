import { Text, TouchableOpacity, View } from "react-native";
import { styles } from "../styles/indexStyles";

export function CounterRow({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={styles.textSmall}>{label}</Text>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => onChange(Math.max(min, value - 1))}
        >
          <Text style={styles.smallButtonText}>−</Text>
        </TouchableOpacity>

        <Text style={[styles.text, { minWidth: 50, textAlign: "center" }]}>{value}</Text>

        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => onChange(Math.min(max, value + 1))}
        >
          <Text style={styles.smallButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default CounterRow;
