import {
  doc, getDoc, setDoc, getDocs, deleteDoc, updateDoc,
  collection, query, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1

function randomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

/** Generate a 6-char friend code and store it on the user doc. */
export async function generateFriendCode(userId: string): Promise<string> {
  const code = randomCode();
  await updateDoc(doc(db, 'users', userId), { friendCode: code });
  return code;
}

/** Read the user's current friend code (or null). */
export async function getFriendCode(userId: string): Promise<string | null> {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? snap.data().friendCode ?? null : null;
}

/** Look up a user by friend code and create mutual friend entries. */
export async function connectByCode(code: string, currentUserId: string): Promise<string> {
  // Find user with this code
  const q = query(collection(db, 'users'), where('friendCode', '==', code.toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('No user found with that code.');

  const friendDoc = snap.docs[0];
  const friendId = friendDoc.id;
  if (friendId === currentUserId) throw new Error("That's your own code!");

  // Check if already friends
  const existing = await getDoc(doc(db, 'users', currentUserId, 'friends', friendId));
  if (existing.exists()) throw new Error('You are already friends!');

  const currentSnap = await getDoc(doc(db, 'users', currentUserId));
  const currentData = currentSnap.data() ?? {};
  const friendData = friendDoc.data();

  // Write mutual entries
  await setDoc(doc(db, 'users', currentUserId, 'friends', friendId), {
    displayName: friendData.displayName || '',
    email: friendData.email || '',
    connectedAt: serverTimestamp(),
  });
  await setDoc(doc(db, 'users', friendId, 'friends', currentUserId), {
    displayName: currentData.displayName || '',
    email: currentData.email || '',
    connectedAt: serverTimestamp(),
  });

  return friendData.displayName || friendData.email || 'Friend';
}

export interface FriendEntry {
  id: string;
  displayName: string;
  email: string;
  connectedAt: any;
}

/** Get all friends for a user. */
export async function getFriends(userId: string): Promise<FriendEntry[]> {
  const snap = await getDocs(collection(db, 'users', userId, 'friends'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as FriendEntry[];
}

/** Remove friend from both users. */
export async function removeFriend(userId: string, friendId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'friends', friendId));
  await deleteDoc(doc(db, 'users', friendId, 'friends', userId));
}
