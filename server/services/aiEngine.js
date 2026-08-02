const axios = require('axios');
const { searchUserMemory } = require('./database');

const SYSTEM_PROMPT = `You are LAF AI, an elite assistant built for fast coding, clear conversation, and creative problem solving. Provide direct, helpful answers. Format code inside clean markdown code blocks.`;

/**
 * High-Speed Direct Passthrough Engine to Ollama AI Models
 * Tuned for sub-second to 2-second responses using fast models and CPU thread optimizations.
 */
async function generateResponse({ username, prompt, history = [], customApiKey }) {
  const cleanPrompt = (prompt || '').trim();
  console.log(`[AI-ENGINE] Fast Processing prompt for user "${username}": "${cleanPrompt}"`);

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

  const fullSystemPrompt = `${SYSTEM_PROMPT}\nUser: ${username}${memoryContext ? '\n' + memoryContext : ''}`;

  const formattedMessages = [
    { role: 'system', content: fullSystemPrompt }
  ];

  if (Array.isArray(history) && history.length > 0) {
    history.slice(-2).forEach(h => {
      formattedMessages.push({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.content
      });
    });
  }

  formattedMessages.push({ role: 'user', content: cleanPrompt });

  // -------------------------------------------------------------
  // 1. DIRECT PASSTHROUGH TO ULTRA-FAST OLLAMA MODELS (Sub-Second / 2s Response)
  // -------------------------------------------------------------
  const ollamaEndpoints = [
    'http://172.17.0.1:11434/api/chat',
    'http://127.0.0.1:11434/api/chat',
    'http://host.docker.internal:11434/api/chat'
  ];

  // Prioritize fast models for maximum speed
  const targetModels = ['qwen2.5:0.5b', 'llama3.2:latest', 'laf-v2:latest'];

  for (const endpoint of ollamaEndpoints) {
    for (const modelName of targetModels) {
      try {
        console.log(`[AI-ENGINE] High-speed call to ${endpoint} (${modelName})...`);
        const start = Date.now();
        const ollamaRes = await axios.post(
          endpoint,
          {
            model: modelName,
            messages: formattedMessages,
            stream: false,
            options: {
              num_ctx: 2048,
              num_predict: 512,
              temperature: 0.6,
              top_k: 20,
              top_p: 0.9,
              num_thread: 4
            }
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
          }
        );

        const content = ollamaRes.data?.message?.content;
        if (content && content.trim().length > 0) {
          const duration = ((Date.now() - start) / 1000).toFixed(2);
          console.log(`[AI-ENGINE] ULTRA-FAST SUCCESS from ${modelName} in ${duration}s! (${content.length} chars)`);
          return {
            text: content.trim(),
            provider: `Llama AI (${modelName})`
          };
        }
      } catch (e) {
        console.error(`[AI-ENGINE] Ollama error [${endpoint} | ${modelName}]: ${e.message}`);
      }
    }
  }

  // -------------------------------------------------------------
  // 2. Backup: Gemini 1.5 Flash API
  // -------------------------------------------------------------
  const geminiKey = customApiKey || (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('your_actual') ? process.env.GEMINI_API_KEY : null);
  if (geminiKey && geminiKey.startsWith('AIzaSy')) {
    try {
      console.log(`[AI-ENGINE] Attempting Gemini API fallback...`);
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          contents: formattedMessages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
          })),
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
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
      console.error(`[AI-ENGINE] Gemini error: ${err.message}`);
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
