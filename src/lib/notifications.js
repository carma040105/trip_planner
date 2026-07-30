import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export async function notifyUser(uid, { type, tripId, message, targetRef }) {
  if (!uid) return;
  await addDoc(collection(db, 'users', uid, 'notifications'), {
    type,
    tripId,
    message,
    targetRef: targetRef || null,
    read: false,
    createdAt: serverTimestamp(),
  });
}
