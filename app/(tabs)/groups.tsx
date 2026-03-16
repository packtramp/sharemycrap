import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Modal,
  Pressable, ActivityIndicator, TextInput, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  collection, query, where, getDocs, addDoc, serverTimestamp, doc, setDoc,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../lib/firebase';
import { Colors } from '../../constants/Colors';

interface Group {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  memberIds: string[];
  createdBy: string;
}

const showAlert = (title: string, msg: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${msg}`);
  } else {
    Alert.alert(title, msg);
  }
};

export default function GroupsScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [fabOpen, setFabOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchGroups = useCallback(async () => {
    const user = getAuth().currentUser;
    if (!user) { setLoading(false); return; }
    try {
      const q = query(
        collection(db, 'groups'),
        where('memberIds', 'array-contains', user.uid)
      );
      const snap = await getDocs(q);
      const fetched: Group[] = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Group[];
      setGroups(fetched);
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchGroups().then(() => setInitialLoad(false));
    }, [fetchGroups])
  );

  const handleCreate = async () => {
    const user = getAuth().currentUser;
    if (!user || !groupName.trim()) return;
    setCreating(true);
    try {
      const groupRef = await addDoc(collection(db, 'groups'), {
        name: groupName.trim(),
        description: groupDesc.trim() || '',
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        memberCount: 1,
        memberIds: [user.uid],
      });
      await setDoc(doc(db, 'groups', groupRef.id, 'members', user.uid), {
        role: 'admin',
        joinedAt: serverTimestamp(),
        displayName: user.displayName || '',
        email: user.email || '',
      });
      setGroupName('');
      setGroupDesc('');
      setCreateOpen(false);
      setLoading(true);
      fetchGroups();
    } catch (err) {
      console.error('Error creating group:', err);
      showAlert('Error', 'Failed to create group. Try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = () => {
    setJoinOpen(false);
    setJoinCode('');
    showAlert('Coming Soon', 'Invite code joining will be available in Phase 3.');
  };

  const openCreate = () => { setFabOpen(false); setCreateOpen(true); };
  const openJoin = () => { setFabOpen(false); setJoinOpen(true); };

  const getUserRole = (group: Group) => {
    const uid = getAuth().currentUser?.uid;
    return group.createdBy === uid ? 'Admin' : 'Member';
  };

  const renderGroup = ({ item }: { item: Group }) => {
    const role = getUserRole(item);
    const letter = item.name.charAt(0).toUpperCase();
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => router.push(`/group-detail?id=${item.id}` as any)}
      >
        <View style={styles.groupIcon}>
          <Text style={styles.groupIconText}>{letter}</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardSub}>{item.memberCount} {item.memberCount === 1 ? 'member' : 'members'}</Text>
        </View>
        <View style={styles.cardRight}>
          <View style={[styles.roleBadge, role === 'Admin' ? styles.roleAdmin : styles.roleMember]}>
            <Text style={[styles.roleText, role === 'Admin' ? styles.roleAdminText : styles.roleMemberText]}>{role}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>👥</Text>
      <Text style={styles.emptyTitle}>No groups yet</Text>
      <Text style={styles.emptySubtitle}>Create a group or join one with an invite code</Text>
      <TouchableOpacity style={styles.emptyButton} onPress={openCreate}>
        <Text style={styles.emptyButtonText}>Create a Group</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.outlineButton} onPress={openJoin}>
        <Text style={styles.outlineButtonText}>Join with Code</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Groups</Text>
        <Text style={styles.headerCount}>{groups.length} {groups.length === 1 ? 'group' : 'groups'}</Text>
      </View>

      {groups.length === 0 ? <EmptyState /> : (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.id}
          renderItem={renderGroup}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setFabOpen(true)} activeOpacity={0.8}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* FAB Menu */}
      <Modal visible={fabOpen} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setFabOpen(false)}>
          <View style={styles.fabMenu}>
            <TouchableOpacity style={styles.fabMenuItem} onPress={openCreate}>
              <Text style={styles.fabMenuIcon}>➕</Text>
              <Text style={styles.fabMenuText}>Create a Group</Text>
            </TouchableOpacity>
            <View style={styles.fabMenuDivider} />
            <TouchableOpacity style={styles.fabMenuItem} onPress={openJoin}>
              <Text style={styles.fabMenuIcon}>🔗</Text>
              <Text style={styles.fabMenuText}>Join with Code</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Create Group Modal */}
      <Modal visible={createOpen} transparent animationType="fade">
        <Pressable style={styles.centerOverlay} onPress={() => setCreateOpen(false)}>
          <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.dialogTitle}>Create a Group</Text>
            <TextInput
              style={styles.input}
              placeholder="Group name"
              placeholderTextColor={Colors.textMuted}
              value={groupName}
              onChangeText={setGroupName}
              maxLength={50}
            />
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="Description (optional)"
              placeholderTextColor={Colors.textMuted}
              value={groupDesc}
              onChangeText={setGroupDesc}
              multiline
              maxLength={200}
            />
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCreateOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, !groupName.trim() && styles.actionBtnDisabled]}
                onPress={handleCreate}
                disabled={!groupName.trim() || creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.actionBtnText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Join Group Modal */}
      <Modal visible={joinOpen} transparent animationType="fade">
        <Pressable style={styles.centerOverlay} onPress={() => setJoinOpen(false)}>
          <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.dialogTitle}>Join a Group</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter invite code"
              placeholderTextColor={Colors.textMuted}
              value={joinCode}
              onChangeText={(t) => setJoinCode(t.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
            />
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setJoinOpen(false); setJoinCode(''); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, joinCode.length < 6 && styles.actionBtnDisabled]}
                onPress={handleJoin}
                disabled={joinCode.length < 6}
              >
                <Text style={styles.actionBtnText}>Join</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: Colors.text },
  headerCount: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12,
    marginBottom: 12, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  groupIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  groupIconText: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  cardContent: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  cardSub: { fontSize: 13, color: Colors.textMuted },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  roleAdmin: { backgroundColor: 'rgba(221,85,12,0.12)' },
  roleMember: { backgroundColor: 'rgba(102,102,102,0.1)' },
  roleText: { fontSize: 11, fontWeight: '700' },
  roleAdminText: { color: Colors.primary },
  roleMemberText: { color: Colors.textMuted },
  chevron: { fontSize: 22, color: Colors.textMuted, marginTop: 2 },
  // Empty state
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  emptyButton: { backgroundColor: Colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12, marginBottom: 12 },
  emptyButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  outlineButton: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: Colors.primary },
  outlineButtonText: { color: Colors.primary, fontSize: 16, fontWeight: '700' },
  // FAB
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: '#FFF', fontSize: 32, fontWeight: '300', marginTop: -2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', alignItems: 'flex-end', paddingBottom: 100, paddingRight: 24 },
  fabMenu: { backgroundColor: Colors.card, borderRadius: 14, paddingVertical: 6, width: 220, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
  fabMenuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  fabMenuIcon: { fontSize: 18, marginRight: 12 },
  fabMenuText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  fabMenuDivider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 16 },
  // Dialogs
  centerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  dialog: { backgroundColor: Colors.card, borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 },
  dialogTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 20 },
  input: { backgroundColor: Colors.inputBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text, marginBottom: 12 },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 12 },
  cancelText: { fontSize: 15, fontWeight: '600', color: Colors.textMuted },
  actionBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  actionBtnDisabled: { opacity: 0.4 },
  actionBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
