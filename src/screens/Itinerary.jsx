import { useState } from 'react';
import { useTravel } from '../store/TravelContext.jsx';

const BLANK_STOP = { time: '', name: '', category: '', stay: '' };

export default function Itinerary() {
  const { data, updateData, selectedTripId, selectedDay, setSelectedDay, setScreen } = useTravel();
  const [showNewStop, setShowNewStop] = useState(false);
  const [stopForm, setStopForm] = useState(BLANK_STOP);

  const trip = data.trips.find((t) => t.id === selectedTripId);

  if (!trip) {
    return (
      <div className="screen" style={{ padding: '70px 20px' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>여행을 찾을 수 없어요.</div>
      </div>
    );
  }

  const dayStops = trip.days[selectedDay] || [];

  const removeStop = (idx) => {
    updateData((d) => ({
      ...d,
      trips: d.trips.map((t2) =>
        t2.id === trip.id
          ? { ...t2, days: t2.days.map((day, di) => (di === selectedDay ? day.filter((_, i2) => i2 !== idx) : day)) }
          : t2
      ),
    }));
  };

  const addStop = () => {
    if (!stopForm.name.trim()) return;
    updateData((d) => ({
      ...d,
      trips: d.trips.map((t2) =>
        t2.id === trip.id ? { ...t2, days: t2.days.map((day, di) => (di === selectedDay ? [...day, { ...stopForm }] : day)) } : t2
      ),
    }));
    setStopForm(BLANK_STOP);
    setShowNewStop(false);
  };

  return (
    <div className="screen">
      <div className="scroll-area" style={{ padding: '70px 20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div onClick={() => setScreen('home')} style={{ padding: 4, cursor: 'pointer' }}>
            <svg width="10" height="18" viewBox="0 0 10 18">
              <path d="M8.5 1.5L2 9l6.5 7.5" stroke="var(--navy)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--navy)', flex: 1 }}>{trip.destination}</div>
          <div
            onClick={() => setScreen('map')}
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
            }}
          >
            🗺️
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 24, marginBottom: 12 }}>{trip.dateLabel}</div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12 }}>
          {trip.days.map((_, i) => (
            <div
              key={i}
              onClick={() => setSelectedDay(i)}
              className={`chip coral${i === selectedDay ? ' active' : ''}`}
              style={{ flexShrink: 0, padding: '8px 16px' }}
            >
              Day {i + 1}
            </div>
          ))}
        </div>

        {dayStops.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '30px 0' }}>
            이 날에는 아직 일정이 없어요.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {dayStops.map((s, idx) => (
            <div key={idx} className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--coral)', width: 44, flexShrink: 0 }}>{s.time}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)' }}>{s.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {s.category} · {s.stay}
                </div>
              </div>
              <div onClick={() => removeStop(idx)} style={{ fontSize: 14, color: '#c4cad6', padding: 4, cursor: 'pointer' }}>
                ✕
              </div>
            </div>
          ))}
        </div>

        {showNewStop && (
          <div className="card" style={{ padding: 14, marginTop: 12 }}>
            <input
              type="text"
              value={stopForm.time}
              onChange={(e) => setStopForm((f) => ({ ...f, time: e.target.value }))}
              placeholder="시간 (예: 09:00)"
              style={inputStyle}
            />
            <input
              type="text"
              value={stopForm.name}
              onChange={(e) => setStopForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="장소 이름"
              style={inputStyle}
            />
            <input
              type="text"
              value={stopForm.category}
              onChange={(e) => setStopForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="분류 (예: 식당)"
              style={inputStyle}
            />
            <input
              type="text"
              value={stopForm.stay}
              onChange={(e) => setStopForm((f) => ({ ...f, stay: e.target.value }))}
              placeholder="체류시간 (예: 1시간)"
              style={{ ...inputStyle, marginBottom: 10 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <div
                onClick={() => {
                  setShowNewStop(false);
                  setStopForm(BLANK_STOP);
                }}
                style={{ flex: 1, textAlign: 'center', padding: 11, borderRadius: 12, background: 'var(--bg)', color: 'var(--text-muted)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                취소
              </div>
              <div
                onClick={addStop}
                style={{ flex: 1, textAlign: 'center', padding: 11, borderRadius: 12, background: 'var(--coral)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                추가
              </div>
            </div>
          </div>
        )}

        <div
          onClick={() => setShowNewStop(true)}
          style={{
            marginTop: 12,
            border: '1.5px dashed var(--coral)',
            borderRadius: 16,
            padding: 13,
            textAlign: 'center',
            color: 'var(--coral)',
            fontSize: 14,
            fontWeight: 700,
            background: 'rgba(255,107,107,0.05)',
            cursor: 'pointer',
          }}
        >
          + 장소 추가
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  border: 'none',
  outline: 'none',
  background: 'var(--bg)',
  borderRadius: 12,
  padding: '10px 12px',
  fontSize: 13,
  marginBottom: 8,
  boxSizing: 'border-box',
};
