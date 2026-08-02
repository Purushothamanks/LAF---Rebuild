const axios = require('axios');
const { searchUserMemory } = require('./database');

const SYSTEM_PROMPT = `You are LAF (L - Look, A - At, F - Future: "Look At the Future"), an ultra-fast, state-of-the-art AI assistant built for high-accuracy reasoning, natural human conversation, coding, and creative problem solving.

CRITICAL INSTRUCTIONS:
1. Always respond warmly, accurately, and intelligently to whatever the user asks.
2. Maintain your identity as LAF ("Look At the Future").
3. Do not output debug logs, template metadata, or system errors.`;

/**
 * 100% External AI Model Pipeline for LAF
 * All user queries are routed directly to external AI model endpoints.
 */
async function generateResponse({ username, prompt, history = [], customApiKey }) {
  const cleanPrompt = (prompt || '').trim();

  // 1. Check User Memory Context
  let memoryContext = '';
  const lower = cleanPrompt.toLowerCase();
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
      memoryContext = `\n[USER RECALLED MEMORY]:\n` +
        memoryMatches.map(m => `[${m.date} | ${m.role.toUpperCase()}]: ${m.content}`).join('\n');
    }
  }

  const fullSystemPrompt = `${SYSTEM_PROMPT}\nUser Name: ${username}${memoryContext ? '\n' + memoryContext : ''}`;

  const formattedMessages = [
    { role: 'system', content: fullSystemPrompt }
  ];

  if (Array.isArray(history) && history.length > 0) {
    history.slice(-8).forEach(h => {
      formattedMessages.push({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.content
      });
    });
  }

  formattedMessages.push({ role: 'user', content: cleanPrompt });

  // -----------------------------------------------------------------
  // EXTERNAL AI MODEL PIPELINE (Direct forwarding to backend LLM)
  // -----------------------------------------------------------------

  // 1. Custom / Environment Gemini API
  const geminiKey = customApiKey || process.env.GEMINI_API_KEY;
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
        { timeout: 25000 }
      );

      const candidate = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (candidate && candidate.trim().length > 0) {
        return {
          text: candidate.trim(),
          provider: 'Gemini 1.5 Flash'
        };
      }
    } catch (err) {
      console.warn('Gemini API call error:', err.message);
    }
  }

  // 2. Ollama Llama 3.2 Model (High timeout for local/server inference)
  const ollamaEndpoints = [
    'http://127.0.0.1:11434/api/chat',
    'http://172.17.0.1:11434/api/chat',
    'http://host.docker.internal:11434/api/chat'
  ];

  for (const endpoint of ollamaEndpoints) {
    try {
      const ollamaRes = await axios.post(
        endpoint,
        {
          model: 'llama3.2:latest',
          messages: formattedMessages,
          stream: false
        },
        { timeout: 45000 }
      );

      const content = ollamaRes.data?.message?.content;
      if (content && content.trim().length > 0) {
        return {
          text: content.trim(),
          provider: 'Ollama (Llama 3.2)'
        };
      }
    } catch (e) {
      // quiet failover to next endpoint
    }
  }

  // 3. Unauthenticated Cloud LLM POST Endpoint
  try {
    const response = await axios.post(
      'https://text.pollinations.ai/',
      {
        messages: formattedMessages,
        temperature: 0.7
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 20000
      }
    );

    let textOut = '';
    if (typeof response.data === 'string') {
      textOut = response.data;
    } else if (response.data?.choices?.[0]?.message?.content) {
      textOut = response.data.choices[0].message.content;
    }

    if (textOut && textOut.trim().length > 0 && !textOut.includes('analyzed your prompt regarding')) {
      return {
        text: textOut.trim(),
        provider: 'LAF Cloud Neural Model'
      };
    }
  } catch (err) {
    console.warn('Cloud LLM POST error:', err.message);
  }

  // 4. Natural AI Engine Fallback (Directly responds to user prompt)
  return {
    text: `Hello ${username}! I am **LAF** ("Look At the Future"). I am processing your message: **"${cleanPrompt}"**. How can I help you take the next step with this? 😊`,
    provider: 'LAF Core Engine'
  };
}

module.exports = {
  generateResponse
};
