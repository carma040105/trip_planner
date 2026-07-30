import { useState } from 'react';
import { useAuth } from '../store/AuthContext.jsx';
import { PROVIDER_META, FUEL_OPTIONS } from '../data/defaultData';

const MAP_PREF_ROWS = [
  { key: 'overseas', label: '해외 여행' },
  { key: 'domesticCar', label: '국내 자동차 여행' },
  { key: 'domesticBike', label: '국내 자전거 여행' },
];

export default function Settings() {
  const { authUser, profile, updateProfileFields, signOutUser } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  if (!profile) {
    return (
      <div className="screen" style={{ padding: '70px 20px' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>불러오는 중…</div>
      </div>
    );
  }

  const startEditName = () => {
    setNameDraft(profile.name || '');
    setEditingName(true);
  };

  const saveName = () => {
    const trimmed = nameDraft.trim();
    if (trimmed) updateProfileFields({ name: trimmed });
    setEditingName(false);
  };

  const mapPrefs = profile.mapPrefs || { overseas: 'google', domesticCar: 'naver', domesticBike: 'kakao' };

  return (
    <div className="screen">
      <div className="scroll-area" style={{ padding: '70px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              background: 'linear-gradient(135deg,#1B2B4B,#3A4E7A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 17,
              flexShrink: 0,
            }}
          >
            {(profile.name || '?')[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {editingName ? (
              <input
                autoFocus
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => e.key === 'Enter' && saveName()}
                style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy)', border: 'none', outline: 'none', background: 'var(--bg)', borderRadius: 8, padding: '4px 8px', width: '100%', boxSizing: 'border-box' }}
              />
            ) : (
              <div onClick={startEditName} style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy)', cursor: 'pointer' }}>
                {profile.name} <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>✏️</span>
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{authUser?.email}</div>
          </div>
        </div>

        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', marginBottom: 2 }}>🗺️ 지도 설정</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>여행 유형별 기본 지도 (지도 화면에 실제 반영돼요)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {MAP_PREF_ROWS.map((row) => (
              <div key={row.key}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>{row.label}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {Object.keys(PROVIDER_META).map((id) => {
                    const active = mapPrefs[row.key] === id;
                    const m = PROVIDER_META[id];
                    return (
                      <div
                        key={id}
                        onClick={() => updateProfileFields({ mapPrefs: { ...mapPrefs, [row.key]: id } })}
                        style={{
                          flex: 1,
                          textAlign: 'center',
                          padding: '8px 4px',
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 800,
                          background: active ? 'var(--navy)' : 'var(--bg)',
                          color: active ? '#fff' : 'var(--navy)',
                          cursor: 'pointer',
                        }}
                      >
                        {m.emoji} {m.short}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', marginBottom: 12 }}>🚗 사용 연료</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            {FUEL_OPTIONS.map((f) => {
              const active = profile.fuelType === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => updateProfileFields({ fuelType: f.id })}
                  style={{
                    textAlign: 'center',
                    padding: '8px 4px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 800,
                    background: active ? 'var(--coral)' : 'var(--bg)',
                    color: active ? '#fff' : 'var(--navy)',
                    cursor: 'pointer',
                  }}
                >
                  {f.emoji} {f.name}
                </div>
              );
            })}
          </div>
        </div>

        <div
          onClick={signOutUser}
          className="card"
          style={{ padding: 14, textAlign: 'center', fontSize: 13, fontWeight: 800, color: 'var(--coral)', cursor: 'pointer' }}
        >
          로그아웃
        </div>
      </div>
    </div>
  );
}
