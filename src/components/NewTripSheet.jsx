import { useState } from 'react';
import { useTravel } from '../store/TravelContext.jsx';

const BLANK = { destination: '', dateLabel: '', country: 'overseas', transport: null, nights: 3 };

export default function NewTripSheet({ onClose }) {
  const { data, updateData, openTrip } = useTravel();
  const [form, setForm] = useState(BLANK);

  const setCountry = (country) =>
    setForm((f) => ({ ...f, country, transport: country === 'overseas' ? null : f.transport || 'car' }));

  const createTrip = () => {
    if (!form.destination.trim()) return;
    const id = 't' + Date.now();
    const days = Array.from({ length: form.nights + 1 }, () => []);
    const trip = {
      id,
      ownerId: data.currentAccountId,
      destination: form.destination,
      dateLabel: form.dateLabel || '날짜 미정',
      country: form.country,
      transport: form.transport,
      private: true,
      days,
    };
    updateData((d) => ({ ...d, trips: [...d.trips, trip], lastTripId: id }));
    setForm(BLANK);
    onClose();
    openTrip(id);
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(27,43,75,0.45)', zIndex: 40 }}
      />
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
        }}
      >
        <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy)', marginBottom: 14 }}>새 여행 만들기</div>

        <input
          type="text"
          value={form.destination}
          onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
          placeholder="여행지 (예: 도쿄)"
          style={{
            width: '100%',
            border: 'none',
            outline: 'none',
            background: 'var(--bg)',
            borderRadius: 14,
            padding: '12px 14px',
            fontSize: 14,
            marginBottom: 10,
          }}
        />
        <input
          type="text"
          value={form.dateLabel}
          onChange={(e) => setForm((f) => ({ ...f, dateLabel: e.target.value }))}
          placeholder="날짜 (예: 2026.3.28 – 4.2)"
          style={{
            width: '100%',
            border: 'none',
            outline: 'none',
            background: 'var(--bg)',
            borderRadius: 14,
            padding: '12px 14px',
            fontSize: 14,
            marginBottom: 10,
          }}
        />

        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {[
            { id: 'overseas', label: '해외' },
            { id: 'domestic', label: '국내' },
          ].map((o) => (
            <div key={o.id} className={`chip${form.country === o.id ? ' active' : ''}`} style={{ flex: 1 }} onClick={() => setCountry(o.id)}>
              {o.label}
            </div>
          ))}
        </div>

        {form.country === 'domestic' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {[
              { id: 'car', label: '🚗 자동차' },
              { id: 'bike', label: '🚴 자전거' },
            ].map((o) => (
              <div
                key={o.id}
                className={`chip${form.transport === o.id ? ' active' : ''}`}
                style={{ flex: 1 }}
                onClick={() => setForm((f) => ({ ...f, transport: o.id }))}
              >
                {o.label}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>숙박 일수</div>
          <div
            onClick={() => setForm((f) => ({ ...f, nights: Math.max(1, f.nights - 1) }))}
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              background: 'var(--bg)',
              textAlign: 'center',
              lineHeight: '30px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            −
          </div>
          <div style={{ fontSize: 14, fontWeight: 800 }}>{form.nights}박</div>
          <div
            onClick={() => setForm((f) => ({ ...f, nights: f.nights + 1 }))}
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              background: 'var(--bg)',
              textAlign: 'center',
              lineHeight: '30px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            +
          </div>
        </div>

        <button className="btn-primary" onClick={createTrip}>
          여행 만들기
        </button>
      </div>
    </>
  );
}
