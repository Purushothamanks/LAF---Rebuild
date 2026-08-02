const axios = require('axios');
const { searchUserMemory } = require('./database');

const SYSTEM_PROMPT = `You are LAF (L - Look, A - At, F - Future: "Look At the Future"), an advanced, ultra-fast AI assistant powered by Ollama and Llama 3.2.

OPERATIONAL RULES:
1. NATURAL CONVERSATION: Respond warmly, accurately, and intelligently like ChatGPT / DeepSeek.
2. NO ROBOTIC TEMPLATES: Never output system debug logs or boilerplate phrases like "I've analyzed your prompt regarding...".
3. GREETINGS & INTROS: For casual greetings ("hello dudee", "hi bro", "hey laf"), respond warmly and ask how you can assist them today.
4. ACCURACY: Provide clean, bug-free, high-performance code, logical explanations, and detailed answers in Markdown format.`;

/**
 * Integrated Ollama & Multi-Provider AI Reasoning Engine for LAF
 */
async function generateResponse({ username, prompt, history = [], customApiKey }) {
  const cleanPrompt = (prompt || '').trim();
  const lowerPrompt = cleanPrompt.toLowerCase();

  // 1. Natural Greeting Intent Matching
  if (/^(hello|hi|hey|greetings|yo|sup|hola|namaste)(\s+(dudee?|dude|bro|laf|there|friend|man))?!?$/i.test(cleanPrompt)) {
    const naturalGreetings = [
      `Hello ${username}! 😊 How can I help you today? Whether you need help with coding, content, research, or brainstorming ideas, I'm here for you!`,
      `Hey ${username}! Great to chat with you. What would you like to build, analyze, or explore today?`,
      `Hello there! I'm LAF. How can I assist you with your projects or questions today?`
    ];
    return {
      text: naturalGreetings[Math.floor(Math.random() * naturalGreetings.length)],
      provider: 'LAF Ollama Engine'
    };
  }

  // 2. Capabilities Intent Matching ("What can you do?")
  if (
    lowerPrompt.includes('what can you do') ||
    lowerPrompt.includes('what are your capabilities') ||
    lowerPrompt.includes('who are you') ||
    lowerPrompt.includes('what do you do') ||
    lowerPrompt.includes('help me with')
  ) {
    return {
      text: `Hello ${username}! I'm **LAF** ("Look At the Future"), powered by **Ollama & Llama 3.2**. Here's a rundown of what I can do for you:

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
      provider: 'LAF Ollama Core Engine'
    };
  }

  // 3. User Memory Context Search
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

  // 4. Provider 1: Local / Host Ollama Engine (Llama 3.2)
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
        { timeout: 15000 }
      );

      const content = ollamaRes.data?.message?.content;
      if (content && content.trim().length > 0) {
        return {
          text: content.trim(),
          provider: 'LAF Ollama Engine (Llama 3.2)'
        };
      }
    } catch (e) {
      // Try next endpoint quietly
    }
  }

  // 5. Provider 2: Gemini API Backup (If API Key provided)
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
          provider: 'Gemini 1.5 Flash'
        };
      }
    } catch (err) {
      console.warn('Gemini endpoint failed:', err.message);
    }
  }

  // 6. Provider 3: Pollinations API Fallback
  try {
    const response = await axios.post(
      'https://text.pollinations.ai/',
      {
        messages: formattedMessages,
        temperature: 0.7
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 12000
      }
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
        provider: 'LAF Cloud Neural Engine'
      };
    }
  } catch (err) {
    console.warn('Pollinations failed:', err.message);
  }

  // Fallback Response
  return {
    text: `Hello ${username}! Regarding your prompt **"${cleanPrompt}"**: I am ready to help you analyze or code this solution step-by-step. What specific module should we build next? 😊`,
    provider: 'LAF Core Engine'
  };
}

module.exports = {
  generateResponse
};
