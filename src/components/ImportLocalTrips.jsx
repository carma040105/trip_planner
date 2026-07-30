import { useEffect, useState } from 'react';
import { useTravel } from '../store/TravelContext.jsx';
import { readLegacyLocalTrips, clearLegacyLocalData } from '../lib/localImport';

const PROMPTED_KEY = 'myway_import_prompted_v1';

export default function ImportLocalTrips() {
  const { createTrip, showToast } = useTravel();
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(PROMPTED_KEY)) return;
    const legacy = readLegacyLocalTrips();
    if (legacy.length > 0) setPending(legacy);
  }, []);

  const dismiss = () => {
    localStorage.setItem(PROMPTED_KEY, '1');
    setPending(null);
  };

  const importAll = async () => {
    setBusy(true);
    try {
      for (const t of pending) {
        await createTrip({
          destination: t.destination,
          dateLabel: t.dateLabel,
          country: t.country || 'overseas',
          transport: t.transport || null,
          coverImage: t.coverImage || null,
          days: (t.days || []).map((day) => day.map((s) => ({ ...s, id: s.id || crypto.randomUUID() }))),
          checklist: (t.checklist || []).map((c) => ({ ...c, assigneeId: null, doneBy: null, doneAt: null })),
        });
      }
      clearLegacyLocalData();
      showToast(`여행 ${pending.length}개를 가져왔어요`);
    } catch {
      showToast('가져오기에 실패했어요');
    } finally {
      setBusy(false);
      dismiss();
    }
  };

  if (!pending) return null;

  return (
    <>
      <div onClick={dismiss} style={{ position: 'absolute', inset: 0, background: 'rgba(27,43,75,0.45)', zIndex: 50 }} />
      <div
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          top: '36%',
          background: '#fff',
          borderRadius: 20,
          padding: 22,
          zIndex: 51,
          boxShadow: '0 12px 30px rgba(27,43,75,0.3)',
        }}
      >
        <div style={{ fontSize: 26, marginBottom: 10, textAlign: 'center' }}>📦</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)', textAlign: 'center', marginBottom: 6 }}>
          이 기기에 저장된 여행 {pending.length}개를 발견했어요
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 18, lineHeight: 1.5 }}>
          내 계정으로 가져오면 다른 기기에서도 보이고, 친구를 초대할 수 있어요.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div
            onClick={dismiss}
            style={{ flex: 1, textAlign: 'center', padding: 13, borderRadius: 14, background: 'var(--bg)', color: 'var(--text-muted)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >
            건너뛰기
          </div>
          <div
            onClick={busy ? undefined : importAll}
            style={{ flex: 1, textAlign: 'center', padding: 13, borderRadius: 14, background: 'var(--coral)', color: '#fff', fontWeight: 800, fontSize: 13, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}
          >
            {busy ? '가져오는 중…' : '가져오기'}
          </div>
        </div>
      </div>
    </>
  );
}
