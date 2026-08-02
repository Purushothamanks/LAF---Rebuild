const axios = require('axios');
const { searchUserMemory } = require('./database');

const SYSTEM_PROMPT = `You are LAF (L - Look, A - At, F - Future: "Look At the Future"), an elite, custom fine-tuned AI model built for software engineering, natural human conversation, visual system diagnostics, and creative problem solving.`;

/**
 * 100% Direct Passthrough Engine to Llama / Ollama AI Backend
 */
async function generateResponse({ username, prompt, history = [], customApiKey }) {
  const cleanPrompt = (prompt || '').trim();
  const lower = cleanPrompt.toLowerCase().replace(/[^\w\s]/gi, '');

  // 1. Check User Memory Context
  let memoryContext = '';
  if (
    lower.includes('past conversation') ||
    lower.includes('last week') ||
    lower.includes('yesterday') ||
    lower.includes('previous conversation') ||
    lower.includes('what did we talk') ||
    lower.includes('remember when')
  ) {
    const memoryMatches = searchUserMemory(username, cleanPrompt);
    if (memoryMatches && memoryMatches.length > 0) {
      memoryContext = `\n[RECALLED MEMORY]:\n` +
        memoryMatches.map(m => `[${m.date} | ${m.role.toUpperCase()}]: ${m.content}`).join('\n');
    }
  }

  const fullSystemPrompt = `${SYSTEM_PROMPT}\nUser Name: ${username}${memoryContext ? '\n' + memoryContext : ''}`;

  const formattedMessages = [
    { role: 'system', content: fullSystemPrompt }
  ];

  if (Array.isArray(history) && history.length > 0) {
    history.slice(-6).forEach(h => {
      formattedMessages.push({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.content
      });
    });
  }

  formattedMessages.push({ role: 'user', content: cleanPrompt });

  // -------------------------------------------------------------
  // 1. DIRECT PASSTHROUGH TO LLAMA / OLLAMA MODEL ENGINE (60s Timeout)
  // -------------------------------------------------------------
  const ollamaEndpoints = [
    'http://172.17.0.1:11434/api/chat',
    'http://127.0.0.1:11434/api/chat',
    'http://host.docker.internal:11434/api/chat'
  ];

  const targetModels = ['laf-v2', 'llama3.2:latest', 'laf-model'];

  for (const endpoint of ollamaEndpoints) {
    for (const modelName of targetModels) {
      try {
        const ollamaRes = await axios.post(
          endpoint,
          {
            model: modelName,
            messages: formattedMessages,
            stream: false
          },
          { timeout: 60000 }
        );

        const content = ollamaRes.data?.message?.content;
        if (content && content.trim().length > 0) {
          return {
            text: content.trim(),
            provider: `LAF Llama AI (${modelName})`
          };
        }
      } catch (e) {
        // Try next endpoint/model
      }
    }
  }

  // -------------------------------------------------------------
  // 2. Backup: Gemini 1.5 Flash API
  // -------------------------------------------------------------
  const geminiKey = customApiKey || (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('your_actual') ? process.env.GEMINI_API_KEY : null);
  if (geminiKey && geminiKey.startsWith('AIzaSy')) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          contents: formattedMessages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
          })),
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
        },
        { timeout: 10000 }
      );

      const candidate = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (candidate && candidate.trim().length > 0) {
        return {
          text: candidate.trim(),
          provider: 'Gemini 1.5 Flash'
        };
      }
    } catch (err) {
      // Fallthrough
    }
  }

  // -------------------------------------------------------------
  // 3. Fallback Response
  // -------------------------------------------------------------
  return {
    text: `Hello ${username}! I am processing your request: "${cleanPrompt}". Please verify that Ollama or an API key is connected.`,
    provider: 'LAF Engine'
  };
}

module.exports = {
  generateResponse
};
