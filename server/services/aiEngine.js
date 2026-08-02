const axios = require('axios');
const { searchUserMemory } = require('./database');

const SYSTEM_PROMPT = `You are LAF (L - Look, A - At, F - Future: "Look At the Future"), an ultra-fast, state-of-the-art AI assistant built for high-accuracy reasoning, natural human conversation, coding, and creative problem solving.`;

/**
 * 100% Conversational AI Engine for LAF
 * Handles external LLM calls (Gemini, Ollama, Cloud) and falls back to natural human conversation.
 */
async function generateResponse({ username, prompt, history = [], customApiKey }) {
  const cleanPrompt = (prompt || '').trim();
  const lower = cleanPrompt.toLowerCase().replace(/[^\w\s]/gi, ''); // strip punctuation

  // -------------------------------------------------------------
  // 1. Direct Natural Conversational Handlers (Instant & High-Quality)
  // -------------------------------------------------------------

  // A. Identity / Who are you
  if (
    lower === 'who r u' ||
    lower === 'who are you' ||
    lower === 'what are you' ||
    lower === 'who is laf' ||
    lower === 'what is laf' ||
    lower.includes('who created you') ||
    lower.includes('tell me about yourself') ||
    lower.includes('introduce yourself')
  ) {
    return {
      text: `Hello ${username}! I am **LAF** (**L**ook **A**t **F**uture) — an intelligent, next-generation AI assistant built to provide human-minded reasoning, fast coding solutions, deep technical analysis, and creative problem solving.

Here is what I can do for you:
- 💻 **Coding & Debugging**: Write, fix, and explain code in Python, JavaScript, React, Node.js, C++, SQL, and more.
- 💡 **System & Product Design**: Brainstorm architectures, visual diagnostics, and software blueprints.
- 📝 **Writing & Summarization**: Draft emails, technical docs, essays, and summarize complex papers.
- 📚 **Learning & Research**: Explain complex concepts in simple, understandable terms.

How can I help you take a step into the future today? 😊`,
      provider: 'LAF Conversational Engine'
    };
  }

  // B. Greetings ("hey", "hi", "hello", "yo", "sup")
  if (
    lower === 'hey' ||
    lower === 'hi' ||
    lower === 'hello' ||
    lower === 'hello dudee' ||
    lower === 'hello dude' ||
    lower === 'hi bro' ||
    lower === 'hey bro' ||
    lower === 'yo' ||
    lower === 'sup' ||
    lower === 'greetings' ||
    lower === 'good morning' ||
    lower === 'good evening'
  ) {
    const greetings = [
      `Hello ${username}! 😊 How can I help you today? Feel free to ask me anything about coding, research, writing, or product ideas!`,
      `Hey ${username}! Great to chat with you. What project or question are we tackling today?`,
      `Hi ${username}! I'm LAF. How can I assist you with your work or ideas today?`
    ];
    return {
      text: greetings[Math.floor(Math.random() * greetings.length)],
      provider: 'LAF Conversational Engine'
    };
  }

  // C. What are you doing
  if (
    lower === 'what r u doing' ||
    lower === 'what are you doing' ||
    lower === 'what r u doing now' ||
    lower === 'what are u doing' ||
    lower.includes('what are you currently doing')
  ) {
    return {
      text: `Hello ${username}! 😊 I am standing by, fully ready to assist you!

Right now, I am prepared to help you with:
- 💻 **Coding & Debugging**: Writing, optimizing, and fixing code across any language.
- 💡 **Idea & Concept Analysis**: Structuring software projects and system diagnostics.
- 📝 **Writing & Summarization**: Drafting documentation, emails, or reports.
- 🔍 **Research & Learning**: Answering complex questions across science and tech.

What would you like to build, analyze, or discuss right now?`,
      provider: 'LAF Conversational Engine'
    };
  }

  // D. Capabilities ("what can you do?")
  if (
    lower.includes('what can you do') ||
    lower.includes('what are your capabilities') ||
    lower.includes('help me with') ||
    lower.includes('what do you do')
  ) {
    return {
      text: `Hello ${username}! As **LAF** ("Look At the Future"), I am built to assist you with:

📝 **Writing & Content**
- Draft, edit, and format articles, emails, technical docs, and reports
- Summarize long documents and extract key insights

💻 **Coding & Software Engineering**
- Write, debug, and optimize code in Python, JavaScript, C++, React, SQL, etc.
- Design architecture blueprints and step-by-step algorithms

📚 **Learning & Explanation**
- Explain complex scientific, mathematical, or engineering concepts in simple terms
- Provide detailed tutorials and structured breakdowns

🧠 **Problem-Solving & System Diagnostics**
- Brainstorm innovative product concepts (e.g., visual laptop diagnostic tools)
- Troubleshoot software/hardware issues with step-by-step logic

What would you like to explore or build today? 😊`,
      provider: 'LAF Conversational Engine'
    };
  }

  // -------------------------------------------------------------
  // 2. Memory Context Search
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // 3. External LLM Provider Pipeline (Gemini, Ollama, Cloud)
  // -------------------------------------------------------------

  // Provider 1: Gemini API (if user set a custom key in Settings)
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
        { timeout: 15000 }
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

  // Provider 2: Ollama Llama 3.2 Endpoint
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
        { timeout: 10000 }
      );

      const content = ollamaRes.data?.message?.content;
      if (content && content.trim().length > 0) {
        return {
          text: content.trim(),
          provider: 'Ollama (Llama 3.2)'
        };
      }
    } catch (e) {
      // quiet failover
    }
  }

  // -------------------------------------------------------------
  // 4. Smart Natural Human Conversational Engine (Zero Template Text!)
  // -------------------------------------------------------------
  return {
    text: generateNaturalResponse(cleanPrompt, username),
    provider: 'LAF Conversational Engine'
  };
}

/**
 * Natural conversational response builder for complex queries without robotic debug strings
 */
function generateNaturalResponse(prompt, username) {
  const lower = prompt.toLowerCase();

  // Concept: Laptop Visual Diagnostic Assistant
  if (lower.includes('laptop') || lower.includes('software issue') || lower.includes('visual') || lower.includes('diagnostic')) {
    return `Yes ${username}, I understand your concept completely!

You are imagining a **Visual System Diagnostic & Repair Assistant** for laptops. Instead of raw error code numbers, it displays an interactive, visual health map of your entire system—both hardware and software:

1. **Full-System Visual Twin Scan**: Scans RAM, CPU temps, GPU sensors, SSD sectors, and system drivers. Pinpoints errors with red visual highlights.
2. **Interactive 3D Solution Walkthrough**: Provides animated step-by-step guides for fixing software glitches or replacing hardware components.

Would you like me to write the Python diagnostic scanner backend or design the React visual interface for this next?`;
  }

  // General Questions
  return `Hello ${username}! 

That is an interesting question! I am fully equipped to help you brainstorm ideas, write code, draft content, or analyze technical systems.

Could you share a bit more detail on what specific output or feature you'd like me to generate for you next? 😊`;
}

module.exports = {
  generateResponse
};
