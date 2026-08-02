import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
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

  const signInWithGoogle = async () => {
    setAuthError('');
    setBusy(true);
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      const ref = doc(db, 'users', cred.user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          name: cred.user.displayName || cred.user.email || '',
          email: cred.user.email || '',
          mapPrefs: DEFAULT_MAP_PREFS,
          fuelType: 'gasoline',
          createdAt: serverTimestamp(),
        });
      }
    } catch (e) {
      const code = e?.code || '';
      if (!code.includes('popup-closed-by-user') && !code.includes('cancelled-popup-request')) {
        setAuthError(mapAuthError(e));
      }
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
    signInWithGoogle,
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
  if (code.includes('popup-blocked')) return '팝업이 차단됐어요. 팝업 차단을 해제하고 다시 시도해주세요.';
  if (code.includes('account-exists-with-different-credential')) return '이미 다른 방식으로 가입된 이메일이에요.';
  return '문제가 발생했어요. 다시 시도해주세요.';
}
