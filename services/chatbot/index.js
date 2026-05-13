const { searchKnowledge } = require('./knowledge-search');
const { callOpenAI, callOpenRouter } = require('./llm');

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
  const productFactsReply = answerKnownProductFacts(normalized);
  if (productFactsReply) {
    return productFactsReply;
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

  return '';
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
