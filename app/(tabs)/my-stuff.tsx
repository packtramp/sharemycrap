import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../lib/firebase';
import { Colors } from '../../constants/Colors';

interface Item {
  id: string;
  title: string;
  category: string;
  condition: string;
  active: boolean;
  photos: string[];
  estimatedValue: number;
}

interface Group {
  id: string;
  name: string;
  memberCount: number;
}

export default function MyStuffScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [fabOpen, setFabOpen] = useState(false);

  // Select mode state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [shareOpen, setShareOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [sharing, setSharing] = useState(false);

  const fetchItems = useCallback(async () => {
    const user = getAuth().currentUser;
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const q = query(
        collection(db, 'items'),
        where('ownerId', '==', user.uid)
      );
      const snap = await getDocs(q);
      const fetched: Item[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Item[];
      setItems(fetched);
    } catch (err) {
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchItems().then(() => setInitialLoad(false));
    }, [fetchItems])
  );

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const toggleItemSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const fetchGroups = async () => {
    const user = getAuth().currentUser;
    if (!user) return;
    setLoadingGroups(true);
    try {
      const q = query(
        collection(db, 'groups'),
        where('memberIds', 'array-contains', user.uid)
      );
      const snap = await getDocs(q);
      const fetched: Group[] = snap.docs.map((d) => ({
        id: d.id,
        name: d.data().name || 'Unnamed Group',
        memberCount: (d.data().memberIds as string[])?.length || 0,
      }));
      setGroups(fetched);
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoadingGroups(false);
    }
  };

  const openShareModal = () => {
    setSelectedGroupIds(new Set());
    setShareOpen(true);
    fetchGroups();
  };

  const toggleGroupSelection = (id: string) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleShare = async () => {
    if (selectedGroupIds.size === 0) return;
    setSharing(true);
    try {
      const groupIdArray = Array.from(selectedGroupIds);
      const promises = Array.from(selectedIds).map((itemId) =>
        updateDoc(doc(db, 'items', itemId), {
          sharedWithGroups: arrayUnion(...groupIdArray),
          active: true,
        })
      );
      await Promise.all(promises);
      setItems((prev) =>
        prev.map((item) =>
          selectedIds.has(item.id) ? { ...item, active: true } : item
        )
      );
      setShareOpen(false);
      exitSelectMode();
      Alert.alert('Shared!', `${selectedIds.size} item${selectedIds.size > 1 ? 's' : ''} shared to ${groupIdArray.length} group${groupIdArray.length > 1 ? 's' : ''}.`);
    } catch (err) {
      console.error('Error sharing items:', err);
      Alert.alert('Error', 'Failed to share items. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const handleAddItem = (mode: string) => {
    setFabOpen(false);
    router.push('/(tabs)/add-item');
  };

  const renderItem = ({ item }: { item: Item }) => {
    const isSelected = selectedIds.has(item.id);
    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        activeOpacity={0.7}
        onPress={() => selectMode ? toggleItemSelection(item.id) : undefined}
      >
        {selectMode && (
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </View>
        )}
        <View style={styles.photoPlaceholder}>
          <Text style={styles.photoIcon}>📷</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardCategory} numberOfLines={1}>
            {item.category || 'No category'}
          </Text>
          <View style={styles.cardFooter}>
            <View style={[styles.statusBadge, item.active ? styles.statusActive : styles.statusInactive]}>
              <Text style={[styles.statusText, item.active ? styles.statusTextActive : styles.statusTextInactive]}>
                {item.active ? 'Shared' : 'Private'}
              </Text>
            </View>
            <Text style={styles.conditionText}>{item.condition}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📦</Text>
      <Text style={styles.emptyTitle}>No items yet</Text>
      <Text style={styles.emptySubtitle}>
        Add your stuff and share it with friends and groups. It's what the app is for.
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={() => handleAddItem('manual')}>
        <Text style={styles.emptyButtonText}>Add your first item</Text>
      </TouchableOpacity>
    </View>
  );

  if (initialLoad) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>
            {selectMode ? `${selectedIds.size} selected` : 'My Stuff'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {selectMode ? (
            <>
              <TouchableOpacity
                style={[styles.shareButton, selectedIds.size === 0 && styles.shareButtonDisabled]}
                onPress={openShareModal}
                disabled={selectedIds.size === 0}
              >
                <Text style={[styles.shareButtonText, selectedIds.size === 0 && styles.shareButtonTextDisabled]}>
                  Share to...
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={exitSelectMode} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.headerCount}>
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </Text>
              {items.length > 0 && (
                <TouchableOpacity onPress={() => setSelectMode(true)} style={styles.selectButton}>
                  <Text style={styles.selectButtonText}>Select</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>

      {/* Item List or Empty State */}
      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          extraData={selectedIds}
        />
      )}

      {/* FAB - hidden in select mode */}
      {!selectMode && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setFabOpen(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* FAB Menu Modal */}
      <Modal visible={fabOpen} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setFabOpen(false)}>
          <View style={styles.fabMenu}>
            <TouchableOpacity style={styles.fabMenuItem} onPress={() => handleAddItem('manual')}>
              <Text style={styles.fabMenuIcon}>✏️</Text>
              <Text style={styles.fabMenuText}>Add Item (Manual)</Text>
            </TouchableOpacity>
            <View style={styles.fabMenuDivider} />
            <TouchableOpacity style={styles.fabMenuItem} onPress={() => handleAddItem('ai-photo')}>
              <Text style={styles.fabMenuIcon}>📸</Text>
              <Text style={styles.fabMenuText}>Add Item (AI Photo)</Text>
            </TouchableOpacity>
            <View style={styles.fabMenuDivider} />
            <TouchableOpacity style={styles.fabMenuItem} onPress={() => handleAddItem('ai-description')}>
              <Text style={styles.fabMenuIcon}>🤖</Text>
              <Text style={styles.fabMenuText}>Add Item (AI Description)</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Share To Modal */}
      <Modal visible={shareOpen} transparent animationType="slide">
        <Pressable style={styles.shareOverlay} onPress={() => setShareOpen(false)}>
          <Pressable style={styles.shareSheet} onPress={() => {}}>
            <View style={styles.shareHandle} />
            <Text style={styles.shareTitle}>
              Share {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} to...
            </Text>

            <ScrollView style={styles.shareScrollArea}>
              {/* Groups Section */}
              <Text style={styles.shareSectionLabel}>GROUPS</Text>
              {loadingGroups ? (
                <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 16 }} />
              ) : groups.length === 0 ? (
                <Text style={styles.shareEmptyText}>No groups yet. Create or join a group first.</Text>
              ) : (
                groups.map((group) => {
                  const isChecked = selectedGroupIds.has(group.id);
                  return (
                    <TouchableOpacity
                      key={group.id}
                      style={styles.shareRow}
                      onPress={() => toggleGroupSelection(group.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkbox, isChecked && styles.checkboxSelected]}>
                        {isChecked && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <View style={styles.shareRowContent}>
                        <Text style={styles.shareRowName}>{group.name}</Text>
                        <Text style={styles.shareRowMeta}>
                          {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}

              {/* Friends Section */}
              <Text style={[styles.shareSectionLabel, { marginTop: 20 }]}>FRIENDS</Text>
              <Text style={styles.shareEmptyText}>Friends coming in Phase 2</Text>
            </ScrollView>

            <TouchableOpacity
              style={[styles.shareConfirmButton, selectedGroupIds.size === 0 && styles.shareConfirmDisabled]}
              onPress={handleShare}
              disabled={selectedGroupIds.size === 0 || sharing}
            >
              {sharing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.shareConfirmText}>
                  {selectedGroupIds.size === 0
                    ? 'Select groups'
                    : `Share to ${selectedGroupIds.size} group${selectedGroupIds.size !== 1 ? 's' : ''}`}
                </Text>
              )}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
  },
  headerCount: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  selectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  shareButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  shareButtonDisabled: {
    backgroundColor: Colors.border,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  shareButtonTextDisabled: {
    color: Colors.textMuted,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardSelected: {
    backgroundColor: 'rgba(221,85,12,0.06)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: -1,
  },
  photoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: Colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoIcon: {
    fontSize: 28,
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  cardCategory: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusActive: {
    backgroundColor: 'rgba(76,175,80,0.12)',
  },
  statusInactive: {
    backgroundColor: 'rgba(102,102,102,0.1)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextActive: {
    color: Colors.success,
  },
  statusTextInactive: {
    color: Colors.textMuted,
  },
  conditionText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '300',
    marginTop: -2,
  },
  // FAB Menu
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: 100,
    paddingRight: 24,
  },
  fabMenu: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 6,
    width: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  fabMenuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  fabMenuText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  fabMenuDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  // Share Modal
  shareOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  shareSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 36,
    maxHeight: '70%',
  },
  shareHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  shareTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 16,
  },
  shareScrollArea: {
    marginBottom: 16,
  },
  shareSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  shareEmptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  shareRowContent: {
    flex: 1,
  },
  shareRowName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  shareRowMeta: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  shareConfirmButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  shareConfirmDisabled: {
    backgroundColor: Colors.border,
  },
  shareConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
