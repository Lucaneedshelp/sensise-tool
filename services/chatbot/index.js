const { searchKnowledge } = require('./knowledge-search');
const { callOpenAI, callOpenRouter } = require('./llm');

async function createChatReply(messages) {
  const safeMessages = Array.isArray(messages) ? messages : [];
  const lastUserMessage = [...safeMessages].reverse().find(message => message.role === 'user')?.content || '';

  if (!process.env.OPENAI_API_KEY && !process.env.OPENROUTER_API_KEY) {
    return `Demo-Modus: Ich habe deine Frage erhalten: "${lastUserMessage}".\n\nSobald OPENAI_API_KEY in der .env gesetzt ist, antworte ich mit OpenAI.`;
  }

  const searchContext = await searchKnowledge(lastUserMessage);
  return process.env.OPENROUTER_API_KEY
    ? callOpenRouter(safeMessages, searchContext)
    : callOpenAI(safeMessages, searchContext);
}

module.exports = {
  createChatReply
};
