import {
  addDoc,
  arrayUnion,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

export const EXPIRY_OPTIONS = [
  { id: '1d', label: '1일', ms: 24 * 60 * 60 * 1000 },
  { id: '7d', label: '7일', ms: 7 * 24 * 60 * 60 * 1000 },
  { id: '30d', label: '30일', ms: 30 * 24 * 60 * 60 * 1000 },
  { id: 'never', label: '무제한', ms: null },
];

export async function sha256Hex(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Link invites: anyone with the link (+ password if set) can join.
export async function createInviteLink(tripId, { role, expiryId, password, createdBy, createdByName }) {
  const opt = EXPIRY_OPTIONS.find((o) => o.id === expiryId) || EXPIRY_OPTIONS[1];
  const passwordHash = password ? await sha256Hex(password) : null;
  const ref = await addDoc(collection(db, 'trips', tripId, 'invites'), {
    role,
    expiresAt: opt.ms ? Timestamp.fromMillis(Date.now() + opt.ms) : null,
    passwordHash,
    createdBy,
    createdByName,
    createdAt: serverTimestamp(),
    revoked: false,
  });
  return `${tripId}_${ref.id}`;
}

export async function fetchInvite(tripId, inviteId) {
  const snap = await getDoc(doc(db, 'trips', tripId, 'invites', inviteId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function redeemInvite(tripId, inviteId, { uid, name, email, password }) {
  const invite = await fetchInvite(tripId, inviteId);
  if (!invite || invite.revoked) throw new Error('invalid');
  if (invite.expiresAt && invite.expiresAt.toMillis() < Date.now()) throw new Error('expired');
  if (invite.passwordHash) {
    const hash = await sha256Hex(password || '');
    if (hash !== invite.passwordHash) throw new Error('password');
  }
  await setDoc(doc(db, 'trips', tripId, 'members', uid), {
    role: invite.role,
    name,
    email,
    joinedAt: serverTimestamp(),
    invitedBy: invite.createdBy,
  });
  await updateDoc(doc(db, 'trips', tripId), { memberIds: arrayUnion(uid) });
  return invite;
}

// Direct invite by email: creates a pending invite. If/when a user with a
// matching email signs in, checkPendingInvites() turns it into an in-app
// notification they can accept from the notification bell.
export async function invitePendingByEmail(tripId, { email, role, invitedBy, invitedByName, tripDestination }) {
  const normalized = email.trim().toLowerCase();
  await setDoc(doc(db, 'trips', tripId, 'pendingInvites', normalized), {
    email: normalized,
    role,
    invitedBy,
    invitedByName,
    tripDestination,
    invitedAt: serverTimestamp(),
  });
}

export async function checkPendingInvites(uid, email, _name) {
  if (!email) return;
  const cg = query(collectionGroup(db, 'pendingInvites'), where('email', '==', email.trim().toLowerCase()));
  const snap = await getDocs(cg);
  for (const d of snap.docs) {
    const data = d.data();
    if (data.notifiedAt) continue;
    const tripId = d.ref.parent.parent.id;
    await addDoc(collection(db, 'users', uid, 'notifications'), {
      type: 'invite',
      tripId,
      pendingInviteId: d.id,
      message: `${data.invitedByName || '누군가'}님이 "${data.tripDestination || '여행'}"에 초대했어요`,
      read: false,
      createdAt: serverTimestamp(),
    });
    await updateDoc(d.ref, { notifiedAt: serverTimestamp() });
  }
}

export async function acceptPendingInvite(tripId, pendingInviteId, { uid, name, email }) {
  const pendingRef = doc(db, 'trips', tripId, 'pendingInvites', pendingInviteId);
  const snap = await getDoc(pendingRef);
  if (!snap.exists()) throw new Error('gone');
  const { role, invitedBy } = snap.data();
  await setDoc(doc(db, 'trips', tripId, 'members', uid), { role, name, email, joinedAt: serverTimestamp(), invitedBy });
  await updateDoc(doc(db, 'trips', tripId), { memberIds: arrayUnion(uid) });
  await deleteDoc(pendingRef);
}
