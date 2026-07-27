import { useTravel } from '../store/TravelContext.jsx';
import { PROVIDER_META } from '../data/defaultData';
import { tripTypeKey, googleEmbedUrl } from '../lib/mapProviders';

export default function MapScreen() {
  const { data, selectedTripId, mapProviderOverride, setMapProviderOverride, setScreen } = useTravel();
  const trip = data.trips.find((t) => t.id === selectedTripId);

  const typeKey = tripTypeKey(trip);
  const activeProvider = mapProviderOverride || data.mapPrefs[typeKey] || 'google';
  const meta = PROVIDER_META[activeProvider];

  return (
    <div className="screen" style={{ background: '#e7ede6', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 18, left: 20, right: 20, zIndex: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          onClick={() => setScreen('itinerary')}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            background: '#fff',
            boxShadow: '4px 4px 8px rgba(27,43,75,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            cursor: 'pointer',
          }}
        >
          <svg width="9" height="16" viewBox="0 0 9 16">
            <path d="M7.5 1.5L1.5 8l6 6.5" stroke="var(--navy)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
        <div
          style={{
            flex: 1,
            background: '#fff',
            borderRadius: 99,
            padding: '10px 16px',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--navy)',
            boxShadow: '4px 4px 10px rgba(27,43,75,0.15)',
          }}
        >
          {trip ? trip.destination : '여행을 선택하세요'}
        </div>
      </div>

      <div style={{ position: 'absolute', top: 64, left: 20, right: 20, display: 'flex', gap: 6, zIndex: 10 }}>
        {Object.keys(PROVIDER_META).map((id) => {
          const active = id === activeProvider;
          const m = PROVIDER_META[id];
          return (
            <div
              key={id}
              onClick={() => setMapProviderOverride(id)}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '8px 4px',
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 800,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                background: active ? 'var(--navy)' : 'rgba(255,255,255,0.92)',
                color: active ? '#fff' : 'var(--navy)',
                boxShadow: '4px 4px 8px rgba(27,43,75,0.12)',
                cursor: 'pointer',
              }}
            >
              {m.emoji} {m.short}
            </div>
          );
        })}
      </div>

      {activeProvider === 'google' && trip && (
        <iframe
          title="Google Map"
          src={googleEmbedUrl(trip.destination)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          loading="lazy"
        />
      )}

      {activeProvider !== 'google' && (
        <div style={{ position: 'absolute', inset: 0, top: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 30, marginBottom: 10 }}>{meta.emoji}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', marginBottom: 6 }}>{meta.name} 연동 필요</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              이 지도를 표시하려면
              <br />
              {meta.name} API 키를 연결해주세요.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
