import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { FIREBASE_CONFIGURED } from '../lib/firebaseKeys';
import { checkPendingInvites } from '../lib/invites';

const AuthContext = createContext(null);

const DEFAULT_MAP_PREFS = { overseas: 'google', domesticCar: 'naver', domesticBike: 'kakao' };

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(undefined); // undefined = not resolved yet, null = signed out
  const [profile, setProfile] = useState(null);
  const [authError, setAuthError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!FIREBASE_CONFIGURED) {
      setAuthUser(null);
      return;
    }
    return onAuthStateChanged(auth, (u) => setAuthUser(u || null));
  }, []);

  useEffect(() => {
    if (!authUser) {
      setProfile(null);
      return;
    }
    const ref = doc(db, 'users', authUser.uid);
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) setProfile({ id: snap.id, ...snap.data() });
    });
  }, [authUser]);

  // Runs once per sign-in: turns any pending email invites into in-app notifications.
  useEffect(() => {
    if (authUser?.email) checkPendingInvites(authUser.uid, authUser.email);
  }, [authUser]);

  const signUp = async (email, password, name) => {
    setAuthError('');
    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: name.trim() });
      await setDoc(doc(db, 'users', cred.user.uid), {
        name: name.trim(),
        email: email.trim(),
        mapPrefs: DEFAULT_MAP_PREFS,
        fuelType: 'gasoline',
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      setAuthError(mapAuthError(e));
      throw e;
    } finally {
      setBusy(false);
    }
  };

  const signIn = async (email, password) => {
    setAuthError('');
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      setAuthError(mapAuthError(e));
      throw e;
    } finally {
      setBusy(false);
    }
  };

  const signOutUser = () => signOut(auth);

  const updateProfileFields = async (fields) => {
    if (!authUser) return;
    await updateDoc(doc(db, 'users', authUser.uid), fields);
  };

  const value = {
    authUser,
    uid: authUser?.uid || null,
    profile,
    authLoading: authUser === undefined,
    authError,
    busy,
    signUp,
    signIn,
    signOutUser,
    updateProfileFields,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function mapAuthError(e) {
  const code = e?.code || '';
  if (code.includes('email-already-in-use')) return '이미 가입된 이메일이에요.';
  if (code.includes('invalid-email')) return '이메일 형식을 확인해주세요.';
  if (code.includes('weak-password')) return '비밀번호는 6자 이상이어야 해요.';
  if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
    return '이메일 또는 비밀번호가 올바르지 않아요.';
  }
  return '문제가 발생했어요. 다시 시도해주세요.';
}
