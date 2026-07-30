import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../store/AuthContext.jsx';
import { useTravel } from '../store/TravelContext.jsx';
import { fetchInvite, redeemInvite } from '../lib/invites';
import { logActivity } from '../lib/activity';

export default function AcceptInvite({ token, onDone }) {
  const { uid, authUser, profile } = useAuth();
  const { openTrip, showToast } = useTravel();
  const [invite, setInvite] = useState(undefined); // undefined = loading, null = not found
  const [tripInfo, setTripInfo] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [tripId, inviteId] = (token || '').split('_');

  useEffect(() => {
    if (!tripId || !inviteId) {
      setInvite(null);
      return;
    }
    (async () => {
      const inv = await fetchInvite(tripId, inviteId);
      setInvite(inv);
      if (inv) {
        const tripSnap = await getDoc(doc(db, 'trips', tripId));
        if (tripSnap.exists()) setTripInfo(tripSnap.data());
      }
    })();
  }, [tripId, inviteId]);

  const join = async () => {
    setBusy(true);
    setError('');
    try {
      await redeemInvite(tripId, inviteId, {
        uid,
        name: profile?.name || '',
        email: authUser?.email || '',
        password,
      });
      await logActivity(tripId, {
        authorId: uid,
        authorName: profile?.name || '',
        type: 'member_join',
        message: '여행에 참여했어요',
      });
      showToast('여행에 참여했어요');
      onDone();
      openTrip(tripId);
    } catch (e) {
      if (e.message === 'expired') setError('초대 링크가 만료됐어요.');
      else if (e.message === 'password') setError('비밀번호가 올바르지 않아요.');
      else setError('유효하지 않은 초대 링크예요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 30 }}>
      <div className="card" style={{ padding: 24, width: '100%', textAlign: 'center' }}>
        {invite === undefined && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>초대 확인 중…</div>}

        {invite === null && (
          <>
            <div style={{ fontSize: 30, marginBottom: 10 }}>🔗</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', marginBottom: 6 }}>유효하지 않은 초대예요</div>
            <div onClick={onDone} style={{ marginTop: 14, fontSize: 12, fontWeight: 700, color: 'var(--coral)', cursor: 'pointer' }}>
              닫기
            </div>
          </>
        )}

        {invite && (
          <>
            <div style={{ fontSize: 30, marginBottom: 10 }}>✈️</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>
              {tripInfo?.destination || '여행'}에 초대되었어요
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>{invite.createdByName}님이 초대했어요</div>

            {invite.passwordHash && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                style={{ width: '100%', boxSizing: 'border-box', border: 'none', outline: 'none', background: 'var(--bg)', borderRadius: 14, padding: '12px 14px', fontSize: 14, marginBottom: 10 }}
              />
            )}

            {error && <div style={{ fontSize: 12, color: 'var(--coral)', fontWeight: 700, marginBottom: 10 }}>{error}</div>}

            <button className="btn-primary" onClick={join} disabled={busy}>
              {busy ? '참여하는 중…' : '여행 참여하기'}
            </button>
            <div onClick={onDone} style={{ marginTop: 12, fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer' }}>
              나중에
            </div>
          </>
        )}
      </div>
    </div>
  );
}
