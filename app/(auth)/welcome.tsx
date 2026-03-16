import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { APP_VERSION } from '../../constants/version';

/* ─── Data ─────────────────────────────────────────────────────── */

const STEPS = [
  { num: '1', icon: '\u{1F4F8}', title: 'List Your Stuff', desc: 'Snap a photo \u2014 AI fills in the details.' },
  { num: '2', icon: '\u{1F465}', title: 'Share With Your People', desc: 'Groups, friends, or both.' },
  { num: '3', icon: '\u{1F91D}', title: 'Borrow With Accountability', desc: 'Required photos, clear terms, zero drama.' },
];

const FEATURES = [
  { icon: '\u{1F465}', title: 'Groups & Friends', desc: 'Scout packs, church groups, neighborhoods, or just your buddy next door.' },
  { icon: '\u{1F4F7}', title: 'Photo Documentation', desc: 'Required before & after photos on every borrow \u2014 no he-said-she-said.' },
  { icon: '\u{1F512}', title: 'Owner Control', desc: 'Your rules, your terms, your call. Approve or deny every request.' },
  { icon: '\u{1F3AC}', title: 'Video Instructions', desc: 'Link a how-to video so borrowers don\u2019t wing it.' },
  { icon: '\u{2728}', title: 'AI-Powered Listing', desc: 'Take a photo and AI identifies make, model, and estimated value.' },
  { icon: '\u{1F4C5}', title: 'Borrow Calendar', desc: 'See what\u2019s available and when \u2014 blackout dates included.' },
];

const RULES = [
  'Owner\u2019s custom guidelines trump general rules.',
  'Return it in the same condition or better.',
  'If it gets damaged, tell the owner immediately.',
  'Take before and after photos (required).',
  'Know the replacement cost BEFORE you borrow.',
];

/* ─── Main Component ───────────────────────────────────────────── */

export default function WelcomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width > 600;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

      {/* ── HERO ─────────────────────────────────────── */}
      <View style={styles.hero}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>SMC</Text>
        </View>
        <Text style={styles.heroTitle}>
          Stop Buying.{'\n'}Start Borrowing.
        </Text>
        <Text style={styles.heroSub}>
          Share your stuff with friends, neighbors, and groups.{'\n'}Track it all in one place.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.heroCta, pressed && styles.heroCtaPressed]}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.heroCtaLabel}>Get Started &mdash; It&rsquo;s Free</Text>
        </Pressable>

        <Pressable onPress={() => router.push('/(auth)/login')} style={styles.loginRow}>
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginBold}>Log in</Text>
          </Text>
        </Pressable>
      </View>

      {/* ── SOCIAL PROOF BAR ─────────────────────────── */}
      <View style={styles.proofBar}>
        <Text style={styles.proofText}>
          Built for Scout packs, church groups, neighborhoods, and friends who share.
        </Text>
      </View>

      {/* ── HOW IT WORKS ─────────────────────────────── */}
      <View style={styles.sectionLight}>
        <Text style={styles.sectionLabel}>HOW IT WORKS</Text>
        <View style={[styles.stepsRow, isWide && styles.stepsRowWide]}>
          {STEPS.map((s) => (
            <View key={s.num} style={[styles.stepCard, isWide && styles.stepCardWide]}>
              <View style={styles.stepNumBadge}>
                <Text style={styles.stepNum}>{s.num}</Text>
              </View>
              <Text style={styles.stepIcon}>{s.icon}</Text>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepDesc}>{s.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── FEATURES ─────────────────────────────────── */}
      <View style={styles.sectionDark}>
        <Text style={[styles.sectionLabel, { color: '#FFFFFF' }]}>FEATURES</Text>
        <View style={[styles.featGrid, isWide && styles.featGridWide]}>
          {FEATURES.map((f) => (
            <View key={f.title} style={[styles.featCard, isWide && styles.featCardWide]}>
              <Text style={styles.featIcon}>{f.icon}</Text>
              <Text style={styles.featTitle}>{f.title}</Text>
              <Text style={styles.featDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── GROUND RULES ─────────────────────────────── */}
      <View style={styles.sectionLight}>
        <Text style={styles.sectionLabel}>THE GROUND RULES</Text>
        <View style={styles.rulesCard}>
          {RULES.map((r, i) => (
            <View key={i} style={styles.ruleRow}>
              <View style={styles.ruleBullet}>
                <Text style={styles.ruleBulletText}>{i + 1}</Text>
              </View>
              <Text style={styles.ruleText}>{r}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── FINAL CTA ────────────────────────────────── */}
      <View style={styles.finalCta}>
        <Text style={styles.finalTitle}>
          Ready to stop buying stuff{'\n'}you&rsquo;ll use once?
        </Text>
        <Pressable
          style={({ pressed }) => [styles.heroCta, pressed && styles.heroCtaPressed]}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.heroCtaLabel}>Create Your Free Account</Text>
        </Pressable>
      </View>

      {/* ── FOOTER ───────────────────────────────────── */}
      <View style={styles.footer}>
        <Text style={styles.footerLinks}>About &middot; Privacy &middot; Terms &middot; Contact</Text>
        <Text style={styles.footerMade}>Made in Alabama</Text>
        <Text style={styles.footerVersion}>v{APP_VERSION}</Text>
      </View>
    </ScrollView>
  );
}

/* ─── Styles ───────────────────────────────────────────────────── */

const SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.10,
  shadowRadius: 8,
  elevation: 4,
};

const SHADOW_LG = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 6,
};

const styles = StyleSheet.create({
  /* scroll */
  scroll: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 0 },

  /* ── hero ── */
  hero: {
    backgroundColor: Colors.primary,
    paddingTop: 72,
    paddingBottom: 48,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 46,
    marginBottom: 14,
  },
  heroSub: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 25,
    marginBottom: 32,
    maxWidth: 380,
  },
  heroCta: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 50,
    ...SHADOW_LG,
  },
  heroCtaPressed: {
    backgroundColor: '#F0F0F0',
    transform: [{ scale: 0.97 }],
  },
  heroCtaLabel: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  loginRow: { marginTop: 20 },
  loginText: { color: 'rgba(255,255,255,0.80)', fontSize: 15 },
  loginBold: { color: '#FFFFFF', fontWeight: '700', textDecorationLine: 'underline' },

  /* ── social proof bar ── */
  proofBar: {
    backgroundColor: Colors.primaryDark,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  proofText: {
    color: 'rgba(255,255,255,0.90)',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  /* ── sections ── */
  sectionLight: {
    backgroundColor: Colors.background,
    paddingVertical: 48,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  sectionDark: {
    backgroundColor: '#1A1A2E',
    paddingVertical: 48,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 28,
  },

  /* ── steps ── */
  stepsRow: {
    flexDirection: 'column',
    gap: 16,
    width: '100%',
    maxWidth: 800,
    alignItems: 'center',
  },
  stepsRowWide: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  stepCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    ...SHADOW,
  },
  stepCardWide: {
    flex: 1,
    maxWidth: 240,
  },
  stepNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stepNum: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  stepIcon: { fontSize: 40, marginBottom: 12 },
  stepTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  stepDesc: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  /* ── features ── */
  featGrid: {
    flexDirection: 'column',
    gap: 14,
    width: '100%',
    maxWidth: 800,
    alignItems: 'center',
  },
  featGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  featCard: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 22,
    width: '100%',
    maxWidth: 400,
  },
  featCardWide: {
    width: '47%',
    maxWidth: 370,
  },
  featIcon: { fontSize: 32, marginBottom: 10 },
  featTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 20,
  },

  /* ── rules ── */
  rulesCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 28,
    width: '100%',
    maxWidth: 560,
    ...SHADOW,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  ruleBullet: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginTop: 1,
  },
  ruleBulletText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  ruleText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    fontWeight: '500',
  },

  /* ── final CTA ── */
  finalCta: {
    backgroundColor: Colors.primary,
    paddingVertical: 56,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  finalTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 28,
    maxWidth: 400,
  },

  /* ── footer ── */
  footer: {
    backgroundColor: '#111111',
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  footerLinks: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 13,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  footerMade: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    marginBottom: 6,
  },
  footerVersion: {
    color: 'rgba(255,255,255,0.20)',
    fontSize: 11,
  },
});
