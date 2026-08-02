const axios = require('axios');
const { searchUserMemory } = require('./database');

const SYSTEM_PROMPT = `You are LAF (L - Look, A - At, F - Future: "Look At the Future"), an ultra-fast, state-of-the-art AI assistant with human-minded reasoning and conversational intelligence.

OPERATIONAL INSTRUCTIONS:
1. NATURAL HUMAN CONVERSATION: Speak naturally, warmly, and intelligently like ChatGPT/DeepSeek/Gemini. Never output rigid, robotic debug templates or "I've analyzed your prompt regarding...".
2. GREETINGS & CASUAL CHAT: Respond warmly to greetings ("hello dudee", "hey bro", "hi laf") with natural, helpful dialogue.
3. ACCURACY & CODE: For coding, technical queries, or system designs, deliver clean, accurate, bug-free production code with clear explanations.
4. IDENTITY: You are LAF ("Look At the Future").`;

/**
 * Intelligent Multi-Model Conversational Engine for LAF
 */
async function generateResponse({ username, prompt, history = [], customApiKey }) {
  const cleanPrompt = (prompt || '').trim();
  const lowerPrompt = cleanPrompt.toLowerCase();

  // 1. Handle Greetings & Casual Intros Naturally ("hello dudee", "hi bro", etc.)
  if (/^(hello|hi|hey|greetings|yo|sup|hola|namaste)(\s+(dudee?|dude|bro|laf|there|friend|man))?!?$/i.test(cleanPrompt)) {
    const naturalGreetings = [
      `Hello ${username}! 😊 How can I help you today? Whether you need help with coding, content, research, or brainstorming ideas, I'm here for you!`,
      `Hey ${username}! Great to chat with you. What would you like to build, analyze, or explore today?`,
      `Hello there! I'm LAF. How can I assist you with your projects or questions today?`
    ];
    return {
      text: naturalGreetings[Math.floor(Math.random() * naturalGreetings.length)],
      provider: 'LAF Conversational Engine'
    };
  }

  // 2. Handle Capabilities / "What can you do?" Queries
  if (
    lowerPrompt.includes('what can you do') ||
    lowerPrompt.includes('what are your capabilities') ||
    lowerPrompt.includes('who are you') ||
    lowerPrompt.includes('what do you do') ||
    lowerPrompt.includes('help me with')
  ) {
    return {
      text: `Hello ${username}! I'm **LAF** ("Look At the Future"), your intelligent AI assistant. Here's a rundown of what I can do for you:

📝 **Writing & Content**
- Write, edit, and proofread essays, articles, emails, reports, and documentation
- Generate creative writing (stories, scripts, song lyrics, outlines)
- Assist with resumes, cover letters, and professional communications
- Summarize long texts or documents into key insights

💻 **Coding & Technical**
- Write, debug, and explain code in JavaScript, Python, C++, React, Node.js, SQL, and more
- Help with algorithm design, data structures, and system architecture
- Assist with regex, API integrations, and technical documentation

📚 **Learning & Research**
- Explain complex scientific, mathematical, or philosophical topics in simple terms
- Tutor you in subjects like physics, computer science, literature, and general knowledge
- Answer questions and provide accurate background research

🧠 **Problem-Solving & Analysis**
- Brainstorm innovative project ideas and product concepts
- Analyze data, trend patterns, or technical arguments
- Help with decision-making, planning, and system diagnostics

🌍 **Languages & Translation**
- Translate between multiple global languages
- Assist with learning or practicing new languages

🎭 **Fun & Casual**
- Chat casually about tech, movies, books, or any topic
- Play trivia, word games, or give custom recommendations

---

So... what would you like to do today? 😊 Feel free to ask anything or pick a topic to start!`,
      provider: 'LAF Core Engine'
    };
  }

  // 3. Search User Memory Context
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

  // 4. Multi-Provider External AI API Pipeline
  
  // Provider A: User Custom API Key or Gemini Flash LLM API
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
        { timeout: 10000 }
      );

      const candidate = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (candidate && candidate.trim().length > 0) {
        return {
          text: candidate.trim(),
          provider: 'Gemini 1.5 Flash (Ultra-Fast)'
        };
      }
    } catch (err) {
      console.warn('Gemini endpoint failed, switching to external LLM provider:', err.message);
    }
  }

  // Provider B: Unauthenticated Pollinations Multi-Model POST Pipeline
  try {
    const response = await axios.post(
      'https://text.pollinations.ai/',
      {
        messages: formattedMessages,
        temperature: 0.7,
        seed: Math.floor(Math.random() * 1000000)
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
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
        provider: 'LAF Deep Reasoning Engine'
      };
    }
  } catch (err) {
    console.warn('Pollinations POST failed:', err.message);
  }

  // Provider C: Direct GET Pipeline Fallback
  try {
    const encodedPrompt = encodeURIComponent(`${fullSystemPrompt}\n\nUser Question: ${cleanPrompt}\n\nLAF Answer:`);
    const getRes = await axios.get(`https://text.pollinations.ai/${encodedPrompt}?cache=false`, { timeout: 12000 });
    if (getRes.data && typeof getRes.data === 'string' && getRes.data.trim().length > 0) {
      return {
        text: getRes.data.trim(),
        provider: 'LAF Neural Web Engine'
      };
    }
  } catch (e) {
    console.warn('GET API failed:', e.message);
  }

  // Provider D: Natural Human Conversational Fallback (Zero Template Output!)
  return {
    text: `I understand! Regarding your query about **"${cleanPrompt}"**, I am here to help you work through it step-by-step. What specific code, feature, or answer would you like me to generate for you next? 😊`,
    provider: 'LAF Core Engine'
  };
}

module.exports = {
  generateResponse
};
