import { useState } from 'react';
import { useTravel } from '../store/TravelContext.jsx';
import { PROVIDER_META, FUEL_OPTIONS } from '../data/defaultData';

const MAP_PREF_ROWS = [
  { key: 'overseas', label: '해외 여행' },
  { key: 'domesticCar', label: '국내 자동차 여행' },
  { key: 'domesticBike', label: '국내 자전거 여행' },
];

export default function Settings() {
  const { data, updateData } = useTravel();
  const currentAccount = data.accounts.find((a) => a.id === data.currentAccountId) || data.accounts[0];
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const addAccount = () => {
    const name = window.prompt('추가할 계정 이름을 입력하세요 (가족·친구)');
    if (!name) return;
    const id = 'a' + Date.now();
    updateData((d) => ({ ...d, accounts: [...d.accounts, { id, name, email: name + '@myway.app' }] }));
  };

  const startEditName = () => {
    setNameDraft(currentAccount.name);
    setEditingName(true);
  };

  const saveName = () => {
    const trimmed = nameDraft.trim();
    if (trimmed) {
      updateData((d) => ({ ...d, accounts: d.accounts.map((a) => (a.id === currentAccount.id ? { ...a, name: trimmed } : a)) }));
    }
    setEditingName(false);
  };

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
            {currentAccount.name[0]}
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
                {currentAccount.name} <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>✏️</span>
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{currentAccount.email}</div>
          </div>
        </div>

        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', marginBottom: 10 }}>
            👥 계정 전환 <span style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: 11 }}>— 각자 로그인해야 본인 여행만 보여요</span>
          </div>
          {data.accounts.map((a) => {
            const active = a.id === data.currentAccountId;
            return (
              <div
                key={a.id}
                onClick={() => updateData((d) => ({ ...d, currentAccountId: a.id }))}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 4px', cursor: 'pointer' }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    background: active ? 'var(--coral)' : 'var(--navy)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {a.name[0]}
                </div>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{a.name}</div>
                <div style={{ fontSize: 11, color: active ? 'var(--coral)' : 'var(--text-muted)' }}>{active ? '사용 중' : '전환'}</div>
              </div>
            );
          })}
          <div onClick={addAccount} style={{ fontSize: 12, fontWeight: 700, color: 'var(--coral)', padding: '9px 4px', cursor: 'pointer' }}>
            + 계정 추가 (가족·친구)
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
                    const active = data.mapPrefs[row.key] === id;
                    const m = PROVIDER_META[id];
                    return (
                      <div
                        key={id}
                        onClick={() => updateData((d) => ({ ...d, mapPrefs: { ...d.mapPrefs, [row.key]: id } }))}
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
              const active = data.fuelType === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => updateData((d) => ({ ...d, fuelType: f.id }))}
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
      </div>
    </div>
  );
}
