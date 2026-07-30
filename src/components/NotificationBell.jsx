import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../store/AuthContext.jsx';
import { useTravel } from '../store/TravelContext.jsx';
import { acceptPendingInvite } from '../lib/invites';

function timeAgo(ts) {
  if (!ts) return '';
  const diffMs = Date.now() - ts.toMillis();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

export default function NotificationBell() {
  const { uid, authUser, profile } = useAuth();
  const { openTrip, showToast } = useTravel();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, 'users', uid, 'notifications'), orderBy('createdAt', 'desc'), limit(30));
    return onSnapshot(q, (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [uid]);

  const unread = items.filter((n) => !n.read).length;

  const markRead = (n) => updateDoc(doc(db, 'users', uid, 'notifications', n.id), { read: true });

  const openNotification = (n) => {
    markRead(n);
    if (n.type !== 'invite') {
      setOpen(false);
      if (n.tripId) openTrip(n.tripId);
    }
  };

  const respondInvite = async (n, accept) => {
    if (accept) {
      try {
        await acceptPendingInvite(n.tripId, n.pendingInviteId, {
          uid,
          name: profile?.name || '',
          email: authUser?.email || '',
        });
        showToast('여행에 참여했어요');
        markRead(n);
        setOpen(false);
        openTrip(n.tripId);
        return;
      } catch {
        showToast('초대가 만료되었거나 이미 처리됐어요');
      }
    }
    markRead(n);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          background: '#fff',
          boxShadow: 'var(--shadow-flat)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 15,
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        🔔
        {unread > 0 && (
          <div
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 15,
              height: 15,
              borderRadius: 8,
              background: 'var(--coral)',
              color: '#fff',
              fontSize: 9,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {unread > 9 ? '9+' : unread}
          </div>
        )}
      </div>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 60 }} />
          <div
            style={{
              position: 'absolute',
              top: 40,
              right: 0,
              width: 280,
              maxHeight: 360,
              overflowY: 'auto',
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 10px 26px rgba(27,43,75,0.25)',
              zIndex: 61,
              padding: 8,
            }}
          >
            {items.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: '20px 0' }}>
                알림이 없어요.
              </div>
            )}
            {items.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: '10px 10px',
                  borderRadius: 12,
                  background: n.read ? 'transparent' : 'var(--bg)',
                  marginBottom: 2,
                }}
              >
                <div onClick={() => openNotification(n)} style={{ fontSize: 12, color: 'var(--navy)', cursor: 'pointer', lineHeight: 1.4 }}>
                  {n.message}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{timeAgo(n.createdAt)}</div>
                {n.type === 'invite' && !n.read && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <div
                      onClick={() => respondInvite(n, true)}
                      style={{ flex: 1, textAlign: 'center', padding: 7, borderRadius: 10, background: 'var(--coral)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                    >
                      수락
                    </div>
                    <div
                      onClick={() => respondInvite(n, false)}
                      style={{ flex: 1, textAlign: 'center', padding: 7, borderRadius: 10, background: 'var(--bg)', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                    >
                      거절
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
