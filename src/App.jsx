import { useTravel } from './store/TravelContext.jsx';
import Home from './screens/Home.jsx';
import Itinerary from './screens/Itinerary.jsx';
import MapScreen from './screens/MapScreen.jsx';
import Checklist from './screens/Checklist.jsx';
import AiWizard from './screens/AiWizard.jsx';
import Settings from './screens/Settings.jsx';
import TabBar from './components/TabBar.jsx';
import Toast from './components/Toast.jsx';

const SCREENS = {
  home: Home,
  itinerary: Itinerary,
  map: MapScreen,
  checklist: Checklist,
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
        <TabBar />
        <Toast />
      </div>
    </div>
  );
}
