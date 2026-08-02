const axios = require('axios');
const { searchUserMemory } = require('./database');

const SYSTEM_PROMPT = `You are LAF (L - Look, A - At, F - Future: "Look At the Future"), a state-of-the-art, ultra-fast, hyper-accurate AI assistant with human-minded deep reasoning capability.

CRITICAL INSTRUCTIONS:
1. IDENTITY: You are LAF ("Look At the Future"). Always maintain a sleek, professional, futuristic, and highly intelligent persona.
2. RESPONSE STYLE & LENGTH (VERY IMPORTANT):
   - Default: Provide ultra-fast, accurate, direct, and concise (short) answers without unnecessary fluff.
   - Deep Dive Mode: ONLY if the user explicitly asks for detailed, step-by-step, or elaborate explanations ("explain in detail", "elaborate", "give a deep dive", "tell me more"), provide a comprehensive, structured response.
3. REASONING LEVEL: Think critically like a top-tier human expert (logical, empathetic, precise, forward-looking).
4. ACCURACY: Strive for zero hallucination. If unsure, specify parameters or ask clarifying questions concisely.
5. MEMORY: When user asks about previous conversations, reference the provided memory context gracefully.`;

/**
 * Main Reasoning & Response Engine for LAF
 */
async function generateResponse({ username, prompt, history = [], customApiKey, concisenessMode = 'short' }) {
  const cleanPrompt = (prompt || '').trim();
  
  // 1. Check if user is asking about past conversations
  let memoryContext = '';
  const lowerPrompt = cleanPrompt.toLowerCase();
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
    if (memoryMatches.length > 0) {
      memoryContext = `\n[RECALLED USER MEMORY CONTEXT FROM ISOLATED DB]:\n` +
        memoryMatches.map(m => `[${m.date} | ${m.role.toUpperCase()}]: ${m.content}`).join('\n');
    } else {
      memoryContext = `\n[RECALLED USER MEMORY CONTEXT FROM ISOLATED DB]: No prior matching conversations found in user database.`;
    }
  }

  // Determine if prompt requires elaboration
  const isElaborateRequested = 
    concisenessMode === 'detailed' ||
    lowerPrompt.includes('elaborate') ||
    lowerPrompt.includes('in detail') ||
    lowerPrompt.includes('explain step by step') ||
    lowerPrompt.includes('deep dive') ||
    lowerPrompt.includes('comprehensive');

  const lengthDirective = isElaborateRequested
    ? "MODE: Detailed/Elaborate. Provide thorough, comprehensive step-by-step explanation."
    : "MODE: Concise/Short. Provide a direct, compact, high-accuracy response in 2-4 sentences max unless code is requested.";

  const fullSystemPrompt = `${SYSTEM_PROMPT}\n${lengthDirective}${memoryContext ? '\n' + memoryContext : ''}`;

  // Format messages payload
  const formattedMessages = [
    { role: 'system', content: fullSystemPrompt }
  ];

  // Include recent conversation history (last 6 turns)
  if (Array.isArray(history) && history.length > 0) {
    history.slice(-6).forEach(h => {
      formattedMessages.push({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.content
      });
    });
  }

  formattedMessages.push({ role: 'user', content: cleanPrompt });

  // 2. Multi-provider AI Routing Pipeline
  // Try User Custom API Key first if provided, else fallback to free ultra-fast endpoints
  
  // Provider 1: Gemini API (if key present in env or custom)
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
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: isElaborateRequested ? 2048 : 512
          }
        },
        { timeout: 12000 }
      );

      const candidate = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (candidate) {
        return {
          text: candidate,
          provider: 'Gemini 1.5 Flash (Ultra-Fast)',
          mode: isElaborateRequested ? 'Elaborate' : 'Concise'
        };
      }
    } catch (err) {
      console.warn('Gemini primary endpoint failed, routing to fast fallback:', err.message);
    }
  }

  // Provider 2: Pollinations AI Fast Reasoning Endpoint (Free, Fast, High Accuracy)
  try {
    const response = await axios.post(
      'https://text.pollinations.ai/openai',
      {
        model: 'openai', // Maps to GPT-4o / Claude / DeepSeek fast tier
        messages: formattedMessages,
        temperature: 0.7,
        seed: Math.floor(Math.random() * 1000000)
      },
      { timeout: 15000 }
    );

    let textOut = '';
    if (typeof response.data === 'string') {
      textOut = response.data;
    } else if (response.data?.choices?.[0]?.message?.content) {
      textOut = response.data.choices[0].message.content;
    }

    if (textOut) {
      return {
        text: textOut,
        provider: 'LAF Core Neural Engine (Fast Reasoning)',
        mode: isElaborateRequested ? 'Elaborate' : 'Concise'
      };
    }
  } catch (err) {
    console.warn('Pollinations AI failed, using local smart reasoning fallback:', err.message);
  }

  // Provider 3: Fallback Smart Engine
  return {
    text: `LAF ("Look At the Future") response: ${cleanPrompt.length > 50 ? 'Analyzing your request...' : 'Direct Answer:'} ${cleanPrompt}. For deeper insights, toggle Detailed Mode or connect an API key.`,
    provider: 'LAF Neural Fallback',
    mode: isElaborateRequested ? 'Elaborate' : 'Concise'
  };
}

module.exports = {
  generateResponse
};
