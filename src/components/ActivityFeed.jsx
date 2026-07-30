import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';

const TYPE_ICON = {
  stop_add: '📍',
  stop_edit: '✏️',
  stop_remove: '🗑️',
  checklist_add: '📝',
  checklist_done: '✔️',
  member_join: '👋',
  role_change: '🔑',
  comment: '💬',
  invite: '✉️',
  proposal: '💡',
  proposal_approved: '✅',
  proposal_rejected: '🚫',
};

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

export default function ActivityFeed({ tripId, onClose }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!tripId) return;
    const q = query(collection(db, 'trips', tripId, 'activity'), orderBy('createdAt', 'desc'), limit(50));
    return onSnapshot(q, (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [tripId]);

  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(27,43,75,0.45)', zIndex: 40 }} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          background: '#fff',
          borderRadius: '24px 24px 0 0',
          padding: '20px 20px 34px',
          zIndex: 41,
          boxShadow: '0 -10px 26px rgba(27,43,75,0.2)',
          maxHeight: '75%',
          overflowY: 'auto',
        }}
      >
        <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy)', marginBottom: 14 }}>활동 내역</div>

        {items.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '30px 0' }}>
            아직 활동 내역이 없어요.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.map((it) => (
            <div key={it.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 2px' }}>
              <div style={{ fontSize: 16, flexShrink: 0 }}>{TYPE_ICON[it.type] || '•'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--navy)' }}>
                  <span style={{ fontWeight: 800 }}>{it.authorName}</span>님 {it.message}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{timeAgo(it.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
