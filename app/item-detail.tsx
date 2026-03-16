import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../lib/firebase';
import { Colors } from '../constants/Colors';

interface ItemData {
  ownerId: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  estimatedValue: number;
  requireReplacement: boolean;
  replacementValue: number | null;
  careInstructions: string;
  borrowingAgreement: string;
  maxBorrowDays: number | null;
  pickupInstructions: string;
  videoUrl: string;
  photos: string[];
  sharedWithGroups: string[];
  active: boolean;
}

export default function ItemDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<ItemData | null>(null);
  const [groupNames, setGroupNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const currentUid = getAuth().currentUser?.uid;
  const isOwner = item?.ownerId === currentUid;

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'items', id));
        if (!snap.exists()) { setLoading(false); return; }
        const data = snap.data() as ItemData;
        setItem(data);

        // Fetch group names
        if (data.sharedWithGroups?.length) {
          const names: Record<string, string> = {};
          await Promise.all(
            data.sharedWithGroups.map(async (gid) => {
              const gSnap = await getDoc(doc(db, 'groups', gid));
              if (gSnap.exists()) names[gid] = (gSnap.data() as any).name || 'Unknown';
            }),
          );
          setGroupNames(names);
        }
      } catch (err) {
        console.error('Error loading item:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Item not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const shared = item.sharedWithGroups?.length > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.headerBack}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{item.title}</Text>
        {isOwner && (
          <TouchableOpacity hitSlop={12}>
            <Text style={styles.headerEdit}>Edit</Text>
          </TouchableOpacity>
        )}
        {!isOwner && <View style={{ width: 40 }} />}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Photo placeholder */}
        <View style={styles.photoBox}>
          <Text style={styles.photoIcon}>📷</Text>
          <Text style={styles.photoLabel}>No Photos Yet</Text>
        </View>
        <TouchableOpacity style={styles.addPhotoBtn} activeOpacity={0.7}>
          <Text style={styles.addPhotoBtnText}>Add Photos</Text>
        </TouchableOpacity>

        {/* Details Card */}
        <View style={styles.card}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <View style={styles.badgeRow}>
            {!!item.category && (
              <View style={styles.badgeOrange}>
                <Text style={styles.badgeOrangeText}>{item.category}</Text>
              </View>
            )}
            {!!item.condition && (
              <View style={styles.badgeGray}>
                <Text style={styles.badgeGrayText}>{item.condition}</Text>
              </View>
            )}
          </View>
          {item.estimatedValue > 0 && (
            <Text style={styles.value}>Estimated Value: ${item.estimatedValue}</Text>
          )}
          {!!item.description && <Text style={styles.description}>{item.description}</Text>}
        </View>

        {/* Sharing Status Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>SHARING</Text>
          <Text style={styles.fieldValue}>{shared ? 'Shared' : 'Private'}</Text>
          {shared && Object.entries(groupNames).map(([gid, name]) => (
            <View key={gid} style={styles.groupRow}>
              <Text style={styles.groupDot}>●</Text>
              <Text style={styles.groupName}>{name}</Text>
            </View>
          ))}
          {isOwner && (
            <TouchableOpacity style={styles.linkBtn} activeOpacity={0.7}>
              <Text style={styles.linkBtnText}>Share to more groups</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Owner Rules Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>BORROWING RULES</Text>
          <View style={styles.ruleRow}>
            <Text style={styles.ruleLabel}>Replacement required</Text>
            <Text style={styles.ruleValue}>
              {item.requireReplacement ? `Yes${item.replacementValue ? ` ($${item.replacementValue})` : ''}` : 'No'}
            </Text>
          </View>
          {item.maxBorrowDays != null && (
            <View style={styles.ruleRow}>
              <Text style={styles.ruleLabel}>Max borrow days</Text>
              <Text style={styles.ruleValue}>{item.maxBorrowDays}</Text>
            </View>
          )}
          {!!item.careInstructions && (
            <View style={styles.ruleBlock}>
              <Text style={styles.ruleLabel}>Care instructions</Text>
              <Text style={styles.ruleText}>{item.careInstructions}</Text>
            </View>
          )}
          {!!item.borrowingAgreement && (
            <View style={styles.ruleBlock}>
              <Text style={styles.ruleLabel}>Borrowing agreement</Text>
              <Text style={styles.ruleText}>{item.borrowingAgreement}</Text>
            </View>
          )}
          {!!item.pickupInstructions && (
            <View style={styles.ruleBlock}>
              <Text style={styles.ruleLabel}>Pickup instructions</Text>
              <Text style={styles.ruleText}>{item.pickupInstructions}</Text>
            </View>
          )}
          {!!item.videoUrl && (
            <TouchableOpacity onPress={() => Linking.openURL(item.videoUrl)} style={styles.ruleBlock}>
              <Text style={styles.ruleLabel}>Video / How-to</Text>
              <Text style={[styles.ruleText, styles.linkText]}>{item.videoUrl}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        {isOwner ? (
          <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>Edit Item</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>Request to Borrow</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  emptyText: { fontSize: 16, color: Colors.textMuted, marginBottom: 16 },
  backBtn: { paddingVertical: 10, paddingHorizontal: 20 },
  backBtnText: { color: Colors.primary, fontSize: 16, fontWeight: '700' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerBack: { color: Colors.primary, fontSize: 16, fontWeight: '700' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: Colors.text, marginHorizontal: 8 },
  headerEdit: { color: Colors.primary, fontSize: 16, fontWeight: '700' },

  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  // Photo
  photoBox: {
    height: 200, backgroundColor: Colors.border, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  photoIcon: { fontSize: 48 },
  photoLabel: { fontSize: 14, color: Colors.textMuted, marginTop: 8 },
  addPhotoBtn: {
    alignSelf: 'center', marginTop: 10, marginBottom: 16,
    paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.primary,
  },
  addPhotoBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '700' },

  // Card
  card: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: Colors.border,
  },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1, marginBottom: 10 },
  itemTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  badgeOrange: { backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4 },
  badgeOrangeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  badgeGray: { backgroundColor: Colors.border, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4 },
  badgeGrayText: { color: Colors.text, fontSize: 13, fontWeight: '600' },
  value: { fontSize: 15, fontWeight: '700', color: Colors.primary, marginBottom: 8 },
  description: { fontSize: 15, color: Colors.text, lineHeight: 22 },

  // Sharing
  fieldValue: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  groupRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  groupDot: { color: Colors.primary, fontSize: 10, marginRight: 8 },
  groupName: { fontSize: 14, color: Colors.text },
  linkBtn: { marginTop: 10 },
  linkBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '700' },

  // Rules
  ruleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  ruleLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  ruleValue: { fontSize: 14, color: Colors.textMuted },
  ruleBlock: { marginBottom: 12 },
  ruleText: { fontSize: 14, color: Colors.textMuted, marginTop: 2, lineHeight: 20 },
  linkText: { color: Colors.primary, textDecorationLine: 'underline' },

  // Action button
  primaryBtn: {
    backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 8,
    shadowColor: Colors.primaryDark, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
});
