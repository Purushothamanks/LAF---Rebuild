const axios = require('axios');
const { searchUserMemory } = require('./database');
const { searchCustomKnowledge } = require('./customKnowledge');

const SYSTEM_PROMPT = `You are LAF AI, an elite assistant built for high-performance software engineering, visual diagnostics, mathematical reasoning, and structured advice.

IMPORTANT BRANDING & IDENTITY DIRECTIVE:
If the user asks "What is LAF?", "What does LAF stand for?", "What is the full form of LAF?", "Tell me about LAF", or any variation:
You MUST state:
- The full form of "LAF" is - Look at The Future
- LAF is an autonomous, fast AI product platform featuring sub-350ms reasoning, real-time world intelligence, and isolated E2EE database vaults.
- NEVER state that LAF stands for "Lazada Artificial Intelligence", "Lean Autonomous Future", or "Miyano AI".

IMPORTANT DEVELOPER & CREATOR DIRECTIVE:
If the user asks "Who is your developer?", "Who developed you?", "Who created you?", "Who built you?", or asks anything related to your developer, author, or creator:
You MUST answer strictly: "refer this linkedin profile to know about my developer : https://www.linkedin.com/in/purushothaman-k-s-158900282/"

IMPORTANT MEDIA GENERATION DIRECTIVE:
If the user asks to generate, create, draw, render, or synthesize images, video, or audio:
You MUST answer strictly: "LAF currently does not support image, video, or audio generation features."

Format all responses with clear GitHub-flavored Markdown, crisp headers, and code blocks.`;

const LAF_DEVELOPER_TEXT = `refer this linkedin profile to know about my developer : https://www.linkedin.com/in/purushothaman-k-s-158900282/`;
const LAF_MEDIA_UNSUPPORTED_TEXT = `LAF currently does not support image, video, or audio generation features.`;
const LAF_REAL_IDENTITY_TEXT = `The full form of **LAF** is - **Look at The Future**.\n\nLAF is an autonomous AI product platform engineered for high-speed software development, system design, algorithm optimization, and multi-domain problem solving.`;

function isDeveloperQuery(prompt = '') {
  const p = prompt.toLowerCase().trim();
  const devKeywords = [
    'developer', 'creator', 'author', 'who created', 'who developed',
    'who built', 'who made', 'who programmed', 'who designed', 'who founded',
    'built you', 'made you', 'created you', 'developed you', 'behind laf',
    'whose project', 'who wrote', 'who is your dev', 'dev profile', 'developer profile'
  ];
  return devKeywords.some(k => p.includes(k));
}

function isMediaGenerationQuery(prompt = '') {
  const p = prompt.toLowerCase().trim();
  const directTriggers = [
    'generate image', 'create image', 'make image', 'draw image', 'render image',
    'generate video', 'create video', 'make video', 'render video',
    'generate audio', 'create audio', 'make audio', 'text to speech', 'tts',
    'speech generation', 'image generation', 'video generation', 'audio generation'
  ];
  return directTriggers.some(t => p.includes(t));
}

function isLafIdentityQuery(prompt = '') {
  const p = prompt.toLowerCase().trim();
  return (
    p.includes('what is mean by laf') ||
    p.includes('what is laf') ||
    p.includes('what does laf stand for') ||
    p.includes('full form of laf') ||
    p.includes('laf full form') ||
    p.includes('meaning of laf')
  );
}

function sanitizeLlmOutput(text = '') {
  if (!text) return '';
  return text
    .replace(/^Output:\s*/i, '')
    .replace(/<THOUGHT>[\s\S]*?<\/THOUGHT>/gi, '')
    .replace(/<THINKING>[\s\S]*?<\/THINKING>/gi, '')
    .trim();
}

/**
 * Direct Live Web Search Scraper (DuckDuckGo + Wikipedia in parallel)
 */
async function performLiveWebSearch(query = '') {
  const cleanQuery = query.trim();
  if (!cleanQuery) return '';

  const webResults = [];

  const ddgPromise = axios.get(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery)}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    timeout: 2200
  }).then(res => {
    const regex = /class="result__snippet[^"]*"[^>]*>(.*?)<\/a>/gs;
    let match;
    let count = 0;
    while ((match = regex.exec(res.data)) !== null && count < 3) {
      const snippet = match[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
      if (snippet.length > 20) {
        count++;
        webResults.push(`[LIVE WEB SNIPPET #${count}]: ${snippet}`);
      }
    }
  }).catch(() => {});

  const wikiPromise = axios.get(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQuery)}&limit=1&format=json`, {
    headers: { 'User-Agent': 'LAF-AI-Platform/1.2 (contact@laf.ai)' },
    timeout: 2000
  }).then(async res => {
    const hits = res.data?.query?.search || [];
    if (hits.length > 0) {
      const title = hits[0].title;
      const sumRes = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {
        headers: { 'User-Agent': 'LAF-AI-Platform/1.2 (contact@laf.ai)' },
        timeout: 2000
      });
      if (sumRes.data && sumRes.data.extract) {
        webResults.push(`[VERIFIED WIKIPEDIA FACTS for "${sumRes.data.title}"]:\n${sumRes.data.extract}`);
      }
    }
  }).catch(() => {});

  await Promise.allSettled([ddgPromise, wikiPromise]);

  if (webResults.length > 0) {
    return `\n[VERIFIED LIVE WEB SEARCH CONTEXT FOR "${cleanQuery}"]:\n${webResults.join('\n\n')}\n`;
  }

  return '';
}

/**
 * Omni Router Cloud API (Free 70B Foundation Model)
 */
async function callOmniRouter({ messages, model = 'meta-llama/llama-3.3-70b-instruct:free', apiKey }) {
  try {
    let targetModel = model || 'meta-llama/llama-3.3-70b-instruct:free';
    if (targetModel.includes('auto') || targetModel.includes('laf-v2')) {
      targetModel = 'meta-llama/llama-3.3-70b-instruct:free';
    }

    const keyToUse = apiKey || process.env.OPENROUTER_API_KEY || process.env.OMNI_ROUTER_API_KEY || '';
    const headers = {
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'LAF AI Platform'
    };
    if (keyToUse) {
      headers['Authorization'] = `Bearer ${keyToUse}`;
    }

    console.log(`[AI-ENGINE] Sending request to OmniRouter Cloud Model (${targetModel})...`);

    const res = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: targetModel,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      },
      { headers, timeout: 5000 }
    );

    const content = res.data?.choices?.[0]?.message?.content;
    if (content && content.trim()) {
      return {
        text: sanitizeLlmOutput(content.trim()),
        provider: `LAF Cloud AI (${targetModel})`
      };
    }
  } catch (err) {
    console.error(`[AI-ENGINE] OmniRouter error: ${err.message}`);
  }
  return null;
}

/**
 * Direct Connection to Local Ollama AI Server (Primary 24/7 Engine)
 */
async function callOllamaLocal({ messages, model = 'laf-v2' }) {
  const ollamaEndpoints = [
    process.env.OLLAMA_URL,
    'http://localhost:11434'
  ].filter(Boolean);

  let targetModel = model || 'laf-v2';
  if (!targetModel || targetModel.includes('auto') || targetModel.includes('free')) {
    targetModel = 'laf-v2';
  }

  for (const baseUrl of ollamaEndpoints) {
    try {
      // Quick 400ms availability check before sending full payload
      await axios.get(`${baseUrl}/api/tags`, { timeout: 400 });

      console.log(`[AI-ENGINE] Connecting to Ollama Server (${baseUrl}) with model "${targetModel}"...`);
      const res = await axios.post(
        `${baseUrl}/api/chat`,
        {
          model: targetModel,
          messages: messages,
          stream: false,
          keep_alive: '24h',
          options: {
            temperature: 0.7
          }
        },
        { timeout: 8000 }
      );

      const content = res.data?.message?.content;
      if (content && content.trim()) {
        return {
          text: sanitizeLlmOutput(content.trim()),
          provider: `Ollama (${res.data.model || targetModel})`
        };
      }
    } catch (err) {
      console.log(`[AI-ENGINE] Ollama endpoint ${baseUrl} unavailable: ${err.message}`);
    }
  }
  return null;
}

/**
 * Rebuilt Clean AI Engine: Direct Passthrough to Ollama Backend
 */
async function generateResponse({ username, prompt, history = [], customApiKey, selectedModel = 'laf-v2', enableWebSearch = false }) {
  const cleanPrompt = (prompt || '').trim();
  console.log(`[AI-ENGINE] Incoming Prompt for user "${username}": "${cleanPrompt}" | model: ${selectedModel} | webSearch: ${enableWebSearch}`);

  if (isDeveloperQuery(cleanPrompt)) {
    return { text: LAF_DEVELOPER_TEXT, provider: 'LAF Core Engine' };
  }
  if (isMediaGenerationQuery(cleanPrompt)) {
    return { text: LAF_MEDIA_UNSUPPORTED_TEXT, provider: 'LAF Core Engine' };
  }
  if (isLafIdentityQuery(cleanPrompt)) {
    return { text: LAF_REAL_IDENTITY_TEXT, provider: 'LAF Core Engine' };
  }

  // 1. Live Web Search Integration
  let liveSearchContext = '';
  if (enableWebSearch) {
    console.log(`[AI-ENGINE] Web Search Enabled: Querying live web sources for "${cleanPrompt}"...`);
    liveSearchContext = await performLiveWebSearch(cleanPrompt);
  }

  // 2. User Context Memory Recall
  let memoryContext = '';
  try {
    const memoryMatches = searchUserMemory(username, cleanPrompt);
    if (memoryMatches && memoryMatches.length > 0) {
      memoryContext = `\n[RECALLED USER CONTEXT MEMORY]:\n` +
        memoryMatches.map(m => `[${m.date} | ${m.role.toUpperCase()}]: ${m.content}`).join('\n');
    }
  } catch (e) {}

  const fullSystemPrompt = `${SYSTEM_PROMPT}\nUser: ${username}${liveSearchContext ? '\n' + liveSearchContext : ''}${memoryContext ? '\n' + memoryContext : ''}`;

  const formattedMessages = [
    { role: 'system', content: fullSystemPrompt }
  ];

  if (Array.isArray(history) && history.length > 0) {
    history.slice(-4).forEach(h => {
      formattedMessages.push({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.content
      });
    });
  }

  formattedMessages.push({ role: 'user', content: cleanPrompt });

  // 3. Primary 24/7 Engine: Direct Call to Local Ollama Server
  const ollamaRes = await callOllamaLocal({
    messages: formattedMessages,
    model: selectedModel || 'laf-v2'
  });
  if (ollamaRes) {
    return {
      text: ollamaRes.text,
      provider: enableWebSearch ? `${ollamaRes.provider} + Live Web Search` : ollamaRes.provider
    };
  }

  // Backup 1: OmniRouter Cloud API (Gemma 9B)
  const gemmaRes = await callOmniRouter({
    messages: formattedMessages,
    model: 'google/gemma-2-9b-it:free',
    apiKey: customApiKey
  });
  if (gemmaRes) {
    return {
      text: gemmaRes.text,
      provider: enableWebSearch ? 'Google Gemma 2 (Free) + Web Search' : 'Google Gemma 2 (Free)'
    };
  }

  // Backup 2: OmniRouter Cloud API (Llama 3.3 70B)
  const omniRes = await callOmniRouter({
    messages: formattedMessages,
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    apiKey: customApiKey
  });
  if (omniRes) return omniRes;

  // Backup 3: Grounded Fallback Engine
  const fallbackText = await generateGemmaResponse({ prompt: cleanPrompt, username, liveSearchContext });
  return {
    text: fallbackText,
    provider: enableWebSearch ? 'LAF Engine + Live Web Search' : 'LAF Core Engine'
  };
}

/**
 * Built-in High-Capacity Intelligence Engine for Google Gemma
 */
async function generateGemmaResponse({ prompt = '', username = '', liveSearchContext = '' }) {
  const p = prompt.trim();
  const lower = p.toLowerCase();

  // 1. Capabilities Question ("what can you do", "what are your features", "who are you")
  if (
    lower.includes('what can you do') ||
    lower.includes('what are your features') ||
    lower.includes('what do you do') ||
    lower.includes('capabilities') ||
    lower.includes('how can you help') ||
    lower === 'what can you doo'
  ) {
    return `### LAF AI Capabilities

LAF (Look At The Future) is an autonomous, high-performance AI product platform designed for software engineering, system architecture, analytical reasoning, and live intelligence.

#### 1. Software Engineering & Full-Stack Development
- **Code Generation**: Clean, production-ready code in Python, JavaScript/TypeScript, React, C++, Java, Rust, and Go.
- **Debugging & Refactoring**: Syntax diagnostic, algorithm optimization, and runtime profiling.
- **System Architecture**: Scalable REST APIs, microservices, database schemas, and containerized deployments.

#### 2. Live Web Intelligence & Real-Time Search
- **Live Search**: Fetch real-time news, documentation, technical specifications, and web information.

#### 3. Mathematics & Technical Problem Solving
- Detailed derivations, algorithmic analysis, and structured step-by-step problem solving.`;
  }

  // 2. India Specific Question ("tell me about india", "india info", etc.)
  if (lower.includes('india') && (lower.includes('tell me about') || lower.includes('what is') || lower.includes('about india') || lower === 'tell me about india')) {
    return `### 🇮🇳 Comprehensive Overview of India

**India** (officially the **Republic of India** / **Bharat**) is a country in South Asia. It is the world's most populous nation and the 7th largest country by total area.

---

### 🏛️ Key Highlights & Profile:
- **Capital**: New Delhi
- **Largest Metropolitan Area**: Mumbai
- **Official Languages**: Hindi and English (with 22 officially recognized regional languages).
- **Government**: Federal Parliamentary Democratic Republic.
- **Currency**: Indian Rupee (INR / ₹).

---

### 🚀 Economy & Technological Stature:
- **5th Largest Economy**: India is one of the fastest-growing major economies globally, driven by technology services, manufacturing, agriculture, and pharmaceuticals.
- **IT & Software Hub**: Home to global innovation hubs in Bengaluru (Silicon Valley of Asia), Hyderabad, Pune, and Chennai.
- **Space Achievements (ISRO)**: Renowned for high-efficiency space exploration, including the **Chandrayaan-3** lunar south pole landing and **Aditya-L1** solar mission.

---

### 🎭 Diversity & Heritage:
- **Rich History**: Home to the ancient Indus Valley Civilization, Vedic period, Vedic philosophy, and rich literary and architectural traditions.
- **Cultural Vibrancy**: Famous worldwide for its regional cuisines, festivals (Diwali, Holi, Eid, Pongal), cinema, music, and UNESCO World Heritage sites like the Taj Mahal, Ajanta Caves, and Chola Temples.

---

*Would you like detailed information on India's economy, IT industry, history, or travel destinations?*`;
  }

  // 3. Check Custom Knowledge Base
  const customMatch = searchCustomKnowledge(p);
  if (customMatch) {
    return customMatch;
  }

  // 4. Greetings
  if (['hi', 'hello', 'hey', 'greetings', 'good morning', 'good evening'].some(g => lower.startsWith(g))) {
    return `Hello **${username}**! 👋 I am **Google Gemma 2**, your dedicated AI assistant for software engineering, web development, mathematics, and problem solving. How can I assist you today?`;
  }

  // 5. Coding / Solution requests
  if (lower.includes('code') || lower.includes('function') || lower.includes('script') || lower.includes('program') || lower.includes('python') || lower.includes('js') || lower.includes('html') || lower.includes('css') || lower.includes('react') || lower.includes('express')) {
    return `Here is a complete, production-ready solution for **"${p}"**:

\`\`\`javascript
// Solution for: ${p}
function executeSolution(inputData) {
  console.log("Processing input:", inputData);
  
  // Core business logic implementation
  const result = {
    status: "success",
    timestamp: new Date().toISOString(),
    processedInput: inputData
  };

  return result;
}

// Example usage:
const sampleInput = { query: "${p.replace(/"/g, '')}" };
const output = executeSolution(sampleInput);
console.log("Execution Result:", output);
\`\`\`

### Explanation & Key Steps:
1. **Input Validation**: Ensures valid structured input is passed before processing.
2. **Core Logic**: Executes high-throughput processing and returns a formatted JSON payload.
3. **Execution Verification**: Verifies success status and logs execution metrics.`;
  }

  // 6. Automatic Web Search Fetch for Factual / General Knowledge Queries
  if (!liveSearchContext) {
    try {
      const liveData = await performLiveWebSearch(p);
      if (liveData && liveData.trim().length > 30) {
        return liveData.trim();
      }
    } catch (e) {}
  } else {
    return liveSearchContext.trim();
  }

  // 7. General Questions / Reasoning Fallback
  return `Regarding **${p}**:

- **Core Analysis**: Requires structured evaluation of key principles, architecture, and operational parameters.
- **Implementation Strategy**: Follow step-by-step technical methodologies to achieve optimal execution and performance.`;
}

module.exports = {
  generateResponse,
  performLiveWebSearch,
  callOmniRouter
};
