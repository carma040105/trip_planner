import { useEffect, useRef, useState } from 'react';
import { KAKAO_MAP_KEY, NAVER_MAP_CLIENT_ID, GOOGLE_MAPS_KEY } from '../lib/mapKeys';
import { loadKakaoMaps, loadNaverMaps, loadGoogleMaps } from '../lib/mapSdkLoader';
import { navigationUrl } from '../lib/mapProviders';

const FALLBACK_CENTER = { lat: 37.5665, lng: 126.978 }; // Seoul, used until geocoding (or coords) resolves

export default function StopMapPreview({ stop, provider, onClose }) {
  const containerRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(false);
    const hasCoords = typeof stop.lat === 'number' && typeof stop.lng === 'number';
    const startLat = hasCoords ? stop.lat : FALLBACK_CENTER.lat;
    const startLng = hasCoords ? stop.lng : FALLBACK_CENTER.lng;

    async function init() {
      if (!containerRef.current) return;
      try {
        if (provider === 'kakao' && KAKAO_MAP_KEY) {
          const kakao = await loadKakaoMaps(KAKAO_MAP_KEY);
          if (cancelled || !containerRef.current) return;
          const map = new kakao.maps.Map(containerRef.current, { center: new kakao.maps.LatLng(startLat, startLng), level: 3 });
          new kakao.maps.Marker({ position: map.getCenter(), map });
          if (!hasCoords && stop.name && kakao.maps.services) {
            const geocoder = new kakao.maps.services.Geocoder();
            geocoder.addressSearch(stop.name, (results, status) => {
              if (cancelled || status !== kakao.maps.services.Status.OK || !results[0]) return;
              const pos = new kakao.maps.LatLng(results[0].y, results[0].x);
              map.setCenter(pos);
              new kakao.maps.Marker({ position: pos, map });
            });
          }
        } else if (provider === 'naver' && NAVER_MAP_CLIENT_ID) {
          const naver = await loadNaverMaps(NAVER_MAP_CLIENT_ID);
          if (cancelled || !containerRef.current) return;
          const startCenter = new naver.maps.LatLng(startLat, startLng);
          const map = new naver.maps.Map(containerRef.current, { center: startCenter, zoom: 17 });
          new naver.maps.Marker({ position: startCenter, map });
          if (!hasCoords && stop.name && naver.maps.Service) {
            naver.maps.Service.geocode({ query: stop.name }, (status, response) => {
              if (cancelled || status !== naver.maps.Service.Status.OK || !response.v2.addresses[0]) return;
              const addr = response.v2.addresses[0];
              const pos = new naver.maps.LatLng(addr.y, addr.x);
              map.setCenter(pos);
              new naver.maps.Marker({ position: pos, map });
            });
          }
        } else if (GOOGLE_MAPS_KEY) {
          const google = await loadGoogleMaps(GOOGLE_MAPS_KEY);
          if (cancelled || !containerRef.current) return;
          const startCenter = { lat: startLat, lng: startLng };
          const map = new google.maps.Map(containerRef.current, {
            center: startCenter,
            zoom: 17,
            gestureHandling: 'greedy',
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });
          new google.maps.Marker({ position: startCenter, map });
          if (!hasCoords && stop.name) {
            new google.maps.Geocoder().geocode({ address: stop.name }, (results, status) => {
              if (cancelled || status !== 'OK' || !results[0]) return;
              map.setCenter(results[0].geometry.location);
              new google.maps.Marker({ position: results[0].geometry.location, map });
            });
          }
        } else {
          if (!cancelled) setError(true);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [stop, provider]);

  const navUrl = navigationUrl(provider, stop);

  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(27,43,75,0.45)', zIndex: 50 }} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '58%',
          background: '#fff',
          borderRadius: '24px 24px 0 0',
          zIndex: 51,
          overflow: 'hidden',
          boxShadow: '0 -10px 26px rgba(27,43,75,0.2)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border-soft)' }}>
          <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 800, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {stop.name}
          </div>
          <div onClick={onClose} style={{ fontSize: 16, color: 'var(--text-muted)', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
            ✕
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative', background: '#e7ede6' }}>
          {!error && <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />}
          {error && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 30, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                지도를 불러오지 못했어요.
                <br />
                설정에서 지도 API 키를 확인해주세요.
              </div>
            </div>
          )}
        </div>

        {navUrl && (
          <div style={{ padding: '10px 16px 16px' }}>
            <a
              href={navUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                textAlign: 'center',
                background: 'var(--coral)',
                color: '#fff',
                borderRadius: 14,
                padding: 13,
                fontSize: 13,
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              🧭 길찾기 시작
            </a>
          </div>
        )}
      </div>
    </>
  );
}
