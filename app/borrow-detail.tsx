import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../lib/firebase';
import { Colors } from '../constants/Colors';
import {
  BorrowDoc,
  BorrowStatus,
  STATUS_COLORS,
  STATUS_LABELS,
  getBorrowById,
  updateBorrowStatus,
} from '../lib/borrows';

const confirm = (msg: string): boolean => {
  if (Platform.OS === 'web') return window.confirm(msg);
  // On native, caller should use Alert.alert with callbacks instead
  return true;
};

const TIMELINE_STEPS: { key: BorrowStatus; label: string }[] = [
  { key: 'pending', label: 'Requested' },
  { key: 'approved', label: 'Approved' },
  { key: 'active', label: 'Picked Up' },
  { key: 'returned', label: 'Returned' },
];

function getStepIndex(status: BorrowStatus): number {
  if (status === 'declined') return -1;
  return TIMELINE_STEPS.findIndex((s) => s.key === status);
}

export default function BorrowDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [borrow, setBorrow] = useState<BorrowDoc | null>(null);
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const user = getAuth().currentUser;
  const isOwner = user?.uid === borrow?.ownerId;
  const isBorrower = user?.uid === borrow?.borrowerId;

  useEffect(() => {
    async function load() {
      try {
        if (!id) return;
        const b = await getBorrowById(id);
        if (b) {
          setBorrow(b);
          const itemSnap = await getDoc(doc(db, 'items', b.itemId));
          if (itemSnap.exists()) setItem({ id: itemSnap.id, ...itemSnap.data() });
        }
      } catch (err) {
        console.error('Error loading borrow detail:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleAction = async (newStatus: BorrowStatus, label: string) => {
    if (!borrow || !user || !id) return;
    if (Platform.OS === 'web') {
      if (!window.confirm(`${label} this borrow request?`)) return;
    }
    setActing(true);
    try {
      await updateBorrowStatus(id, newStatus, user.uid);
      setBorrow((prev) => prev ? { ...prev, status: newStatus } : prev);
    } catch (err) {
      console.error('Error updating status:', err);
      if (Platform.OS === 'web') window.alert('Failed to update. Try again.');
      else Alert.alert('Error', 'Failed to update. Try again.');
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!borrow) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Borrow request not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStep = getStepIndex(borrow.status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[borrow.status] + '20' }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLORS[borrow.status] }]}>
            {STATUS_LABELS[borrow.status]}
          </Text>
        </View>
      </View>

      {/* Item Card */}
      <View style={styles.card}>
        <View style={styles.photoPlaceholder}>
          <Text style={styles.photoIcon}>📷</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item?.title || 'Unknown Item'}</Text>
          <Text style={styles.cardCategory}>{item?.category || 'No category'}</Text>
        </View>
      </View>

      {/* Status Timeline */}
      {borrow.status !== 'declined' ? (
        <View style={styles.timeline}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.timelineRow}>
            {TIMELINE_STEPS.map((step, i) => {
              const isComplete = i <= currentStep;
              const isCurrent = i === currentStep;
              const dotColor = isCurrent
                ? Colors.primary
                : isComplete
                ? Colors.success
                : Colors.border;
              return (
                <View key={step.key} style={styles.timelineStep}>
                  <View style={[styles.dot, { backgroundColor: dotColor }]}>
                    {isComplete && <Text style={styles.dotCheck}>✓</Text>}
                  </View>
                  <Text style={[
                    styles.stepLabel,
                    isCurrent && styles.stepLabelCurrent,
                    !isComplete && styles.stepLabelFuture,
                  ]}>
                    {step.label}
                  </Text>
                  {i < TIMELINE_STEPS.length - 1 && (
                    <View style={[styles.connector, isComplete && styles.connectorDone]} />
                  )}
                </View>
              );
            })}
          </View>
        </View>
      ) : (
        <View style={styles.declinedBox}>
          <Text style={styles.declinedText}>This request was declined.</Text>
        </View>
      )}

      {/* People */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>People</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Borrower</Text>
          <Text style={styles.infoValue}>{borrow.borrowerName}{isBorrower ? ' (you)' : ''}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Owner</Text>
          <Text style={styles.infoValue}>{item?.ownerName || borrow.ownerId}{isOwner ? ' (you)' : ''}</Text>
        </View>
      </View>

      {/* Request Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Start</Text>
          <Text style={styles.infoValue}>{borrow.requestedStart}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Return by</Text>
          <Text style={styles.infoValue}>{borrow.requestedEnd}</Text>
        </View>
        {borrow.message ? (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>"{borrow.message}"</Text>
          </View>
        ) : null}
      </View>

      {/* Photo Placeholders */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Condition Photos</Text>
        <Text style={styles.photoNote}>
          📸 Photos required on pickup and return (coming soon)
        </Text>
      </View>

      {/* Action Buttons */}
      {!acting && renderActions(borrow.status, isOwner, isBorrower, handleAction)}

      {acting && (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
      )}
    </ScrollView>
  );
}

function renderActions(
  status: BorrowStatus,
  isOwner: boolean,
  isBorrower: boolean,
  onAction: (s: BorrowStatus, l: string) => void
) {
  const buttons: JSX.Element[] = [];

  if (status === 'pending' && isOwner) {
    buttons.push(
      <TouchableOpacity key="approve" style={styles.actionBtn} onPress={() => onAction('approved', 'Approve')}>
        <Text style={styles.actionText}>✅ Approve</Text>
      </TouchableOpacity>,
      <TouchableOpacity key="decline" style={[styles.actionBtn, styles.actionDanger]} onPress={() => onAction('declined', 'Decline')}>
        <Text style={[styles.actionText, styles.actionDangerText]}>❌ Decline</Text>
      </TouchableOpacity>
    );
  }

  if (status === 'approved' && isOwner) {
    buttons.push(
      <TouchableOpacity key="pickup" style={styles.actionBtn} onPress={() => onAction('active', 'Mark Picked Up')}>
        <Text style={styles.actionText}>📦 Mark Picked Up</Text>
      </TouchableOpacity>
    );
  }

  if (status === 'active' && isBorrower) {
    buttons.push(
      <TouchableOpacity key="return" style={styles.actionBtn} onPress={() => onAction('return_pending', 'Mark Returned')}>
        <Text style={styles.actionText}>↩️ Mark Returned</Text>
      </TouchableOpacity>
    );
  }

  if (status === 'return_pending' && isOwner) {
    buttons.push(
      <TouchableOpacity key="confirm" style={styles.actionBtn} onPress={() => onAction('returned', 'Confirm Return')}>
        <Text style={styles.actionText}>✅ Confirm Return</Text>
      </TouchableOpacity>
    );
  }

  if (buttons.length === 0) return null;
  return <View style={styles.actions}>{buttons}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },
  centered: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background,
  },
  errorText: { fontSize: 16, color: Colors.textMuted, marginBottom: 12 },
  backLink: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  backText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 13, fontWeight: '700' },
  card: {
    flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 12,
    marginHorizontal: 16, padding: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  photoPlaceholder: {
    width: 72, height: 72, borderRadius: 10, backgroundColor: Colors.inputBg,
    justifyContent: 'center', alignItems: 'center',
  },
  photoIcon: { fontSize: 28 },
  cardContent: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  cardCategory: { fontSize: 13, color: Colors.textMuted },
  // Timeline
  timeline: {
    backgroundColor: Colors.card, borderRadius: 12, marginHorizontal: 16,
    marginTop: 16, padding: 16,
  },
  timelineRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  timelineStep: { alignItems: 'center', flex: 1, position: 'relative' },
  dot: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  dotCheck: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  stepLabel: { fontSize: 11, color: Colors.text, fontWeight: '600', marginTop: 6, textAlign: 'center' },
  stepLabelCurrent: { color: Colors.primary, fontWeight: '800' },
  stepLabelFuture: { color: Colors.border },
  connector: {
    position: 'absolute', top: 13, left: '60%', right: '-40%',
    height: 2, backgroundColor: Colors.border,
  },
  connectorDone: { backgroundColor: Colors.success },
  declinedBox: {
    backgroundColor: '#FDECEA', borderRadius: 12, marginHorizontal: 16,
    marginTop: 16, padding: 16, alignItems: 'center',
  },
  declinedText: { fontSize: 15, color: Colors.danger, fontWeight: '700' },
  // Sections
  section: {
    backgroundColor: Colors.card, borderRadius: 12, marginHorizontal: 16,
    marginTop: 16, padding: 16,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6,
  },
  infoLabel: { fontSize: 14, color: Colors.textMuted },
  infoValue: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  messageBox: {
    backgroundColor: Colors.inputBg, borderRadius: 8, padding: 12, marginTop: 8,
  },
  messageText: { fontSize: 14, color: Colors.text, fontStyle: 'italic', lineHeight: 20 },
  photoNote: {
    fontSize: 13, color: Colors.textMuted, fontStyle: 'italic', textAlign: 'center',
    paddingVertical: 16,
  },
  // Actions
  actions: { marginHorizontal: 16, marginTop: 20, gap: 12 },
  actionBtn: {
    backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12,
    alignItems: 'center',
  },
  actionText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  actionDanger: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: Colors.danger },
  actionDangerText: { color: Colors.danger },
});
