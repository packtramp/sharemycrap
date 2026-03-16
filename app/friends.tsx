import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, ActivityIndicator, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { Colors } from '../constants/Colors';
import {
  generateFriendCode, getFriendCode, connectByCode,
  getFriends, removeFriend, FriendEntry,
} from '../lib/friends';

// Platform-safe clipboard
import * as Clipboard from 'expo-clipboard';
const showAlert = (title: string, msg: string) => {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
};

const confirmAction = (title: string, msg: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${msg}`)) onConfirm();
  } else {
    Alert.alert(title, msg, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: onConfirm },
    ]);
  }
};

export default function FriendsScreen() {
  const router = useRouter();
  const [friendCode, setFriendCode] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [connectCode, setConnectCode] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [listLoading, setListLoading] = useState(true);

  const uid = getAuth().currentUser?.uid;

  const load = useCallback(async () => {
    if (!uid) return;
    try {
      const [code, list] = await Promise.all([
        getFriendCode(uid),
        getFriends(uid),
      ]);
      setFriendCode(code);
      setFriends(list);
    } catch (err) {
      console.error('Friends load error:', err);
    } finally {
      setCodeLoading(false);
      setListLoading(false);
    }
  }, [uid]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleGenerate = async () => {
    if (!uid) return;
    setGenerating(true);
    try {
      const code = await generateFriendCode(uid);
      setFriendCode(code);
    } catch (err) {
      showAlert('Error', 'Could not generate code. Try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!friendCode) return;
    try {
      await Clipboard.setStringAsync(friendCode);
      showAlert('Copied', 'Friend code copied to clipboard!');
    } catch {
      showAlert('Code', friendCode);
    }
  };

  const handleConnect = async () => {
    if (!uid || connectCode.length !== 6) return;
    setConnecting(true);
    try {
      const name = await connectByCode(connectCode, uid);
      showAlert('Connected', `You are now friends with ${name}!`);
      setConnectCode('');
      load();
    } catch (err: any) {
      showAlert('Error', err.message || 'Could not connect. Try again.');
    } finally {
      setConnecting(false);
    }
  };

  const handleRemove = (friend: FriendEntry) => {
    if (!uid) return;
    confirmAction(
      'Remove Friend',
      `Remove ${friend.displayName || friend.email}? They won't be able to see your shared items anymore.`,
      async () => {
        try {
          await removeFriend(uid, friend.id);
          setFriends((prev) => prev.filter((f) => f.id !== friend.id));
        } catch {
          showAlert('Error', 'Failed to remove friend.');
        }
      },
    );
  };

  const renderFriend = ({ item }: { item: FriendEntry }) => {
    const letter = (item.displayName || item.email || '?').charAt(0).toUpperCase();
    return (
      <View style={styles.friendCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{letter}</Text>
        </View>
        <View style={styles.friendInfo}>
          <Text style={styles.friendName} numberOfLines={1}>
            {item.displayName || 'No Name'}
          </Text>
          <Text style={styles.friendEmail} numberOfLines={1}>{item.email}</Text>
        </View>
        <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item)}>
          <Text style={styles.removeBtnText}>Remove</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🤝</Text>
      <Text style={styles.emptyTitle}>No friends yet</Text>
      <Text style={styles.emptySubtitle}>
        Share your friend code with someone, or enter theirs below to connect. Friends can see items you share with them directly.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Friends</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={friends}
        keyExtractor={(f) => f.id}
        renderItem={renderFriend}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Your Code Card */}
            <View style={styles.codeCard}>
              <Text style={styles.codeLabel}>Your Friend Code</Text>
              {codeLoading ? (
                <ActivityIndicator color={Colors.primary} style={{ marginVertical: 12 }} />
              ) : friendCode ? (
                <View style={styles.codeRow}>
                  <Text style={styles.codeText}>{friendCode}</Text>
                  <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                    <Text style={styles.copyBtnText}>Copy</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} disabled={generating}>
                  {generating ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.generateBtnText}>Generate Code</Text>
                  )}
                </TouchableOpacity>
              )}
              <Text style={styles.codeHint}>Share this code so friends can connect with you</Text>
            </View>

            {/* Add Friend */}
            <View style={styles.addSection}>
              <Text style={styles.addLabel}>Add a Friend</Text>
              <View style={styles.addRow}>
                <TextInput
                  style={styles.addInput}
                  placeholder="Enter 6-char code"
                  placeholderTextColor={Colors.textMuted}
                  value={connectCode}
                  onChangeText={(t) => setConnectCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                  maxLength={6}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={[styles.connectBtn, connectCode.length < 6 && styles.connectBtnDisabled]}
                  onPress={handleConnect}
                  disabled={connectCode.length < 6 || connecting}
                >
                  {connecting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.connectBtnText}>Connect</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Friends count */}
            <View style={styles.friendsHeader}>
              <Text style={styles.friendsHeaderText}>
                {listLoading ? 'Loading...' : `${friends.length} ${friends.length === 1 ? 'friend' : 'friends'}`}
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={listLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 32 }} />
        ) : (
          <EmptyState />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  backBtn: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },

  // Code card
  codeCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 20, marginBottom: 16,
    alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  codeLabel: { fontSize: 14, fontWeight: '700', color: Colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 },
  codeText: { fontSize: 32, fontWeight: '800', color: Colors.primary, letterSpacing: 6, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  copyBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  copyBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  generateBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, marginVertical: 8 },
  generateBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  codeHint: { fontSize: 12, color: Colors.textMuted, marginTop: 6 },

  // Add friend
  addSection: { marginBottom: 20 },
  addLabel: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  addRow: { flexDirection: 'row', gap: 10 },
  addInput: {
    flex: 1, backgroundColor: Colors.inputBg, borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 16, color: Colors.text, letterSpacing: 3,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontWeight: '700',
  },
  connectBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, borderRadius: 10, justifyContent: 'center' },
  connectBtnDisabled: { opacity: 0.4 },
  connectBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  // Friends list header
  friendsHeader: { marginBottom: 8 },
  friendsHeaderText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },

  // Friend card
  friendCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12,
    marginBottom: 10, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  friendInfo: { flex: 1, marginLeft: 12 },
  friendName: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 1 },
  friendEmail: { fontSize: 13, color: Colors.textMuted },
  removeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(239,83,80,0.1)' },
  removeBtnText: { fontSize: 13, fontWeight: '700', color: Colors.danger },

  // Empty
  emptyContainer: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
