import { useEffect, useRef, useState } from 'react';
import { serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useTravel } from '../store/TravelContext.jsx';
import { useAuth } from '../store/AuthContext.jsx';
import { PROVIDER_META } from '../data/defaultData';
import { tripTypeKey, googleEmbedUrl } from '../lib/mapProviders';
import { KAKAO_MAP_KEY, NAVER_MAP_CLIENT_ID, GOOGLE_MAPS_KEY } from '../lib/mapKeys';
import { loadKakaoMaps, loadNaverMaps, loadGoogleMaps } from '../lib/mapSdkLoader';
import { canEditItinerary, canPropose } from '../lib/permissions';
import { useEditingLock } from '../lib/presence';
import { logActivity } from '../lib/activity';
import { notifyUser } from '../lib/notifications';
import StopFormSheet, { DEFAULT_STOP_FIELDS } from '../components/StopFormSheet.jsx';

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }; // Seoul, fallback when destination geocoding fails/unavailable

export default function MapScreen() {
  const { data, updateTrip, members, selectedTripId, selectedDay, mapProviderOverride, setMapProviderOverride, setScreen, showToast } =
    useTravel();
  const { uid, profile } = useAuth();
  const trip = data.trips.find((t) => t.id === selectedTripId);
  const myName = profile?.name || '';
  const myMember = members.find((m) => m.uid === uid);
  const editable = canEditItinerary(trip, myMember, uid);
  const proposeOnly = !editable && canPropose(trip, myMember, uid);

  const typeKey = tripTypeKey(trip);
  const activeProvider = mapProviderOverride || (profile?.mapPrefs || {})[typeKey] || 'google';
  const meta = PROVIDER_META[activeProvider];
  const providerKeyMissing =
    (activeProvider === 'kakao' && !KAKAO_MAP_KEY) ||
    (activeProvider === 'naver' && !NAVER_MAP_CLIENT_ID) ||
    (activeProvider === 'google' && !GOOGLE_MAPS_KEY);
  const useIframeFallback = activeProvider === 'google' && !GOOGLE_MAPS_KEY;

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const sdkRef = useRef(null);
  const [sdkError, setSdkError] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pendingStop, setPendingStop] = useState(null); // { lat, lng }
  const [stopForm, setStopForm] = useState(DEFAULT_STOP_FIELDS);

  useEditingLock(selectedTripId, pendingStop ? 'new-stop' : null, uid, myName);

  const openStopConfirm = (lat, lng, defaultName) => {
    setPendingStop({ lat, lng });
    setStopForm({ ...DEFAULT_STOP_FIELDS, name: defaultName });
  };

  // Only fills in the auto-detected place/address name if the user hasn't
  // already typed something themselves in the meantime.
  const fillAutoName = (name) => {
    if (!name) return;
    setStopForm((f) => (f.name === '' ? { ...f, name } : f));
  };

  const reverseGeocodeKakao = (kakao, lat, lng) => {
    if (!kakao.maps.services) return;
    new kakao.maps.services.Geocoder().coord2Address(lng, lat, (result, status) => {
      if (status === kakao.maps.services.Status.OK && result[0]) {
        fillAutoName(result[0].road_address?.address_name || result[0].address?.address_name);
      }
    });
  };

  const reverseGeocodeNaver = (naver, coord) => {
    if (!naver.maps.Service) return;
    naver.maps.Service.reverseGeocode(
      { coords: coord, orders: [naver.maps.Service.OrderType.ROAD_ADDR, naver.maps.Service.OrderType.ADDR].join(',') },
      (status, response) => {
        if (status !== naver.maps.Service.Status.OK) return;
        const result = response.v2.results?.[0];
        if (!result) return;
        const region = result.region;
        const regionName = [region?.area1?.name, region?.area2?.name, region?.area3?.name].filter(Boolean).join(' ');
        const landName = result.land?.name || [result.land?.number1, result.land?.number2].filter(Boolean).join('-');
        fillAutoName([regionName, landName].filter(Boolean).join(' '));
      }
    );
  };

  const reverseGeocodeGoogle = (google, lat, lng) => {
    new google.maps.Geocoder().geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        fillAutoName(results[0].formatted_address);
      }
    });
  };

  useEffect(() => {
    setSdkError(false);
    mapInstanceRef.current = null;
    sdkRef.current = null;

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
          sdkRef.current = { type: 'kakao', kakao, map };

          if (trip?.destination && kakao.maps.services) {
            const geocoder = new kakao.maps.services.Geocoder();
            geocoder.addressSearch(trip.destination, (results, status) => {
              if (status === kakao.maps.services.Status.OK && results[0]) {
                map.setCenter(new kakao.maps.LatLng(results[0].y, results[0].x));
              }
            });
          }

          kakao.maps.event.addListener(map, 'click', (e) => {
            if (!editable && !proposeOnly) return;
            const lat = e.latLng.getLat();
            const lng = e.latLng.getLng();
            openStopConfirm(lat, lng, '');
            reverseGeocodeKakao(kakao, lat, lng);
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
          sdkRef.current = { type: 'naver', naver, map };

          if (trip?.destination && naver.maps.Service) {
            naver.maps.Service.geocode({ query: trip.destination }, (status, response) => {
              if (status === naver.maps.Service.Status.OK && response.v2.addresses[0]) {
                const addr = response.v2.addresses[0];
                map.setCenter(new naver.maps.LatLng(addr.y, addr.x));
              }
            });
          }

          naver.maps.Event.addListener(map, 'click', (e) => {
            if (!editable && !proposeOnly) return;
            openStopConfirm(e.coord.lat(), e.coord.lng(), '');
            reverseGeocodeNaver(naver, e.coord);
          });
        })
        .catch(() => !cancelled && setSdkError(true));
      return () => {
        cancelled = true;
      };
    }

    if (activeProvider === 'google' && GOOGLE_MAPS_KEY && mapContainerRef.current) {
      let cancelled = false;
      loadGoogleMaps(GOOGLE_MAPS_KEY)
        .then((google) => {
          if (cancelled || !mapContainerRef.current) return;
          const map = new google.maps.Map(mapContainerRef.current, {
            center: DEFAULT_CENTER,
            zoom: 12,
            gestureHandling: 'greedy',
            mapTypeControl: false,
            streetViewControl: false,
          });
          mapInstanceRef.current = map;
          sdkRef.current = { type: 'google', google, map };

          if (trip?.destination) {
            new google.maps.Geocoder().geocode({ address: trip.destination }, (results, status) => {
              if (status === 'OK' && results[0]) {
                map.setCenter(results[0].geometry.location);
              }
            });
          }

          map.addListener('click', (e) => {
            if (!editable && !proposeOnly) return;
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            openStopConfirm(lat, lng, '');
            reverseGeocodeGoogle(google, lat, lng);
          });
        })
        .catch(() => !cancelled && setSdkError(true));
      return () => {
        cancelled = true;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProvider, trip?.destination]);

  const handleSearch = () => {
    const query = searchText.trim();
    if (!query || !sdkRef.current || (!editable && !proposeOnly)) return;
    const { type, map } = sdkRef.current;

    if (type === 'kakao') {
      const { kakao } = sdkRef.current;
      if (!kakao.maps.services) return;
      new kakao.maps.services.Geocoder().addressSearch(query, (results, status) => {
        if (status === kakao.maps.services.Status.OK && results[0]) {
          const lat = Number(results[0].y);
          const lng = Number(results[0].x);
          map.setCenter(new kakao.maps.LatLng(lat, lng));
          map.setLevel(3);
          openStopConfirm(lat, lng, query);
        } else {
          showToast('검색 결과를 찾지 못했어요');
        }
      });
    } else if (type === 'naver') {
      const { naver } = sdkRef.current;
      if (!naver.maps.Service) return;
      naver.maps.Service.geocode({ query }, (status, response) => {
        if (status === naver.maps.Service.Status.OK && response.v2.addresses[0]) {
          const addr = response.v2.addresses[0];
          const lat = Number(addr.y);
          const lng = Number(addr.x);
          map.setCenter(new naver.maps.LatLng(lat, lng));
          map.setZoom(17);
          openStopConfirm(lat, lng, query);
        } else {
          showToast('검색 결과를 찾지 못했어요');
        }
      });
    } else if (type === 'google') {
      const { google } = sdkRef.current;
      new google.maps.Geocoder().geocode({ address: query }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const lat = results[0].geometry.location.lat();
          const lng = results[0].geometry.location.lng();
          map.setCenter(results[0].geometry.location);
          map.setZoom(17);
          openStopConfirm(lat, lng, query);
        } else {
          showToast('검색 결과를 찾지 못했어요');
        }
      });
    }
  };

  const addPendingStop = async (fields) => {
    if (!trip || !pendingStop) return;
    const newStop = { ...fields, id: crypto.randomUUID(), lat: pendingStop.lat, lng: pendingStop.lng };

    if (editable) {
      await updateTrip(trip.id, (t) => ({
        ...t,
        days: t.days.map((day, di) => (di === selectedDay ? { stops: [...day.stops, newStop] } : day)),
      }));
      await logActivity(trip.id, { authorId: uid, authorName: myName, type: 'stop_add', message: `"${newStop.name}" 일정을 추가했어요` });
      if (newStop.assigneeId && newStop.assigneeId !== uid) {
        notifyUser(newStop.assigneeId, { type: 'assigned', tripId: trip.id, message: `${myName}님이 "${newStop.name}" 담당자로 지정했어요` });
      }
      showToast('일정에 장소를 추가했어요');
    } else if (proposeOnly) {
      await addDoc(collection(db, 'trips', trip.id, 'proposals'), {
        dayIndex: selectedDay,
        stop: newStop,
        proposedBy: uid,
        proposedByName: myName,
        createdAt: serverTimestamp(),
      });
      await logActivity(trip.id, { authorId: uid, authorName: myName, type: 'proposal', message: `"${newStop.name}" 일정을 제안했어요` });
      if (trip.ownerId !== uid) {
        notifyUser(trip.ownerId, { type: 'proposal', tripId: trip.id, message: `${myName}님이 "${newStop.name}"을 제안했어요` });
      }
      showToast('일정을 제안했어요. 소유자 승인을 기다려주세요');
    }
    setPendingStop(null);
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

      {!providerKeyMissing && !sdkError && !useIframeFallback && (
        <div style={{ position: 'absolute', top: 106, left: 20, right: 20, display: 'flex', gap: 6, zIndex: 10 }}>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="장소 이름으로 검색"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: '#fff',
              borderRadius: 99,
              padding: '10px 16px',
              fontSize: 12,
              boxShadow: '4px 4px 8px rgba(27,43,75,0.12)',
              boxSizing: 'border-box',
            }}
          />
          <div
            onClick={handleSearch}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: 'var(--navy)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            🔍
          </div>
        </div>
      )}

      {useIframeFallback && trip && (
        <iframe
          title="Google Map"
          src={googleEmbedUrl(trip.destination)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          loading="lazy"
        />
      )}

      {!providerKeyMissing && !sdkError && (
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
            {editable || proposeOnly ? '지도를 탭하거나 검색해서 일정에 장소를 추가하세요' : '뷰어 권한에서는 일정을 추가할 수 없어요'}
          </div>
        </>
      )}

      {(providerKeyMissing || sdkError) && !useIframeFallback && (
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
        <StopFormSheet
          title={editable ? '일정에 장소 추가' : '일정 제안하기'}
          saveLabel={editable ? '추가' : '제안하기'}
          value={stopForm}
          onChange={setStopForm}
          members={members}
          showAssignee={editable}
          onSave={addPendingStop}
          onClose={() => setPendingStop(null)}
        />
      )}
    </div>
  );
}
