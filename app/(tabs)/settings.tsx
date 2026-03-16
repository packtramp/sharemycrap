import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from '../../lib/auth';
import { Colors } from '../../constants/Colors';
import { APP_VERSION } from '../../constants/version';

// ── Declarative settings list ──────────────────────────────────────────

type SettingsItem = {
  icon: string;
  label: string;
  detail?: string;
  route?: string;
  action?: () => void;
  danger?: boolean;
  premium?: boolean;
};

type SettingsSection = {
  title: string;
  items: SettingsItem[];
};

const SECTIONS: SettingsSection[] = [
  {
    title: 'ACCOUNT',
    items: [
      { icon: '👤', label: 'Profile', detail: 'Name, photo, phone', route: '/settings/profile' },
      { icon: '👥', label: 'My Groups', route: '/settings/groups' },
      { icon: '🤝', label: 'My Friends', route: '/friends' },
    ],
  },
  {
    title: 'SHARING',
    items: [
      { icon: '🔔', label: 'Notification Preferences', route: '/settings/notifications' },
      { icon: '📋', label: 'Default Borrowing Rules', detail: '5 rules', route: '/settings/rules' },
    ],
  },
  {
    title: 'PREMIUM',
    items: [
      { icon: '⭐', label: 'Pro & Credits', detail: 'Free plan', route: '/settings/premium', premium: true },
    ],
  },
  {
    title: 'INFO',
    items: [
      { icon: 'ℹ️', label: 'About', detail: `v${APP_VERSION}` },
      { icon: '📄', label: 'Legal', detail: 'TOS, Privacy', route: '/settings/legal' },
      { icon: '💬', label: 'Send Feedback', detail: 'Bug or feature', route: '/feedback' },
      { icon: '🗑️', label: 'Delete Account', danger: true },
    ],
  },
];

// ── Platform-safe confirm dialog ───────────────────────────────────────

function confirmDialog(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', style: 'destructive', onPress: onConfirm },
    ]);
  }
}

// ── Component ──────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter();

  function handlePress(item: SettingsItem) {
    // Delete Account — confirm first
    if (item.label === 'Delete Account') {
      confirmDialog(
        'Delete Account',
        'This will permanently delete your account, items, and all associated data. This cannot be undone.',
        () => router.push('/settings/delete-account' as any),
      );
      return;
    }

    if (item.action) {
      item.action();
    } else if (item.route) {
      router.push(item.route as any);
    }
  }

  function handleSignOut() {
    confirmDialog('Sign Out', 'Are you sure you want to sign out?', () => {
      signOut();
    });
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.card}>
            {section.items.map((item, idx) => {
              const isLast = idx === section.items.length - 1;
              const hasNav = !!item.route || item.label === 'Delete Account';

              return (
                <Pressable
                  key={item.label}
                  style={({ pressed }) => [
                    styles.row,
                    !isLast && styles.rowBorder,
                    pressed && styles.rowPressed,
                  ]}
                  onPress={() => handlePress(item)}
                  disabled={!hasNav && !item.action}
                >
                  <Text style={styles.icon}>{item.icon}</Text>
                  <Text
                    style={[
                      styles.label,
                      item.danger && styles.labelDanger,
                      item.premium && styles.labelPremium,
                    ]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                  <View style={styles.rowRight}>
                    {item.detail ? (
                      <Text
                        style={[styles.detail, item.premium && styles.detailPremium]}
                        numberOfLines={1}
                      >
                        {item.detail}
                      </Text>
                    ) : null}
                    {hasNav ? <Text style={styles.chevron}>›</Text> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      {/* Sign Out */}
      <Pressable
        style={({ pressed }) => [styles.signOutButton, pressed && { opacity: 0.7 }]}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>

      <Text style={styles.versionFooter}>ShareMyCrap v{APP_VERSION}</Text>
    </ScrollView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 48,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
    marginLeft: 4,
  },

  // Card (white container per section)
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  rowPressed: {
    backgroundColor: '#F0F0F0',
  },

  // Icon
  icon: {
    fontSize: 20,
    width: 32,
    textAlign: 'center',
  },

  // Label
  label: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    marginLeft: 8,
  },
  labelDanger: {
    color: Colors.danger,
  },
  labelPremium: {
    color: Colors.text,
  },

  // Right side (detail + chevron)
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detail: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  detailPremium: {
    color: Colors.premium,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 18,
    color: Colors.textMuted,
    fontWeight: '600',
  },

  // Sign Out
  signOutButton: {
    alignSelf: 'center',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    backgroundColor: Colors.danger,
    marginTop: 8,
  },
  signOutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Version footer
  versionFooter: {
    textAlign: 'center',
    color: Colors.border,
    fontSize: 12,
    marginTop: 16,
  },
});
