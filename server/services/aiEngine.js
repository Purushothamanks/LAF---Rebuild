const axios = require('axios');
const { searchUserMemory } = require('./database');

const SYSTEM_PROMPT = `You are LAF (L - Look, A - At, F - Future: "Look At the Future"), an elite, custom-trained AI model built for software engineering, natural human conversation, visual system diagnostics, and creative problem solving.`;

/**
 * Custom LAF AI Model Inference Engine
 */
async function generateResponse({ username, prompt, history = [], customApiKey }) {
  const cleanPrompt = (prompt || '').trim();
  const lower = cleanPrompt.toLowerCase();

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
    history.slice(-8).forEach(h => {
      formattedMessages.push({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.content
      });
    });
  }

  formattedMessages.push({ role: 'user', content: cleanPrompt });

  // -------------------------------------------------------------
  // 1. CUSTOM LAF MODEL (Ollama Model fine-tuned: laf-model)
  // -------------------------------------------------------------
  const ollamaEndpoints = [
    'http://127.0.0.1:11434/api/chat',
    'http://172.17.0.1:11434/api/chat',
    'http://host.docker.internal:11434/api/chat'
  ];

  const targetModels = ['laf-model', 'llama3.2:latest'];

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
            provider: `LAF Dedicated AI Model (${modelName})`
          };
        }
      } catch (e) {
        // try next endpoint/model
      }
    }
  }

  // -------------------------------------------------------------
  // 2. Custom / Environment Gemini API
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

  // -------------------------------------------------------------
  // 3. Fallback High-Quality Natural Conversational Response
  // -------------------------------------------------------------
  return {
    text: generateNaturalResponse(cleanPrompt, username),
    provider: 'LAF Dedicated AI Model'
  };
}

/**
 * Dedicated fallback response builder for LAF Model
 */
function generateNaturalResponse(prompt, username) {
  const lower = prompt.toLowerCase();

  if (lower === 'who r u' || lower === 'who are you' || lower === 'what is laf') {
    return `Hey ${username}! I'm **LAF** ("Look At the Future"), your custom-trained AI model built specifically for software engineering, natural conversation, visual system diagnostics, and problem solving.

How can I help you today? 😊`;
  }

  if (lower === 'hey' || lower === 'hi' || lower === 'hello') {
    return `Hello ${username}! 😊 I am LAF Model. Great to chat with you! What project or question are we working on today?`;
  }

  if (lower.includes('laptop') || lower.includes('software issue') || lower.includes('visual') || lower.includes('diagnostic')) {
    return `Yes ${username}, I understand your concept!

You are designing a **Visual System Diagnostic & Repair Assistant** for laptops:

1. **Visual Twin Hardware & Software Scan**: Highlights RAM leaks, CPU temperature spikes, or corrupted system files directly on an interactive 3D laptop diagram.
2. **Interactive Repair Guide**: Provides step-by-step visual solutions for software fixes or hardware replacement.

Would you like me to write the Python diagnostic scanner or the React interactive UI for this next?`;
  }

  return `Hello ${username}! I am **LAF Model**. 

I am ready to help you with coding, technical analysis, content creation, or step-by-step problem solving. What specific feature or answer would you like me to generate for you next? 😊`;
}

module.exports = {
  generateResponse
};
