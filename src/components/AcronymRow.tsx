import { Text, View } from "react-native";
import { styles } from "../styles/indexStyles";

export function AcronymRow<T extends string>({
  title,
  letters,
  state,
}: {
  title?: string;
  letters: T[];
  state: Record<T, boolean>;
}) {
  return (
    <View style={{ marginTop: 8 }}>
      {!!title && <Text style={styles.sectionTitle}>{title}</Text>}

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
        {letters.map((k) => {
          const ok = !!state[k];
          return (
            <View
              key={k}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 10,
                backgroundColor: ok ? "#10b981" : "#ef4444",
              }}
            >
              <Text style={{ color: "black", fontWeight: "800" }}>{k}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
