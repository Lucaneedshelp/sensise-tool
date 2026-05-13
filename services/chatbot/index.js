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

function extractCelsiusValue(text) {
  const match = String(text || '').match(/(-?\d+(?:[,.]\d+)?)\s*(?:grad|°\s*c?|celsius|temp|temperatur)/i);
  if (!match) return null;
  return Number(match[1].replace(',', '.'));
}

function int16ToHex(value) {
  const wrapped = value < 0 ? 0x10000 + value : value;
  return wrapped.toString(16).toUpperCase().padStart(4, '0').slice(-4);
}

module.exports = {
  buildKnowledgeQuery,
  createChatReply
};
