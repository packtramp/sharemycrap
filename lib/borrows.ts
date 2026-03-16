import {
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
  getDoc,
  serverTimestamp,
  arrayUnion,
  or,
} from 'firebase/firestore';
import { db } from './firebase';

export type BorrowStatus =
  | 'pending'
  | 'approved'
  | 'declined'
  | 'active'
  | 'return_pending'
  | 'returned';

export interface BorrowRequest {
  itemId: string;
  ownerId: string;
  borrowerId: string;
  borrowerName: string;
  status: BorrowStatus;
  requestedStart: string;
  requestedEnd: string;
  message: string;
  createdAt: any;
  statusHistory?: { status: BorrowStatus; timestamp: any; userId: string }[];
}

export interface BorrowDoc extends BorrowRequest {
  id: string;
}

export const STATUS_COLORS: Record<BorrowStatus, string> = {
  pending: '#FF9800',
  approved: '#DD550C',
  declined: '#EF5350',
  active: '#4CAF50',
  return_pending: '#DD550C',
  returned: '#666666',
};

export const STATUS_LABELS: Record<BorrowStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  declined: 'Declined',
  active: 'Picked Up',
  return_pending: 'Return Pending',
  returned: 'Returned',
};

export async function createBorrowRequest(data: {
  itemId: string;
  ownerId: string;
  borrowerId: string;
  borrowerName: string;
  requestedStart: string;
  requestedEnd: string;
  message: string;
}): Promise<string> {
  const docRef = await addDoc(collection(db, 'borrows'), {
    ...data,
    status: 'pending' as BorrowStatus,
    createdAt: serverTimestamp(),
    statusHistory: [
      { status: 'pending', timestamp: new Date().toISOString(), userId: data.borrowerId },
    ],
  });
  return docRef.id;
}

export async function updateBorrowStatus(
  borrowId: string,
  newStatus: BorrowStatus,
  userId: string
): Promise<void> {
  const ref = doc(db, 'borrows', borrowId);
  await updateDoc(ref, {
    status: newStatus,
    statusHistory: arrayUnion({
      status: newStatus,
      timestamp: new Date().toISOString(),
      userId,
    }),
  });
}

export async function getBorrowsForUser(userId: string): Promise<BorrowDoc[]> {
  const q = query(
    collection(db, 'borrows'),
    or(
      where('ownerId', '==', userId),
      where('borrowerId', '==', userId)
    )
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BorrowDoc));
}

export async function getBorrowById(borrowId: string): Promise<BorrowDoc | null> {
  const snap = await getDoc(doc(db, 'borrows', borrowId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as BorrowDoc;
}
