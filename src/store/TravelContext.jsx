import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { defaultData } from '../data/defaultData';

const STORAGE_KEY = 'myway_app_v1';

/*
 * Persistence adapter. The prototype (and this build) uses localStorage only.
 * To wire up Firebase later: replace loadData/saveData with Firestore reads
 * (onSnapshot for realtime sync) and writes scoped by ownerId, keeping the
 * same `data` shape so screens/components don't need to change.
 */
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore corrupt storage
  }
  return defaultData();
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage unavailable (private mode, quota) — app still works in-memory
  }
}

const TravelContext = createContext(null);

export function TravelProvider({ children }) {
  const [data, setData] = useState(loadData);
  const [screen, setScreen] = useState(() => (loadData().loggedIn ? 'home' : 'login'));
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [mapProviderOverride, setMapProviderOverride] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const updateData = useCallback((fn) => {
    setData((prev) => fn({ ...prev }));
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const openTrip = useCallback(
    (tripId) => {
      setSelectedTripId(tripId);
      setSelectedDay(0);
      setMapProviderOverride(null);
      setScreen('itinerary');
      updateData((d) => ({ ...d, lastTripId: tripId }));
    },
    [updateData]
  );

  const value = {
    data,
    updateData,
    screen,
    setScreen,
    selectedTripId,
    setSelectedTripId,
    selectedDay,
    setSelectedDay,
    mapProviderOverride,
    setMapProviderOverride,
    toast,
    showToast,
    openTrip,
  };

  return <TravelContext.Provider value={value}>{children}</TravelContext.Provider>;
}

export function useTravel() {
  const ctx = useContext(TravelContext);
  if (!ctx) throw new Error('useTravel must be used within TravelProvider');
  return ctx;
}
