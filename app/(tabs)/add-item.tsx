import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../lib/firebase';
import { Colors } from '../../constants/Colors';

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Well-Loved'];

function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

export default function AddItemScreen() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [requireReplacement, setRequireReplacement] = useState(false);
  const [replacementValue, setReplacementValue] = useState('');
  const [careInstructions, setCareInstructions] = useState('');
  const [borrowingAgreement, setBorrowingAgreement] = useState('');
  const [maxBorrowDays, setMaxBorrowDays] = useState('');
  const [pickupInstructions, setPickupInstructions] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [shareWithFriends, setShareWithFriends] = useState(false);
  const [shareWithGroups, setShareWithGroups] = useState(false);

  const handleSave = async () => {
    const user = getAuth().currentUser;
    if (!user) {
      showAlert('Not signed in', 'Please sign in to add items.');
      return;
    }
    if (!title.trim()) {
      showAlert('Missing title', 'Give your item a name.');
      return;
    }
    if (!condition) {
      showAlert('Missing condition', 'Select the condition of your item.');
      return;
    }

    setSaving(true);
    try {
      const itemData = {
        ownerId: user.uid,
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        condition,
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : 0,
        requireReplacement,
        replacementValue: requireReplacement && replacementValue ? parseFloat(replacementValue) : null,
        careInstructions: careInstructions.trim(),
        borrowingAgreement: borrowingAgreement.trim(),
        maxBorrowDays: maxBorrowDays ? parseInt(maxBorrowDays, 10) : null,
        pickupInstructions: pickupInstructions.trim(),
        videoUrl: videoUrl.trim(),
        photos: [],
        tags: [],
        active: true,
        sharedWithGroups: [],
        sharedWithUsers: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'items'), itemData);
      showAlert('Saved', 'Item added to your inventory.');
      router.back();
    } catch (err) {
      console.error('Error saving item:', err);
      showAlert('Error', 'Failed to save item. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Add New Item</Text>

      {/* Title */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="What is it?"
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      {/* Description */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="Brand, model, features, quirks..."
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Category */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Category</Text>
        <TextInput
          style={styles.input}
          value={category}
          onChangeText={setCategory}
          placeholder="e.g., Tools, Kitchen, Outdoor"
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      {/* Condition */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Condition *</Text>
        <View style={styles.conditionRow}>
          {CONDITIONS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.conditionChip, condition === c && styles.conditionChipActive]}
              onPress={() => setCondition(c)}
            >
              <Text style={[styles.conditionChipText, condition === c && styles.conditionChipTextActive]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Estimated Value */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Estimated Value</Text>
        <View style={styles.dollarRow}>
          <Text style={styles.dollarSign}>$</Text>
          <TextInput
            style={[styles.input, styles.dollarInput]}
            value={estimatedValue}
            onChangeText={setEstimatedValue}
            placeholder="0"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Replacement Required Toggle */}
      <View style={styles.replacementCard}>
        <View style={styles.replacementHeader}>
          <View style={styles.replacementLabel}>
            <Text style={styles.replacementTitle}>Replacement Required</Text>
            <Text style={styles.replacementSubtitle}>Require borrower to replace if damaged?</Text>
          </View>
          <Switch
            value={requireReplacement}
            onValueChange={setRequireReplacement}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={requireReplacement ? '#FFFFFF' : '#FFFFFF'}
          />
        </View>
        {requireReplacement && (
          <View style={styles.replacementValueRow}>
            <Text style={styles.replacementValueLabel}>Replacement Value</Text>
            <View style={styles.dollarRow}>
              <Text style={styles.dollarSign}>$</Text>
              <TextInput
                style={[styles.input, styles.dollarInput]}
                value={replacementValue}
                onChangeText={setReplacementValue}
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
              />
            </View>
          </View>
        )}
      </View>

      {/* Care Instructions */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Care Instructions</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={careInstructions}
          onChangeText={setCareInstructions}
          placeholder="How should the borrower handle this item?"
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Borrowing Agreement */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Borrowing Agreement</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={borrowingAgreement}
          onChangeText={setBorrowingAgreement}
          placeholder="Any terms the borrower must agree to?"
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Max Borrow Days */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Max Borrow Days</Text>
        <TextInput
          style={styles.input}
          value={maxBorrowDays}
          onChangeText={setMaxBorrowDays}
          placeholder="e.g., 7"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
        />
      </View>

      {/* Pickup Instructions */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Pickup Instructions</Text>
        <TextInput
          style={styles.input}
          value={pickupInstructions}
          onChangeText={setPickupInstructions}
          placeholder="Where / when can they pick it up?"
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      {/* Video URL */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Video URL</Text>
        <TextInput
          style={styles.input}
          value={videoUrl}
          onChangeText={setVideoUrl}
          placeholder="YouTube or link for instructions / how-to"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="none"
          keyboardType="url"
        />
      </View>

      {/* Share With */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Share With</Text>
        <View style={styles.shareCard}>
          <TouchableOpacity
            style={styles.shareRow}
            onPress={() => setShareWithFriends(!shareWithFriends)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, shareWithFriends && styles.checkboxActive]}>
              {shareWithFriends && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.shareText}>Friends</Text>
          </TouchableOpacity>
          <View style={styles.shareDivider} />
          <TouchableOpacity
            style={styles.shareRow}
            onPress={() => setShareWithGroups(!shareWithGroups)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, shareWithGroups && styles.checkboxActive]}>
              {shareWithGroups && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.shareText}>Groups</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.8}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>Save Item</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
  },
  multiline: {
    minHeight: 80,
    paddingTop: 12,
  },
  // Condition chips
  conditionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  conditionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  conditionChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  conditionChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  conditionChipTextActive: {
    color: '#FFFFFF',
  },
  // Dollar input
  dollarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dollarSign: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textMuted,
    marginRight: 6,
  },
  dollarInput: {
    flex: 1,
  },
  // Replacement card
  replacementCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  replacementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  replacementLabel: {
    flex: 1,
    marginRight: 12,
  },
  replacementTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  replacementSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  replacementValueRow: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  replacementValueLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  // Share section
  shareCard: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  shareDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  shareText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  // Save button
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
});
