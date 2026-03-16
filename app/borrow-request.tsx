import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
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
import { createBorrowRequest } from '../lib/borrows';

const showAlert = (title: string, msg: string, onOk?: () => void) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${msg}`);
    onOk?.();
  } else {
    Alert.alert(title, msg, [{ text: 'OK', onPress: onOk }]);
  }
};

export default function BorrowRequestScreen() {
  const router = useRouter();
  const { itemId, ownerId } = useLocalSearchParams<{ itemId: string; ownerId: string }>();

  const [item, setItem] = useState<any>(null);
  const [ownerName, setOwnerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      try {
        if (itemId) {
          const itemSnap = await getDoc(doc(db, 'items', itemId));
          if (itemSnap.exists()) setItem({ id: itemSnap.id, ...itemSnap.data() });
        }
        if (ownerId) {
          const userSnap = await getDoc(doc(db, 'users', ownerId));
          if (userSnap.exists()) setOwnerName(userSnap.data().displayName || 'Unknown');
        }
      } catch (err) {
        console.error('Error loading borrow request data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [itemId, ownerId]);

  const handleSubmit = async () => {
    const user = getAuth().currentUser;
    if (!user || !itemId || !ownerId) return;
    if (!startDate.trim() || !endDate.trim()) {
      showAlert('Missing dates', 'Please enter both start and return dates.');
      return;
    }
    setSubmitting(true);
    try {
      await createBorrowRequest({
        itemId,
        ownerId,
        borrowerId: user.uid,
        borrowerName: user.displayName || 'Anonymous',
        requestedStart: startDate.trim(),
        requestedEnd: endDate.trim(),
        message: message.trim(),
      });
      setSuccess(true);
      setTimeout(() => router.back(), 2000);
    } catch (err) {
      console.error('Error creating borrow request:', err);
      showAlert('Error', 'Failed to send request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (success) {
    return (
      <View style={styles.centered}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>Request Sent!</Text>
        <Text style={styles.successSub}>The owner will be notified. Redirecting...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request to Borrow</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Item Summary */}
      <View style={styles.card}>
        <View style={styles.photoPlaceholder}>
          <Text style={styles.photoIcon}>📷</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item?.title || 'Unknown Item'}</Text>
          <Text style={styles.cardCategory}>{item?.category || 'No category'}</Text>
          <Text style={styles.ownerText}>Owned by {ownerName}</Text>
        </View>
      </View>

      {/* Owner Rules */}
      {item && (item.maxBorrowDays || item.replacementRequired || item.careInstructions) && (
        <View style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>📋 Owner's Rules</Text>
          {item.maxBorrowDays && (
            <Text style={styles.ruleText}>Max borrow: {item.maxBorrowDays} days</Text>
          )}
          {item.replacementRequired && (
            <Text style={styles.ruleText}>⚠️ Replacement required if damaged</Text>
          )}
          {item.careInstructions && (
            <Text style={styles.ruleText}>{item.careInstructions}</Text>
          )}
        </View>
      )}

      {/* Form */}
      <Text style={styles.label}>When do you need it?</Text>
      <TextInput
        style={styles.input}
        value={startDate}
        onChangeText={setStartDate}
        placeholder="e.g., March 20"
        placeholderTextColor={Colors.textMuted}
      />

      <Text style={styles.label}>Return by</Text>
      <TextInput
        style={styles.input}
        value={endDate}
        onChangeText={setEndDate}
        placeholder="e.g., March 25"
        placeholderTextColor={Colors.textMuted}
      />

      <Text style={styles.label}>Message to owner (optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={message}
        onChangeText={setMessage}
        placeholder="Why do you need it? Any special care plans?"
        placeholderTextColor={Colors.textMuted}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
        activeOpacity={0.8}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.submitText}>Send Request</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },
  centered: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  backText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
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
  cardCategory: { fontSize: 13, color: Colors.textMuted, marginBottom: 4 },
  ownerText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  rulesCard: {
    backgroundColor: Colors.card, borderRadius: 12, marginHorizontal: 16, marginTop: 12,
    padding: 14, borderLeftWidth: 3, borderLeftColor: Colors.warning,
  },
  rulesTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  ruleText: { fontSize: 13, color: Colors.textMuted, marginBottom: 4, lineHeight: 18 },
  label: {
    fontSize: 14, fontWeight: '700', color: Colors.text,
    marginHorizontal: 16, marginTop: 20, marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.card, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    marginHorizontal: 16, fontSize: 15, color: Colors.text, borderWidth: 1, borderColor: Colors.border,
  },
  textArea: { minHeight: 100, paddingTop: 12 },
  submitButton: {
    backgroundColor: Colors.primary, marginHorizontal: 16, marginTop: 28,
    paddingVertical: 16, borderRadius: 12, alignItems: 'center',
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  successIcon: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  successSub: { fontSize: 15, color: Colors.textMuted },
});
