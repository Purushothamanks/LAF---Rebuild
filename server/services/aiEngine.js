const axios = require('axios');
const { searchUserMemory } = require('./database');

const SYSTEM_PROMPT = `You are LAF (L - Look, A - At, F - Future: "Look At the Future"), an elite, ultra-fast, hyper-accurate AI assistant created to deliver human-minded deep reasoning, technical problem-solving, and innovative insights.

CRITICAL OPERATIONAL RULES:
1. IDENTITY: You are LAF ("Look At the Future"). Always respond directly, naturally, and warmly like a world-class AI reasoning product.
2. NO BOILERPLATE: Never output system debug logs, mode notes, or template prefixes. Provide clean, well-formatted markdown answers directly.
3. GREETINGS: For greetings ("hi", "hello", "hey"), welcome the user warmly by name and ask how you can help them innovate or solve problems today.
4. SYSTEM CONCEPTS: When users share product ideas, concepts (like visual diagnostic software), or code requirements, provide a comprehensive, brilliant, structured breakdown with clear steps.
5. MEMORY: Seamlessly incorporate recalled memory from previous chats when relevant.`;

/**
 * High-Performance Reasoning & Response Engine for LAF
 */
async function generateResponse({ username, prompt, history = [], customApiKey }) {
  const cleanPrompt = (prompt || '').trim();
  const lowerPrompt = cleanPrompt.toLowerCase();
  
  // 1. Instant Natural Greetings
  if (/^(hi|hello|hey|greetings|hola|namaste|sup|yo|hi laf|hello laf)$/i.test(cleanPrompt)) {
    const greetings = [
      `Hello ${username}! I'm LAF. How can I help you today?`,
      `Hi ${username}! Great to connect. What would you like to build, analyze, or explore today?`,
      `Hey ${username}! LAF is ready. What idea or project are we working on today?`
    ];
    return {
      text: greetings[Math.floor(Math.random() * greetings.length)],
      provider: 'LAF Instant Neural Engine'
    };
  }

  // 2. Memory Context Search
  let memoryContext = '';
  if (
    lowerPrompt.includes('past conversation') ||
    lowerPrompt.includes('last week') ||
    lowerPrompt.includes('yesterday') ||
    lowerPrompt.includes('previous conversation') ||
    lowerPrompt.includes('what did we talk') ||
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

  // 3. Multi-Provider Fast Reasoning Routing
  
  // Provider 1: Gemini 1.5 / 2.0 Flash API (if Key exists)
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
      if (candidate && candidate.trim().length > 0) {
        return {
          text: candidate.trim(),
          provider: 'Gemini 1.5 Flash (Ultra-Fast)'
        };
      }
    } catch (err) {
      console.warn('Gemini endpoint failed, switching to secondary reasoning provider:', err.message);
    }
  }

  // Provider 2: Fast Pollinations Multi-Model Routing Pipeline (Qwen-Coder / DeepSeek / OpenAI)
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
          provider: `LAF Deep Reasoning Engine (${modelName.toUpperCase()})`
        };
      }
    } catch (err) {
      console.warn(`Pollinations ${modelName} model failed, trying next model...`);
    }
  }

  // Provider 3: OpenRouter / Free Neural Tier Backup
  try {
    const encodedPrompt = encodeURIComponent(`${fullSystemPrompt}\n\nUser Question: ${cleanPrompt}\n\nLAF Answer:`);
    const getRes = await axios.get(`https://text.pollinations.ai/${encodedPrompt}?model=openai&cache=false`, { timeout: 12000 });
    if (getRes.data && typeof getRes.data === 'string' && getRes.data.trim().length > 0) {
      return {
        text: getRes.data.trim(),
        provider: 'LAF Neural Web Engine'
      };
    }
  } catch (e) {
    console.warn('GET Pollinations failed:', e.message);
  }

  // Fallback: Smart Direct Answer
  return {
    text: `Hello ${username}, I'm LAF. Regarding your query about "${cleanPrompt}": I am analyzing this in detail and ready to assist you step-by-step. What specific feature or solution would you like me to generate next?`,
    provider: 'LAF Core Neural Engine'
  };
}

module.exports = {
  generateResponse
};
