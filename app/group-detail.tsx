import { useState, useEffect, useLayoutEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal,
  Pressable, ActivityIndicator, Platform, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import {
  doc, getDoc, collection, getDocs, query, where, updateDoc,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../lib/firebase';
import { Colors } from '../constants/Colors';
import * as Clipboard from 'expo-clipboard';

interface GroupDoc {
  name: string;
  description?: string;
  memberCount: number;
  memberIds: string[];
  createdBy: string;
  createdAt: any;
  inviteCode?: string;
}

interface Member {
  id: string;
  displayName: string;
  email: string;
  role: string;
  joinedAt: any;
}

interface Item {
  id: string;
  title: string;
  category: string;
  condition: string;
  ownerName: string;
  photos: string[];
}

const showAlert = (title: string, msg: string) => {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
};

const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

export default function GroupDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [group, setGroup] = useState<GroupDoc | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [copied, setCopied] = useState(false);

  const uid = getAuth().currentUser?.uid;
  const isAdmin = group?.createdBy === uid;

  // Set dynamic header title
  useLayoutEffect(() => {
    if (group?.name) {
      navigation.setOptions({ title: group.name });
    }
  }, [group?.name, navigation]);

  useEffect(() => {
    if (!id) return;
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [groupSnap, membersSnap, itemsSnap] = await Promise.all([
        getDoc(doc(db, 'groups', id!)),
        getDocs(collection(db, 'groups', id!, 'members')),
        getDocs(query(collection(db, 'items'), where('sharedWithGroups', 'array-contains', id))),
      ]);

      if (groupSnap.exists()) {
        setGroup(groupSnap.data() as GroupDoc);
      }

      const fetched: Member[] = membersSnap.docs.map((d) => ({
        id: d.id, ...d.data(),
      })) as Member[];
      fetched.sort((a, b) => (a.role === 'admin' ? -1 : 1));
      setMembers(fetched);

      const fetchedItems: Item[] = itemsSnap.docs.map((d) => ({
        id: d.id, ...d.data(),
      })) as Item[];
      setItems(fetchedItems);
    } catch (err) {
      console.error('Error fetching group detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (group?.inviteCode) {
      setInviteCode(group.inviteCode);
    } else {
      const code = generateCode();
      try {
        await updateDoc(doc(db, 'groups', id!), { inviteCode: code });
        setInviteCode(code);
        setGroup((prev) => prev ? { ...prev, inviteCode: code } : prev);
      } catch (err) {
        console.error('Error generating invite code:', err);
        showAlert('Error', 'Failed to generate invite code.');
        return;
      }
    }
    setInviteOpen(true);
    setCopied(false);
  };

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showAlert('Code', inviteCode);
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Group not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Group Info Card */}
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.groupName}>{group.name}</Text>
          {isAdmin && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          )}
        </View>
        {!!group.description && <Text style={styles.groupDesc}>{group.description}</Text>}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>👥 {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}</Text>
          {group.createdAt && <Text style={styles.metaText}>📅 Created {formatDate(group.createdAt)}</Text>}
        </View>
      </View>

      {/* Members Section */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionLeft}>
          <Text style={styles.sectionTitle}>MEMBERS</Text>
          <Text style={styles.sectionCount}>{members.length}</Text>
        </View>
        <TouchableOpacity onPress={handleInvite} style={styles.inviteBtn} activeOpacity={0.7}>
          <Text style={styles.inviteBtnText}>+ Invite</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.card}>
        {members.length === 0 ? (
          <Text style={styles.emptyText}>No members found</Text>
        ) : (
          members.map((m, i) => (
            <View key={m.id} style={[styles.memberRow, i < members.length - 1 && styles.memberBorder]}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(m.displayName || m.email || '?').charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName} numberOfLines={1}>{m.displayName || 'Unknown'}</Text>
                <Text style={styles.memberEmail} numberOfLines={1}>{m.email}</Text>
              </View>
              <View style={[styles.roleBadge, m.role === 'admin' ? styles.roleAdmin : styles.roleMember]}>
                <Text style={[styles.roleText, m.role === 'admin' ? styles.roleAdminText : styles.roleMemberText]}>
                  {m.role === 'admin' ? 'Admin' : 'Member'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Shared Items Section */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionLeft}>
          <Text style={styles.sectionTitle}>SHARED ITEMS</Text>
          <Text style={styles.sectionCount}>{items.length}</Text>
        </View>
      </View>
      {items.length === 0 ? (
        <View style={styles.card}>
          <View style={styles.emptyItems}>
            <Text style={styles.emptyItemsIcon}>📦</Text>
            <Text style={styles.emptyItemsTitle}>No items shared yet</Text>
            <Text style={styles.emptyItemsSubtitle}>Share items from My Stuff to this group</Text>
          </View>
        </View>
      ) : (
        items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.itemCard}
            activeOpacity={0.7}
            onPress={() => router.push(`/item-detail?id=${item.id}` as any)}
          >
            <View style={styles.itemPhoto}>
              <Text style={styles.itemPhotoEmoji}>📷</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.itemMeta}>{item.category}</Text>
              <View style={styles.itemFooter}>
                <Text style={styles.itemOwner}>{item.ownerName || 'Unknown'}</Text>
                {!!item.condition && (
                  <View style={styles.conditionBadge}>
                    <Text style={styles.conditionText}>{item.condition}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}

      <View style={{ height: 40 }} />

      {/* Invite Code Modal */}
      <Modal visible={inviteOpen} transparent animationType="fade">
        <Pressable style={styles.centerOverlay} onPress={() => setInviteOpen(false)}>
          <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.dialogTitle}>Invite to {group.name}</Text>
            <Text style={styles.dialogSubtitle}>Share this code with others to join your group</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{inviteCode}</Text>
            </View>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.7}>
              <Text style={styles.copyBtnText}>{copied ? '✓ Copied!' : 'Copy Code'}</Text>
            </TouchableOpacity>
            <Text style={styles.shareHint}>Send this code via text, email, or any messenger. They can join from the Groups tab.</Text>
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setInviteOpen(false)}>
              <Text style={styles.closeModalText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  errorText: { fontSize: 16, color: Colors.textMuted, marginBottom: 16 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.primary, borderRadius: 10 },
  backBtnText: { color: '#FFF', fontWeight: '700' },
  // Scroll
  scrollContent: { padding: 16 },
  // Cards
  card: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  // Group info
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  groupName: { fontSize: 22, fontWeight: '800', color: Colors.text, flexShrink: 1 },
  adminBadge: { backgroundColor: 'rgba(221,85,12,0.12)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  adminBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  groupDesc: { fontSize: 14, color: Colors.textMuted, lineHeight: 20, marginBottom: 10 },
  metaRow: { flexDirection: 'row', gap: 16, marginTop: 4 },
  metaText: { fontSize: 13, color: Colors.textMuted },
  // Sections
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 4 },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1 },
  sectionCount: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, backgroundColor: Colors.border, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  inviteBtn: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  inviteBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  // Members
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  memberBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  memberInfo: { flex: 1, marginLeft: 12 },
  memberName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  memberEmail: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  roleAdmin: { backgroundColor: 'rgba(221,85,12,0.12)' },
  roleMember: { backgroundColor: 'rgba(102,102,102,0.1)' },
  roleText: { fontSize: 11, fontWeight: '700' },
  roleAdminText: { color: Colors.primary },
  roleMemberText: { color: Colors.textMuted },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', paddingVertical: 12 },
  // Items
  itemCard: {
    flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 12, padding: 12, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  itemPhoto: {
    width: 60, height: 60, borderRadius: 10, backgroundColor: Colors.inputBg,
    justifyContent: 'center', alignItems: 'center',
  },
  itemPhotoEmoji: { fontSize: 24 },
  itemInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  itemTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  itemMeta: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  itemFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemOwner: { fontSize: 12, color: Colors.textMuted },
  conditionBadge: { backgroundColor: 'rgba(76,175,80,0.12)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  conditionText: { fontSize: 10, fontWeight: '700', color: Colors.success },
  // Empty items
  emptyItems: { alignItems: 'center', paddingVertical: 20 },
  emptyItemsIcon: { fontSize: 40, marginBottom: 8 },
  emptyItemsTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  emptyItemsSubtitle: { fontSize: 13, color: Colors.textMuted },
  // Invite modal
  centerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  dialog: { backgroundColor: Colors.card, borderRadius: 16, padding: 24, width: '100%', maxWidth: 360, alignItems: 'center' },
  dialogTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 4, textAlign: 'center' },
  dialogSubtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginBottom: 20 },
  codeBox: {
    backgroundColor: Colors.inputBg, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 16,
    marginBottom: 16, borderWidth: 2, borderColor: Colors.primary, borderStyle: 'dashed',
  },
  codeText: { fontSize: 32, fontWeight: '800', color: Colors.primary, letterSpacing: 6, textAlign: 'center' },
  copyBtn: { backgroundColor: Colors.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10, marginBottom: 16 },
  copyBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  shareHint: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  closeModalBtn: { paddingVertical: 8 },
  closeModalText: { fontSize: 15, fontWeight: '600', color: Colors.textMuted },
});
