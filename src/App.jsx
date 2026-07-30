import { useEffect, useState } from 'react';
import { useAuth } from './store/AuthContext.jsx';
import { useTravel } from './store/TravelContext.jsx';
import Home from './screens/Home.jsx';
import Itinerary from './screens/Itinerary.jsx';
import MapScreen from './screens/MapScreen.jsx';
import Checklist from './screens/Checklist.jsx';
import AiWizard from './screens/AiWizard.jsx';
import Settings from './screens/Settings.jsx';
import AuthScreen from './screens/AuthScreen.jsx';
import AcceptInvite from './screens/AcceptInvite.jsx';
import TabBar from './components/TabBar.jsx';
import Toast from './components/Toast.jsx';
import ImportLocalTrips from './components/ImportLocalTrips.jsx';
import { FIREBASE_CONFIGURED } from './lib/firebaseKeys';

const SCREENS = {
  home: Home,
  itinerary: Itinerary,
  map: MapScreen,
  checklist: Checklist,
  ai: AiWizard,
  settings: Settings,
};

function readInviteToken() {
  try {
    return new URLSearchParams(window.location.search).get('invite');
  } catch {
    return null;
  }
}

export default function App() {
  const { authUser, authLoading } = useAuth();
  const { screen } = useTravel();
  const [inviteToken, setInviteToken] = useState(readInviteToken);

  const clearInviteToken = () => {
    setInviteToken(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('invite');
    window.history.replaceState({}, '', url.toString());
  };

  useEffect(() => {
    document.title = 'MyWay';
  }, []);

  let body;
  if (!FIREBASE_CONFIGURED || authLoading) {
    body = <AuthScreen />;
  } else if (!authUser) {
    body = <AuthScreen />;
  } else if (inviteToken) {
    body = <AcceptInvite token={inviteToken} onDone={clearInviteToken} />;
  } else {
    const ScreenComponent = SCREENS[screen] || Home;
    body = <ScreenComponent />;
  }

  const showChrome = FIREBASE_CONFIGURED && !authLoading && authUser && !inviteToken;

  return (
    <div className="app-shell">
      <div className="phone-frame">
        {body}
        {showChrome && <TabBar />}
        {showChrome && <ImportLocalTrips />}
        <Toast />
      </div>
    </div>
  );
}
