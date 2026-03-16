import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function MyStuffScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Stuff</Text>
      <Text style={styles.subtitle}>Your inventory will appear here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 8 },
});
