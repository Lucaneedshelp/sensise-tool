const SENSOR_TYPES = [
  'CURRENT',
  'VOLTAGE',
  'ENERGY_CONSUMPTION',
  'TEMPERATURE',
  'TEMPERATURE_1',
  'TEMPERATURE_2',
  'FLUID_MAX_TEMPERATURE',
  'FLUID_MIN_TEMPERATURE',
  'LEAKAGE_STATE',
  'MOTION_RELATIVE_COUNT',
  'GAS_FLOW',
  'GAS_VOLUME',
  'GAS_VOLUME_ABSOLUTE',
  'POWER',
  'AIR_PRESSURE',
  'BATTERY_LEVEL',
  'DISTANCE',
  'HUMIDITY',
  'LOUDNESS',
  'PRESENT_AMBIENT_LIGHT_LEVEL',
  'CO2',
  'VOC_LEVEL',
  'OCCUPANCY',
  'CONTACT_RELATIVE_COUNT',
  'CONTACT_STATE',
  'WINDOW_CONTACT_STATE',
  'CTRL_SETPOINT_TEMPERATURE',
  'SETPOINT_TEMPERATURE',
  'VALVE_POSITION',
  'CONDENSATION_STATE'
];

const DEMO_DECODER = `function decodeUplink(input) {
  const bytes = input.bytes;

  return {
    data: {
      temperature: ((bytes[0] << 8) | bytes[1]) / 10,
      humidity: bytes[2],
      battery: bytes[3] / 10
    }
  };
}`;

const DEMO_PAYLOAD = '00FA321E';

const state = {
  analysis: null,
  mapping: new Map(),
  generatedCode: ''
};

const dom = {
  decoderSource: document.getElementById('decoder-source'),
  payloadHex: document.getElementById('payload-hex'),
  fportInput: document.getElementById('fport-input'),
  demoBtn: document.getElementById('demo-btn'),
  analyzeBtn: document.getElementById('analyze-btn'),
  analysisStatus: document.getElementById('analysis-status'),
  sensorTypeCount: document.getElementById('sensor-type-count'),
  resultGrid: document.getElementById('result-grid'),
  fieldSummary: document.getElementById('field-summary'),
  duplicateWarning: document.getElementById('duplicate-warning'),
  fieldList: document.getElementById('field-list'),
  generateBtn: document.getElementById('generate-btn'),
  modeBadge: document.getElementById('mode-badge'),
  decodedPreview: document.getElementById('decoded-preview'),
  exportPanel: document.getElementById('export-panel'),
  exportSummary: document.getElementById('export-summary'),
  generatedOutput: document.getElementById('generated-output'),
  copyOutputBtn: document.getElementById('copy-output-btn'),
  copyStatus: document.getElementById('copy-status')
};

dom.sensorTypeCount.textContent = SENSOR_TYPES.length;
setAnalysisStatus('Noch kein Decoder analysiert');
setCopyStatus('Noch nichts generiert');

dom.demoBtn.addEventListener('click', loadDemo);
dom.analyzeBtn.addEventListener('click', analyzeDecoder);
dom.generateBtn.addEventListener('click', generateWrapperDecoder);
dom.copyOutputBtn.addEventListener('click', copyGeneratedDecoder);

function loadDemo() {
  dom.decoderSource.value = DEMO_DECODER;
  dom.payloadHex.value = DEMO_PAYLOAD;
  dom.fportInput.value = '1';
  setAnalysisStatus('Demo geladen. Du kannst direkt analysieren.', 'success');
}

function setAnalysisStatus(message, tone = '') {
  dom.analysisStatus.textContent = message;
  dom.analysisStatus.className = 'inline-status';

  if (tone === 'success') {
    dom.analysisStatus.classList.add('inline-status--success');
  }

  if (tone === 'error') {
    dom.analysisStatus.classList.add('inline-status--error');
  }
}

function setCopyStatus(message, tone = '') {
  dom.copyStatus.textContent = message;
  dom.copyStatus.className = 'inline-status inline-status--compact';

  if (tone === 'success') {
    dom.copyStatus.classList.add('inline-status--success');
  }

  if (tone === 'error') {
    dom.copyStatus.classList.add('inline-status--error');
  }
}

function prepareDecoderSource(source) {
  return source
    .replace(/^\uFEFF/, '')
    .replace(/\bmodule\.exports\b/g, 'moduleExports')
    .replace(/\bexports\./g, 'moduleExports.')
    .replace(/export\s+default\s+/g, '')
    .replace(/export\s+(function|const|let|var|class)\s+/g, '$1 ')
    .replace(/export\s*\{[^}]+\};?/g, '')
    .trim();
}

function parseHexPayload(value) {
  const cleaned = (value || '').replace(/[^a-fA-F0-9]/g, '');

  if (!cleaned) {
    throw new Error('Bitte einen Beispielpayload in Hex einfügen.');
  }

  if (cleaned.length % 2 !== 0) {
    throw new Error('Der Hex-Payload muss aus ganzen Byte-Paaren bestehen.');
  }

  const bytes = [];

  for (let i = 0; i < cleaned.length; i += 2) {
    bytes.push(parseInt(cleaned.slice(i, i + 2), 16));
  }

  return bytes;
}

function decoderAnalysisWorker() {
  function isPlainObject(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
  }

  function resolveApi(preparedSource) {
    const factory = new Function(
      '"use strict";\n' +
      'let moduleExports = {};\n' +
      preparedSource + '\n' +
      'const exported = moduleExports;\n' +
      'const fallback = exported && typeof exported === "function" ? exported : null;\n' +
      'return {' +
      'decodeUplink: typeof decodeUplink === "function" ? decodeUplink : exported && typeof exported.decodeUplink === "function" ? exported.decodeUplink : fallback && fallback.length <= 1 ? fallback : null,' +
      'Decoder: typeof Decoder === "function" ? Decoder : exported && typeof exported.Decoder === "function" ? exported.Decoder : fallback && fallback.length > 1 ? fallback : null,' +
      'decodePayload: typeof decodePayload === "function" ? decodePayload : exported && typeof exported.decodePayload === "function" ? exported.decodePayload : null' +
      '};'
    );

    return factory();
  }

  self.onmessage = event => {
    const { preparedSource, bytes, fPort } = event.data;

    try {
      const api = resolveApi(preparedSource);
      let mode = '';
      let rawResult;

      if (typeof api.decodeUplink === 'function') {
        mode = 'decodeUplink';
        rawResult = api.decodeUplink({ bytes, fPort, recvTime: new Date().toISOString(), variables: {} });
      } else if (typeof api.Decoder === 'function') {
        mode = 'Decoder';
        rawResult = api.Decoder(bytes, fPort);
      } else if (typeof api.decodePayload === 'function') {
        mode = 'decodePayload';
        rawResult = api.decodePayload(bytes, fPort);
      } else {
        throw new Error('Keine unterstützte Decoder-Funktion gefunden.');
      }

      let baseData = {};

      if (mode === 'decodeUplink') {
        if (rawResult && typeof rawResult === 'object' && isPlainObject(rawResult.data)) {
          baseData = rawResult.data;
        } else if (isPlainObject(rawResult)) {
          baseData = rawResult;
        }
      } else if (isPlainObject(rawResult)) {
        baseData = rawResult;
      }

      self.postMessage({
        ok: true,
        mode,
        rawResult,
        baseData
      });
    } catch (error) {
      self.postMessage({
        ok: false,
        error: error && error.message ? error.message : String(error)
      });
    }
  };
}

function runDecoderAnalysis(preparedSource, bytes, fPort) {
  return new Promise((resolve, reject) => {
    const workerSource = `(${decoderAnalysisWorker.toString()})();`;
    const blob = new Blob([workerSource], { type: 'text/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    const cleanup = () => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
    };

    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('Die Analyse hat zu lange gedauert. Bitte Decoder oder Payload prüfen.'));
    }, 3000);

    worker.onmessage = event => {
      window.clearTimeout(timeout);
      cleanup();

      if (event.data && event.data.ok) {
        resolve(event.data);
        return;
      }

      reject(new Error(event.data && event.data.error ? event.data.error : 'Analyse fehlgeschlagen.'));
    };

    worker.onerror = () => {
      window.clearTimeout(timeout);
      cleanup();
      reject(new Error('Der Decoder konnte nicht sicher ausgeführt werden.'));
    };

    worker.postMessage({ preparedSource, bytes, fPort });
  });
}

function collectLeafFields(source) {
  const fields = [];

  function walk(value, path) {
    if (Array.isArray(value)) {
      if (path.length) {
        fields.push(createField(path, value));
      }
      return;
    }

    if (value && typeof value === 'object') {
      const entries = Object.entries(value);

      if (!entries.length && path.length) {
        fields.push(createField(path, value));
      }

      entries.forEach(([key, nestedValue]) => walk(nestedValue, [...path, key]));
      return;
    }

    if (path.length) {
      fields.push(createField(path, value));
    }
  }

  walk(source, []);
  return fields;
}

function createField(path, value) {
  return {
    id: JSON.stringify(path),
    path,
    label: path.join('.'),
    type: Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value,
    preview: formatValuePreview(value),
    value
  };
}

function formatValuePreview(value) {
  if (typeof value === 'string') {
    return value.length > 48 ? `${value.slice(0, 45)}…` : value;
  }

  if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
    return String(value);
  }

  const serialized = JSON.stringify(value);
  return serialized && serialized.length > 60 ? `${serialized.slice(0, 57)}…` : serialized || 'leer';
}

function normalizeName(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function suggestSensorType(field) {
  const directMatch = normalizeName(field.label);
  if (SENSOR_TYPES.includes(directMatch)) {
    return directMatch;
  }

  const haystack = field.label.toLowerCase().replace(/[^a-z0-9]+/g, '');

  const rules = [
    ['TEMPERATURE_1', ['temperature1', 'temp1']],
    ['TEMPERATURE_2', ['temperature2', 'temp2']],
    ['FLUID_MAX_TEMPERATURE', ['fluidmaxtemperature', 'maxfluidtemp', 'fluidtempmax']],
    ['FLUID_MIN_TEMPERATURE', ['fluidmintemperature', 'minfluidtemp', 'fluidtempmin']],
    ['BATTERY_LEVEL', ['battery', 'batterylevel', 'batteryvoltage']],
    ['AIR_PRESSURE', ['airpressure', 'pressure', 'barometricpressure']],
    ['ENERGY_CONSUMPTION', ['energy', 'energyconsumption']],
    ['CURRENT', ['current']],
    ['VOLTAGE', ['voltage']],
    ['POWER', ['power']],
    ['DISTANCE', ['distance', 'range']],
    ['HUMIDITY', ['humidity', 'humid']],
    ['CO2', ['co2']],
    ['VOC_LEVEL', ['voc', 'tvoc']],
    ['LOUDNESS', ['loudness', 'noise', 'sound']],
    ['PRESENT_AMBIENT_LIGHT_LEVEL', ['light', 'lux', 'ambientlight']],
    ['MOTION_RELATIVE_COUNT', ['motioncount', 'motion', 'pircount']],
    ['LEAKAGE_STATE', ['leak', 'leakage', 'waterleak']],
    ['GAS_FLOW', ['gasflow']],
    ['GAS_VOLUME_ABSOLUTE', ['gasvolumeabsolute', 'absolutegasvolume']],
    ['GAS_VOLUME', ['gasvolume']],
    ['OCCUPANCY', ['occupancy', 'presence']],
    ['CONTACT_RELATIVE_COUNT', ['contactcount', 'contactrelativecount']],
    ['WINDOW_CONTACT_STATE', ['windowcontact', 'windowstate']],
    ['CONTACT_STATE', ['contactstate', 'contact']],
    ['CTRL_SETPOINT_TEMPERATURE', ['ctrlsetpoint', 'controlsetpoint']],
    ['SETPOINT_TEMPERATURE', ['setpointtemperature', 'setpoint']],
    ['VALVE_POSITION', ['valveposition', 'valve']],
    ['CONDENSATION_STATE', ['condensation', 'condensate']],
    ['TEMPERATURE', ['temperature', 'temp']]
  ];

  for (const [target, keywords] of rules) {
    if (keywords.some(keyword => haystack.includes(keyword))) {
      return target;
    }
  }

  return '';
}

function getDuplicateTargets() {
  const counts = new Map();

  for (const target of state.mapping.values()) {
    if (!target) continue;
    counts.set(target, (counts.get(target) || 0) + 1);
  }

  return new Set(Array.from(counts.entries()).filter(([, count]) => count > 1).map(([target]) => target));
}

function renderFieldList() {
  const fields = state.analysis ? state.analysis.fields : [];
  const duplicates = getDuplicateTargets();
  let mappedCount = 0;

  dom.fieldList.innerHTML = '';

  if (!fields.length) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'Für den Beispielpayload wurden keine mappbaren Felder gefunden. Prüfe den Decoder oder verwende einen anderen Testpayload.';
    dom.fieldList.appendChild(emptyState);
    dom.fieldSummary.textContent = 'Keine Felder erkannt';
    dom.duplicateWarning.hidden = true;
    dom.generateBtn.disabled = true;
    return;
  }

  fields.forEach(field => {
    const selectedTarget = state.mapping.get(field.id) || '';
    if (selectedTarget) {
      mappedCount += 1;
    }

    const row = document.createElement('div');
    row.className = 'mapping-row';

    if (selectedTarget && duplicates.has(selectedTarget)) {
      row.classList.add('mapping-row--duplicate');
    }

    const meta = document.createElement('div');
    meta.className = 'mapping-meta';

    const path = document.createElement('span');
    path.className = 'mapping-path';
    path.textContent = field.label;

    const detail = document.createElement('div');
    detail.className = 'mapping-detail';

    const type = document.createElement('span');
    type.className = 'mapping-type';
    type.textContent = field.type;

    const preview = document.createElement('span');
    preview.className = 'mapping-preview';
    preview.textContent = field.preview;

    detail.append(type, preview);
    meta.append(path, detail);

    const select = document.createElement('select');
    select.className = 'sensor-select';
    select.dataset.fieldId = field.id;

    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = 'Nicht übernehmen';
    select.appendChild(emptyOption);

    SENSOR_TYPES.forEach(sensorType => {
      const option = document.createElement('option');
      option.value = sensorType;
      option.textContent = sensorType;
      if (sensorType === selectedTarget) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    select.addEventListener('change', event => {
      state.mapping.set(field.id, event.target.value);
      renderFieldList();
    });

    row.append(meta, select);
    dom.fieldList.appendChild(row);
  });

  dom.fieldSummary.textContent = `${fields.length} Feld${fields.length === 1 ? '' : 'er'} erkannt, ${mappedCount} zugeordnet`;

  if (duplicates.size) {
    dom.duplicateWarning.hidden = false;
    dom.duplicateWarning.textContent = `Diese Sensortypen sind doppelt vergeben: ${Array.from(duplicates).join(', ')}.`;
  } else {
    dom.duplicateWarning.hidden = true;
    dom.duplicateWarning.textContent = '';
  }

  dom.generateBtn.disabled = mappedCount === 0 || duplicates.size > 0;
}

function renderAnalysis() {
  if (!state.analysis) {
    dom.resultGrid.hidden = true;
    dom.exportPanel.hidden = true;
    return;
  }

  dom.resultGrid.hidden = false;
  dom.modeBadge.textContent = `Erkannter Einstieg: ${state.analysis.mode}`;
  dom.decodedPreview.textContent = JSON.stringify(state.analysis.rawResult, null, 2);
  dom.exportPanel.hidden = true;
  dom.generatedOutput.value = '';
  setCopyStatus('Noch nichts generiert');
  renderFieldList();
}

function indentBlock(text, spaces) {
  const prefix = ' '.repeat(spaces);
  return text
    .split('\n')
    .map(line => `${prefix}${line}`)
    .join('\n');
}

function buildWrapperCode(preparedSource, mappings) {
  const mappingDefinition = JSON.stringify(
    mappings.map(({ path, target }) => ({ path, target })),
    null,
    2
  );

  return [
    '// Generated by Sensise Payload Decoder Builder',
    '// Maps decoder output to approved Sensise sensor types.',
    '',
    `const __sensiseFieldMapping = ${mappingDefinition};`,
    '',
    'function __sensiseGetByPath(source, path) {',
    '  return path.reduce((current, key) => (current == null ? undefined : current[key]), source);',
    '}',
    '',
    'function __sensiseMapData(source) {',
    '  const mapped = {};',
    '',
    '  __sensiseFieldMapping.forEach(({ path, target }) => {',
    '    const value = __sensiseGetByPath(source, path);',
    '    if (value !== undefined) {',
    '      mapped[target] = value;',
    '    }',
    '  });',
    '',
    '  return mapped;',
    '}',
    '',
    'const __sensiseOriginal = (function () {',
    '  "use strict";',
    '  let moduleExports = {};',
    '',
    indentBlock(preparedSource, 2),
    '',
    '  const exported = moduleExports;',
    '  const fallback = exported && typeof exported === "function" ? exported : null;',
    '',
    '  return {',
    '    decodeUplink:',
    '      typeof decodeUplink === "function"',
    '        ? decodeUplink',
    '        : exported && typeof exported.decodeUplink === "function"',
    '          ? exported.decodeUplink',
    '          : fallback && fallback.length <= 1',
    '            ? fallback',
    '            : null,',
    '    Decoder:',
    '      typeof Decoder === "function"',
    '        ? Decoder',
    '        : exported && typeof exported.Decoder === "function"',
    '          ? exported.Decoder',
    '          : fallback && fallback.length > 1',
    '            ? fallback',
    '            : null,',
    '    decodePayload:',
    '      typeof decodePayload === "function"',
    '        ? decodePayload',
    '        : exported && typeof exported.decodePayload === "function"',
    '          ? exported.decodePayload',
    '          : null',
    '  };',
    '})();',
    '',
    'function decodeUplink(input) {',
    '  if (__sensiseOriginal.decodeUplink) {',
    '    const result = __sensiseOriginal.decodeUplink(input);',
    '    const safeResult = result && typeof result === "object" ? result : {};',
    '    const sourceData = safeResult.data && typeof safeResult.data === "object"',
    '      ? safeResult.data',
    '      : safeResult;',
    '',
    '    return {',
    '      ...safeResult,',
    '      data: __sensiseMapData(sourceData && typeof sourceData === "object" ? sourceData : {})',
    '    };',
    '  }',
    '',
    '  if (__sensiseOriginal.Decoder) {',
    '    return {',
    '      data: __sensiseMapData(__sensiseOriginal.Decoder(input.bytes, input.fPort) || {})',
    '    };',
    '  }',
    '',
    '  if (__sensiseOriginal.decodePayload) {',
    '    return {',
    '      data: __sensiseMapData(__sensiseOriginal.decodePayload(input.bytes, input.fPort) || {})',
    '    };',
    '  }',
    '',
    '  return { data: {} };',
    '}',
    '',
    'function Decoder(bytes, port) {',
    '  return decodeUplink({ bytes, fPort: port, recvTime: new Date().toISOString() }).data;',
    '}',
    '',
    'function decodePayload(bytes, port) {',
    '  return Decoder(bytes, port);',
    '}'
  ].join('\n');
}

async function analyzeDecoder() {
  const source = dom.decoderSource.value.trim();
  const fPort = Number(dom.fportInput.value || '1');

  if (!source) {
    setAnalysisStatus('Bitte zuerst einen Payload Decoder einfügen.', 'error');
    return;
  }

  if (!Number.isFinite(fPort) || fPort < 1) {
    setAnalysisStatus('Bitte einen gültigen fPort größer oder gleich 1 angeben.', 'error');
    return;
  }

  let bytes;

  try {
    bytes = parseHexPayload(dom.payloadHex.value);
  } catch (error) {
    setAnalysisStatus(error.message, 'error');
    return;
  }

  const preparedSource = prepareDecoderSource(source);

  setAnalysisStatus('Decoder wird analysiert …');
  dom.analyzeBtn.disabled = true;

  try {
    const analysis = await runDecoderAnalysis(preparedSource, bytes, fPort);
    const fields = collectLeafFields(analysis.baseData);

    state.analysis = {
      ...analysis,
      preparedSource,
      fields
    };

    state.mapping = new Map(fields.map(field => [field.id, suggestSensorType(field)]));
    renderAnalysis();
    setAnalysisStatus(`Analyse erfolgreich: ${fields.length} Feld${fields.length === 1 ? '' : 'er'} erkannt (${analysis.mode}).`, 'success');
  } catch (error) {
    state.analysis = null;
    renderAnalysis();
    setAnalysisStatus(`Analyse fehlgeschlagen: ${error.message}`, 'error');
  } finally {
    dom.analyzeBtn.disabled = false;
  }
}

function generateWrapperDecoder() {
  if (!state.analysis) {
    setCopyStatus('Bitte zuerst einen Decoder analysieren.', 'error');
    return;
  }

  const duplicates = getDuplicateTargets();
  if (duplicates.size) {
    setCopyStatus('Doppelte Sensortypen müssen zuerst aufgelöst werden.', 'error');
    return;
  }

  const mappings = state.analysis.fields
    .map(field => ({
      path: field.path,
      target: state.mapping.get(field.id) || ''
    }))
    .filter(field => field.target);

  if (!mappings.length) {
    setCopyStatus('Bitte mindestens ein Feld einem Sensortyp zuordnen.', 'error');
    return;
  }

  state.generatedCode = buildWrapperCode(state.analysis.preparedSource, mappings);
  dom.generatedOutput.value = state.generatedCode;
  dom.exportSummary.textContent = `${mappings.length} Sensortyp${mappings.length === 1 ? '' : 'en'} werden in den Wrapper übernommen.`;
  dom.exportPanel.hidden = false;
  setCopyStatus('Wrapper erstellt. Jetzt kannst du ihn kopieren.', 'success');
}

async function copyGeneratedDecoder() {
  if (!state.generatedCode) {
    setCopyStatus('Es ist noch kein Wrapper erzeugt worden.', 'error');
    return;
  }

  try {
    await navigator.clipboard.writeText(state.generatedCode);
    setCopyStatus('Decoder in die Zwischenablage kopiert.', 'success');
  } catch (error) {
    dom.generatedOutput.focus();
    dom.generatedOutput.select();
    setCopyStatus('Kopieren bitte manuell mit Strg+C abschließen.', 'error');
  }
}

