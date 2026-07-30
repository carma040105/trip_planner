import WheelPicker from './WheelPicker.jsx';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));
export const STAY_OPTIONS = ['30분', '1시간', '1시간 30분', '2시간', '2시간 30분', '3시간', '4시간', '5시간', '6시간', '종일'];

function parseTime(time) {
  const [h, m] = (time || '09:00').split(':');
  return {
    hour: HOURS.includes(h) ? h : '09',
    minute: MINUTES.includes(m) ? m : '00',
  };
}

// Merges "start time" and "머무는 시간(stay duration)" into one wheel-picker section,
// iOS-dial style, instead of two separate free-text inputs.
export default function TimeStaySection({ time, stay, onChange }) {
  const { hour, minute } = parseTime(time);
  const stayValue = STAY_OPTIONS.includes(stay) ? stay : STAY_OPTIONS[1];

  return (
    <div className="card" style={{ padding: '14px 10px', marginBottom: 10 }}>
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>시작 시간</div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
            <WheelPicker items={HOURS} value={hour} onChange={(h) => onChange({ time: `${h}:${minute}`, stay: stayValue })} width={44} />
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)' }}>:</div>
            <WheelPicker items={MINUTES} value={minute} onChange={(m) => onChange({ time: `${hour}:${m}`, stay: stayValue })} width={44} />
          </div>
        </div>
        <div style={{ width: 1, background: 'var(--border-soft)', margin: '0 4px' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>머무는 시간</div>
          <WheelPicker
            items={STAY_OPTIONS}
            value={stayValue}
            onChange={(s) => onChange({ time: `${hour}:${minute}`, stay: s })}
            width={90}
          />
        </div>
      </div>
    </div>
  );
}
