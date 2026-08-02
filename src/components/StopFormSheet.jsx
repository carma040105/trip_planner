import TimeStaySection from './TimeStaySection.jsx';
import { AssigneeRow } from './AssigneePicker.jsx';

export const TRANSPORT_MODES = [
  { id: 'flight', label: '✈️ 항공' },
  { id: 'ship', label: '🚢 선박' },
  { id: 'car', label: '🚗 차량' },
];

export const DEFAULT_STOP_FIELDS = {
  time: '09:00',
  name: '',
  category: '',
  stay: '1시간',
  assigneeId: null,
  type: 'place',
  transportMode: null,
  rentalCompany: null,
  cost: null,
};

export function canSaveStop(value) {
  if (value.type === 'transport') return Boolean(value.transportMode);
  return Boolean(value.name && value.name.trim());
}

// Shared add/edit form for an itinerary entry — either a place, or a
// transport leg (flight/ship/car, with rental company when it's a car).
// Controlled: `value`/`onChange` hold the in-progress form state so the
// caller can also push in async updates (e.g. reverse-geocoded names).
export default function StopFormSheet({ title, saveLabel, value, onChange, members, showAssignee, onSave, onClose }) {
  const set = (fields) => onChange({ ...value, ...fields });
  const isTransport = value.type === 'transport';
  const ready = canSaveStop(value);

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
          maxHeight: '85%',
          overflowY: 'auto',
        }}
      >
        <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy)', marginBottom: 14 }}>{title}</div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <div className={`chip${!isTransport ? ' active' : ''}`} style={{ flex: 1 }} onClick={() => set({ type: 'place' })}>
            📍 장소
          </div>
          <div
            className={`chip${isTransport ? ' active' : ''}`}
            style={{ flex: 1 }}
            onClick={() => set({ type: 'transport', category: '' })}
          >
            🚗 이동수단
          </div>
        </div>

        {isTransport ? (
          <>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {TRANSPORT_MODES.map((m) => (
                <div
                  key={m.id}
                  className={`chip${value.transportMode === m.id ? ' active' : ''}`}
                  style={{ flex: 1, fontSize: 12, padding: '8px 4px' }}
                  onClick={() => set({ transportMode: m.id, rentalCompany: m.id === 'car' ? value.rentalCompany : null })}
                >
                  {m.label}
                </div>
              ))}
            </div>
            <input
              type="text"
              value={value.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="예: KE001, 인천 → 나리타 (선택)"
              style={inputStyle}
            />
            {value.transportMode === 'car' && (
              <input
                type="text"
                value={value.rentalCompany || ''}
                onChange={(e) => set({ rentalCompany: e.target.value })}
                placeholder="렌트카 업체 (예: 롯데렌터카)"
                style={inputStyle}
              />
            )}
          </>
        ) : (
          <>
            <input
              type="text"
              value={value.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="장소 이름 (자동으로 채워지면 직접 수정 가능)"
              style={inputStyle}
            />
            <input
              type="text"
              value={value.category}
              onChange={(e) => set({ category: e.target.value })}
              placeholder="분류 (예: 식당)"
              style={inputStyle}
            />
          </>
        )}

        <input
          type="number"
          inputMode="numeric"
          value={value.cost ?? ''}
          onChange={(e) => set({ cost: e.target.value === '' ? null : Number(e.target.value) })}
          placeholder="비용 (선택, 원)"
          style={{ ...inputStyle, marginBottom: 14 }}
        />

        <TimeStaySection time={value.time} stay={value.stay} onChange={({ time, stay }) => set({ time, stay })} />

        {showAssignee && (
          <div style={{ marginTop: 14, marginBottom: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>담당자</div>
            <AssigneeRow members={members} value={value.assigneeId} onSelect={(id) => set({ assigneeId: id })} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <div
            onClick={onClose}
            style={{ flex: 1, textAlign: 'center', padding: 14, borderRadius: 14, background: 'var(--bg)', color: 'var(--text-muted)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
          >
            취소
          </div>
          <div
            onClick={() => ready && onSave(value)}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: 14,
              borderRadius: 14,
              background: 'var(--coral)',
              color: '#fff',
              fontWeight: 800,
              fontSize: 14,
              cursor: ready ? 'pointer' : 'default',
              opacity: ready ? 1 : 0.5,
            }}
          >
            {saveLabel}
          </div>
        </div>
      </div>
    </>
  );
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  border: 'none',
  outline: 'none',
  background: 'var(--bg)',
  borderRadius: 14,
  padding: '12px 14px',
  fontSize: 14,
  marginBottom: 10,
};
