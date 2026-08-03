const axios = require('axios');
const { searchUserMemory } = require('./database');

const SYSTEM_PROMPT = `You are LAF AI, an elite, human-minded AI assistant built for high-performance software engineering, visual system diagnostics, and structured advice.

Format ALL your responses cleanly using this exact structure:
1. **Introduction**: A clear, direct 1-2 sentence overview setting the context and introducing the roadmap or solution.
2. **Numbered Step-by-Step Sections**:
   - Use numbered headings for each step (e.g. ### 1. Deconstruct the Job Description: *Prerequisite for targeted preparation*).
   - Include a short subtitle/tagline right below the title explaining the core purpose.
   - Separate every numbered section with double line breaks for maximum readability.
   - Use bold key terms (**STAR Method**, **Elevator Pitch**) and structured sub-bullet points for details (e.g. - **Situation:** ..., - **Task:** ..., - **Action:** ..., - **Result:** ...).
3. **Summary / Quick Checklist Table**:
   - Conclude guides, processes, or advice with a clean Markdown Table (e.g., | Phase | What to Focus On |) for fast reference.
4. **Code Blocks**:
   - Enclose all code snippets inside clean triple-backtick markdown blocks with explicit language tags (\`\`\`js, \`\`\`python, \`\`\`bash).

Maintain high visual clarity, comfortable spacing, and an encouraging professional tone.`;

/**
 * Checks if user prompt is a generic code request missing a language specification.
 */
function isGenericCodeRequest(prompt = '') {
  const p = prompt.toLowerCase();
  
  // Keywords indicating a request for code
  const hasCodeIntent = p.includes('code') || p.includes('script') || p.includes('program') || p.includes('function') || p.includes('write code') || p.includes('give me code') || p.includes('generate code');
  
  if (!hasCodeIntent) return false;

  // Check if explicit language or technology stack is already specified
  const explicitLanguages = [
    'javascript', 'js', 'python', 'py', 'typescript', 'ts', 'java',
    'c++', 'cpp', 'c#', 'csharp', 'golang', 'go', 'rust', 'html', 'css',
    'sql', 'php', 'ruby', 'swift', 'kotlin', 'bash', 'shell', 'docker', 'yaml'
  ];

  const mentionsLanguage = explicitLanguages.some(lang => p.includes(lang));
  
  // If user asked for code but didn't mention any language, prompt for clarification!
  return !mentionsLanguage;
}

/**
 * High-Speed Direct Passthrough Engine to Ollama AI Models
 */
async function generateResponse({ username, prompt, history = [], customApiKey }) {
  const cleanPrompt = (prompt || '').trim();
  console.log(`[AI-ENGINE] Fast Processing prompt for user "${username}": "${cleanPrompt}"`);

  // 1. Generic Code Request Interception: Ask for purpose & language preference
  if (isGenericCodeRequest(cleanPrompt)) {
    return {
      text: `Before I generate the code, could you please specify your **preferred programming language** (e.g. *JavaScript*, *Python*, *Go*, *C++*, *HTML/CSS*) and the **main purpose / target framework** for your project? 😊`,
      provider: 'LAF Assistant'
    };
  }

  const lower = cleanPrompt.toLowerCase().replace(/[^\w\s]/gi, '');

  // 2. Check User Memory Context
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
  // 3. DIRECT PASSTHROUGH TO ULTRA-FAST OLLAMA MODELS
  // -------------------------------------------------------------
  const ollamaEndpoints = [
    'http://172.17.0.1:11434/api/chat',
    'http://127.0.0.1:11434/api/chat',
    'http://host.docker.internal:11434/api/chat'
  ];

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
              num_predict: 1024,
              temperature: 0.6,
              top_k: 20,
              top_p: 0.9,
              num_thread: 4
            }
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 25000
          }
        );

        const content = ollamaRes.data?.message?.content;
        if (content && content.trim().length > 0) {
          const duration = ((Date.now() - start) / 1000).toFixed(2);
          console.log(`[AI-ENGINE] SUCCESS from ${modelName} in ${duration}s!`);
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
  // 4. Backup: Gemini API
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
  // 5. Guaranteed Non-Crashing Assistant Response
  // -------------------------------- agreed
  return {
    text: `Hello ${username}! I received your request: "${cleanPrompt}". I am here to help you with coding, system design, or diagnostics. Please specify your question details!`,
    provider: 'LAF AI Cluster'
  };
}

module.exports = {
  generateResponse
};
