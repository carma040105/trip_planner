import { PROVIDER_META } from '../data/defaultData';

// Maps a trip's country/transport combo to the mapPrefs key used in settings.
export function tripTypeKey(trip) {
  if (!trip) return 'overseas';
  if (trip.country === 'overseas') return 'overseas';
  return trip.transport === 'bike' ? 'domesticBike' : 'domesticCar';
}

export function googleEmbedUrl(query) {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

export function providerMeta(id) {
  return PROVIDER_META[id] || PROVIDER_META.google;
}

// Builds a "get directions to this stop" link for the trip's chosen map provider.
// Uses stop.lat/lng when available (stops added by tapping the map), otherwise
// falls back to searching by the stop's name.
export function navigationUrl(providerId, stop) {
  const name = (stop?.name || '').trim();
  if (!name) return null;
  const hasCoords = typeof stop.lat === 'number' && typeof stop.lng === 'number';

  switch (providerId) {
    case 'kakao':
      return hasCoords
        ? `https://map.kakao.com/link/to/${encodeURIComponent(name)},${stop.lat},${stop.lng}`
        : `https://map.kakao.com/link/search/${encodeURIComponent(name)}`;
    case 'naver':
      return `https://map.naver.com/p/search/${encodeURIComponent(hasCoords ? `${stop.lat},${stop.lng}` : name)}`;
    case 'google':
    default:
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(hasCoords ? `${stop.lat},${stop.lng}` : name)}`;
  }
}
