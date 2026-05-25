const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GROQ_API_KEY is not set in Vercel environment variables',
    });
  }

  const { system, messages, max_tokens = 1200 } = req.body || {};
  if (!system || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'system and messages are required' });
  }

  const groqMessages = [{ role: 'system', content: system }, ...messages];

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || DEFAULT_MODEL,
        messages: groqMessages,
        max_tokens,
        temperature: 0.5,
      }),
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      const msg = data?.error?.message || data?.message || 'Groq API error';
      return res.status(groqRes.status).json({ error: msg });
    }

    const text = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
