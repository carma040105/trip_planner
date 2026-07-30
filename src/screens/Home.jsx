import { useRef, useState } from 'react';
import { useTravel } from '../store/TravelContext.jsx';
import { useAuth } from '../store/AuthContext.jsx';
import { GRADIENTS } from '../data/defaultData';
import { resizeImageFile } from '../lib/imageUtils';
import { isOwner } from '../lib/permissions';
import NewTripSheet from '../components/NewTripSheet.jsx';
import NotificationBell from '../components/NotificationBell.jsx';

function countryLabel(trip) {
  if (trip.country === 'overseas') return '🌍 해외';
  return trip.transport === 'bike' ? '🚴 국내 · 자전거' : '🚗 국내 · 자동차';
}

export default function Home() {
  const { data, updateTrip, deleteTrip, openTrip, tripsLoading } = useTravel();
  const { uid, profile } = useAuth();
  const [openMenuTripId, setOpenMenuTripId] = useState(null);
  const [showNewTrip, setShowNewTrip] = useState(false);
  const photoInputRef = useRef(null);
  const photoTargetTripId = useRef(null);

  const removeTrip = (e, trip) => {
    e.stopPropagation();
    if (!window.confirm('이 여행을 삭제할까요? 모든 참여자에게서 사라져요.')) return;
    deleteTrip(trip.id);
    setOpenMenuTripId(null);
  };

  const startPhotoChange = (e, trip) => {
    e.stopPropagation();
    photoTargetTripId.current = trip.id;
    setOpenMenuTripId(null);
    photoInputRef.current?.click();
  };

  const onPhotoSelected = async (e) => {
    const file = e.target.files?.[0];
    const tripId = photoTargetTripId.current;
    e.target.value = '';
    if (!file || !tripId) return;
    try {
      const dataUrl = await resizeImageFile(file);
      updateTrip(tripId, (t) => ({ ...t, coverImage: dataUrl }));
    } catch {
      window.alert('사진을 처리하지 못했어요. 다른 사진으로 시도해주세요.');
    }
  };

  return (
    <div className="screen">
      <input ref={photoInputRef} type="file" accept="image/*" onChange={onPhotoSelected} style={{ display: 'none' }} />
      <div className="scroll-area" style={{ padding: '70px 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)' }}>내 여행</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{profile?.name || ''} 님</div>
            <NotificationBell />
          </div>
        </div>

        {!tripsLoading && data.trips.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '60px 0' }}>
            아직 만든 여행이 없어요.
            <br />
            오른쪽 아래 + 를 눌러 시작해보세요.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {data.trips.map((t, i) => {
            const stopCount = (t.days || []).reduce((n, d) => n + (d.stops?.length || 0), 0);
            const menuOpen = openMenuTripId === t.id;
            const memberCount = (t.memberIds || []).length;
            const iOwn = isOwner(t, uid);
            return (
              <div key={t.id} className="card" style={{ overflow: 'hidden', position: 'relative' }}>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuTripId(menuOpen ? null : t.id);
                  }}
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    background: 'rgba(27,43,75,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                    cursor: 'pointer',
                  }}
                >
                  <svg width="3" height="13" viewBox="0 0 3 13">
                    <circle cx="1.5" cy="1.5" r="1.5" fill="#fff" />
                    <circle cx="1.5" cy="6.5" r="1.5" fill="#fff" />
                    <circle cx="1.5" cy="11.5" r="1.5" fill="#fff" />
                  </svg>
                </div>

                {menuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 40,
                      right: 10,
                      background: 'var(--navy)',
                      borderRadius: 14,
                      padding: 6,
                      zIndex: 3,
                      boxShadow: '0 6px 16px rgba(27,43,75,0.3)',
                    }}
                  >
                    <div
                      onClick={(e) => startPhotoChange(e, t)}
                      style={{ padding: '9px 14px', fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', cursor: 'pointer' }}
                    >
                      {t.coverImage ? '대표 사진 변경' : '대표 사진 추가'}
                    </div>
                    {iOwn && (
                      <div
                        onClick={(e) => removeTrip(e, t)}
                        style={{ padding: '9px 14px', fontSize: 12, fontWeight: 700, color: '#ff9a9a', whiteSpace: 'nowrap', cursor: 'pointer' }}
                      >
                        삭제
                      </div>
                    )}
                  </div>
                )}

                <div
                  onClick={() => openTrip(t.id)}
                  style={{
                    height: 150,
                    background: t.coverImage ? `url(${t.coverImage}) center/cover no-repeat` : GRADIENTS[i % GRADIENTS.length],
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: 12,
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div
                      style={{
                        background: 'rgba(27,43,75,0.7)',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '4px 9px',
                        borderRadius: 99,
                      }}
                    >
                      {memberCount > 1 ? `👥 ${memberCount}명` : '🔒 나만'}
                    </div>
                  </div>

                  {!t.coverImage && (
                    <div
                      onClick={(e) => startPhotoChange(e, t)}
                      style={{
                        alignSelf: 'center',
                        textAlign: 'center',
                        color: 'rgba(255,255,255,0.95)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: 26, marginBottom: 2 }}>📷</div>
                      <div style={{ fontSize: 11, fontWeight: 700, background: 'rgba(27,43,75,0.35)', padding: '3px 10px', borderRadius: 99 }}>
                        대표 사진 추가
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#fff',
                      background: 'rgba(27,43,75,0.55)',
                      alignSelf: 'flex-start',
                      padding: '4px 9px',
                      borderRadius: 99,
                      textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    }}
                  >
                    {countryLabel(t)}
                  </div>
                </div>
                <div onClick={() => openTrip(t.id)} style={{ padding: '14px 16px', cursor: 'pointer' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', marginBottom: 3 }}>{t.destination}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {t.dateLabel} · {stopCount}곳
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        onClick={() => setShowNewTrip(true)}
        style={{
          position: 'absolute',
          right: 20,
          bottom: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          background: 'var(--coral)',
          boxShadow: '8px 8px 18px rgba(255,107,107,0.5), -5px -5px 12px rgba(255,180,180,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 25,
          cursor: 'pointer',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      </div>

      {showNewTrip && <NewTripSheet onClose={() => setShowNewTrip(false)} />}
    </div>
  );
}
