import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from 'firebase/auth';
import { signOut } from '../../lib/auth';
import { Colors } from '../../constants/Colors';
import { APP_VERSION } from '../../constants/version';

const BETA_DISMISSED_KEY = 'smc_beta_dismissed';

export default function HomeScreen() {
  const [betaDismissed, setBetaDismissed] = useState(true);
  const user = getAuth().currentUser;
  const displayName = user?.displayName || 'Friend';

  useEffect(() => {
    AsyncStorage.getItem(BETA_DISMISSED_KEY).then((val) => {
      setBetaDismissed(val === 'true');
    });
  }, []);

  const dismissBeta = async () => {
    setBetaDismissed(true);
    await AsyncStorage.setItem(BETA_DISMISSED_KEY, 'true');
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      {/* Welcome */}
      <Text style={styles.welcome}>Welcome to ShareMyCrap</Text>
      <Text style={styles.greeting}>Hey, {displayName}!</Text>

      {/* Beta Banner */}
      {!betaDismissed && (
        <View style={styles.betaBanner}>
          <View style={styles.betaHeader}>
            <View style={styles.betaBadge}>
              <Text style={styles.betaBadgeText}>BETA</Text>
            </View>
            <Text style={styles.betaTitle}>Early Access — Free During Beta</Text>
            <Pressable onPress={dismissBeta} hitSlop={12}>
              <Text style={styles.betaClose}>✕</Text>
            </Pressable>
          </View>
          <Text style={styles.betaBody}>
            All premium features are free during beta! Once we officially launch, premium features will require a subscription.
          </Text>
        </View>
      )}

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Items</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Friends</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Groups</Text>
        </View>
      </View>

      {/* Active Borrows */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Borrows</Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No active borrows</Text>
        </View>
      </View>

      {/* Pending Requests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pending Requests</Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No pending requests</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsRow}>
        <Pressable style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}>
          <Text style={styles.actionBtnText}>Add Item</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}>
          <Text style={styles.actionBtnText}>Join Group</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}>
          <Text style={styles.actionBtnText}>Add Friend</Text>
        </Pressable>
      </View>

      {/* Sign Out */}
      <Pressable
        style={({ pressed }) => [styles.signOutButton, pressed && { opacity: 0.7 }]}
        onPress={signOut}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>

      <Text style={styles.version}>v{APP_VERSION}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  welcome: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 16,
    color: Colors.textMuted,
    marginBottom: 20,
  },
  // Beta banner
  betaBanner: {
    backgroundColor: '#FFF3E8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFDDB8',
  },
  betaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  betaBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 10,
  },
  betaBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  betaTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  betaClose: {
    fontSize: 18,
    color: Colors.textMuted,
    paddingLeft: 8,
  },
  betaBody: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 19,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  // Sections
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
  // Sign out
  signOutButton: {
    alignSelf: 'center',
    padding: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  signOutText: {
    color: Colors.danger,
    fontSize: 14,
  },
  version: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.textMuted,
  },
});
