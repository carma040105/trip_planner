import { useEffect, useRef, useState } from 'react';
import { useTravel } from '../store/TravelContext.jsx';
import { PROVIDER_META } from '../data/defaultData';
import { tripTypeKey, googleEmbedUrl } from '../lib/mapProviders';
import { KAKAO_MAP_KEY, NAVER_MAP_CLIENT_ID } from '../lib/mapKeys';
import { loadKakaoMaps, loadNaverMaps } from '../lib/mapSdkLoader';

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }; // Seoul, fallback when destination geocoding fails/unavailable

export default function MapScreen() {
  const { data, updateData, selectedTripId, selectedDay, mapProviderOverride, setMapProviderOverride, setScreen, showToast } =
    useTravel();
  const trip = data.trips.find((t) => t.id === selectedTripId);

  const typeKey = tripTypeKey(trip);
  const activeProvider = mapProviderOverride || data.mapPrefs[typeKey] || 'google';
  const meta = PROVIDER_META[activeProvider];
  const providerKeyMissing = (activeProvider === 'kakao' && !KAKAO_MAP_KEY) || (activeProvider === 'naver' && !NAVER_MAP_CLIENT_ID);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [sdkError, setSdkError] = useState(false);
  const [pendingStop, setPendingStop] = useState(null); // { lat, lng }
  const [stopForm, setStopForm] = useState({ time: '', name: '', category: '', stay: '' });

  useEffect(() => {
    setSdkError(false);
    mapInstanceRef.current = null;
    if (activeProvider === 'kakao' && KAKAO_MAP_KEY && mapContainerRef.current) {
      let cancelled = false;
      loadKakaoMaps(KAKAO_MAP_KEY)
        .then((kakao) => {
          if (cancelled || !mapContainerRef.current) return;
          const map = new kakao.maps.Map(mapContainerRef.current, {
            center: new kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
            level: 6,
          });
          mapInstanceRef.current = map;

          if (trip?.destination && kakao.maps.services) {
            const geocoder = new kakao.maps.services.Geocoder();
            geocoder.addressSearch(trip.destination, (results, status) => {
              if (status === kakao.maps.services.Status.OK && results[0]) {
                const coords = new kakao.maps.LatLng(results[0].y, results[0].x);
                map.setCenter(coords);
              }
            });
          }

          kakao.maps.event.addListener(map, 'click', (e) => {
            setPendingStop({ lat: e.latLng.getLat(), lng: e.latLng.getLng() });
          });
        })
        .catch(() => !cancelled && setSdkError(true));
      return () => {
        cancelled = true;
      };
    }

    if (activeProvider === 'naver' && NAVER_MAP_CLIENT_ID && mapContainerRef.current) {
      let cancelled = false;
      loadNaverMaps(NAVER_MAP_CLIENT_ID)
        .then((naver) => {
          if (cancelled || !mapContainerRef.current) return;
          const map = new naver.maps.Map(mapContainerRef.current, {
            center: new naver.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
            zoom: 12,
          });
          mapInstanceRef.current = map;

          if (trip?.destination && naver.maps.Service) {
            naver.maps.Service.geocode({ query: trip.destination }, (status, response) => {
              if (status === naver.maps.Service.Status.OK && response.v2.addresses[0]) {
                const addr = response.v2.addresses[0];
                map.setCenter(new naver.maps.LatLng(addr.y, addr.x));
              }
            });
          }

          naver.maps.Event.addListener(map, 'click', (e) => {
            setPendingStop({ lat: e.coord.lat(), lng: e.coord.lng() });
          });
        })
        .catch(() => !cancelled && setSdkError(true));
      return () => {
        cancelled = true;
      };
    }
  }, [activeProvider, trip?.destination]);

  useEffect(() => {
    if (pendingStop) {
      setStopForm({ time: '', name: `지도에서 선택한 장소 (${pendingStop.lat.toFixed(5)}, ${pendingStop.lng.toFixed(5)})`, category: '', stay: '' });
    }
  }, [pendingStop]);

  const addPendingStop = () => {
    if (!trip || !stopForm.name.trim()) return;
    updateData((d) => ({
      ...d,
      trips: d.trips.map((t2) =>
        t2.id === trip.id ? { ...t2, days: t2.days.map((day, di) => (di === selectedDay ? [...day, { ...stopForm }] : day)) } : t2
      ),
    }));
    setPendingStop(null);
    showToast('일정에 장소를 추가했어요');
  };

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

      {(activeProvider === 'kakao' || activeProvider === 'naver') && !providerKeyMissing && !sdkError && (
        <>
          <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
          <div
            style={{
              position: 'absolute',
              bottom: 24,
              left: 20,
              right: 20,
              textAlign: 'center',
              background: 'rgba(27,43,75,0.85)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              padding: '8px 12px',
              borderRadius: 99,
              zIndex: 10,
            }}
          >
            지도를 탭하면 그 위치를 일정에 추가할 수 있어요
          </div>
        </>
      )}

      {(providerKeyMissing || sdkError) && activeProvider !== 'google' && (
        <div style={{ position: 'absolute', inset: 0, top: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 30, marginBottom: 10 }}>{meta.emoji}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', marginBottom: 6 }}>{meta.name} 연동 필요</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {sdkError
                ? '지도를 불러오지 못했어요. API 키/도메인 등록을 확인해주세요.'
                : (
                  <>
                    이 지도를 표시하려면
                    <br />
                    {meta.name} API 키를 연결해주세요.
                  </>
                )}
            </div>
          </div>
        </div>
      )}

      {pendingStop && (
        <>
          <div onClick={() => setPendingStop(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(27,43,75,0.45)', zIndex: 40 }} />
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
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy)', marginBottom: 14 }}>일정에 장소 추가</div>
            <input
              type="text"
              value={stopForm.name}
              onChange={(e) => setStopForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="장소 이름"
              style={{ width: '100%', boxSizing: 'border-box', border: 'none', outline: 'none', background: 'var(--bg)', borderRadius: 14, padding: '12px 14px', fontSize: 14, marginBottom: 10 }}
            />
            <input
              type="text"
              value={stopForm.time}
              onChange={(e) => setStopForm((f) => ({ ...f, time: e.target.value }))}
              placeholder="시간 (예: 09:00)"
              style={{ width: '100%', boxSizing: 'border-box', border: 'none', outline: 'none', background: 'var(--bg)', borderRadius: 14, padding: '12px 14px', fontSize: 14, marginBottom: 10 }}
            />
            <input
              type="text"
              value={stopForm.category}
              onChange={(e) => setStopForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="분류 (예: 식당)"
              style={{ width: '100%', boxSizing: 'border-box', border: 'none', outline: 'none', background: 'var(--bg)', borderRadius: 14, padding: '12px 14px', fontSize: 14, marginBottom: 10 }}
            />
            <input
              type="text"
              value={stopForm.stay}
              onChange={(e) => setStopForm((f) => ({ ...f, stay: e.target.value }))}
              placeholder="체류시간 (예: 1시간)"
              style={{ width: '100%', boxSizing: 'border-box', border: 'none', outline: 'none', background: 'var(--bg)', borderRadius: 14, padding: '12px 14px', fontSize: 14, marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <div
                onClick={() => setPendingStop(null)}
                style={{ flex: 1, textAlign: 'center', padding: 14, borderRadius: 14, background: 'var(--bg)', color: 'var(--text-muted)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                취소
              </div>
              <div onClick={addPendingStop} style={{ flex: 1, textAlign: 'center', padding: 14, borderRadius: 14, background: 'var(--coral)', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                추가
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
