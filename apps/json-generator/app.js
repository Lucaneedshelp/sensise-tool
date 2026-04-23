let excelHeaders = [];
let excelRows = [];
let jsonOutput = null;

const FIELDS = [
  {
    key: 'name',
    label: 'Gerätename / Beschreibung',
    hints: ['name', 'bezeichnung', 'device', 'gerät', 'description', 'descr', 'label', 'titel']
  },
  { key: 'dev_eui', label: 'DevEUI', hints: ['deveui', 'dev_eui', 'deviceeui', 'eui'] },
  { key: 'join_eui', label: 'AppEUI / JoinEUI', hints: ['joineui', 'join_eui', 'appeui', 'app_eui', 'applicationeui'] },
  { key: 'app_key', label: 'AppKey', hints: ['appkey', 'app_key', 'applicationkey', 'nwkkey', 'key'] }
];

const fileInput = document.getElementById('file-input');
const fileTrigger = document.getElementById('file-trigger');
const mappingSection = document.getElementById('mapping-section');
const mappingGrid = document.getElementById('mapping-grid');
const previewSection = document.getElementById('preview-section');
const statsBar = document.getElementById('stats-bar');
const statusMsg = document.getElementById('status-msg');
const previewMeta = document.getElementById('preview-meta');
const jsonPreview = document.getElementById('json-preview');
const errorBox = document.getElementById('error-box');
const buildBtn = document.getElementById('build-btn');
const copyBtn = document.getElementById('copy-btn');
const downloadBtn = document.getElementById('download-btn');
const fileNameInput = document.getElementById('file-name-input');

fileTrigger.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', event => {
  const file = event.target.files[0];
  if (file) processFile(file);
});

buildBtn.addEventListener('click', buildJSON);
copyBtn.addEventListener('click', copyJSON);
downloadBtn.addEventListener('click', downloadJSON);

function setStatus(message, tone = '') {
  statusMsg.textContent = message;
  statusMsg.className = 'inline-status';

  if (tone) {
    statusMsg.classList.add(`inline-status--${tone}`);
  }
}

function guessColumn(headers, hints) {
  for (const hint of hints) {
    const normalizedHint = hint.toLowerCase().replace(/[\s_\-]/g, '');
    const found = headers.find(header => {
      if (!header) return false;
      const normalizedHeader = header.toString().toLowerCase().replace(/[\s_\-]/g, '');
      return normalizedHeader.includes(normalizedHint);
    });
    if (found) return found;
  }
  return '';
}

function normalizeHex(value) {
  if (value === null || value === undefined) return '';
  return value.toString().replace(/[^a-fA-F0-9]/g, '').toUpperCase();
}

function sanitizeFilename(value) {
  const cleaned = (value || '')
    .toString()
    .trim()
    .replace(/\.json$/i, '')
    .replace(/[\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[_\-.]+|[_\-.]+$/g, '');

  return cleaned || 'sensise_devices';
}

function setSuggestedFilename(fileName) {
  const baseName = (fileName || 'sensise_devices').replace(/\.[^.]+$/, '');
  fileNameInput.value = sanitizeFilename(baseName);
}

function detectCsvSeparator(text) {
  const firstNonEmptyLine = text
    .split(/\r?\n/)
    .find(line => line.trim().length > 0) || '';

  const semicolons = (firstNonEmptyLine.match(/;/g) || []).length;
  const commas = (firstNonEmptyLine.match(/,/g) || []).length;
  const tabs = (firstNonEmptyLine.match(/\t/g) || []).length;

  if (semicolons >= commas && semicolons >= tabs) return ';';
  if (tabs >= commas && tabs >= semicolons) return '\t';
  return ',';
}

async function processFile(file) {
  try {
    const lowerName = file.name.toLowerCase();
    const isCSV = lowerName.endsWith('.csv');

    let workbook;

    if (isCSV) {
      let text = await file.text();

      if (text.charCodeAt(0) === 0xfeff) {
        text = text.slice(1);
      }

      const separator = detectCsvSeparator(text);

      workbook = XLSX.read(text, {
        type: 'string',
        raw: true,
        FS: separator
      });
    } else {
      const data = await file.arrayBuffer();
      workbook = XLSX.read(data, { type: 'array' });
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (!data.length) {
      setStatus('Die Datei ist leer.', 'warning');
      mappingSection.hidden = true;
      previewSection.hidden = true;
      statsBar.hidden = true;
      return;
    }

    excelHeaders = Object.keys(data[0]);
    excelRows = data;

    setStatus(`${data.length} Zeilen aus "${file.name}" eingelesen`, 'success');
    setSuggestedFilename(file.name);
    renderMapping();
  } catch (error) {
    setStatus(`Fehler beim Lesen: ${error.message}`, 'error');
    mappingSection.hidden = true;
    previewSection.hidden = true;
    statsBar.hidden = true;
  }
}

function renderMapping() {
  mappingGrid.innerHTML = '';

  FIELDS.forEach(field => {
    const guessed = guessColumn(excelHeaders, field.hints);
    const card = document.createElement('div');
    card.className = 'field-card';
    card.innerHTML = `
      <label for="map-${field.key}">${field.label}</label>
      <select id="map-${field.key}">
        <option value="">— nicht zugeordnet —</option>
        ${excelHeaders.map(header => `
          <option value="${header}" ${header === guessed ? 'selected' : ''}>
            ${header}
          </option>
        `).join('')}
      </select>
    `;
    mappingGrid.appendChild(card);
  });

  mappingSection.hidden = false;
  previewSection.hidden = true;
  statsBar.hidden = true;
  errorBox.hidden = true;
  errorBox.innerHTML = '';
}

function buildJSON() {
  const mapping = {};

  FIELDS.forEach(field => {
    mapping[field.key] = document.getElementById(`map-${field.key}`)?.value || '';
  });

  const onMapVal = document.getElementById('on-map-val').value === 'true';
  const errors = [];
  let okCount = 0;

  const devices = excelRows.map((row, index) => {
    const rawEui = row[mapping.dev_eui] || '';
    const devEui = normalizeHex(rawEui).toLowerCase();
    const joinEui = normalizeHex(row[mapping.join_eui] || '');
    const appKey = normalizeHex(row[mapping.app_key] || '');
    const name = (row[mapping.name] || `Gerät ${index + 1}`).toString().trim();

    const rowErrors = [];
    if (!devEui) rowErrors.push('DevEUI fehlt');
    if (!joinEui) rowErrors.push('JoinEUI fehlt');
    if (!appKey) rowErrors.push('AppKey fehlt');

    if (rowErrors.length) {
      errors.push(`Zeile ${index + 2}: ${rowErrors.join(', ')}`);
    } else {
      okCount += 1;
    }

    return {
      name,
      platform: 'LORAWAN',
      serialNumber: devEui ? `eui-${devEui}` : '',
      properties: {
        onMap: onMapVal
      },
      details: {
        type: 'LORAWAN',
        joinEui,
        appKey
      }
    };
  });

  jsonOutput = JSON.stringify(devices, null, 2);
  jsonPreview.textContent = jsonOutput;
  previewMeta.textContent = `${devices.length} Geräte · ${errors.length ? `${errors.length} Warnungen` : 'alle vollständig'}`;

  document.getElementById('stat-total').textContent = devices.length;
  document.getElementById('stat-ok').textContent = okCount;
  document.getElementById('stat-warn').textContent = errors.length;

  if (errors.length) {
    errorBox.hidden = false;
    errorBox.innerHTML =
      errors.slice(0, 8).join('<br>') +
      (errors.length > 8 ? `<br>… und ${errors.length - 8} weitere` : '');
    setStatus(`JSON erstellt: ${errors.length} Warnungen gefunden.`, 'warning');
  } else {
    errorBox.hidden = true;
    errorBox.innerHTML = '';
    setStatus('JSON erfolgreich erstellt.', 'success');
  }

  previewSection.hidden = false;
  statsBar.hidden = false;
}

function copyJSON() {
  if (!jsonOutput) return;

  navigator.clipboard.writeText(jsonOutput).then(() => {
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Kopiert';
    setStatus('JSON in die Zwischenablage kopiert.', 'success');

    setTimeout(() => {
      copyBtn.textContent = originalText;
    }, 1800);
  }).catch(error => {
    setStatus(`Fehler beim Kopieren: ${error.message}`, 'error');
  });
}

function downloadJSON() {
  if (!jsonOutput) return;

  const blob = new Blob([jsonOutput], { type: 'application/json' });
  const link = document.createElement('a');
  const objectUrl = URL.createObjectURL(blob);
  const fileName = `${sanitizeFilename(fileNameInput.value)}.json`;

  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(objectUrl);
  setStatus(`JSON „${fileName}“ wurde heruntergeladen.`, 'success');
}
