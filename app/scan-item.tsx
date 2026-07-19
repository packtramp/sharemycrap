import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Platform, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
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
  if (Platform.OS === 'web') window.alert(`${title}\n${message}`);
  else Alert.alert(title, message);
}

export default function ScanItemScreen() {
  const router = useRouter();
  const isWeb = Platform.OS === 'web';
  const hasDetector = isWeb && typeof window !== 'undefined' && 'BarcodeDetector' in window;

  const videoRef = useRef<any>(null);
  const streamRef = useRef<any>(null);
  const pausedRef = useRef(false);
  const aliveRef = useRef(true);

  const [phase, setPhase] = useState<'scanning' | 'nocam' | 'looking' | 'found' | 'saving'>(hasDetector ? 'scanning' : 'nocam');
  const [msg, setMsg] = useState('');
  const [manual, setManual] = useState('');

  // Form (prefilled from the scan, editable)
  const [upc, setUpc] = useState('');
  const [image, setImage] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('Good');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [careInstructions, setCareInstructions] = useState('');

  // ---- Web barcode scanner ----
  useEffect(() => {
    aliveRef.current = true;
    if (!hasDetector) { setPhase('nocam'); return; }
    let detector: any;
    (async () => {
      try {
        const stream = await (navigator as any).mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => {}); }
        detector = new (window as any).BarcodeDetector({ formats: ['upc_a', 'upc_e', 'ean_13', 'ean_8'] });
        setPhase('scanning');
        tick();
      } catch { setPhase('nocam'); setMsg('Couldn’t open the camera. Allow camera access, or type the barcode number below.'); }
    })();
    async function tick() {
      if (!aliveRef.current) return;
      if (!pausedRef.current && videoRef.current && videoRef.current.readyState >= 2) {
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes && codes.length && codes[0].rawValue) { onCode(codes[0].rawValue); }
        } catch {}
      }
      setTimeout(tick, 400);
    }
    return () => { aliveRef.current = false; if (streamRef.current) streamRef.current.getTracks().forEach((t: any) => t.stop()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCode = async (code: string) => {
    if (pausedRef.current) return;
    pausedRef.current = true;
    setPhase('looking'); setMsg('');
    try {
      const r = await fetch(`/api/product-lookup?upc=${encodeURIComponent(code)}`);
      const p = await r.json();
      setUpc(p.upc || code);
      setImage(p.image || '');
      setTitle(p.title || '');
      setDescription(p.brand && p.title && !p.title.includes(p.brand) ? `${p.brand} — ${p.title}` : (p.description || p.title || ''));
      setCategory(p.category || '');
      setPhase('found');
      if (isWeb && (navigator as any).vibrate) (navigator as any).vibrate(50);
      if (!p.title) setMsg('No product match — fill in the name and save it anyway.');
    } catch {
      setUpc(code); setTitle(''); setPhase('found');
      setMsg('Lookup failed — you can still type the name and save it.');
    }
  };

  const scanAgain = () => {
    setUpc(''); setImage(''); setTitle(''); setDescription(''); setCategory(''); setCondition('Good'); setEstimatedValue(''); setCareInstructions(''); setMsg('');
    pausedRef.current = false;
    setPhase(hasDetector && streamRef.current ? 'scanning' : 'nocam');
  };

  const handleSave = async () => {
    const user = getAuth().currentUser;
    if (!user) { showAlert('Not signed in', 'Please sign in to add items.'); return; }
    if (!title.trim()) { showAlert('Missing title', 'Give your item a name.'); return; }
    if (!condition) { showAlert('Missing condition', 'Select the condition of your item.'); return; }
    setPhase('saving');
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
        aiGenerated: false,
        scanned: true,
        upc: upc || null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      showAlert('Saved', 'Item added to your inventory.');
      router.back();
    } catch (err) {
      console.error('Error saving item:', err);
      showAlert('Error', 'Failed to save item. Try again.');
      setPhase('found');
    }
  };

  const showForm = phase === 'found' || phase === 'saving';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Scan a Barcode</Text>
      <Text style={styles.sub}>Point your camera at the barcode on the item. We’ll look it up and fill in the details.</Text>

      {/* Live camera (web) */}
      {hasDetector && !showForm && (
        <View style={styles.camWrap}>
          {Platform.OS === 'web' && (
            // @ts-ignore raw DOM video on web only
            <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          )}
          <View style={styles.reticle} pointerEvents="none" />
          <Text style={styles.camHint}>{phase === 'looking' ? 'Looking it up…' : 'Point at the barcode'}</Text>
        </View>
      )}

      {/* Product preview + editable form */}
      {showForm && (
        <View>
          {!!image && <Image source={{ uri: image }} style={styles.thumb} resizeMode="contain" />}

          <Text style={styles.label}>Item name</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="(type it if not found)" placeholderTextColor={Colors.textMuted} />

          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, styles.multiline]} value={description} onChangeText={setDescription} multiline placeholderTextColor={Colors.textMuted} />

          <Text style={styles.label}>Category</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[styles.chip, category === c && styles.chipOn]}>
                <Text style={[styles.chipText, category === c && styles.chipTextOn]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Condition</Text>
          <View style={styles.chips}>
            {CONDITIONS.map((c) => (
              <TouchableOpacity key={c} onPress={() => setCondition(c)} style={[styles.chip, condition === c && styles.chipOn]}>
                <Text style={[styles.chipText, condition === c && styles.chipTextOn]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Estimated value (USD)</Text>
          <TextInput style={styles.input} value={estimatedValue} onChangeText={setEstimatedValue} keyboardType="numeric" placeholder="0" placeholderTextColor={Colors.textMuted} />

          <Text style={styles.label}>Care instructions (optional)</Text>
          <TextInput style={[styles.input, styles.multiline]} value={careInstructions} onChangeText={setCareInstructions} multiline placeholderTextColor={Colors.textMuted} />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={phase === 'saving'}>
            {phase === 'saving' ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Add to My Stuff</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={scanAgain}>
            <Text style={styles.secondaryText}>Scan another</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Manual barcode entry (always available; only path on native / no camera) */}
      {!showForm && (
        <View style={{ marginTop: 16 }}>
          {phase === 'nocam' && (
            <Text style={styles.note}>
              {isWeb ? 'Live scanning needs camera access in your browser. ' : 'Live scanning is on the web app for now. '}
              Type the barcode number below, or use “AI Photo” to add this item.
            </Text>
          )}
          <Text style={styles.label}>Or type the barcode number</Text>
          <View style={styles.manualRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={manual}
              onChangeText={setManual}
              keyboardType="numeric"
              placeholder="e.g. 049000006346"
              placeholderTextColor={Colors.textMuted}
              onSubmitEditing={() => manual.trim() && onCode(manual.trim())}
            />
            <TouchableOpacity style={styles.lookupBtn} onPress={() => manual.trim() && onCode(manual.trim())}>
              <Text style={styles.lookupText}>Look up</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!!msg && <Text style={styles.msg}>{msg}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 60 },
  heading: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  sub: { fontSize: 14, color: Colors.textMuted, marginBottom: 18, lineHeight: 20 },
  camWrap: {
    position: 'relative', width: '100%', aspectRatio: 3 / 4, maxHeight: 460, backgroundColor: '#000',
    borderRadius: 14, overflow: 'hidden',
  },
  reticle: {
    position: 'absolute', left: '10%', right: '10%', top: '30%', bottom: '30%',
    borderWidth: 2, borderColor: Colors.primary, borderRadius: 10,
  },
  camHint: {
    position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center',
    color: '#fff', fontSize: 13, fontWeight: '600',
  },
  thumb: { width: 120, height: 120, alignSelf: 'center', marginBottom: 12, borderRadius: 10, backgroundColor: Colors.inputBg },
  label: { fontSize: 13, fontWeight: '700', color: Colors.text, marginTop: 14, marginBottom: 6 },
  input: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: Colors.text, marginBottom: 4,
  },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: Colors.card },
  chipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.text },
  chipTextOn: { color: '#fff', fontWeight: '700' },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 22 },
  saveText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  secondaryBtn: { paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  secondaryText: { color: Colors.primary, fontSize: 15, fontWeight: '600' },
  manualRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  lookupBtn: { backgroundColor: Colors.text, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  lookupText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  note: { fontSize: 13, color: Colors.textMuted, lineHeight: 19, marginBottom: 10, backgroundColor: Colors.inputBg, padding: 12, borderRadius: 10 },
  msg: { fontSize: 13, color: Colors.textMuted, marginTop: 12 },
});
