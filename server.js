const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

loadEnv(path.join(__dirname, '.env'));

const PORT = Number(process.env.PORT || 4177);
const ROOT = __dirname;
const KNOWLEDGE_DIR = path.join(ROOT, 'assets', 'knowledge');
const DEFAULT_ICS_URL = 'https://outlook.office365.com/owa/calendar/0a43a3313a6140d3ab20331348d665f2@thermokon.de/8b53a825b48c4adc9281eb67987ab3508190174971116413725/calendar.ics';
const SESSION_COOKIE = 'sensise_session';
const sessions = new Set();

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

function send(res, status, body, type = 'text/plain; charset=utf-8', extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': type,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Cache-Control': 'no-store',
    ...extraHeaders
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

function isAuthEnabled() {
  return Boolean(String(process.env.APP_LOGIN_PASSWORD || '').trim());
}

function parseCookies(req) {
  return String(req.headers.cookie || '')
    .split(';')
    .map(cookie => cookie.trim())
    .filter(Boolean)
    .reduce((cookies, cookie) => {
      const index = cookie.indexOf('=');
      if (index === -1) return cookies;
      cookies[decodeURIComponent(cookie.slice(0, index))] = decodeURIComponent(cookie.slice(index + 1));
      return cookies;
    }, {});
}

function isAuthenticated(req) {
  if (!isAuthEnabled()) return true;
  const token = parseCookies(req)[SESSION_COOKIE];
  return Boolean(token && sessions.has(token));
}

function isPublicAsset(pathname) {
  return pathname.startsWith('/assets/css/')
    || pathname.startsWith('/assets/img/')
    || pathname === '/favicon.ico';
}

function isHttpsRequest(req) {
  return req.socket.encrypted || String(req.headers['x-forwarded-proto'] || '').includes('https');
}

function createSessionCookie(req, token) {
  const secure = isHttpsRequest(req) ? '; Secure' : '';
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800${secure}`;
}

function clearSessionCookie(req) {
  const secure = isHttpsRequest(req) ? '; Secure' : '';
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`;
}

function safeEquals(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function redirectToLogin(res) {
  send(res, 302, '', 'text/plain; charset=utf-8', { Location: '/login' });
}

function serveLoginPage(req, res) {
  if (!isAuthEnabled() || isAuthenticated(req)) {
    send(res, 302, '', 'text/plain; charset=utf-8', { Location: '/' });
    return;
  }

  send(res, 200, `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sensise Login</title>
  <link rel="stylesheet" href="/assets/css/theme.css">
  <style>
    body {
      min-height: 100vh;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px;
      background:
        radial-gradient(circle at 50% 0%, rgba(243, 145, 0, 0.14), transparent 32%),
        linear-gradient(180deg, #001533 0%, #06234b 100%);
      color: var(--color-text);
    }

    .login-shell {
      width: min(460px, 100%);
      display: grid;
      justify-items: center;
      gap: 34px;
    }

    .login-logo {
      width: min(360px, 78vw);
      height: auto;
    }

    .login-panel {
      width: 100%;
      display: grid;
      gap: 24px;
      padding: 32px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: rgba(255, 255, 255, 0.065);
      box-shadow: var(--shadow-soft);
      backdrop-filter: blur(10px);
    }

    .login-panel h1 {
      margin: 0;
      font-size: 30px;
      line-height: 1.1;
      letter-spacing: 0;
    }

    .login-panel p {
      max-width: 34ch;
      margin: 0;
      margin-top: 8px;
      color: var(--color-text-muted);
      line-height: 1.5;
    }

    .login-form {
      display: grid;
      gap: 14px;
    }

    .login-form label {
      font-size: 13px;
      font-weight: 800;
      color: var(--color-text-muted);
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }

    .login-form input {
      width: 100%;
      min-height: 52px;
      padding: 0 16px;
      border: 1px solid var(--color-border);
      border-radius: 10px;
      background: rgba(0, 0, 0, 0.2);
      color: var(--color-text);
      font: inherit;
      outline: none;
    }

    .login-form input:focus {
      border-color: rgba(243, 145, 0, 0.75);
      box-shadow: 0 0 0 3px rgba(243, 145, 0, 0.14);
    }

    .login-form button {
      min-height: 52px;
      border: 0;
      border-radius: 10px;
      background: var(--color-mustard);
      color: var(--color-dark-blue);
      font: inherit;
      font-weight: 900;
      cursor: pointer;
      transition: 160ms ease;
    }

    .login-form button:hover {
      background: #d98000;
      transform: translateY(-1px);
    }

    .login-error {
      min-height: 22px;
      color: #ffb3a8;
      font-size: 14px;
      font-weight: 700;
    }

    @media (max-width: 560px) {
      body {
        align-items: flex-start;
        padding: 28px 18px;
      }

      .login-shell {
        gap: 26px;
      }

      .login-panel {
        padding: 24px;
      }
    }
  </style>
</head>
<body>
  <main class="login-shell">
    <img class="login-logo" src="/assets/img/sensise-logo-neg.png" alt="Sensise Logo">
    <section class="login-panel">
      <div>
        <h1>Sensise Tools</h1>
        <p>Bitte gib das Passwort ein, um die internen Tools zu öffnen.</p>
      </div>
      <form class="login-form" id="login-form">
        <label for="password">Passwort</label>
        <input id="password" name="password" type="password" autocomplete="current-password" autofocus>
        <button type="submit">Anmelden</button>
        <div class="login-error" id="login-error" aria-live="polite"></div>
      </form>
    </section>
  </main>
  <script>
    const form = document.getElementById('login-form');
    const errorBox = document.getElementById('login-error');

    form.addEventListener('submit', async event => {
      event.preventDefault();
      errorBox.textContent = '';
      const password = document.getElementById('password').value;

      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });

        if (!response.ok) {
          errorBox.textContent = 'Das Passwort stimmt nicht.';
          return;
        }

        window.location.href = '/';
      } catch {
        errorBox.textContent = 'Anmeldung gerade nicht erreichbar.';
      }
    });
  </script>
</body>
</html>`, 'text/html; charset=utf-8');
}

async function handleLogin(req, res) {
  if (!isAuthEnabled()) {
    send(res, 204, '');
    return;
  }

  try {
    const body = JSON.parse(await readBody(req) || '{}');
    const password = String(body.password || '');
    const expectedPassword = String(process.env.APP_LOGIN_PASSWORD || '');

    if (!safeEquals(password, expectedPassword)) {
      send(res, 401, JSON.stringify({ error: 'Invalid password' }), 'application/json; charset=utf-8');
      return;
    }

    const token = crypto.randomBytes(32).toString('base64url');
    sessions.add(token);
    send(res, 204, '', 'text/plain; charset=utf-8', { 'Set-Cookie': createSessionCookie(req, token) });
  } catch {
    send(res, 400, JSON.stringify({ error: 'Invalid request' }), 'application/json; charset=utf-8');
  }
}

function handleLogout(req, res) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (token) sessions.delete(token);
  send(res, 302, '', 'text/plain; charset=utf-8', {
    Location: '/login',
    'Set-Cookie': clearSessionCookie(req)
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
  if (url.pathname === '/login' && req.method === 'GET') {
    serveLoginPage(req, res);
    return;
  }

  if (url.pathname === '/api/login' && req.method === 'POST') {
    handleLogin(req, res);
    return;
  }

  if (url.pathname === '/logout' && req.method === 'GET') {
    handleLogout(req, res);
    return;
  }

  if (!isPublicAsset(url.pathname) && !isAuthenticated(req)) {
    if (url.pathname.startsWith('/api/')) {
      send(res, 401, JSON.stringify({ error: 'Authentication required' }), 'application/json; charset=utf-8');
      return;
    }
    redirectToLogin(res);
    return;
  }

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
