import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FIREBASE_CONFIGURED } from '../lib/firebaseKeys';
import { useAuth } from './AuthContext.jsx';

const TravelContext = createContext(null);

export function TravelProvider({ children }) {
  const { uid, authUser, profile } = useAuth();

  const [trips, setTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [screen, setScreen] = useState('home');
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [mapProviderOverride, setMapProviderOverride] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const tripsRef = useRef([]);
  tripsRef.current = trips;

  // Trip list: every trip this account owns or is a member of.
  useEffect(() => {
    if (!FIREBASE_CONFIGURED || !uid) {
      setTrips([]);
      setTripsLoading(false);
      return;
    }
    setTripsLoading(true);
    const q = query(collection(db, 'trips'), where('memberIds', 'array-contains', uid));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
      setTrips(list);
      setTripsLoading(false);
    });
  }, [uid]);

  // Member roster for whichever trip is currently open.
  useEffect(() => {
    if (!FIREBASE_CONFIGURED || !selectedTripId) {
      setMembers([]);
      return;
    }
    return onSnapshot(collection(db, 'trips', selectedTripId, 'members'), (snap) => {
      setMembers(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
    });
  }, [selectedTripId]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const openTrip = useCallback((tripId) => {
    setSelectedTripId(tripId);
    setSelectedDay(0);
    setMapProviderOverride(null);
    setScreen('itinerary');
  }, []);

  // Applies fn to the trip's current local state and writes the changed
  // fields back to Firestore. Never touches id/ownerId/memberIds/createdAt —
  // use the dedicated helpers below (addMember/removeMember) for those.
  const updateTrip = useCallback(async (tripId, fn) => {
    const current = tripsRef.current.find((t) => t.id === tripId);
    if (!current) return;
    const next = fn(current);
    const { id: _id, ownerId: _o, memberIds: _m, createdAt: _c, ...rest } = next;
    await updateDoc(doc(db, 'trips', tripId), { ...rest, updatedAt: serverTimestamp() });
  }, []);

  const createTrip = useCallback(
    async (fields) => {
      if (!uid) return null;
      const tripRef = doc(collection(db, 'trips'));
      const batch = writeBatch(db);
      batch.set(tripRef, {
        ...fields,
        ownerId: uid,
        ownerName: profile?.name || authUser?.email || '',
        memberIds: [uid],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'trips', tripRef.id, 'members', uid), {
        role: 'owner',
        name: profile?.name || '',
        email: authUser?.email || '',
        joinedAt: serverTimestamp(),
      });
      await batch.commit();
      return tripRef.id;
    },
    [uid, profile, authUser]
  );

  const deleteTrip = useCallback(async (tripId) => {
    await deleteDoc(doc(db, 'trips', tripId));
  }, []);

  const value = {
    data: { trips },
    tripsLoading,
    updateTrip,
    createTrip,
    deleteTrip,
    members,
    screen,
    setScreen,
    selectedTripId,
    setSelectedTripId,
    selectedDay,
    setSelectedDay,
    mapProviderOverride,
    setMapProviderOverride,
    toast,
    showToast,
    openTrip,
  };

  return <TravelContext.Provider value={value}>{children}</TravelContext.Provider>;
}

export function useTravel() {
  const ctx = useContext(TravelContext);
  if (!ctx) throw new Error('useTravel must be used within TravelProvider');
  return ctx;
}
