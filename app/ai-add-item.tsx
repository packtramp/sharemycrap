import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../lib/firebase';
import { Colors } from '../constants/Colors';

const CATEGORIES = [
  'Electronics', 'Tools', 'Sports & Outdoors', 'Camping & Hiking', 'Kitchen',
  'Garden & Yard', 'Games & Toys', 'Books & Media', 'Musical Instruments',
  'Photography', 'Automotive', 'Home Improvement', 'Party & Events',
  'Baby & Kids', 'Fitness', 'Crafts & Hobbies', 'Clothing & Accessories',
  'Furniture', 'Seasonal', 'Other',
];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Well-Loved'];

function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

export default function AIAddItemScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode: 'photo' | 'text' }>();

  // Input state
  const [textDescription, setTextDescription] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreviewUri, setImagePreviewUri] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // AI state
  const [analyzing, setAnalyzing] = useState(false);
  const [aiDone, setAiDone] = useState(false);

  // Form state (filled by AI, editable by user)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [careInstructions, setCareInstructions] = useState('');
  const [saving, setSaving] = useState(false);

  const isPhoto = mode === 'photo';

  const handleFileSelect = (e: any) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Split off "data:image/...;base64," prefix
      const base64 = result.split(',')[1];
      setImageBase64(base64);
      setImagePreviewUri(result);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (isPhoto && !imageBase64) {
      showAlert('No photo', 'Select a photo first.');
      return;
    }
    if (!isPhoto && !textDescription.trim()) {
      showAlert('No description', 'Describe your item first.');
      return;
    }

    setAnalyzing(true);
    try {
      const body = isPhoto
        ? { mode: 'photo', image: imageBase64 }
        : { mode: 'text', description: textDescription.trim() };

      const res = await fetch('/api/analyze-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Analysis failed');
      }

      const data = await res.json();
      setTitle(data.title || '');
      setDescription(data.description || '');
      setCategory(data.category || '');
      setCondition(data.condition || '');
      setEstimatedValue(data.estimatedValue ? String(data.estimatedValue) : '');
      setCareInstructions(data.careInstructions || '');
      setAiDone(true);
    } catch (err: any) {
      showAlert('Analysis Failed', err.message || 'Something went wrong. Try again.');
    } finally {
      setAnalyzing(false);
    }
  };

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
      await addDoc(collection(db, 'items'), {
        ownerId: user.uid,
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        condition,
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : 0,
        requireReplacement: false,
        replacementValue: null,
        careInstructions: careInstructions.trim(),
        borrowingAgreement: '',
        maxBorrowDays: null,
        pickupInstructions: '',
        videoUrl: '',
        photos: [],
        tags: [],
        active: false,
        sharedWithGroups: [],
        sharedWithUsers: [],
        aiGenerated: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      showAlert('Saved', 'Item added to your inventory.');
      router.back();
    } catch (err) {
      console.error('Error saving item:', err);
      showAlert('Error', 'Failed to save item. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setAiDone(false);
    setTitle('');
    setDescription('');
    setCategory('');
    setCondition('');
    setEstimatedValue('');
    setCareInstructions('');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.pageTitle}>{isPhoto ? '📸 AI Photo Scan' : '🤖 AI Description'}</Text>

      {/* Input Section (before AI runs) */}
      {!aiDone && !analyzing && (
        <>
          {isPhoto ? (
            <View style={styles.inputSection}>
              {imagePreviewUri ? (
                <View style={styles.previewContainer}>
                  {Platform.OS === 'web' ? (
                    <img
                      src={imagePreviewUri}
                      alt="Preview"
                      style={{ width: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 12 }}
                    />
                  ) : (
                    <View style={styles.previewPlaceholder}>
                      <Text style={styles.previewPlaceholderText}>Photo selected</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.changePhotoButton} onPress={() => fileInputRef.current?.click()}>
                    <Text style={styles.changePhotoText}>Change photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoArea}>
                  <Text style={styles.photoAreaIcon}>📸</Text>
                  <Text style={styles.photoAreaText}>Take or choose a photo of your item</Text>
                </View>
              )}

              {Platform.OS === 'web' && (
                <>
                  {/* Hidden file input for web */}
                  <input
                    ref={fileInputRef as any}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={styles.photoButton}
                      onPress={() => fileInputRef.current?.click()}
                    >
                      <Text style={styles.photoButtonText}>Choose Photo</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {Platform.OS !== 'web' && (
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={[styles.photoButton, styles.photoButtonDisabled]}>
                    <Text style={styles.photoButtonTextDisabled}>Camera — coming soon on mobile</Text>
                  </TouchableOpacity>
                </View>
              )}

              {imageBase64 && (
                <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyze}>
                  <Text style={styles.analyzeButtonText}>Analyze</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.inputSection}>
              <TextInput
                style={[styles.input, styles.descriptionInput]}
                value={textDescription}
                onChangeText={setTextDescription}
                placeholder='Describe your item... e.g. "Garmin GPSMAP 67i handheld GPS"'
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.analyzeButton, !textDescription.trim() && styles.analyzeButtonDisabled]}
                onPress={handleAnalyze}
                disabled={!textDescription.trim()}
              >
                <Text style={styles.analyzeButtonText}>Describe</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* Loading State */}
      {analyzing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>
            {isPhoto ? 'Analyzing your item...' : 'Looking up your item...'}
          </Text>
        </View>
      )}

      {/* AI Results Form */}
      {aiDone && (
        <>
          {/* AI Badge */}
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>AI-generated — edit any field before saving</Text>
          </View>

          {/* Title */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholderTextColor={Colors.textMuted} />
          </View>

          {/* Description */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          {/* Category chips */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, category === c && styles.chipActive]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Condition chips */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Condition *</Text>
            <View style={styles.chipRow}>
              {CONDITIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, condition === c && styles.chipActive]}
                  onPress={() => setCondition(c)}
                >
                  <Text style={[styles.chipText, condition === c && styles.chipTextActive]}>{c}</Text>
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
                keyboardType="numeric"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>

          {/* Care Instructions */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Care Instructions</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={careInstructions}
              onChangeText={setCareInstructions}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          {/* Action buttons */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Item</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.retryButton} onPress={handleReset}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  backButton: { paddingVertical: 8, paddingRight: 16 },
  backText: { fontSize: 16, fontWeight: '600', color: Colors.primary },
  pageTitle: { fontSize: 28, fontWeight: '800', color: Colors.text, marginBottom: 20 },

  // Input section
  inputSection: { marginBottom: 20 },
  photoArea: {
    height: 200, borderRadius: 14, borderWidth: 2, borderColor: Colors.border,
    borderStyle: 'dashed', backgroundColor: Colors.card, justifyContent: 'center',
    alignItems: 'center', marginBottom: 14,
  },
  photoAreaIcon: { fontSize: 48, marginBottom: 8 },
  photoAreaText: { fontSize: 15, color: Colors.textMuted, fontWeight: '600' },
  previewContainer: { marginBottom: 14, alignItems: 'center' },
  previewPlaceholder: {
    height: 200, borderRadius: 14, backgroundColor: Colors.card,
    justifyContent: 'center', alignItems: 'center', width: '100%',
  },
  previewPlaceholderText: { fontSize: 15, color: Colors.textMuted },
  changePhotoButton: { marginTop: 8 },
  changePhotoText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  buttonRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  photoButton: {
    flex: 1, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  photoButtonText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  photoButtonDisabled: { borderColor: Colors.border },
  photoButtonTextDisabled: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  descriptionInput: { minHeight: 120, paddingTop: 14, marginBottom: 14 },

  analyzeButton: {
    backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  analyzeButtonDisabled: { opacity: 0.5 },
  analyzeButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },

  // Loading
  loadingContainer: { alignItems: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 16, fontSize: 16, fontWeight: '600', color: Colors.textMuted },

  // AI badge
  aiBadge: {
    backgroundColor: 'rgba(221,85,12,0.08)', borderRadius: 8, paddingHorizontal: 12,
    paddingVertical: 8, marginBottom: 20, alignSelf: 'flex-start',
  },
  aiBadgeText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  // Form fields
  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  input: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text,
  },
  multiline: { minHeight: 80, paddingTop: 12 },
  dollarRow: { flexDirection: 'row', alignItems: 'center' },
  dollarSign: { fontSize: 16, fontWeight: '700', color: Colors.textMuted, marginRight: 6 },
  dollarInput: { flex: 1 },

  // Chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  chipTextActive: { color: '#FFFFFF' },

  // Buttons
  saveButton: {
    backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 8, shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  retryButton: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  retryButtonText: { fontSize: 15, fontWeight: '600', color: Colors.primary },
});
