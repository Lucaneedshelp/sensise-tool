const DEFAULT_ICS_URL = 'https://outlook.office365.com/owa/calendar/0a43a3313a6140d3ab20331348d665f2@thermokon.de/8b53a825b48c4adc9281eb67987ab3508190174971116413725/calendar.ics';
const DEFAULT_ZONE_LABEL = 'Europe/Berlin';
const LOCAL_PROXY_URL = 'calendar.ics';

const state = {
  events: [],
  selectedSlot: null
};

const els = {
  icsUrl: document.getElementById('ics-url'),
  ownerEmail: document.getElementById('owner-email'),
  duration: document.getElementById('duration'),
  rangeDays: document.getElementById('range-days'),
  workStart: document.getElementById('work-start'),
  workEnd: document.getElementById('work-end'),
  loadBtn: document.getElementById('load-btn'),
  fileInput: document.getElementById('ics-file'),
  status: document.getElementById('status'),
  slotsMeta: document.getElementById('slots-meta'),
  calendarBoard: document.getElementById('calendar-board'),
  slotsList: document.getElementById('slots-list'),
  selectedSlotLabel: document.getElementById('selected-slot-label'),
  bookingForm: document.getElementById('booking-form'),
  requesterName: document.getElementById('requester-name'),
  requesterEmail: document.getElementById('requester-email'),
  requesterCompany: document.getElementById('requester-company'),
  meetingTopic: document.getElementById('meeting-topic'),
  meetingNote: document.getElementById('meeting-note'),
  mailRequest: document.getElementById('mail-request'),
  downloadIcs: document.getElementById('download-ics')
};

const dateLabel = new Intl.DateTimeFormat('de-DE', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit'
});

const timeLabel = new Intl.DateTimeFormat('de-DE', {
  hour: '2-digit',
  minute: '2-digit'
});

function setStatus(message, type = '') {
  els.status.textContent = message;
  els.status.className = `status ${type}`;
}

function unfoldIcs(text) {
  return text.replace(/\r?\n[ \t]/g, '');
}

function splitParams(key) {
  const parts = key.split(';');
  const name = parts.shift().toUpperCase();
  const params = {};
  parts.forEach(part => {
    const [paramKey, paramValue] = part.split('=');
    params[paramKey.toUpperCase()] = paramValue;
  });
  return { name, params };
}

function decodeText(value = '') {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

function parseIcsDate(value, params = {}) {
  if (!value) return null;
  if (params.VALUE === 'DATE') {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(4, 6)) - 1;
    const day = Number(value.slice(6, 8));
    return new Date(year, month, day, 0, 0, 0);
  }

  const clean = value.replace('Z', '');
  const year = Number(clean.slice(0, 4));
  const month = Number(clean.slice(4, 6)) - 1;
  const day = Number(clean.slice(6, 8));
  const hour = Number(clean.slice(9, 11) || 0);
  const minute = Number(clean.slice(11, 13) || 0);
  const second = Number(clean.slice(13, 15) || 0);

  if (value.endsWith('Z')) {
    return new Date(Date.UTC(year, month, day, hour, minute, second));
  }
  return new Date(year, month, day, hour, minute, second);
}

function parseRRule(value = '') {
  return Object.fromEntries(value.split(';').map(part => {
    const [key, itemValue] = part.split('=');
    return [key, itemValue];
  }));
}

function parseExdates(value = '', params = {}) {
  return value.split(',').map(item => parseIcsDate(item, params)).filter(Boolean);
}

function parseCalendar(text) {
  const lines = unfoldIcs(text).split(/\r?\n/);
  const rawEvents = [];
  let current = null;

  lines.forEach(line => {
    if (line === 'BEGIN:VEVENT') {
      current = {};
      return;
    }
    if (line === 'END:VEVENT') {
      if (current) rawEvents.push(current);
      current = null;
      return;
    }
    if (!current || !line.includes(':')) return;

    const divider = line.indexOf(':');
    const rawKey = line.slice(0, divider);
    const value = line.slice(divider + 1);
    const { name, params } = splitParams(rawKey);

    if (name === 'DTSTART') current.start = parseIcsDate(value, params);
    if (name === 'DTEND') current.end = parseIcsDate(value, params);
    if (name === 'SUMMARY') current.summary = decodeText(value);
    if (name === 'LOCATION') current.location = decodeText(value);
    if (name === 'TRANSP') current.transp = value;
    if (name === 'STATUS') current.status = value;
    if (name === 'RRULE') current.rrule = parseRRule(value);
    if (name === 'EXDATE') current.exdates = [...(current.exdates || []), ...parseExdates(value, params)];
    if (name === 'X-MICROSOFT-CDO-BUSYSTATUS') current.busyStatus = value;
  });

  return rawEvents.filter(event => event.start && event.end);
}

function isBusy(event) {
  if (event.status === 'CANCELLED') return false;
  if (event.transp === 'TRANSPARENT') return false;
  if (['FREE', 'TENTATIVE'].includes(event.busyStatus)) return false;
  return true;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function sameMinute(a, b) {
  return a && b && Math.abs(a.getTime() - b.getTime()) < 60 * 1000;
}

function expandWeeklyEvent(event, rangeStart, rangeEnd) {
  if (!event.rrule || event.rrule.FREQ !== 'WEEKLY') return [event];

  const interval = Number(event.rrule.INTERVAL || 1);
  const until = event.rrule.UNTIL ? parseIcsDate(event.rrule.UNTIL) : rangeEnd;
  const weekdays = (event.rrule.BYDAY || '').split(',').filter(Boolean);
  const weekdayIndex = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
  const duration = event.end.getTime() - event.start.getTime();
  const candidates = [];

  for (let day = startOfDay(event.start); day <= rangeEnd && day <= until; day = addDays(day, 1)) {
    const weeks = Math.floor((startOfDay(day) - startOfDay(event.start)) / (7 * 24 * 60 * 60 * 1000));
    if (weeks < 0 || weeks % interval !== 0) continue;
    const code = Object.keys(weekdayIndex).find(key => weekdayIndex[key] === day.getDay());
    if (weekdays.length && !weekdays.includes(code)) continue;

    const start = new Date(day);
    start.setHours(event.start.getHours(), event.start.getMinutes(), event.start.getSeconds(), 0);
    const end = new Date(start.getTime() + duration);
    if (end < rangeStart || start > rangeEnd) continue;
    if ((event.exdates || []).some(exdate => sameMinute(exdate, start))) continue;
    candidates.push({ ...event, start, end });
  }

  return candidates;
}

function normalizeEvents(events, rangeStart, rangeEnd) {
  return events
    .filter(isBusy)
    .flatMap(event => expandWeeklyEvent(event, rangeStart, rangeEnd))
    .filter(event => event.end > rangeStart && event.start < rangeEnd)
    .sort((a, b) => a.start - b.start);
}

function minutesFromInput(value) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function dateAtMinutes(day, minutes) {
  const date = new Date(day);
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

function buildSlots() {
  const today = startOfDay(new Date());
  const rangeDays = Number(els.rangeDays.value);
  const duration = Number(els.duration.value);
  const workStart = minutesFromInput(els.workStart.value);
  const workEnd = minutesFromInput(els.workEnd.value);
  const rangeEnd = addDays(today, rangeDays);
  const events = normalizeEvents(state.events, today, rangeEnd);
  const days = [];

  for (let offset = 0; offset < rangeDays; offset += 1) {
    const day = addDays(today, offset);
    if ([0, 6].includes(day.getDay())) continue;

    const dayStart = dateAtMinutes(day, workStart);
    const dayEnd = dateAtMinutes(day, workEnd);
    const busy = events.filter(event => overlaps(event.start, event.end, dayStart, dayEnd));
    const slots = [];

    for (let minutes = workStart; minutes + duration <= workEnd; minutes += 15) {
      const start = dateAtMinutes(day, minutes);
      const end = new Date(start.getTime() + duration * 60 * 1000);
      if (start < new Date()) continue;
      if (!busy.some(event => overlaps(start, end, event.start, event.end))) {
        slots.push({ start, end });
      }
    }

    days.push({ day, slots, busy });
  }

  return days;
}

function minutesSinceWorkStart(date) {
  return date.getHours() * 60 + date.getMinutes() - minutesFromInput(els.workStart.value);
}

function blockStyle(start, end) {
  const workStart = minutesFromInput(els.workStart.value);
  const workEnd = minutesFromInput(els.workEnd.value);
  const total = Math.max(workEnd - workStart, 1);
  const top = Math.max(minutesSinceWorkStart(start), 0) / total * 100;
  const height = Math.max((end - start) / 60000, 12) / total * 100;
  return `top:${top}%;height:${height}%;`;
}

function renderCalendar(days) {
  const visibleDays = days.slice(0, Math.min(days.length, 5));
  const workStart = minutesFromInput(els.workStart.value);
  const workEnd = minutesFromInput(els.workEnd.value);
  const hourCount = Math.max(Math.ceil((workEnd - workStart) / 60), 1);
  const hourLabels = [];

  for (let minutes = workStart; minutes <= workEnd; minutes += 60) {
    hourLabels.push({ minutes, label: `${String(Math.floor(minutes / 60)).padStart(2, '0')}:00` });
  }

  if (!visibleDays.length) {
    els.calendarBoard.innerHTML = '<div class="empty-state">Kalender konnte noch nicht aufgebaut werden.</div>';
    return;
  }

  function nonOverlappingSlots(slots) {
    let lastEnd = 0;
    return slots.filter(slot => {
      if (slot.start.getTime() < lastEnd) return false;
      lastEnd = slot.end.getTime();
      return true;
    });
  }

  els.calendarBoard.innerHTML = `
    <div class="calendar-grid" style="--day-count:${visibleDays.length};--calendar-height:${hourCount * 72}px;--hour-height:72px;">
      <div class="calendar-corner"></div>
      ${visibleDays.map(day => `
        <div class="calendar-day-head">
          <strong>${dateLabel.format(day.day)}</strong>
          <span>${day.slots.length} freie Slots</span>
        </div>
      `).join('')}
      <div class="time-axis">
        ${hourLabels.map(item => `
          <span class="time-label" style="top:${(item.minutes - workStart) / Math.max(workEnd - workStart, 1) * 100}%;">${item.label}</span>
        `).join('')}
      </div>
      ${visibleDays.map(day => `
        <div class="calendar-day">
          ${day.busy.map(event => `
            <div class="calendar-busy" style="${blockStyle(event.start, event.end)}">belegt</div>
          `).join('')}
          ${nonOverlappingSlots(day.slots).map(slot => `
            <button class="calendar-free" type="button" data-start="${slot.start.toISOString()}" data-end="${slot.end.toISOString()}" style="${blockStyle(slot.start, slot.end)}">
              ${timeLabel.format(slot.start)}
            </button>
          `).join('')}
        </div>
      `).join('')}
    </div>
  `;
}

function renderSlots() {
  const days = buildSlots();
  const slotCount = days.reduce((total, day) => total + day.slots.length, 0);
  els.slotsMeta.textContent = `${slotCount} freie Zeitfenster in den nächsten ${els.rangeDays.value} Tagen.`;
  renderCalendar(days);

  if (!slotCount) {
    els.slotsList.innerHTML = '<div class="empty-state">Keine freien Zeitfenster im gewählten Zeitraum gefunden.</div>';
    return;
  }

  els.slotsList.innerHTML = days
    .filter(day => day.slots.length)
    .map(day => `
      <article class="day-group">
        <div class="day-head">
          <h3>${dateLabel.format(day.day)}</h3>
          <span class="day-date">${day.slots.length} frei</span>
        </div>
        <div class="slot-grid">
          ${day.slots.map(slot => `
            <button class="slot-btn" type="button" data-start="${slot.start.toISOString()}" data-end="${slot.end.toISOString()}">
              ${timeLabel.format(slot.start)} - ${timeLabel.format(slot.end)}
            </button>
          `).join('')}
        </div>
        <div class="busy-strip">
          ${day.busy.slice(0, 6).map(event => `
            <span class="busy-label">belegt ${timeLabel.format(event.start)}-${timeLabel.format(event.end)}</span>
          `).join('')}
        </div>
      </article>
    `).join('');
}

async function loadRemoteCalendar() {
  setStatus('Kalender wird geladen...');
  try {
    const text = await fetchCalendarText();
    state.events = parseCalendar(text);
    renderSlots();
    setStatus(`${state.events.length} Kalendereinträge geladen.`, 'ok');
  } catch (error) {
    els.calendarBoard.innerHTML = '<div class="empty-state">Der Kalender konnte nicht geladen werden.</div>';
    els.slotsList.innerHTML = '<div class="empty-state">Starte die App über den lokalen Kalender-Server oder öffne eine ICS-Datei.</div>';
    setStatus(`Kalender konnte nicht geladen werden: ${error.message}`, 'error');
  }
}

async function fetchCalendarText() {
  const directUrl = els.icsUrl.value.trim();
  const attempts = [];
  if (location.protocol !== 'file:') {
    attempts.push(`${LOCAL_PROXY_URL}?url=${encodeURIComponent(directUrl)}`);
  }
  attempts.push(directUrl);

  let lastError = null;
  for (const url of attempts) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Unbekannter Ladefehler');
}

function loadFileCalendar(file) {
  const reader = new FileReader();
  reader.onload = () => {
    state.events = parseCalendar(String(reader.result));
    renderSlots();
    setStatus(`${state.events.length} Kalendereinträge aus Datei geladen.`, 'ok');
  };
  reader.onerror = () => setStatus('Die ICS-Datei konnte nicht gelesen werden.', 'error');
  reader.readAsText(file);
}

function selectSlot(startIso, endIso) {
  state.selectedSlot = {
    start: new Date(startIso),
    end: new Date(endIso)
  };
  document.querySelectorAll('.slot-btn.selected').forEach(button => button.classList.remove('selected'));
  document.querySelectorAll('.calendar-free.selected').forEach(button => button.classList.remove('selected'));
  document.querySelectorAll(`[data-start="${startIso}"]`).forEach(button => button.classList.add('selected'));

  els.selectedSlotLabel.textContent = `${dateLabel.format(state.selectedSlot.start)}, ${timeLabel.format(state.selectedSlot.start)} - ${timeLabel.format(state.selectedSlot.end)}`;
  els.mailRequest.disabled = false;
  els.downloadIcs.disabled = false;
}

function toIcsDate(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function createBookingIcs() {
  const topic = els.meetingTopic.value || 'Termin';
  const company = els.requesterCompany.value ? ` (${els.requesterCompany.value})` : '';
  const description = [
    `Anfrage von: ${els.requesterName.value}${company}`,
    `E-Mail: ${els.requesterEmail.value}`,
    '',
    els.meetingNote.value
  ].join('\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sensise//Terminbuchung//DE',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${crypto.randomUUID ? crypto.randomUUID() : Date.now()}@sensise-booking`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(state.selectedSlot.start)}`,
    `DTEND:${toIcsDate(state.selectedSlot.end)}`,
    `SUMMARY:${escapeIcsText(topic)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    'LOCATION:Microsoft Teams / nach Vereinbarung',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

function escapeIcsText(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function downloadBookingIcs() {
  if (!state.selectedSlot || !els.bookingForm.reportValidity()) return;
  const blob = new Blob([createBookingIcs()], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `terminanfrage-${state.selectedSlot.start.toISOString().slice(0, 10)}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

function sendMailRequest(event) {
  event.preventDefault();
  if (!state.selectedSlot || !els.bookingForm.reportValidity()) return;

  const subject = `Terminanfrage: ${els.meetingTopic.value}`;
  const body = [
    'Hallo Luca,',
    '',
    'ich möchte gerne folgenden Termin anfragen:',
    `${dateLabel.format(state.selectedSlot.start)}, ${timeLabel.format(state.selectedSlot.start)} - ${timeLabel.format(state.selectedSlot.end)} (${DEFAULT_ZONE_LABEL})`,
    '',
    `Name: ${els.requesterName.value}`,
    `E-Mail: ${els.requesterEmail.value}`,
    `Firma: ${els.requesterCompany.value || '-'}`,
    '',
    `Thema: ${els.meetingTopic.value}`,
    '',
    els.meetingNote.value || ''
  ].join('\n');

  const mailto = `mailto:${encodeURIComponent(els.ownerEmail.value)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
}

function bindEvents() {
  els.loadBtn.addEventListener('click', loadRemoteCalendar);
  els.fileInput.addEventListener('change', event => {
    const [file] = event.target.files;
    if (file) loadFileCalendar(file);
  });
  [els.duration, els.rangeDays, els.workStart, els.workEnd].forEach(input => {
    input.addEventListener('change', () => {
      if (state.events.length) renderSlots();
    });
  });
  els.slotsList.addEventListener('click', event => {
    const button = event.target.closest('[data-start]');
    if (!button) return;
    selectSlot(button.dataset.start, button.dataset.end);
  });
  els.calendarBoard.addEventListener('click', event => {
    const button = event.target.closest('[data-start]');
    if (!button) return;
    selectSlot(button.dataset.start, button.dataset.end);
  });
  els.bookingForm.addEventListener('submit', sendMailRequest);
  els.downloadIcs.addEventListener('click', downloadBookingIcs);
}

function init() {
  els.icsUrl.value = DEFAULT_ICS_URL;
  bindEvents();
  loadRemoteCalendar();
}

init();
