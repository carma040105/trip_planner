import { useEffect, useRef, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const HEARTBEAT_MS = 20000;
const ONLINE_WINDOW_MS = 60000;
const LOCK_HEARTBEAT_MS = 5000;
const LOCK_WINDOW_MS = 15000;

// Lightweight "who's online" — a heartbeat doc per member, refreshed every
// ~20s while the trip screen is mounted. Not push/onDisconnect-based, so
// presence can lag by up to a heartbeat interval; good enough for the
// "collaborating right now" feel without a Realtime DB dependency.
export function usePresence(tripId, uid, name) {
  const [onlineIds, setOnlineIds] = useState([]);

  useEffect(() => {
    if (!tripId || !uid) return;
    const ref = doc(db, 'trips', tripId, 'presence', uid);
    const beat = () => setDoc(ref, { name, lastActiveAt: serverTimestamp() }).catch(() => {});
    beat();
    const interval = setInterval(beat, HEARTBEAT_MS);
    return () => {
      clearInterval(interval);
      deleteDoc(ref).catch(() => {});
    };
  }, [tripId, uid, name]);

  useEffect(() => {
    if (!tripId) return;
    return onSnapshot(collection(db, 'trips', tripId, 'presence'), (snap) => {
      const now = Date.now();
      const ids = snap.docs
        .filter((d) => {
          const ts = d.data().lastActiveAt;
          return ts && now - ts.toMillis() < ONLINE_WINDOW_MS;
        })
        .map((d) => d.id);
      setOnlineIds(ids);
    });
  }, [tripId]);

  return onlineIds;
}

// Marks a stop as "being edited" while its confirm/edit sheet is open, so
// other members see a "OO님이 수정 중" badge on it.
export function useEditingLock(tripId, stopId, uid, name) {
  const [locks, setLocks] = useState({});
  const activeRef = useRef(false);

  useEffect(() => {
    if (!tripId) return;
    return onSnapshot(collection(db, 'trips', tripId, 'editingLocks'), (snap) => {
      const now = Date.now();
      const next = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        if (data.updatedAt && now - data.updatedAt.toMillis() < LOCK_WINDOW_MS && data.uid !== uid) {
          next[d.id] = data.name;
        }
      });
      setLocks(next);
    });
  }, [tripId, uid]);

  useEffect(() => {
    if (!tripId || !stopId || !uid) return;
    activeRef.current = true;
    const ref = doc(db, 'trips', tripId, 'editingLocks', stopId);
    const beat = () => activeRef.current && setDoc(ref, { uid, name, updatedAt: serverTimestamp() }).catch(() => {});
    beat();
    const interval = setInterval(beat, LOCK_HEARTBEAT_MS);
    return () => {
      activeRef.current = false;
      clearInterval(interval);
      deleteDoc(ref).catch(() => {});
    };
  }, [tripId, stopId, uid, name]);

  return locks;
}
