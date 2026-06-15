const SENSOR_CATALOG = [
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 4, type: 'AIR_PRESSURE', index: 0, dataType: 'UINT32', endianness: 'LE', showInAnalytics: true, unit: 'PASCAL' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 4, type: 'BATTERY_LEVEL', index: 0, dataType: 'UINT32', endianness: 'LE', showInAnalytics: true, unit: 'PERCENT' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 4, type: 'CO2', index: 0, dataType: 'UINT32', endianness: 'LE', showInAnalytics: true, unit: 'PPM' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 0, type: 'CONTACT_RELATIVE_COUNT', index: 0, dataType: 'UINT32', showInAnalytics: true, unit: 'LITER' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 0, type: 'CONTACT_STATE', index: 0, dataType: 'UINT8', showInAnalytics: false },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 4, type: 'CONDENSATION_STATE', index: 0, dataType: 'UINT32', endianness: 'LE', showInAnalytics: true, unit: 'ON_OFF' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 4, type: 'CTRL_SETPOINT_TEMPERATURE', index: 0, dataType: 'UINT32', endianness: 'LE', showInAnalytics: true, unit: 'CELSIUS' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 4, type: 'DISTANCE', index: 0, dataType: 'UINT32', endianness: 'LE', showInAnalytics: true, unit: 'METER' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 4, type: 'ENERGY_CONSUMPTION', index: 0, dataType: 'UINT32', endianness: 'LE', showInAnalytics: true, unit: 'WATT_HOUR', retentionPolicy: 'PERSIST_FOREVER' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 0, type: 'FLUID_MAX_TEMPERATURE', index: 0, dataType: 'FLOAT', showInAnalytics: true, unit: 'CELSIUS' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 0, type: 'FLUID_MIN_TEMPERATURE', index: 0, dataType: 'FLOAT', showInAnalytics: true, unit: 'CELSIUS' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 4, type: 'GAS_FLOW', index: 0, dataType: 'UINT32', endianness: 'LE', showInAnalytics: true, unit: 'CUBIC_METERS_PER_HOUR' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 4, type: 'GAS_VOLUME', index: 0, dataType: 'UINT32', endianness: 'LE', showInAnalytics: true, unit: 'CUBIC_METERS', retentionPolicy: 'PERSIST_FOREVER' },
  { module: 'virtual', component: 0, register: 0, offset: 34851, length: 4, type: 'GAS_VOLUME_ABSOLUTE', index: 0, dataType: 'UINT32', endianness: 'LE', showInAnalytics: true, unit: 'CUBIC_METERS' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 4, type: 'HUMIDITY', index: 0, dataType: 'UINT32', endianness: 'LE', showInAnalytics: true, unit: 'PERCENT' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 4, type: 'INTERNAL_TEMPERATURE', index: 0, dataType: 'FLOAT', endianness: 'LE', showInAnalytics: true, unit: 'CELSIUS' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 0, type: 'LEAKAGE_STATE', index: 0, dataType: 'UINT8', showInAnalytics: true },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 4, type: 'LEAKAGE_STATE', index: 0, dataType: 'UINT32', endianness: 'LE', showInAnalytics: true, unit: 'ON_OFF' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 4, type: 'LOUDNESS', index: 0, dataType: 'UINT32', endianness: 'LE', showInAnalytics: true, unit: 'DBA' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 0, type: 'MOTION_RELATIVE_COUNT', index: 0, dataType: 'UINT32', showInAnalytics: true, unit: 'LITER' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 4, type: 'OCCUPANCY', index: 0, dataType: 'UINT32', endianness: 'LE', showInAnalytics: true, unit: 'ON_OFF' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 1, type: 'OUTPUT_STATE', index: 0, dataType: 'UINT8', endianness: 'LE', showInAnalytics: true, unit: 'ON_OFF' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 4, type: 'POWER', index: 0, dataType: 'UINT32', endianness: 'LE', showInAnalytics: true, unit: 'WATT' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 4, type: 'PRESENT_AMBIENT_LIGHT_LEVEL', index: 0, dataType: 'UINT32', endianness: 'LE', showInAnalytics: true, unit: 'LUX' },
  { module: 'lorawan', component: 0, register: 0, offset: 0, length: 4, type: 'PRESENT_AMBIENT_LIGHT_LEVEL', index: 0, dataType: 'UINT32', endianness: 'LE', showInAnalytics: true, unit: 'LUX' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 4, type: 'SETPOINT_TEMPERATURE', index: 0, dataType: 'UINT32', endianness: 'LE', showInAnalytics: true, unit: 'CELSIUS' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 4, type: 'TEMPERATURE', index: 0, dataType: 'UINT32', endianness: 'LE', showInAnalytics: true, unit: 'CELSIUS' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 0, type: 'TEMPERATURE', index: 0, dataType: 'FLOAT', showInAnalytics: true, unit: 'CELSIUS' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 4, type: 'TEMPERATURE_1', index: 0, dataType: 'UINT32', endianness: 'LE', showInAnalytics: true, unit: 'CELSIUS' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 4, type: 'TEMPERATURE_2', index: 0, dataType: 'UINT32', endianness: 'LE', showInAnalytics: true, unit: 'CELSIUS' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 4, type: 'TEMPERATURE_FEEDBACK', index: 0, dataType: 'UINT32', endianness: 'LE', showInAnalytics: true, unit: 'CELSIUS' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 4, type: 'VALVE_POSITION', index: 0, dataType: 'UINT32', endianness: 'LE', showInAnalytics: true, unit: 'PERCENT' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 4, type: 'VOC_LEVEL', index: 0, dataType: 'UINT32', endianness: 'LE', showInAnalytics: true, unit: 'PERCENT' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 4, type: 'VOLTAGE', index: 0, dataType: 'UINT32', endianness: 'LE', showInAnalytics: true, unit: 'VOLT' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 4, type: 'VOLTAGE', index: 0, dataType: 'FLOAT', endianness: 'LE', showInAnalytics: true, unit: 'VOLT' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 0, type: 'VOLTAGE', index: 0, dataType: 'FLOAT', showInAnalytics: true, unit: 'VOLT' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 4, type: 'VOLTAGE', index: 0, dataType: 'UINT32', endianness: 'LE', scale: 0.01, showInAnalytics: true, unit: 'VOLT' },
  { module: 'virtual', component: 0, register: 0, offset: 0, length: 4, type: 'WINDOW_CONTACT_STATE', index: 0, dataType: 'UINT32', endianness: 'LE', showInAnalytics: true, unit: 'ON_OFF' }
];

const sensorList = document.getElementById('sensor-list');
const searchInput = document.getElementById('search-input');
const unitFilter = document.getElementById('unit-filter');
const selectedCount = document.getElementById('selected-count');
const catalogCount = document.getElementById('catalog-count');
const selectionSummary = document.getElementById('selection-summary');
const jsonPreview = document.getElementById('json-preview');
const copyBtn = document.getElementById('copy-btn');
const downloadBtn = document.getElementById('download-btn');
const clearBtn = document.getElementById('clear-btn');
const selectCommonBtn = document.getElementById('select-common-btn');
const formatBtn = document.getElementById('format-btn');
const copyStatus = document.getElementById('copy-status');

const selectedIds = new Set();

function sensorId(sensor) {
  return [
    sensor.type,
    sensor.module,
    sensor.dataType,
    sensor.length,
    sensor.unit || '',
    sensor.scale ? `scale:${sensor.scale}` : '',
    sensor.retentionPolicy || '',
    sensor.offset ? `offset:${sensor.offset}` : ''
  ].join('|');
}

const COMMON_ROOM_CLIMATE = new Set(
  SENSOR_CATALOG
    .filter(sensor => (
      ['CO2', 'HUMIDITY', 'TEMPERATURE', 'VOLTAGE'].includes(sensor.type)
      && sensor.module === 'virtual'
      && sensor.dataType === 'UINT32'
      && sensor.length === 4
      && !sensor.scale
      && !sensor.retentionPolicy
    ))
    .map(sensorId)
);

function cloneSensor(sensor) {
  return JSON.parse(JSON.stringify(sensor));
}

function buildOutput() {
  return {
    sensorModule: SENSOR_CATALOG
      .filter(sensor => selectedIds.has(sensorId(sensor)))
      .map(cloneSensor)
  };
}

function buildJson() {
  return JSON.stringify(buildOutput(), null, 2);
}

function searchableText(sensor) {
  return [
    sensor.type,
    sensor.module,
    sensor.dataType,
    sensor.unit,
    sensor.endianness,
    sensor.retentionPolicy,
    sensor.scale,
    `length ${sensor.length}`,
    `offset ${sensor.offset}`
  ].filter(value => value !== undefined && value !== null).join(' ').toLowerCase();
}

function renderUnitOptions() {
  const units = [...new Set(SENSOR_CATALOG.map(sensor => sensor.unit || 'Ohne Einheit'))].sort();
  unitFilter.innerHTML = '<option value="">Alle Einheiten</option>' + units
    .map(unit => `<option value="${unit}">${unit}</option>`)
    .join('');
}

function renderSensorList() {
  const query = searchInput.value.trim().toLowerCase();
  const unit = unitFilter.value;
  const visibleSensors = SENSOR_CATALOG.filter(sensor => {
    const unitName = sensor.unit || 'Ohne Einheit';
    const matchesUnit = !unit || unitName === unit;
    const matchesQuery = !query || searchableText(sensor).includes(query);
    return matchesUnit && matchesQuery;
  });

  if (!visibleSensors.length) {
    sensorList.innerHTML = '<div class="empty-state">Keine passende Messgröße gefunden.</div>';
    return;
  }

  sensorList.innerHTML = visibleSensors.map(sensor => {
    const id = sensorId(sensor);
    const variant = getVariantLabel(sensor);

    return `
      <label class="sensor-option">
        <input type="checkbox" value="${id}" ${selectedIds.has(id) ? 'checked' : ''}>
        <span class="sensor-main">
          <span class="sensor-title">
            <strong>${sensor.type}</strong>
            ${variant ? `<span class="sensor-variant">(${variant})</span>` : ''}
          </span>
        </span>
      </label>
    `;
  }).join('');
}

function getVariantLabel(sensor) {
  const sameTypeCount = SENSOR_CATALOG.filter(item => item.type === sensor.type).length;
  if (sameTypeCount < 2) return '';

  const parts = [
    sensor.module !== 'virtual' ? sensor.module : null,
    sensor.dataType,
    sensor.length !== 4 ? `L${sensor.length}` : null,
    sensor.unit,
    sensor.scale ? `scale ${sensor.scale}` : null,
    sensor.retentionPolicy ? 'persistent' : null,
    sensor.offset ? `offset ${sensor.offset}` : null
  ];

  return parts.filter(Boolean).join(', ');
}

function renderOutput() {
  const output = buildOutput();
  const count = output.sensorModule.length;

  selectedCount.textContent = String(count);
  catalogCount.textContent = String(SENSOR_CATALOG.length);
  selectionSummary.textContent = count
    ? `${count} Messgröße${count === 1 ? '' : 'n'} im JSON`
    : 'Noch keine Messgröße ausgewählt';
  jsonPreview.textContent = JSON.stringify(output, null, 2);
}

function renderAll() {
  renderSensorList();
  renderOutput();
}

function setStatus(message, success = false) {
  copyStatus.textContent = message;
  copyStatus.classList.toggle('inline-status--success', success);
}

async function copyJson() {
  const text = buildJson();

  try {
    await navigator.clipboard.writeText(text);
    setStatus('JSON wurde in die Zwischenablage kopiert.', true);
  } catch (error) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-1000px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    setStatus('JSON wurde kopiert.', true);
  }
}

function downloadJson() {
  const blob = new Blob([buildJson()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sensor-module.json';
  link.click();
  URL.revokeObjectURL(url);
  setStatus('Download wurde vorbereitet.', true);
}

sensorList.addEventListener('change', event => {
  if (event.target.type !== 'checkbox') return;

  if (event.target.checked) {
    selectedIds.add(event.target.value);
  } else {
    selectedIds.delete(event.target.value);
  }

  renderOutput();
});

searchInput.addEventListener('input', renderSensorList);
unitFilter.addEventListener('change', renderSensorList);

clearBtn.addEventListener('click', () => {
  selectedIds.clear();
  setStatus('Auswahl geleert.');
  renderAll();
});

selectCommonBtn.addEventListener('click', () => {
  COMMON_ROOM_CLIMATE.forEach(id => selectedIds.add(id));
  setStatus('Raumklima-Messgrößen ausgewählt.', true);
  renderAll();
});

copyBtn.addEventListener('click', copyJson);
downloadBtn.addEventListener('click', downloadJson);
formatBtn.addEventListener('click', renderOutput);

renderUnitOptions();
renderAll();
