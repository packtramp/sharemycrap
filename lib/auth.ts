import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

export { onAuthStateChanged };

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await createUserDoc(cred.user, displayName);
  return cred.user;
}

export async function signInWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}

async function createUserDoc(user: User, displayName: string) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email,
      displayName,
      profilePhoto: null,
      phone: null,
      contactPreference: 'in-app',
      proStatus: false,
      proExpiry: null,
      aiScansUsedThisMonth: 0,
      aiScansResetDate: null,
      aiCredits: 0,
      friends: [],
      groups: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
}
