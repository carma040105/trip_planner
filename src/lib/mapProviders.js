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
