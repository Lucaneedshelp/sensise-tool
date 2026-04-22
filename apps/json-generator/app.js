let excelHeaders = [];
let excelRows = [];
let jsonOutput = null;

const FIELDS = [
  { key: 'name', label: 'Gerätename / Description', hints: ['name', 'bezeichnung', 'device', 'gerät', 'description', 'descr', 'label', 'titel'] },
  { key: 'dev_eui', label: 'DevEUI', hints: ['deveui', 'dev_eui', 'deviceeui', 'eui'] },
  { key: 'join_eui', label: 'AppEUI / JoinEUI', hints: ['joineui', 'join_eui', 'appeui', 'app_eui', 'applicationeui'] },
  { key: 'app_key', label: 'AppKey', hints: ['appkey', 'app_key', 'applicationkey', 'nwkkey', 'key'] },
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

fileTrigger.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', event => {
  const file = event.target.files[0];
  if (file) processFile(file);
});
buildBtn.addEventListener('click', buildJSON);
copyBtn.addEventListener('click', copyJSON);
downloadBtn.addEventListener('click', downloadJSON);

function setStatus(message) {
  statusMsg.textContent = message;
}

function guessColumn(headers, hints) {
  for (const hint of hints) {
    const found = headers.find(header => header && header.toString().toLowerCase().replace(/[\s_\-]/g, '').includes(hint.toLowerCase().replace(/[\s_\-]/g, '')));
    if (found) return found;
  }
  return '';
}

function normalizeHex(value) {
  if (value === null || value === undefined) return '';
  return value.toString().replace(/[^a-fA-F0-9]/g, '').toUpperCase();
}

function processFile(file) {
  const reader = new FileReader();
  reader.onload = event => {
    try {
      const workbook = XLSX.read(new Uint8Array(event.target.result), { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!data.length) {
        setStatus('Die Datei ist leer.');
        return;
      }

      excelHeaders = Object.keys(data[0]);
      excelRows = data;
      setStatus(`${data.length} Zeilen aus "${file.name}" eingelesen`);
      renderMapping();
    } catch (error) {
      setStatus(`Fehler beim Lesen: ${error.message}`);
    }
  };

  reader.readAsArrayBuffer(file);
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
        ${excelHeaders.map(header => `<option value="${header}" ${header === guessed ? 'selected' : ''}>${header}</option>`).join('')}
      </select>
    `;
    mappingGrid.appendChild(card);
  });

  mappingSection.hidden = false;
  previewSection.hidden = true;
  statsBar.hidden = true;
}

function buildJSON() {
  const mapping = {};
  FIELDS.forEach(field => {
    mapping[field.key] = document.getElementById(`map-${field.key}`)?.value || '';
  });

  const onMapVal = document.getElementById('on-map-val').value;
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
      serialNumber: `eui-${devEui}`,
      properties: { onMap: onMapVal },
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
    errorBox.innerHTML = errors.slice(0, 8).join('<br>') + (errors.length > 8 ? `<br>… und ${errors.length - 8} weitere` : '');
  } else {
    errorBox.hidden = true;
    errorBox.innerHTML = '';
  }

  previewSection.hidden = false;
  statsBar.hidden = false;
}

function copyJSON() {
  if (!jsonOutput) return;

  navigator.clipboard.writeText(jsonOutput).then(() => {
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Kopiert';
    setTimeout(() => {
      copyBtn.textContent = originalText;
    }, 1800);
  });
}

function downloadJSON() {
  if (!jsonOutput) return;

  const blob = new Blob([jsonOutput], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'sensise_devices.json';
  link.click();
}
