import { View, Text, StyleSheet, Pressable } from 'react-native';
import { signOut } from '../../lib/auth';
import { Colors } from '../../constants/Colors';
import { APP_VERSION } from '../../constants/version';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Profile, groups, friends, and more</Text>
      <Pressable
        style={({ pressed }) => [styles.signOutButton, pressed && { opacity: 0.7 }]}
        onPress={signOut}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
      <Text style={styles.version}>v{APP_VERSION}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 8 },
  signOutButton: { marginTop: 32, padding: 12, paddingHorizontal: 24, borderRadius: 8, backgroundColor: Colors.danger },
  signOutText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  version: { color: Colors.border, fontSize: 12, marginTop: 24 },
});
