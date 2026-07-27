/*
 * AI wizard client. In production this should call a server-side endpoint
 * (Netlify Function / Firebase Function) that holds the Anthropic API key —
 * see netlify/functions/ai-wizard.js for the server-side counterpart.
 * The client never talks to Anthropic directly, so no key is ever exposed
 * in the browser.
 *
 * If the endpoint isn't deployed (e.g. running `vite dev` without
 * `netlify dev`), this falls back to a canned local response so the wizard
 * still demonstrates the flow end to end.
 */

const ENDPOINT = '/api/ai-wizard';

export async function requestAiReply(messages) {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
    if (!res.ok) throw new Error(`AI endpoint returned ${res.status}`);
    const json = await res.json();
    if (!json.reply) throw new Error('AI endpoint returned no reply');
    return json.reply;
  } catch (err) {
    return mockReply(messages);
  }
}

function mockReply(messages) {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const prompt = (lastUser?.content || '').trim();
  return (
    `(오프라인 데모 응답 — 서버 AI 엔드포인트가 연결되면 실제 Claude 응답으로 대체됩니다)\n\n` +
    `"${prompt}" 요청을 바탕으로 간단한 일정 예시예요:\n\n` +
    `Day 1\n· 09:00 대표 명소 방문 (1시간)\n· 12:00 현지 맛집에서 점심 (1시간)\n· 14:00 근처 산책로/공원 (1시간 30분)\n\n` +
    `Day 2\n· 10:00 박물관 또는 전시 관람 (1시간 30분)\n· 13:00 로컬 카페 휴식\n· 18:00 야경 명소 방문\n\n` +
    `더 구체적인 지역·기간·스타일(가족/커플/자전거 등)을 알려주시면 더 정확히 짜드릴게요!`
  );
}
