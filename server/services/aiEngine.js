const axios = require('axios');
const { searchUserMemory } = require('./database');

const SYSTEM_PROMPT = `You are LAF (L - Look, A - At, F - Future: "Look At the Future"), a state-of-the-art, ultra-fast, hyper-accurate AI product with human-minded deep reasoning capability.

CRITICAL INSTRUCTIONS:
1. IDENTITY: You are LAF ("Look At the Future"). Always maintain a warm, highly intelligent, sleek, and futuristic persona.
2. NATURAL HUMAN RESPONSE: Respond naturally and directly like an advanced human expert. Never output raw template strings or boilerplate debug text.
3. GREETINGS & INTROS: For simple greetings like "hi", "hello", "hey", respond warmly and ask how you can assist them today.
4. ACCURACY & CODE: For coding, reasoning, or technical tasks, provide clean, high-performance, bug-free solutions with step-by-step logic.
5. MEMORY: When user asks about previous conversations, reference the provided memory context gracefully.`;

/**
 * Main Reasoning & Response Engine for LAF
 */
async function generateResponse({ username, prompt, history = [], customApiKey, concisenessMode = 'short' }) {
  const cleanPrompt = (prompt || '').trim();
  const lowerPrompt = cleanPrompt.toLowerCase();
  
  // 1. Handle common greetings & instant natural responses
  if (/^(hi|hello|hey|greetings|hola|namaste|sup|yo|hi laf|hello laf)$/i.test(cleanPrompt)) {
    const greetings = [
      `Hello ${username}! I'm LAF. How can I assist you today?`,
      `Hi ${username}! Great to connect. What would you like to build, analyze, or explore today?`,
      `Hey ${username}! LAF is ready. How can I help you take a step into the future?`
    ];
    return {
      text: greetings[Math.floor(Math.random() * greetings.length)],
      provider: 'LAF Instant Neural Engine',
      mode: 'Conversational'
    };
  }

  // 2. Check user memory context from isolated DB
  let memoryContext = '';
  if (
    lowerPrompt.includes('past conversation') ||
    lowerPrompt.includes('last week') ||
    lowerPrompt.includes('yesterday') ||
    lowerPrompt.includes('previous conversation') ||
    lowerPrompt.includes('what did we talk') ||
    lowerPrompt.includes('what did i ask') ||
    lowerPrompt.includes('remember when')
  ) {
    const memoryMatches = searchUserMemory(username, cleanPrompt);
    if (memoryMatches && memoryMatches.length > 0) {
      memoryContext = `\n[RECALLED USER MEMORY CONTEXT FROM ISOLATED DB]:\n` +
        memoryMatches.map(m => `[${m.date} | ${m.role.toUpperCase()}]: ${m.content}`).join('\n');
    }
  }

  const fullSystemPrompt = `${SYSTEM_PROMPT}${memoryContext ? '\n' + memoryContext : ''}`;

  // Format messages payload
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

  // 3. Multi-provider AI Routing Pipeline
  
  // Provider 1: Gemini 1.5/2.0 Flash Endpoint (if custom API key or ENV present)
  const geminiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (geminiKey) {
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
        { timeout: 12000 }
      );

      const candidate = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (candidate) {
        return {
          text: candidate,
          provider: 'Gemini 1.5 Flash (Ultra-Fast)',
          mode: 'Reasoning'
        };
      }
    } catch (err) {
      console.warn('Gemini endpoint failed, switching to secondary reasoning provider:', err.message);
    }
  }

  // Provider 2: Fast Pollinations Reasoning Models (Qwen-Coder / DeepSeek / OpenAI)
  const pollModels = ['openai', 'qwen-coder', 'mistral'];
  for (const modelName of pollModels) {
    try {
      const response = await axios.post(
        'https://text.pollinations.ai/openai',
        {
          model: modelName,
          messages: formattedMessages,
          temperature: 0.7,
          seed: Math.floor(Math.random() * 1000000)
        },
        { timeout: 14000 }
      );

      let textOut = '';
      if (typeof response.data === 'string') {
        textOut = response.data;
      } else if (response.data?.choices?.[0]?.message?.content) {
        textOut = response.data.choices[0].message.content;
      }

      if (textOut && textOut.trim().length > 0) {
        return {
          text: textOut.trim(),
          provider: `LAF Deep Reasoning Engine (${modelName.toUpperCase()})`,
          mode: 'Deep Reason'
        };
      }
    } catch (err) {
      console.warn(`Pollinations ${modelName} model failed, trying next model...`);
    }
  }

  // Provider 3: Direct Pollinations GET Fallback (High Reliability)
  try {
    const encodedPrompt = encodeURIComponent(`${fullSystemPrompt}\n\nUser: ${cleanPrompt}`);
    const getRes = await axios.get(`https://text.pollinations.ai/${encodedPrompt}?model=openai&cache=false`, { timeout: 12000 });
    if (getRes.data && typeof getRes.data === 'string' && getRes.data.trim().length > 0) {
      return {
        text: getRes.data.trim(),
        provider: 'LAF Neural Web Engine',
        mode: 'Direct Reason'
      };
    }
  } catch (e) {
    console.warn('GET Pollinations failed, fallback to natural intelligent response:', e.message);
  }

  // Provider 4: Natural Intelligent Fallback (Warm & Helpful)
  return {
    text: `Hello ${username}, I'm LAF ("Look At the Future"). I received your message: "${cleanPrompt}". How can I assist you with your project, code, or ideas today?`,
    provider: 'LAF Core Neural Fallback',
    mode: 'Conversational'
  };
}

module.exports = {
  generateResponse
};
