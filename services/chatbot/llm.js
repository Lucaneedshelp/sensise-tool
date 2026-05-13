const { getSystemPrompt } = require('./prompt');

function normalizeMessages(messages) {
  return messages.map(message => ({
    role: message.role === 'assistant' ? 'assistant' : 'user',
    content: String(message.content || '').slice(0, 4000)
  }));
}

async function callOpenAI(messages, searchContext) {
  const system = getSystemPrompt(searchContext);

  const payload = JSON.stringify({
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    input: [
      { role: 'system', content: system },
      ...normalizeMessages(messages)
    ],
    max_output_tokens: 700
  });

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: payload
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `OpenAI API error ${response.status}`);
  }

  return data.output_text || extractOutputText(data) || 'Ich habe keine Antwort erhalten.';
}

async function callOpenRouter(messages, searchContext) {
  const apiKey = String(process.env.OPENROUTER_API_KEY || '').trim();
  if (!apiKey.startsWith('sk-or-')) {
    throw new Error('OPENROUTER_API_KEY ist gesetzt, sieht aber nicht wie ein kompletter OpenRouter-Key aus. Der Key muss mit sk-or- beginnen.');
  }

  const payload = JSON.stringify({
    model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
    messages: [
      { role: 'system', content: getSystemPrompt(searchContext) },
      ...normalizeMessages(messages)
    ],
    max_tokens: 700,
    temperature: 0.4
  });

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_PUBLIC_URL || `http://localhost:${process.env.PORT || 4177}`,
      'X-Title': 'Sensise Tools'
    },
    body: payload
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `OpenRouter API error ${response.status}`);
  }

  return data.choices?.[0]?.message?.content?.trim() || 'Ich habe keine Antwort erhalten.';
}

function extractOutputText(data) {
  return (data.output || [])
    .flatMap(item => item.content || [])
    .filter(item => item.type === 'output_text' || item.text)
    .map(item => item.text)
    .join('\n')
    .trim();
}

module.exports = {
  callOpenAI,
  callOpenRouter,
  normalizeMessages
};
