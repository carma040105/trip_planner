// Netlify Function: server-side proxy to the Anthropic API.
// Deploy target for the AI wizard screen (src/lib/aiClient.js calls /api/ai-wizard,
// which netlify.toml redirects to this function).
//
// Set the ANTHROPIC_API_KEY environment variable in the Netlify site settings.
// The key never reaches the browser.

const SYSTEM_PROMPT =
  '당신은 한국어로 답하는 여행 일정 플래너 AI입니다. 사용자의 요청에 맞춰 간결하고 구체적인 여행 코스를 ' +
  'Day별 bullet 목록으로 제안하세요. 너무 길지 않게, 실제 지명을 포함해서 답하세요.';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured' }) };
  }

  let messages;
  try {
    ({ messages } = JSON.parse(event.body || '{}'));
    if (!Array.isArray(messages) || messages.length === 0) throw new Error('messages required');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 700,
        system: SYSTEM_PROMPT,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { statusCode: res.status, body: JSON.stringify({ error: errText }) };
    }

    const json = await res.json();
    const reply = json.content?.map((block) => block.text).join('') || '';
    return { statusCode: 200, body: JSON.stringify({ reply }) };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: String(err) }) };
  }
}
