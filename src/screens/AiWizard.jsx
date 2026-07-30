import { useState } from 'react';
import { useTravel } from '../store/TravelContext.jsx';
import { requestAiReply } from '../lib/aiClient';

const PROMPT_CHIPS = ['3박 4일 여행 일정 짜줘', '제주도 자전거 일주 여행 코스 추천해줘', '가족 캠핑 여행 코스'];

export default function AiWizard() {
  const { data, updateTrip, selectedTripId, showToast } = useTravel();
  const [messages, setMessages] = useState([
    { role: 'assistant', text: '안녕하세요! 어떤 여행을 계획 중이신가요? 기간·지역·스타일을 알려주시면 일정을 짜드릴게요 ✨' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant' && m !== messages[0]);

  const send = async (text) => {
    const value = (text ?? input).trim();
    if (!value || loading) return;
    const userMsg = { role: 'user', text: value };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    const firstUserIdx = nextMessages.findIndex((m) => m.role === 'user');
    const apiMessages = nextMessages.slice(firstUserIdx).map((m) => ({ role: m.role, content: m.text }));
    const reply = await requestAiReply(apiMessages);
    setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    setLoading(false);
  };

  const addToTrip = () => {
    const target = data.trips.find((t) => t.id === selectedTripId) || data.trips[0];
    if (!target || !lastAssistant) return;
    updateTrip(target.id, (t) => ({
      ...t,
      days: t.days.map((day, di) =>
        di === 0
          ? [...day, { id: crypto.randomUUID(), time: '-', name: 'AI 추천 일정', category: 'AI', stay: lastAssistant.text.slice(0, 60) + '…', assigneeId: null }]
          : day
      ),
    }));
    showToast(`"${target.destination}" 일정에 추가했어요`);
  };

  return (
    <div className="screen">
      <div style={{ padding: '18px 20px 12px', borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: 'linear-gradient(135deg,#FF6B6B,#FF9A8B)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 17,
            }}
          >
            ✨
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)' }}>AI 여행 도우미</div>
        </div>
      </div>

      <div className="scroll-area" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '88%',
              background: m.role === 'user' ? 'var(--navy)' : '#fff',
              color: m.role === 'user' ? '#fff' : 'var(--navy)',
              borderRadius: 16,
              padding: '12px 15px',
              fontSize: 13,
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
              boxShadow: m.role === 'assistant' ? 'var(--shadow-raised-sm)' : 'none',
            }}
          >
            {m.text}
          </div>
        ))}

        {!loading && lastAssistant && (
          <div
            onClick={addToTrip}
            style={{
              alignSelf: 'flex-start',
              background: 'var(--coral)',
              color: '#fff',
              borderRadius: 14,
              padding: '10px 16px',
              fontSize: 12,
              fontWeight: 800,
              boxShadow: '4px 4px 10px rgba(255,107,107,0.35)',
              cursor: 'pointer',
            }}
          >
            + 내 일정에 추가
          </div>
        )}

        {loading && (
          <div style={{ alignSelf: 'flex-start', background: '#fff', borderRadius: 16, padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
            생각하는 중…
          </div>
        )}
      </div>

      <div style={{ padding: '0 20px 10px', display: 'flex', gap: 8, overflowX: 'auto' }}>
        {PROMPT_CHIPS.map((label) => (
          <div
            key={label}
            onClick={() => send(label)}
            style={{
              flexShrink: 0,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--navy)',
              background: '#fff',
              borderRadius: 99,
              padding: '8px 14px',
              boxShadow: '4px 4px 8px rgba(27,43,75,0.08)',
              cursor: 'pointer',
            }}
          >
            {label}
          </div>
        ))}
      </div>

      <div style={{ padding: '0 20px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="메시지를 입력하세요…"
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: '#fff',
            borderRadius: 99,
            padding: '12px 16px',
            fontSize: 13,
            boxShadow: '4px 4px 8px rgba(27,43,75,0.08)',
            boxSizing: 'border-box',
          }}
        />
        <div
          onClick={() => send()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            background: 'var(--coral)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            cursor: 'pointer',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 18 18">
            <path d="M2 9L16 2l-4 14-3.5-5.5L2 9z" fill="#fff" />
          </svg>
        </div>
      </div>
    </div>
  );
}
