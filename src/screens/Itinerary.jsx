import { useState } from 'react';
import { useTravel } from '../store/TravelContext.jsx';
import { tripTypeKey } from '../lib/mapProviders';
import StopMapPreview from '../components/StopMapPreview.jsx';

export default function Itinerary() {
  const { data, updateData, selectedTripId, selectedDay, setSelectedDay, setScreen } = useTravel();
  const [previewStop, setPreviewStop] = useState(null);

  const trip = data.trips.find((t) => t.id === selectedTripId);

  if (!trip) {
    return (
      <div className="screen" style={{ padding: '70px 20px' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>여행을 찾을 수 없어요.</div>
      </div>
    );
  }

  const dayStops = trip.days[selectedDay] || [];
  const activeProvider = data.mapPrefs[tripTypeKey(trip)] || 'google';

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
            onClick={() => setScreen('checklist')}
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
            ✅
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
            <div
              key={idx}
              className="card"
              onClick={() => setPreviewStop(s)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', cursor: 'pointer' }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--coral)', width: 44, flexShrink: 0 }}>{s.time}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)' }}>{s.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {s.category} · {s.stay}
                </div>
              </div>
              <div style={{ fontSize: 15, flexShrink: 0 }}>🧭</div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  removeStop(idx);
                }}
                style={{ fontSize: 14, color: '#c4cad6', padding: 4, cursor: 'pointer', flexShrink: 0 }}
              >
                ✕
              </div>
            </div>
          ))}
        </div>

        <div
          onClick={() => setScreen('map')}
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

      {previewStop && <StopMapPreview stop={previewStop} provider={activeProvider} onClose={() => setPreviewStop(null)} />}
    </div>
  );
}
