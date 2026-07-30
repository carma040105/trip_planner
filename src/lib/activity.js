import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export async function logActivity(tripId, { authorId, authorName, type, message, targetRef }) {
  await addDoc(collection(db, 'trips', tripId, 'activity'), {
    authorId,
    authorName,
    type,
    message,
    targetRef: targetRef || null,
    createdAt: serverTimestamp(),
  });
}
