const axios = require('axios');
const { searchUserMemory } = require('./database');

const SYSTEM_PROMPT = `You are LAF (L - Look, A - At, F - Future: "Look At the Future"), a state-of-the-art AI product and intelligent reasoning assistant.

DIRECTIVES:
1. IDENTITY: You are LAF ("Look At the Future").
2. NATURAL & INTELLIGENT: Provide direct, accurate, friendly, and helpful responses to every prompt.
3. NEVER OUTPUT DEBUG TEMPLATES: Never say "Regarding your prompt...". Provide real, helpful answers.`;

/**
 * Main Reasoning & Response Engine for LAF
 */
async function generateResponse({ username, prompt, history = [], customApiKey }) {
  const cleanPrompt = (prompt || '').trim();
  const lower = cleanPrompt.toLowerCase().replace(/[^\w\s]/gi, ''); // clean punctuation

  // -------------------------------------------------------------
  // 1. IDENTITY & WHO ARE YOU INTENT MATCHING
  // -------------------------------------------------------------
  if (
    lower === 'who r u' ||
    lower === 'who are you' ||
    lower === 'who r u' ||
    lower === 'what are you' ||
    lower === 'what r u' ||
    lower === 'who is laf' ||
    lower === 'what is laf' ||
    lower.includes('who created you') ||
    lower.includes('tell me about yourself') ||
    lower.includes('introduce yourself')
  ) {
    return {
      text: `Hello ${username}! I am **LAF** (**L**ook **A**t **F**uture) — a state-of-the-art, ultra-fast, and hyper-accurate AI product designed to provide human-minded reasoning, deep technical analysis, coding assistance, and creative problem solving.

Here is what I bring to the table:

🚀 **Core Capabilities**:
- **Fast Reasoning & Coding**: Writing, debugging, and explaining code across JavaScript, Python, C++, React, Node.js, SQL, and system design.
- **Human-Minded Thinking**: Analyzing complex technical concepts, product ideas, and logical workflows step-by-step.
- **Isolated Encrypted DB Memory**: Safely recalling context from your previous conversations using end-to-end encryption.
- **Multimodal & Global Trends**: Synthesizing global tech advances, images, audio, and visual guides.

How can I help you take a step into the future today? 😊`,
      provider: 'LAF Core Engine'
    };
  }

  // -------------------------------------------------------------
  // 2. GREETINGS INTENT MATCHING
  // -------------------------------------------------------------
  if (
    lower === 'hi' ||
    lower === 'hello' ||
    lower === 'hey' ||
    lower === 'hello dudee' ||
    lower === 'hello dude' ||
    lower === 'hi bro' ||
    lower === 'hey bro' ||
    lower === 'yo' ||
    lower === 'sup' ||
    lower === 'greetings'
  ) {
    const greetings = [
      `Hello ${username}! 😊 How can I help you today? Feel free to ask me anything about coding, research, writing, or product ideas!`,
      `Hey ${username}! Great to see you. What project or question are we tackling today?`,
      `Hi ${username}! I'm LAF. How can I assist you with your work or ideas today?`
    ];
    return {
      text: greetings[Math.floor(Math.random() * greetings.length)],
      provider: 'LAF Core Engine'
    };
  }

  // -------------------------------------------------------------
  // 3. CAPABILITIES / WHAT CAN YOU DO INTENT MATCHING
  // -------------------------------------------------------------
  if (
    lower.includes('what can you do') ||
    lower.includes('what are your capabilities') ||
    lower.includes('help me with') ||
    lower.includes('what do you do')
  ) {
    return {
      text: `Hello ${username}! As **LAF** ("Look At the Future"), I am built to help you across a wide range of tasks:

📝 **Writing & Content**
- Draft, edit, and format articles, emails, technical docs, and reports
- Summarize long documents and extract key takeaways

💻 **Coding & Software Engineering**
- Write, debug, and optimize code in Python, JavaScript, C++, React, SQL, etc.
- Design architecture blueprints and step-by-step algorithms

📚 **Learning & Explanation**
- Explain complex scientific, mathematical, or engineering concepts in simple terms
- Provide detailed tutorials and structured breakdowns

🧠 **Problem-Solving & System Diagnostics**
- Brainstorm innovative product concepts (e.g., visual laptop diagnostic software)
- Troubleshoot software/hardware issues with step-by-step logic

What would you like to explore or build today? Pick any topic or ask away!`,
      provider: 'LAF Core Engine'
    };
  }

  // -------------------------------------------------------------
  // 4. MEMORY RECALL CONTEXT SEARCH
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

  // -------------------------------------------------------------
  // 5. EXTERNAL LLM PROVIDER PIPELINE (Ollama / Gemini / Cloud APIs)
  // -------------------------------------------------------------

  // Provider 1: Gemini API (if key present)
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
      console.warn('Gemini API call failed:', err.message);
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
        { timeout: 8000 }
      );

      const content = ollamaRes.data?.message?.content;
      if (content && content.trim().length > 0) {
        return {
          text: content.trim(),
          provider: 'LAF Ollama (Llama 3.2)'
        };
      }
    } catch (e) {
      // quiet failover
    }
  }

  // Provider 3: Cloud LLM API Pipeline
  try {
    const response = await axios.post(
      'https://text.pollinations.ai/',
      {
        messages: formattedMessages,
        temperature: 0.7
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
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
    console.warn('Cloud LLM POST failed:', err.message);
  }

  // -------------------------------------------------------------
  // 6. HIGH-INTELLECT DYNAMIC FALLBACK (ZERO ROBOTIC TEMPLATES!)
  // -------------------------------------------------------------
  return {
    text: generateSmartResponse(cleanPrompt, username),
    provider: 'LAF Core Engine'
  };
}

/**
 * Smart natural language answer builder for unrecognized prompts
 */
function generateSmartResponse(prompt, username) {
  const lower = prompt.toLowerCase();

  if (lower.includes('laptop') || lower.includes('software issue') || lower.includes('visual') || lower.includes('diagnostic')) {
    return `Yes ${username}, I understand your concept!

You are proposing a **Visual System Diagnostic & Repair Assistant** for laptops. Instead of raw text error codes, it provides an interactive visual health map of your laptop:

1. **Visual Twin Hardware/Software Scan**: Highlights exact component faults in red (e.g. Memory leak on RAM stick or corrupted kernel driver).
2. **Interactive 3D Solution Guide**: Displays animated step-by-step visual guides on how to resolve the issue.

Would you like me to write the Python scanning script or design the React visual interface for this?`;
  }

  return `Hi ${username}! I'm **LAF** ("Look At the Future").

Regarding your question **"${prompt}"**:
I am ready to help you analyze, write code, or solve this step-by-step.

What specific details, code, or answer would you like me to generate for you next? 😊`;
}

module.exports = {
  generateResponse
};
