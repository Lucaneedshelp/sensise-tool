const fs = require('fs');
const path = require('path');
const { searchKnowledge } = require('./knowledge-search');
const { callOpenAI, callOpenRouter } = require('./llm');

let catalogCache = null;

async function createChatReply(messages) {
  const safeMessages = Array.isArray(messages) ? messages : [];
  const lastUserMessage = [...safeMessages].reverse().find(message => message.role === 'user')?.content || '';
  const knowledgeQuery = buildKnowledgeQuery(safeMessages);
  const directReply = answerKnownTechnicalQuestion(knowledgeQuery);

  if (directReply) {
    return directReply;
  }

  if (!process.env.OPENAI_API_KEY && !process.env.OPENROUTER_API_KEY) {
    return `Demo-Modus: Ich habe deine Frage erhalten: "${lastUserMessage}".\n\nSobald OPENAI_API_KEY in der .env gesetzt ist, antworte ich mit OpenAI.`;
  }

  const searchContext = await searchKnowledge(knowledgeQuery);
  return process.env.OPENROUTER_API_KEY
    ? callOpenRouter(safeMessages, searchContext)
    : callOpenAI(safeMessages, searchContext);
}

function buildKnowledgeQuery(messages) {
  return messages
    .filter(message => message.role === 'user')
    .slice(-4)
    .map(message => String(message.content || '').trim())
    .filter(Boolean)
    .join('\n');
}

function answerKnownTechnicalQuestion(query) {
  const text = String(query || '');
  const normalized = text.toLowerCase();
  if (/(ding|gerät|geraet).*(schneller|häufiger|haeufiger)|schneller machen/.test(normalized)) {
    return 'Welches Gerät meinst du und was genau soll schneller werden: Sendeintervall, Heartbeat, Reaktionszeit oder Downlink-Verhalten?';
  }

  if (/(rechtlich|verbindlich|zusagen|freigabe)/.test(normalized) && /(rabatt|preis|angebot)/.test(normalized)) {
    return 'Verbindliche Preise, Angebote oder Rabattfreigaben kann ich nicht zusagen. Bitte stimme das mit dem Sensise-Team bzw. Vertrieb ab.';
  }

  const uplinkDirectionReply = answerUplinkDirection(normalized);
  if (uplinkDirectionReply) {
    return uplinkDirectionReply;
  }

  const productPriceReply = answerKnownProductPrice(text, normalized);
  if (productPriceReply) {
    return productPriceReply;
  }

  const productFactsReply = answerKnownProductFacts(normalized);
  if (productFactsReply) {
    return productFactsReply;
  }

  const thermokonConfigReply = answerThermokonConfigPayload(text, normalized);
  if (thermokonConfigReply) {
    return thermokonConfigReply;
  }

  const sendIntervalReply = answerThermokonSendInterval(text, normalized);
  if (sendIntervalReply) {
    return sendIntervalReply;
  }

  const isNovos = /novos\s*3/.test(normalized);
  const isTemperature = /(temperatur|temperature|celsius|grad|°c|temp\b)/.test(normalized);
  const isUplinkPayload = /(uplink|payload|identifier|telegramm|decoder|10\s*01|10\s*)/.test(normalized);

  if (!isNovos || !isTemperature || !isUplinkPayload) {
    return '';
  }

  const temperature = extractCelsiusValue(text);
  if (temperature === null) {
  return [
    'Beim NOVOS 3 ist Temperatur im Uplink der Identifier `0x10`.',
      'Datentyp: `INT16`, Einheit: Grad Celsius mit Teiler 10.',
      'Wenn du mir den Temperaturwert gibst, rechne ich dir daraus die Payload aus.',
      '',
      'Wichtig: Einen Uplink sendet man normalerweise nicht an das Gerät. Uplink kommt vom Gerät zum Server. Wenn du einen Wert simulieren/testen willst, kann ich dir aber die Uplink-Payload bilden.'
    ].join('\n');
  }

  const rawValue = Math.round(temperature * 10);
  const hexValue = int16ToHex(rawValue);
  const decimal = Number.isInteger(temperature) ? String(temperature) : String(temperature).replace('.', ',');

  return [
    'Ja. Für einen NOVOS 3 Temperatur-Uplink ist der Identifier `0x10`.',
    '',
    `Temperatur: ${decimal} Grad Celsius`,
    `Rechnung: ${decimal} * 10 = ${rawValue}`,
    `INT16 Big-Endian: \`${hexValue}\``,
    `Uplink-Payload: \`10 ${hexValue}\` bzw. ohne Leerzeichen \`10${hexValue}\``,
    '',
    'Wichtig: Einen Uplink sendet man fachlich nicht an das Gerät. Uplink kommt vom Gerät zum Server. Wenn du dem Gerät etwas senden willst, ist das ein Downlink. Wenn du nur einen Uplink mit 45 Grad Celsius simulieren willst, ist `1001C2` der passende Temperaturwert.'
  ].join('\n');
}

function answerUplinkDirection(normalized) {
  const saysSendToDevice = /(uplink).*(an|zum|dem)\s+(gerät|geraet)|uplink.*senden/.test(normalized);
  if (!saysSendToDevice) return '';

  return [
    'Das ist ein Begriffs-Missverständnis:',
    '',
    '- Uplink kommt vom Gerät zum Server.',
    '- Downlink wird an das Gerät gesendet.',
    '',
    'Wenn du also etwas an das Gerät senden willst, brauchst du einen Downlink. Sag mir Gerät und Zielwert, dann bilde ich dir die Payload.'
  ].join('\n');
}

function answerKnownProductPrice(text, normalized) {
  if (!/(kostet|preis|rabatt|nachlass|netto|eur|€)/.test(normalized)) return '';

  if (/(x[\s-]?logi[xc]|pc[\s-]?lr|wasserz|wasserzähler|wasserzaehler)/.test(normalized)) {
    return [
      'X-Logic PC-LR-1: Wasserzähler / Impulskontakt',
      'Netto-Orientierungspreis: Preis nicht hinterlegt',
      '',
      'Mögliche Kalkulator-Rabattgruppen, sofern als Endgerät/Zubehör kalkuliert:',
      '- W1 maximal 35 Prozent',
      '- W2 maximal 55 Prozent',
      '',
      'Das ist keine verbindliche Rabattfreigabe.'
    ].join('\n');
  }

  const product = findCatalogProduct(text);
  if (!product) return '';

  const price = product.price > 0
    ? `${product.price.toFixed(2).replace('.', ',')} EUR`
    : 'Preis nicht hinterlegt';
  const lines = [
    `${product.sku}: ${product.name}`,
    `Netto-Orientierungspreis: ${price}`
  ];

  if (/(rabatt|nachlass)/.test(normalized)) {
    lines.push('');
    lines.push('Mögliche Kalkulator-Rabattgruppen:');
    if (['Endgerät', 'Gateway', 'Zubehör'].includes(product.category)) {
      lines.push('- W1 maximal 35 Prozent');
      lines.push('- W2 maximal 55 Prozent');
    } else if (product.category === 'Software') {
      lines.push('- Software maximal 5 Prozent');
    } else if (/sim/i.test(product.sku + product.name)) {
      lines.push('- SIM Karte maximal 5 Prozent');
    } else if (/schulung/i.test(product.sku + product.name)) {
      lines.push('- Schulung maximal 5 Prozent');
    } else {
      lines.push('- abhängig von der Artikelgruppe im Kalkulator');
    }
    lines.push('Das ist keine verbindliche Rabattfreigabe.');
  }

  return lines.join('\n');
}

function answerKnownProductFacts(normalized) {
  if (/mcs\s*state/.test(normalized) && /(messwert|messwerte|liefert|uplink|sensorwert|datenpunkt)/.test(normalized)) {
    return [
      'MCS State liefert laut Produkt-/Sensortypenliste diese Messwerte:',
      '',
      '- `VOLTAGE` in V',
      '- `CONTACT_RELATIVE_COUNT`',
      '- `CONTACT_STATE` an/aus',
      '- `WINDOW_CONTACT_STATE` an/aus',
      '',
      'Er ist also ein Fenster-/Türkontakt, kein Temperatur-/Feuchte-Multisensor. Für Temperatur/Feuchte wäre eher MCS Temp_rH oder NOVOS 3 passend.'
    ].join('\n');
  }

  if (/novos\s*3/.test(normalized) && /(messwert|messwerte|liefert|sensorwert|datenpunkt)/.test(normalized)) {
    const hasCo2 = /co2/.test(normalized);
    const values = hasCo2
      ? ['`TEMPERATURE` in °C', '`HUMIDITY` in %', '`VOLTAGE` in V', '`CO2` in ppm']
      : ['`TEMPERATURE` in °C', '`HUMIDITY` in %', '`VOLTAGE` in V'];

    return [
      `${hasCo2 ? 'NOVOS 3 CO2' : 'NOVOS 3'} liefert laut Produkt-/Sensortypenliste diese Messwerte:`,
      '',
      ...values.map(value => `- ${value}`)
    ].join('\n');
  }

  if (/(kondensation|betauung|condensation)/.test(normalized) && /(sensor|welchen|welche|nehmen|empfehl)/.test(normalized)) {
    return [
      'Für Kondensation/Betauung ist in der Wissensbasis `WK02+` vorgesehen.',
      '',
      'Passender Artikel aus der Produktliste:',
      '- `WK02+ ext LRW 24 V L2000`',
      '- Messwert: `CONDENSATION_STATE` an/aus'
    ].join('\n');
  }

  return '';
}

function getCatalogProducts() {
  if (catalogCache) return catalogCache;

  try {
    const appPath = path.join(__dirname, '..', '..', 'apps', 'project-calculator', 'app.js');
    const source = fs.readFileSync(appPath, 'utf8');
    const match = source.match(/const PRODUCT_ROWS = `([\s\S]*?)`;/);
    if (!match) return [];

    catalogCache = match[1].trim().split('\n').map(row => {
      const [category, sku, name, unit, weight, manufacturer, price] = row.split('\t');
      return {
        category,
        sku,
        name,
        unit,
        manufacturer,
        price: Number(price || 0)
      };
    });
    return catalogCache;
  } catch {
    return [];
  }
}

function findCatalogProduct(text) {
  const normalizedQuery = normalizeForMatch(text);
  const queryWords = new Set(normalizedQuery.split(' ').filter(Boolean));
  const products = getCatalogProducts();
  let best = null;
  let bestScore = 0;

  for (const product of products) {
    const haystack = `${product.sku} ${product.name}`;
    const tokens = normalizeForMatch(haystack).split(' ').filter(token => token.length >= 3 && !isWeakMatchToken(token));
    const uniqueTokens = [...new Set(tokens)];
    const score = uniqueTokens.reduce((sum, token) => sum + (queryWords.has(token) ? 1 : 0), 0);
    const strongSkuHit = normalizeForMatch(product.sku).split(' ').some(token => token.length >= 3 && queryWords.has(token));
    const adjustedScore = score + (strongSkuHit ? 2 : 0);
    if (adjustedScore > bestScore) {
      best = product;
      bestScore = adjustedScore;
    }
  }

  return bestScore >= 3 ? best : null;
}

function isWeakMatchToken(token) {
  return ['lrw', 'bat', 'sensor', 'weiss', 'weiß', 'temp', 'plus', 'fuer', 'für'].includes(token);
}

function normalizeForMatch(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function answerThermokonConfigPayload(text, normalized) {
  const deviceName = detectThermokonDevice(normalized);
  if (!deviceName) return '';

  const hysteresis = detectHysteresisValue(normalized);
  if (hysteresis) {
    return [
      `Für ${deviceName} wird das Hysterese-Sendeverhalten über \`0xC107\` gesetzt.`,
      'Datentyp: `UINT16`, Payload-Aufbau: Identifier + Wert in Big-Endian.',
      '',
      `Gewünschte Einstellung: ${hysteresis.label}`,
      `Payload: \`C107${uint16ToHex(hysteresis.value)}\``
    ].join('\n');
  }

  if (/(heartbeat|heart beat|lebenszeichen)/.test(normalized)) {
    const minutes = extractMinutes(text);
    if (minutes === null) {
      return [
        `Für ${deviceName} wird das Heartbeatintervall über \`0xC106\` gesetzt.`,
        'Datentyp: `UINT16`, Einheit: Minuten. Nenn mir das gewünschte Intervall, dann bilde ich die Payload.'
      ].join('\n');
    }
    return formatSimpleUint16Payload(deviceName, 'Heartbeatintervall', '0xC106', 'C106', minutes, 'Minuten');
  }

  if (/(adr|adaptive data rate)/.test(normalized)) {
    const disabled = /(deaktivieren|ausschalten|aus\b|disable|disabled|off\b)/.test(normalized);
    const enabled = !disabled && /(\baktivieren\b|einschalten|an\b|enable|enabled|on\b)/.test(normalized);
    if (!enabled && !disabled) return '';
    const value = enabled ? 1 : 0;
    return [
      `Für ${deviceName} wird ADR über \`0xC217\` gesetzt.`,
      `Payload: \`C217${uint16ToHex(value)}\``,
      '',
      value ? '`1` = ADR aktiviert' : '`0` = ADR deaktiviert'
    ].join('\n');
  }

  if (/(datenrate|data rate|\bdr[0-5]\b)/.test(normalized)) {
    const match = normalized.match(/\bdr\s*([0-5])\b|datenrate\s*([0-5])|data rate\s*([0-5])/);
    if (!match) return '';
    const value = Number(match[1] || match[2] || match[3]);
    return [
      `Für ${deviceName} wird die LoRaWAN-Datenrate über \`0xC218\` gesetzt.`,
      `Payload: \`C218${uint16ToHex(value)}\``,
      '',
      'Werte: `0` = DR0/SF12 bis `5` = DR5/SF7.'
    ].join('\n');
  }

  if (/(port|fport|f-port)/.test(normalized)) {
    const match = normalized.match(/(?:port|fport|f-port)\s*(?:auf|=|:)?\s*(\d{1,3})/);
    if (!match) return '';
    const value = Number(match[1]);
    if (value < 1 || value > 223) {
      return `Der Uplink-/Downlink-Port für ${deviceName} muss zwischen 1 und 223 liegen.`;
    }
    return formatSimpleUint16Payload(deviceName, 'Uplink-/Downlink-Port', '0xC216', 'C216', value, '');
  }

  if (/(re[\s-]?join|rejoin)/.test(normalized)) {
    const minutes = extractMinutes(text);
    if (minutes === null) {
      return [
        `Für ${deviceName} wird das Re-Join-Intervall über \`0xC21C\` gesetzt.`,
        'Datentyp: `UINT16`, Einheit: Minuten. `0` deaktiviert Re-Join.'
      ].join('\n');
    }
    return formatSimpleUint16Payload(deviceName, 'Re-Join-Intervall', '0xC21C', 'C21C', minutes, 'Minuten');
  }

  return '';
}

function detectHysteresisValue(normalized) {
  if (!/(hysterese|hysteresis)/.test(normalized)) return null;
  if (/(deaktivieren|aus|keine|none|0\b)/.test(normalized)) return { value: 0, label: 'keine Hysterese' };
  if (/(groß|grosse|große|gross|large|1\b)/.test(normalized)) return { value: 1, label: 'große Hysterese' };
  if (/(mittel|mittlere|medium|2\b)/.test(normalized)) return { value: 2, label: 'mittlere Hysterese' };
  if (/(klein|kleine|small|3\b)/.test(normalized)) return { value: 3, label: 'kleine Hysterese' };
  return null;
}

function formatSimpleUint16Payload(deviceName, label, identifier, prefix, value, unit) {
  const rounded = Math.round(value);
  const display = unit ? `${rounded} ${unit}` : String(rounded);
  return [
    `Für ${deviceName} wird ${label} über \`${identifier}\` gesetzt.`,
    'Datentyp: `UINT16`, Payload-Aufbau: Identifier + Wert in Big-Endian.',
    '',
    `Wert: ${display}`,
    `Payload: \`${prefix}${uint16ToHex(rounded)}\``
  ].join('\n');
}

function answerThermokonSendInterval(text, normalized) {
  const deviceName = detectThermokonDevice(normalized);
  const isThermokonStandardDevice = Boolean(deviceName);
  const asksForInterval = /(sendeintervall|sendeinterval|uplink.*intervall|messintervall|intervall|alle\s+\d+)/.test(normalized);
  const wantsPayload = /(downlink|payload|senden|setzen|konfigurieren|auf\s+\d+)/.test(normalized);

  if (!isThermokonStandardDevice || !asksForInterval || !wantsPayload) {
    return '';
  }

  const minutes = extractMinutes(text);
  if (minutes === null) {
    return [
      'Bei Thermokon Standardgeräten wie MCS State wird das Mess-/Sendeintervall über den Parameter `0xC108` konfiguriert.',
      'Datentyp: `UINT16`.',
      '',
      'Nenn mir bitte das gewünschte Intervall, dann bilde ich dir die Payload.'
    ].join('\n');
  }

  const seconds = minutes * 60;
  const minuteHex = uint16ToHex(minutes);
  const secondHex = uint16ToHex(seconds);
  const minutePayload = `C108${minuteHex}`;
  const secondPayload = `C108${secondHex}`;
  const displayMinutes = Number.isInteger(minutes) ? String(minutes) : String(minutes).replace('.', ',');
  const intervalRule = getIntervalEncodingRule(deviceName);

  const lines = [
    `Für ${deviceName} ist der Thermokon-Parameter für Mess-/Sendeintervall \`0xC108\`.`,
    'Datentyp: `UINT16`, Payload-Aufbau: Identifier + Wert in Big-Endian.',
    '',
    `Für ${displayMinutes} ${minutes === 1 ? 'Minute' : 'Minuten'} ergibt sich:`
  ];

  if (intervalRule.unit === 'minutes') {
    lines.push(`\`${minutePayload}\``);
    lines.push('');
    lines.push(`Grundlage: In der Schnittstellenbeschreibung ist \`0xC108\` als s/min abhängig vom Gerätetyp beschrieben; NOVOS 3 ist dort die 5-min-Variante.`);
  } else if (intervalRule.unit === 'seconds') {
    lines.push(`\`${secondPayload}\``);
    lines.push('');
    lines.push(`Grundlage: In der Schnittstellenbeschreibung ist \`0xC108\` als s/min abhängig vom Gerätetyp beschrieben; ${deviceName} fällt in die 60-s-Variante.`);
  } else {
    lines.push(`- Minutenvariante: \`${minutePayload}\``);
    lines.push(`- Sekundenvariante: \`${secondPayload}\``);
    lines.push('');
    lines.push('Die Schnittstellenbeschreibung beschreibt die Einheit bei `0xC108` als geräte-/softwareabhängig. Für dieses Gerät habe ich noch keine feste Zuordnung hinterlegt.');
  }

  return lines.join('\n');
}

function getIntervalEncodingRule(deviceName) {
  if (deviceName === 'NOVOS 3') {
    return { unit: 'minutes' };
  }

  if (['MCS', 'MCS State'].includes(deviceName)) {
    return { unit: 'seconds' };
  }

  return { unit: 'unknown' };
}

function detectThermokonDevice(normalized) {
  const devices = [
    [/mcs\s*state/, 'MCS State'],
    [/mcs/, 'MCS'],
    [/novos\s*3/, 'NOVOS 3'],
    [/fta54/, 'FTA54+'],
    [/ags55/, 'AGS55+'],
    [/akf10/, 'AKF10+'],
    [/dpa/, 'DPA+'],
    [/ftk/, 'FTK+'],
    [/la\+/, 'LA+'],
    [/li65/, 'Li65+'],
    [/lk\+/, 'LK+'],
    [/ls02/, 'LS02+'],
    [/mwf/, 'MWF+'],
    [/of14/, 'OF14+'],
    [/tf25/, 'TF25+'],
    [/wk02/, 'WK02+'],
    [/wsa/, 'WSA']
  ];

  const match = devices.find(([pattern]) => pattern.test(normalized));
  return match ? match[1] : '';
}

function extractCelsiusValue(text) {
  const match = String(text || '').match(/(-?\d+(?:[,.]\d+)?)\s*(?:grad|°\s*c?|celsius|temp|temperatur)/i);
  if (!match) return null;
  return Number(match[1].replace(',', '.'));
}

function extractMinutes(text) {
  const minuteMatch = String(text || '').match(/(\d+(?:[,.]\d+)?)\s*(?:min|minute|minuten)\b/i);
  if (minuteMatch) return Number(minuteMatch[1].replace(',', '.'));

  const hourMatch = String(text || '').match(/(\d+(?:[,.]\d+)?)\s*(?:h|std|stunde|stunden)\b/i);
  if (hourMatch) return Number(hourMatch[1].replace(',', '.')) * 60;

  return null;
}

function int16ToHex(value) {
  const wrapped = value < 0 ? 0x10000 + value : value;
  return wrapped.toString(16).toUpperCase().padStart(4, '0').slice(-4);
}

function uint16ToHex(value) {
  const rounded = Math.round(value);
  return Math.max(0, Math.min(0xFFFF, rounded)).toString(16).toUpperCase().padStart(4, '0');
}

module.exports = {
  buildKnowledgeQuery,
  createChatReply
};
