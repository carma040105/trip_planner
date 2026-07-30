// One-time migration path: this app used to store everything in
// localStorage only (single-device, no accounts). After adding real
// accounts, we offer to import whatever's still sitting in localStorage
// into the signed-in user's Firestore trips.
const STORAGE_KEY = 'myway_app_v1';

export function readLegacyLocalTrips() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.trips) ? parsed.trips : [];
  } catch {
    return [];
  }
}

export function clearLegacyLocalData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
