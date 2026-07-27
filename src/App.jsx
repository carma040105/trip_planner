import { useTravel } from './store/TravelContext.jsx';
import Login from './screens/Login.jsx';
import Home from './screens/Home.jsx';
import Itinerary from './screens/Itinerary.jsx';
import MapScreen from './screens/MapScreen.jsx';
import AiWizard from './screens/AiWizard.jsx';
import Settings from './screens/Settings.jsx';
import TabBar from './components/TabBar.jsx';
import Toast from './components/Toast.jsx';

const SCREENS = {
  login: Login,
  home: Home,
  itinerary: Itinerary,
  map: MapScreen,
  ai: AiWizard,
  settings: Settings,
};

export default function App() {
  const { screen } = useTravel();
  const ScreenComponent = SCREENS[screen] || Home;

  return (
    <div className="app-shell">
      <div className="phone-frame">
        <ScreenComponent />
        {screen !== 'login' && <TabBar />}
        <Toast />
      </div>
    </div>
  );
}
