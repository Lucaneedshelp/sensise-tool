const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const DEFAULT_ICS_URL = 'https://outlook.office365.com/owa/calendar/0a43a3313a6140d3ab20331348d665f2@thermokon.de/8b53a825b48c4adc9281eb67987ab3508190174971116413725/calendar.ics';
const ROOT = path.resolve(__dirname, '../..');
const PORT = Number(process.env.PORT || 4177);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ics': 'text/calendar; charset=utf-8'
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store'
  });
  res.end(body);
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
  if (pathname === '/') pathname = '/apps/calendar-booking/';
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
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname.endsWith('/calendar.ics')) {
    fetchIcs(url.searchParams.get('url') || DEFAULT_ICS_URL, res);
    return;
  }
  serveStatic(req, res);
}).listen(PORT, () => {
  console.log(`Terminbuchung läuft auf http://localhost:${PORT}/apps/calendar-booking/`);
});
