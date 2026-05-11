const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

loadEnv(path.join(__dirname, '.env'));

const PORT = Number(process.env.PORT || 4177);
const ROOT = __dirname;
const KNOWLEDGE_DIR = path.join(ROOT, 'assets', 'knowledge');
const DEFAULT_ICS_URL = 'https://outlook.office365.com/owa/calendar/0a43a3313a6140d3ab20331348d665f2@thermokon.de/8b53a825b48c4adc9281eb67987ab3508190174971116413725/calendar.ics';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ics': 'text/calendar; charset=utf-8'
};

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const index = trimmed.indexOf('=');
    if (index === -1) return;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  });
}

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function handleChat(req, res) {
  try {
    const body = JSON.parse(await readBody(req) || '{}');
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const lastUserMessage = [...messages].reverse().find(message => message.role === 'user')?.content || '';

    if (!process.env.OPENAI_API_KEY && !process.env.OPENROUTER_API_KEY) {
      send(res, 200, JSON.stringify({
        reply: `Demo-Modus: Ich habe deine Frage erhalten: "${lastUserMessage}".\n\nSobald OPENAI_API_KEY in der .env gesetzt ist, antworte ich mit OpenAI.`
      }), 'application/json; charset=utf-8');
      return;
    }

    const reply = process.env.OPENROUTER_API_KEY
      ? await callOpenRouter(messages)
      : await callOpenAI(messages);
    send(res, 200, JSON.stringify({ reply }), 'application/json; charset=utf-8');
  } catch (error) {
    send(res, 500, JSON.stringify({ error: error.message }), 'application/json; charset=utf-8');
  }
}

function loadKnowledge() {
  try {
    if (!fs.existsSync(KNOWLEDGE_DIR)) return '';
    return fs.readdirSync(KNOWLEDGE_DIR)
      .filter(file => file.toLowerCase().endsWith('.md'))
      .sort()
      .map(file => fs.readFileSync(path.join(KNOWLEDGE_DIR, file), 'utf8').trim())
      .join('\n\n---\n\n')
      .slice(0, 60000);
  } catch {
    return '';
  }
}

function getSystemPrompt() {
  const knowledge = loadKnowledge();
  const instructions = [
    'Du bist der Sensise Produkt- und Toolassistent.',
    'Antworte auf Deutsch, klar und hilfreich.',
    'Du darfst allgemein zu Sensise-Produkten, Projektaufnahme, Projektkalkulator und Terminbuchung helfen.',
    'Erfinde keine Preise, Lieferzeiten oder verbindlichen technischen Zusagen.',
    'Wenn eine Frage intern, rechtlich, kommerziell oder sicherheitskritisch ist, weise auf Abstimmung mit dem Sensise-Team hin.',
    'Nutze die folgende Wissensbasis als bevorzugte Grundlage. Wenn dort keine passende Information steht, sage das transparent und frage nach oder verweise auf das Sensise-Team.'
  ].join(' ');

  if (!knowledge) return instructions;
  return `${instructions}\n\nWissensbasis:\n${knowledge}`;
}

function normalizeMessages(messages) {
  return messages.map(message => ({
    role: message.role === 'assistant' ? 'assistant' : 'user',
    content: String(message.content || '').slice(0, 4000)
  }));
}

async function callOpenAI(messages) {
  const system = getSystemPrompt();

  const payload = JSON.stringify({
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    input: [
      { role: 'system', content: system },
      ...normalizeMessages(messages)
    ],
    max_output_tokens: 700
  });

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: payload
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `OpenAI API error ${response.status}`);
  }

  return data.output_text || extractOutputText(data) || 'Ich habe keine Antwort erhalten.';
}

async function callOpenRouter(messages) {
  const apiKey = String(process.env.OPENROUTER_API_KEY || '').trim();
  if (!apiKey.startsWith('sk-or-')) {
    throw new Error('OPENROUTER_API_KEY ist gesetzt, sieht aber nicht wie ein kompletter OpenRouter-Key aus. Der Key muss mit sk-or- beginnen.');
  }

  const payload = JSON.stringify({
    model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
    messages: [
      { role: 'system', content: getSystemPrompt() },
      ...normalizeMessages(messages)
    ],
    max_tokens: 700,
    temperature: 0.4
  });

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_PUBLIC_URL || `http://localhost:${PORT}`,
      'X-Title': 'Sensise Tools'
    },
    body: payload
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `OpenRouter API error ${response.status}`);
  }

  return data.choices?.[0]?.message?.content?.trim() || 'Ich habe keine Antwort erhalten.';
}

function extractOutputText(data) {
  return (data.output || [])
    .flatMap(item => item.content || [])
    .filter(item => item.type === 'output_text' || item.text)
    .map(item => item.text)
    .join('\n')
    .trim();
}

function fetchIcs(url, res) {
  https.get(url || DEFAULT_ICS_URL, response => {
    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
      fetchIcs(response.headers.location, res);
      return;
    }
    if (response.statusCode !== 200) {
      send(res, response.statusCode, `ICS request failed with ${response.statusCode}`);
      response.resume();
      return;
    }
    const chunks = [];
    response.on('data', chunk => chunks.push(chunk));
    response.on('end', () => send(res, 200, Buffer.concat(chunks), 'text/calendar; charset=utf-8'));
  }).on('error', error => send(res, 502, error.message));
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';
  if (pathname.endsWith('/')) pathname += 'index.html';

  const target = path.resolve(ROOT, pathname.replace(/^\/+/, ''));
  if (!target.startsWith(ROOT)) {
    send(res, 403, 'Forbidden');
    return;
  }

  fs.readFile(target, (error, data) => {
    if (error) {
      send(res, 404, 'Not found');
      return;
    }
    send(res, 200, data, MIME[path.extname(target)] || 'application/octet-stream');
  });
}

http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    send(res, 204, '');
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname === '/api/chat' && req.method === 'POST') {
    handleChat(req, res);
    return;
  }

  if (url.pathname.endsWith('/calendar.ics')) {
    fetchIcs(url.searchParams.get('url') || DEFAULT_ICS_URL, res);
    return;
  }

  serveStatic(req, res);
}).listen(PORT, () => {
  console.log(`Sensise Tools laufen auf http://localhost:${PORT}/`);
});
