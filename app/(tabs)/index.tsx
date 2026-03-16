import { View, Text, StyleSheet, Pressable } from 'react-native';
import { signOut } from '../../lib/auth';
import { Colors } from '../../constants/Colors';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to ShareMyCrap</Text>
      <Text style={styles.subtitle}>Your dashboard will appear here</Text>
      <Text style={styles.hint}>Add items, join a group, or connect with friends to get started.</Text>
      <Pressable
        style={({ pressed }) => [styles.signOutButton, pressed && { opacity: 0.7 }]}
        onPress={signOut}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.textMuted, marginBottom: 16 },
  hint: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
  signOutButton: { marginTop: 32, padding: 12, paddingHorizontal: 24, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  signOutText: { color: Colors.danger, fontSize: 14 },
});
