import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { FIREBASE_CONFIG, FIREBASE_CONFIGURED } from './firebaseKeys';

// When keys aren't set yet (local dev, or before the user finishes Firebase
// setup) skip init entirely rather than throwing — screens check
// FIREBASE_CONFIGURED and show a "설정 필요" card instead of crashing.
export const app = FIREBASE_CONFIGURED ? initializeApp(FIREBASE_CONFIG) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
