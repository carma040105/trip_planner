import { useTravel } from '../store/TravelContext.jsx';

const TABS = [
  { id: 'home', label: '여행', icon: '🗺️', screens: ['home', 'itinerary', 'map'] },
  { id: 'ai', label: 'AI', icon: '🤖', screens: ['ai'] },
  { id: 'settings', label: '내 정보', icon: '👤', screens: ['settings'] },
];

export default function TabBar() {
  const { screen, setScreen } = useTravel();

  return (
    <div className="tab-bar">
      {TABS.map((tab) => {
        const active = tab.screens.includes(screen);
        return (
          <button
            key={tab.id}
            className="tab-item"
            style={{ opacity: active ? 1 : 0.35 }}
            onClick={() => setScreen(tab.id)}
          >
            <div className="tab-icon">{tab.icon}</div>
            <div className="tab-label" style={{ color: active ? 'var(--coral)' : 'var(--navy)' }}>
              {tab.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}
