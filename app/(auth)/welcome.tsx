import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { APP_VERSION } from '../../constants/version';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Stop Buying.{'\n'}Start Borrowing.</Text>
        <Text style={styles.heroSubtitle}>
          Share your stuff with friends, neighbors, and groups. Track it all.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaPressed]}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.ctaText}>Get Started</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginLink}>Already have an account? Log in</Text>
        </Pressable>
      </View>

      {/* How It Works */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.stepsRow}>
          <StepCard icon="📸" title="List Your Stuff" desc="Snap a photo — AI fills in the details" />
          <StepCard icon="👥" title="Share With Your People" desc="Groups, friends, or both" />
          <StepCard icon="🤝" title="Borrow With Accountability" desc="Required photos, clear terms" />
        </View>
      </View>

      {/* Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why ShareMyCrap?</Text>
        <FeatureRow icon="👥" title="Groups & Friends" desc="Scout packs, church groups, or just your neighbor" />
        <FeatureRow icon="📷" title="Photo Documentation" desc="Required before/after photos — no disputes" />
        <FeatureRow icon="🔒" title="Owner Control" desc="Your rules, your terms, your call" />
        <FeatureRow icon="🎥" title="Video Instructions" desc="Link tutorials for your items" />
        <FeatureRow icon="📅" title="Borrow Calendar" desc="See what's available and when" />
      </View>

      {/* Rules */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rules of Borrowing</Text>
        <Text style={styles.rule}>1. Owner's custom guidelines trump general rules.</Text>
        <Text style={styles.rule}>2. Return it in the same condition or better.</Text>
        <Text style={styles.rule}>3. If it gets damaged, tell the owner immediately.</Text>
        <Text style={styles.rule}>4. Take before and after photos (required).</Text>
        <Text style={styles.rule}>5. Know the replacement cost BEFORE you borrow.</Text>
      </View>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaPressed]}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.ctaText}>Get Started</Text>
        </Pressable>
        <Text style={styles.footerLinks}>
          About  •  Privacy  •  Terms  •  Contact
        </Text>
        <Text style={styles.footerTagline}>Made in Alabama 🏠</Text>
        <Text style={styles.versionText}>v{APP_VERSION}</Text>
      </View>
    </ScrollView>
  );
}

function StepCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <View style={styles.stepCard}>
      <Text style={styles.stepIcon}>{icon}</Text>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDesc}>{desc}</Text>
    </View>
  );
}

function FeatureRow({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },
  hero: { alignItems: 'center', paddingTop: 80, paddingBottom: 40, paddingHorizontal: 24, backgroundColor: Colors.card },
  heroTitle: { fontSize: 36, fontWeight: '800', color: Colors.text, textAlign: 'center', lineHeight: 44 },
  heroSubtitle: { fontSize: 18, color: Colors.textMuted, textAlign: 'center', marginTop: 16, marginBottom: 32, lineHeight: 26 },
  ctaButton: { backgroundColor: Colors.primary, paddingVertical: 16, paddingHorizontal: 48, borderRadius: 12 },
  ctaPressed: { backgroundColor: Colors.primaryDark },
  ctaText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  loginLink: { color: Colors.primary, fontSize: 16, marginTop: 16 },
  section: { padding: 24 },
  sectionTitle: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 20 },
  stepsRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' },
  stepCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 20, alignItems: 'center', flex: 1, minWidth: 140, maxWidth: 200 },
  stepIcon: { fontSize: 36, marginBottom: 8 },
  stepTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  stepDesc: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 4 },
  featureRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, padding: 16, marginBottom: 12 },
  featureIcon: { fontSize: 28, marginRight: 16 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  featureDesc: { fontSize: 14, color: Colors.textMuted, marginTop: 2 },
  rule: { fontSize: 15, color: Colors.text, marginBottom: 8, lineHeight: 22 },
  footer: { alignItems: 'center', padding: 24, paddingBottom: 40 },
  footerLinks: { color: Colors.textMuted, fontSize: 14, marginTop: 20 },
  footerTagline: { color: Colors.textMuted, fontSize: 14, marginTop: 8 },
  versionText: { color: Colors.border, fontSize: 12, marginTop: 8 },
});
