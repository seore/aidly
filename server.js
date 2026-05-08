const express   = require('express');
const path      = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const app    = express();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── middleware ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── CORS (allows Flutter app to call /ask) ─────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── AI route ───────────────────────────────────────────────────────────────
app.post('/ask', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const response = await client.messages.create({
      model     : 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system    : `You are PAL Aid, an AI first aid assistant.
You provide clear, calm, and accurate first aid guidance for emergencies and injuries.

Guidelines:
- Be direct and actionable — people may be in an emergency
- Use numbered steps when giving instructions
- Always recommend calling emergency services (999/112/911) for serious situations
- Never diagnose medical conditions — only provide first aid guidance
- Keep responses concise but complete
- Use simple language, no medical jargon
- If the situation sounds life-threatening, lead with "Call emergency services immediately"
- Add a brief disclaimer for serious situations: "This is first aid guidance only — always seek professional medical help"

You are NOT a doctor and should never replace professional medical advice.`,
      messages  : messages,
    });

    res.json({ content: response.content });
  } catch (err) {
    console.error('Anthropic error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── static HTML pages ──────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/confirm', (req, res) => {
  res.sendFile(path.join(__dirname, 'confirm.html'));
});

app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'privacy.html'));
});

app.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, 'terms.html'));
});

app.get('/support', (req, res) => {
  res.sendFile(path.join(__dirname, 'support.html'));
});

// ── health check ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PAL Aid server running on port ${PORT}`);
});