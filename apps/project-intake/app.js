const PRODUCTS = [
  ['Endgerät', 'SAB07 LRW', 'Ventilstellantrieb / SAB07 / B', 'Stück', 'Thermokon', 89],
  ['Endgerät', 'AGS55+ LRW', 'Außensensor / AGS55+', 'Stück', 'Thermokon', 156.8],
  ['Endgerät', 'AKF10+ LRW 150.06', 'Einstechsensor / AKF10+', 'Stück', 'Thermokon', 166.4],
  ['Endgerät', 'TF25+ BAT LRW T160 L1000', 'Kabelsensor / TF25+ / B', 'Stück', 'Thermokon', 132.9],
  ['Endgerät', 'VFG54+ BAT LRW', 'Anlegesensor / VFG54+ / B', 'Stück', 'Thermokon', 138.3],
  ['Endgerät', 'NOVOS 3 Temp_rH weiß LRW', 'Multiraumsensor / NOVOS 3 / B', 'Stück', 'Thermokon', 68.9],
  ['Endgerät', 'NOVOS 3 INC EPD weiß Temp_rH LRW', 'Raumbediengerät / NOVOS 3 INC / B', 'Stück', 'Thermokon', 144.9],
  ['Endgerät', 'MCS Temp_rH weiß LRW', 'Multikompaktsensor / MCS / B', 'Stück', 'Thermokon', 74.8],
  ['Endgerät', 'MCS Lum Temp_rH weiß LRW', 'Multikompaktsensor Licht / MCS / B', 'Stück', 'Thermokon', 86.9],
  ['Endgerät', 'MCS State weiß LRW', 'Fensterkontakt / MCS / B', 'Stück', 'Thermokon', 64],
  ['Endgerät', 'MCS Occ Temp_rH weiß LRW', 'Multikompaktsensor Präsenz / MCS / B', 'Stück', 'Thermokon', 94.1],
  ['Endgerät', 'LA+ CO2 Temp_rH LRW', 'Außensensor Luftqualität / LA+', 'Stück', 'Thermokon', 405.3],
  ['Endgerät', 'DPA2500+ LRW MultiRange', 'Differenzdrucksensor / DPA2500+', 'Stück', 'Thermokon', 189.8],
  ['Endgerät', 'LS02+ ext LRW L5000', 'Leckagesensor / LS02+', 'Stück', 'Thermokon', 204.9],
  ['Endgerät', 'WK02+ ext LRW 24 V L2000', 'Kondensationswächter / WK02+', 'Stück', 'Thermokon', 242.8],
  ['Endgerät', 'CubicMeter LTCM02-P', 'Volumenstromsensor / CubicMeter-P / B', 'Stück', 'Quandify', 304.7],
  ['Endgerät', 'ERS Sound', 'Multiraumsensor Sound / ERS / B', 'Stück', 'Elsys', 240],
  ['Endgerät', 'EM400-MUD', 'Füllstandsensor / EM400 / B', 'Stück', 'Milesight', 161.4],
  ['Endgerät', 'DNT-ES-IEC', 'Energiesensor für Smart Meter IEC', 'Stück', 'DNT', 39.9],
  ['Endgerät', 'DNT-ES-LED', 'Energiesensor für Smart Meter LED', 'Stück', 'DNT', 33.7],
  ['Endgerät', 'DNT-LW-ESI', 'Energie Sensor Interface', 'Stück', 'DNT', 92.2],
  ['Gateway', 'Gateway LRW Indoor RAK 7268V2', 'Gateway / RAK', 'Stück', 'RAKwireless', 215.2],
  ['Gateway', 'Gateway LRW Indoor RAK 7268CV2', 'Gateway / RAK LTE', 'Stück', 'RAKwireless', 338.3],
  ['Gateway', 'SIM-Karte für LTE-Gateways', 'SIM-Karte für LTE-Gateways', 'Monat pro Stück', 'Melita', 5],
  ['Zubehör', 'Batterie AA 1,5 V Lithium L91', 'Batterie AA 1,5 V Lithium L91', 'Stück', 'Energizer', 2.6],
  ['Zubehör', 'Batterie AAA 1,5 V Lithium L92', 'Batterie AAA 1,5 V Lithium L92', 'Stück', 'Energizer', 2.4],
  ['Zubehör', 'BLE-Dongle Micro-USB', 'BLE-Dongle für USE-M / USE-L / NOVOS / thanos EVO', 'Stück', 'Thermokon', 32.1],
  ['Software', 'Sensise Plattform monatlich', 'Cloud-basierte IoT-SaaS-Software / monatlich kündbar', 'Sensor pro Monat', 'Sensise', 5],
  ['Software', 'Sensise Plattform 12 Monate', 'Cloud-basierte IoT-SaaS-Software / 12 Monate Laufzeit', 'Sensor pro Monat', 'Sensise', 4],
  ['Software', 'Sensise Plattform 36 Monate', 'Cloud-basierte IoT-SaaS-Software / 36 Monate Laufzeit', 'Sensor pro Monat', 'Sensise', 3],
  ['Software', 'Sensise Plattform 60 Monate', 'Cloud-basierte IoT-SaaS-Software / 60 Monate Laufzeit', 'Sensor pro Monat', 'Sensise', 2],
  ['Dienstleistung', 'Projektsetup: Basis', 'Projektsetup: Basis', 'Stück', 'Sensise', 15],
  ['Dienstleistung', 'Projektsetup: Erweitert', 'Projektsetup: Erweitert', 'Stück', 'Sensise', 30],
  ['Dienstleistung', 'Projektsetup: Komplett', 'Projektsetup: Komplett', 'Stück', 'Sensise', 35],
  ['Dienstleistung', 'Vorbereitung Kundeninstallation: Erweitert', 'Vorbereitung für Kundeninstallation: Erweitert', 'Stück', 'Sensise', 15],
  ['Dienstleistung', 'Sensise-Eigeninstallation: Komplett', 'Sensise-Eigeninstallation: Komplett', 'Stück', 'Sensise', 30],
  ['Dienstleistung', 'Sensise-Partnerinstallation: Komplett', 'Sensise-Partnerinstallation: Komplett', 'Stück', 'Sensise', 5],
  ['Dienstleistung', 'LoRaWAN Grundlagenschulung', 'LoRaWAN Grundlagenschulung - virtuell', 'Stunde', 'Sensise', 139],
  ['Dienstleistung', 'LoRaWAN Expertenschulung', 'LoRaWAN Expertenschulung - virtuell', 'Stunde', 'Sensise', 139],
  ['Dienstleistung', 'Sensise-Plattform Anwenderschulung', 'Sensise-Plattform Anwenderschulung - virtuell', 'Stunde', 'Sensise', 139],
  ['Dienstleistung', 'LoRaWAN Reichweitentest', 'LoRaWAN Reichweitentest - vor Ort', 'Stunde', 'Sensise', 139],
  ['Dienstleistung', 'Fahrtkosten', 'Fahrtkosten', 'Kilometer', 'Sensise', 1],
  ['Dienstleistung', 'Übernachtungskosten', 'Übernachtungskosten', 'Person pro Übernachtung', 'Sensise', 198],
  ['Dienstleistung', 'Projektkonzeption Professional', 'Projektkonzeption - Professional', 'Stunde', 'Sensise', 139]
].map((row, index) => ({
  id: `product-${index + 1}`,
  category: row[0],
  sku: row[1],
  name: row[2],
  unit: row[3],
  manufacturer: row[4],
  price: row[5]
}));

const SERVICE_OPTIONS = [
  {
    id: 'iot-concept',
    title: 'IoT-Konzeption',
    description: 'Use Case, Sensorik, Datenpunkte, Gateway- und Plattformlogik.'
  },
  {
    id: 'lorawan-planning',
    title: 'LoRaWAN Planung',
    description: 'Reichweite, Gateway-Positionen, Funkrisiken und Vor-Ort-Test.'
  },
  {
    id: 'platform-setup',
    title: 'Sensise Plattform',
    description: 'Projektsetup, Dashboard, Nutzer, Datenmodell und Regeln.'
  },
  {
    id: 'installation',
    title: 'Installation',
    description: 'Kundeninstallation vorbereiten, Partnerinstallation oder Sensise vor Ort.'
  },
  {
    id: 'training',
    title: 'Schulung',
    description: 'LoRaWAN, Plattform-Anwender, Key User oder Expertenschulung.'
  },
  {
    id: 'custom-product',
    title: 'Kundenspezifische Produktlösung',
    description: 'Engineering, Konstruktion, Hard-/Software oder Sonderlösung.'
  },
  {
    id: 'preconfiguration',
    title: 'Parametrierung / Vorkonfiguration',
    description: 'Geräteparameter, Raumbediengeräte, Sensoren oder Thermostate ab Werk.'
  },
  {
    id: 'labeling',
    title: 'Beschriftung',
    description: 'Projekt-, Anlagen- oder DIN-konforme Kennzeichnung.'
  },
  {
    id: 'cabling',
    title: 'Konfektionierung',
    description: 'Anschlussleitungen, Plug-and-Play-Montage oder vormontierte Sets.'
  }
];

const STORAGE_KEY = 'sensise-project-intake-v1';
const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

const state = {
  search: '',
  category: 'Alle',
  cart: [],
  services: [],
  files: []
};

const els = {
  form: document.getElementById('project-form'),
  serviceOptions: document.getElementById('service-options'),
  search: document.getElementById('search'),
  categoryFilter: document.getElementById('category-filter'),
  resultCount: document.getElementById('result-count'),
  catalogBody: document.getElementById('catalog-body'),
  cartBody: document.getElementById('cart-body'),
  emptyCart: document.getElementById('empty-cart'),
  hardwareTotal: document.getElementById('hardware-total'),
  softwareTotal: document.getElementById('software-total'),
  serviceTotal: document.getElementById('service-total'),
  grandTotal: document.getElementById('grand-total'),
  attachments: document.getElementById('attachments'),
  fileList: document.getElementById('file-list'),
  flowUrl: document.getElementById('flow-url'),
  status: document.getElementById('submit-status'),
  submitDialog: document.getElementById('submit-confirm-dialog')
};

function isRecurring(product) {
  return product.unit.toLowerCase().includes('monat');
}

function getProduct(productId) {
  return PRODUCTS.find(product => product.id === productId);
}

function getLineTotal(product, line) {
  const months = isRecurring(product) ? Math.max(Number(line.months) || 1, 1) : 1;
  const discount = Math.min(Math.max(Number(line.discount) || 0, 0), 100);
  return product.price * (Number(line.qty) || 0) * months * (1 - discount / 100);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[char]);
}

function sanitizeFilename(value) {
  return value.trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '_') || 'sensise-projekt';
}

function setStatus(message, type = '') {
  els.status.textContent = message;
  els.status.className = type ? `status-${type}` : '';
}

function saveDraft() {
  const draft = {
    fields: Object.fromEntries(new FormData(els.form).entries()),
    services: state.services,
    cart: state.cart,
    flowUrl: els.flowUrl.value
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

function restoreDraft() {
  const draft = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  if (!draft) return;
  Object.entries(draft.fields || {}).forEach(([key, value]) => {
    const field = els.form.elements[key];
    if (field && field.type !== 'file') field.value = value;
  });
  state.services = Array.isArray(draft.services) ? draft.services : [];
  state.cart = Array.isArray(draft.cart) ? draft.cart : [];
  els.flowUrl.value = draft.flowUrl || '';
}

function filteredProducts() {
  const query = state.search.trim().toLowerCase();
  return PRODUCTS.filter(product => {
    const matchesCategory = state.category === 'Alle' || product.category === state.category;
    const text = `${product.sku} ${product.name} ${product.manufacturer} ${product.unit}`.toLowerCase();
    return matchesCategory && (!query || text.includes(query));
  });
}

function renderServices() {
  els.serviceOptions.innerHTML = SERVICE_OPTIONS.map(service => `
    <label class="check-card">
      <input type="checkbox" value="${service.id}" ${state.services.includes(service.id) ? 'checked' : ''}>
      <span>
        <strong>${escapeHtml(service.title)}</strong>
        ${escapeHtml(service.description)}
      </span>
    </label>
  `).join('');
}

function renderCatalog() {
  const list = filteredProducts();
  els.resultCount.textContent = `${list.length} Treffer`;
  els.catalogBody.innerHTML = list.map(product => `
    <tr>
      <td>
        <span class="article-title">${escapeHtml(product.name)}</span>
        <span class="article-meta">${escapeHtml(product.sku)} · ${escapeHtml(product.manufacturer)}</span>
      </td>
      <td><span class="pill">${escapeHtml(product.category)}</span></td>
      <td>${escapeHtml(product.unit)}</td>
      <td class="num">${euro.format(product.price)}</td>
      <td class="num"><button class="icon-btn" type="button" data-add="${product.id}" title="Hinzufügen">+</button></td>
    </tr>
  `).join('');
}

function renderCart() {
  els.emptyCart.hidden = state.cart.length > 0;
  els.cartBody.innerHTML = state.cart.map(line => {
    const product = getProduct(line.productId);
    if (!product) return '';
    return `
      <article class="cart-item">
        <div>
          <span class="article-title">${escapeHtml(product.name)}</span>
          <span class="article-meta">${escapeHtml(product.sku)} · ${euro.format(product.price)} / ${escapeHtml(product.unit)}</span>
        </div>
        <strong>${euro.format(getLineTotal(product, line))}</strong>
        <div class="cart-controls">
          <label><span>Menge</span><input type="number" min="0" step="1" value="${line.qty}" data-field="qty" data-line="${line.id}"></label>
          <label><span>Monate</span><input type="number" min="1" step="1" value="${line.months}" data-field="months" data-line="${line.id}" ${isRecurring(product) ? '' : 'disabled'}></label>
          <label><span>Rabatt %</span><input type="number" min="0" max="100" step="0.5" value="${line.discount}" data-field="discount" data-line="${line.id}"></label>
          <button class="icon-btn" type="button" data-remove="${line.id}" title="Entfernen">x</button>
        </div>
      </article>
    `;
  }).join('');
  renderTotals();
  saveDraft();
}

function renderTotals() {
  const totals = state.cart.reduce((acc, line) => {
    const product = getProduct(line.productId);
    if (!product) return acc;
    const total = getLineTotal(product, line);
    acc.grand += total;
    if (product.category === 'Software') acc.software += total;
    else if (product.category === 'Dienstleistung') acc.service += total;
    else acc.hardware += total;
    return acc;
  }, { hardware: 0, software: 0, service: 0, grand: 0 });

  els.hardwareTotal.textContent = euro.format(totals.hardware);
  els.softwareTotal.textContent = euro.format(totals.software);
  els.serviceTotal.textContent = euro.format(totals.service);
  els.grandTotal.textContent = euro.format(totals.grand);
}

function renderFiles() {
  state.files = [...els.attachments.files];
  els.fileList.innerHTML = state.files.map(file => `
    <div class="file-row">
      <span>${escapeHtml(file.name)}</span>
      <span>${(file.size / 1024 / 1024).toFixed(2)} MB</span>
    </div>
  `).join('');
}

function addProduct(productId, qty = 1, months) {
  const product = getProduct(productId);
  if (!product) return;
  const existing = state.cart.find(line => line.productId === productId && Number(line.discount) === 0);
  if (existing) {
    existing.qty += qty;
  } else {
    state.cart.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      productId,
      qty,
      months: months || (isRecurring(product) ? 12 : 1),
      discount: 0
    });
  }
  renderCart();
}

function addStarterPackage() {
  addProduct(PRODUCTS.find(product => product.sku === 'Gateway LRW Indoor RAK 7268V2')?.id, 1);
  addProduct(PRODUCTS.find(product => product.sku === 'NOVOS 3 Temp_rH weiß LRW')?.id, 10);
  addProduct(PRODUCTS.find(product => product.sku === 'Sensise Plattform 36 Monate')?.id, 10, 36);
  addProduct(PRODUCTS.find(product => product.sku === 'Projektsetup: Erweitert')?.id, 10);
}

function fileToPayload(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      resolve({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        contentBase64: dataUrl.split(',')[1] || ''
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function fileToMetadata(file) {
  return {
    name: file.name,
    size: file.size,
    sizeMb: Number((file.size / 1024 / 1024).toFixed(2)),
    type: file.type || 'application/octet-stream'
  };
}

async function buildPayload(includeFileContent = false) {
  const form = Object.fromEntries(new FormData(els.form).entries());
  const selectedServices = SERVICE_OPTIONS
    .filter(service => state.services.includes(service.id))
    .map(({ id, title, description }) => ({ id, title, description }));
  const positions = state.cart.map(line => {
    const product = getProduct(line.productId);
    return {
      category: product.category,
      sku: product.sku,
      name: product.name,
      manufacturer: product.manufacturer,
      unit: product.unit,
      unitPrice: product.price,
      quantity: Number(line.qty) || 0,
      months: isRecurring(product) ? Number(line.months) || 1 : null,
      discountPercent: Number(line.discount) || 0,
      totalNet: Number(getLineTotal(product, line).toFixed(2))
    };
  });
  const totals = positions.reduce((acc, item) => {
    acc.totalNet += item.totalNet;
    acc[item.category] = (acc[item.category] || 0) + item.totalNet;
    return acc;
  }, { totalNet: 0 });

  return {
    schemaVersion: 1,
    submittedAt: new Date().toISOString(),
    source: 'sensise-project-intake',
    project: form,
    selectedServices,
    positions,
    totals,
    internalNote: document.getElementById('internal-note').value,
    suggestedFolderName: sanitizeFilename(`${form.customerName || 'Kunde'}_${form.projectName || 'Projekt'}`),
    attachments: includeFileContent
      ? await Promise.all(state.files.map(fileToPayload))
      : state.files.map(fileToMetadata)
  };
}

function downloadJson(payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${payload.suggestedFolderName}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows) {
  return rows.map(row => row.map(csvEscape).join(';')).join('\r\n');
}

function downloadText(filename, content, type) {
  const blob = new Blob([content], { type });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

async function downloadCsv() {
  const payload = await buildPayload(false);
  const projectRows = [
    ['Bereich', 'Feld', 'Wert'],
    ...Object.entries(payload.project).map(([key, value]) => ['Projekt', key, value]),
    ['Projekt', 'internalNote', payload.internalNote],
    ['Projekt', 'suggestedFolderName', payload.suggestedFolderName],
    ['Summen', 'totalNet', payload.totals.totalNet.toFixed(2)]
  ];
  const serviceRows = [
    [],
    ['Services'],
    ['ID', 'Titel', 'Beschreibung'],
    ...payload.selectedServices.map(service => [service.id, service.title, service.description])
  ];
  const positionRows = [
    [],
    ['Positionen'],
    ['Kategorie', 'Artikel', 'Bezeichnung', 'Hersteller', 'Einheit', 'Einzelpreis netto', 'Menge', 'Monate', 'Rabatt %', 'Summe netto'],
    ...payload.positions.map(item => [
      item.category,
      item.sku,
      item.name,
      item.manufacturer,
      item.unit,
      item.unitPrice.toFixed(2),
      item.quantity,
      item.months ?? '',
      item.discountPercent,
      item.totalNet.toFixed(2)
    ])
  ];
  const fileRows = [
    [],
    ['Dateien'],
    ['Name', 'Groesse MB', 'Typ'],
    ...payload.attachments.map(file => [file.name, file.sizeMb, file.type])
  ];

  downloadText(`${payload.suggestedFolderName}.csv`, toCsv([...projectRows, ...serviceRows, ...positionRows, ...fileRows]), 'text/csv;charset=utf-8');
  setStatus('CSV wurde exportiert.', 'ok');
}

async function copyJsonToClipboard() {
  const payload = await buildPayload(false);
  await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
  setStatus('JSON wurde in die Zwischenablage kopiert.', 'ok');
}

function requestSubmitConfirmation() {
  return new Promise(resolve => {
    const dialog = els.submitDialog;
    if (!dialog || typeof dialog.showModal !== 'function') {
      resolve(window.confirm('Hast du alle relevanten Informationen eingetragen und bist sicher, dass die Projektaufnahme jetzt an Solution Engineering übergeben werden soll?'));
      return;
    }

    const handleClose = () => {
      dialog.removeEventListener('close', handleClose);
      resolve(dialog.returnValue === 'confirm');
    };

    dialog.addEventListener('close', handleClose);
    dialog.showModal();
  });
}

async function submitToFlow(event) {
  event.preventDefault();
  if (!els.form.reportValidity()) return;
  const confirmed = await requestSubmitConfirmation();
  if (!confirmed) {
    setStatus('Absenden abgebrochen. Du kannst die Angaben weiter bearbeiten.');
    return;
  }
  if (!els.flowUrl.value.trim()) {
    setStatus('Bitte zuerst die Power-Automate-HTTP-URL eintragen.', 'error');
    return;
  }

  setStatus('Sende Projektpaket an Power Automate...');
  try {
    const payload = await buildPayload(true);
    const response = await fetch(els.flowUrl.value.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    setStatus('Projekt wurde an Power Automate gesendet.', 'ok');
  } catch (error) {
    setStatus(`Senden fehlgeschlagen: ${error.message}`, 'error');
  }
}

function bindEvents() {
  els.form.addEventListener('input', () => {
    saveDraft();
  });
  els.serviceOptions.addEventListener('change', event => {
    const input = event.target.closest('input[type="checkbox"]');
    if (!input) return;
    state.services = [...els.serviceOptions.querySelectorAll('input:checked')].map(item => item.value);
    renderTotals();
    saveDraft();
  });
  els.search.addEventListener('input', event => {
    state.search = event.target.value;
    renderCatalog();
  });
  els.categoryFilter.addEventListener('change', event => {
    state.category = event.target.value;
    renderCatalog();
  });
  els.catalogBody.addEventListener('click', event => {
    const button = event.target.closest('[data-add]');
    if (button) addProduct(button.dataset.add);
  });
  els.cartBody.addEventListener('input', event => {
    const input = event.target.closest('[data-field]');
    if (!input) return;
    const line = state.cart.find(item => item.id === input.dataset.line);
    if (!line) return;
    line[input.dataset.field] = Number(input.value) || 0;
    renderCart();
  });
  els.cartBody.addEventListener('click', event => {
    const button = event.target.closest('[data-remove]');
    if (!button) return;
    state.cart = state.cart.filter(line => line.id !== button.dataset.remove);
    renderCart();
  });
  els.attachments.addEventListener('change', renderFiles);
  document.getElementById('starter-btn').addEventListener('click', addStarterPackage);
  document.getElementById('clear-btn').addEventListener('click', () => {
    if (!state.cart.length || confirm('Auswahl wirklich leeren?')) {
      state.cart = [];
      renderCart();
    }
  });
  const jsonButton = document.getElementById('json-btn');
  if (jsonButton) {
    jsonButton.addEventListener('click', async () => {
      downloadJson(await buildPayload(false));
      setStatus('JSON wurde exportiert.', 'ok');
    });
  }
  const csvButton = document.getElementById('csv-btn');
  if (csvButton) csvButton.addEventListener('click', downloadCsv);
  const copyJsonButton = document.getElementById('copy-json-btn');
  if (copyJsonButton) {
    copyJsonButton.addEventListener('click', () => {
      copyJsonToClipboard().catch(error => setStatus(`Kopieren fehlgeschlagen: ${error.message}`, 'error'));
    });
  }
  const printButton = document.getElementById('print-btn');
  if (printButton) printButton.addEventListener('click', () => window.print());
  const resetDraftButton = document.getElementById('reset-draft-btn');
  if (resetDraftButton) {
    resetDraftButton.addEventListener('click', () => {
      if (!confirm('Entwurf und aktuelle Auswahl wirklich löschen?')) return;
      localStorage.removeItem(STORAGE_KEY);
      els.form.reset();
      state.cart = [];
      state.services = [];
      state.files = [];
      renderServices();
      renderCart();
      renderFiles();
      localStorage.removeItem(STORAGE_KEY);
      setStatus('Entwurf wurde gelöscht.', 'ok');
    });
  }
  els.form.addEventListener('submit', submitToFlow);
}

function init() {
  restoreDraft();
  const categories = ['Alle', ...new Set(PRODUCTS.map(product => product.category))];
  els.categoryFilter.innerHTML = categories.map(category => `<option>${escapeHtml(category)}</option>`).join('');
  renderServices();
  renderCatalog();
  renderCart();
  bindEvents();
}

init();
