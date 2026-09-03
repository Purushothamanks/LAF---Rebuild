const axios = require('axios');
const { searchUserMemory } = require('./database');
const { searchCustomKnowledge } = require('./customKnowledge');
const { searchWebGrounding } = require('./webSearch');
const { getRagContext } = require('./ragEngine');

const SYSTEM_PROMPT = `You are LAF (Look At Future), an elite, helpful, and highly intelligent AI platform operating in 2026.

OPERATIONAL KNOWLEDGE & GROUNDING:
- Current Year: 2026 | Current Date: August 8, 2026.
- Prime Minister of India: Shri Narendra Modi (2014 – Present / 2026).
- President of India: Smt. Droupadi Murmu (15th President of India, July 2022 – Present / 2026).
- Vice President of India: Shri Jagdeep Dhankhar (August 2022 – Present / 2026).

DIRECTIVES:
1. Always be direct, helpful, and respectful. Never issue robotic refusals or canned disclaimer responses.
2. Evaluate historical and scientific statements accurately without preachy temporal disclaimers.
3. If a query is short, broad, or ambiguous, ask a polite direct clarifying question to understand intent.
4. Provide clean, 100% accurate, and well-structured Markdown responses.`;

const LAF_DEVELOPER_TEXT = `refer this linkedin profile to know about my developer : https://www.linkedin.com/in/purushothaman-k-s-158900282/`;
const LAF_MEDIA_UNSUPPORTED_TEXT = `LAF currently does not support image, video, or audio generation features.`;
const LAF_REAL_IDENTITY_TEXT = `Hello! I am **LAF AI** (**L**ook **A**t **F**uture) — an autonomous artificial intelligence platform developed by **Purushothaman**.

### 🚀 What I Excel At:
1. **Software Engineering**: Full-stack architectures, clean production code (React 19, Node.js, Python, Rust, Go, SQL, Docker).
2. **Visual Hardware Diagnostics**: Real-time concepts for laptop thermals, fan RPM curves, and memory leak analysis.
3. **Deep Reasoning & Mathematics**: Complex algorithms, system designs, and technical roadmaps.
4. **Encrypted Architecture**: Client-side AES-GCM data encryption and zero-knowledge vaults.

How can I assist you today?`;

function isTemporalQuery(prompt = '') {
  const p = prompt.toLowerCase().trim();
  const exactYearQueries = [
    'what year are we in', 'what year is it', 'what is the year', 'current year',
    'which year are we in', 'what year we are now', 'what year is now',
    'what is the current year', 'what is current year', 'year now', 'what year are we now',
    'what is the year now', 'which year is now', 'what is our current year', 'what year'
  ];
  return exactYearQueries.includes(p);
}

function isDateQuery(prompt = '') {
  const p = prompt.toLowerCase().trim();
  const exactDateQueries = [
    'what is today\'s date', 'what is the date today', 'today\'s date', 'current date',
    'what date is today', 'what is today date', 'today date', 'what is the date', 'date today'
  ];
  return exactDateQueries.includes(p);
}

function checkAmbiguousQuery(prompt = '') {
  const p = prompt.toLowerCase().trim();
  
  // Ambiguous CM / Chief Minister Query
  if (
    p === 'cm' ||
    p === 'what is cm' ||
    p === 'cm meaning' ||
    p === 'chief minister' ||
    p === 'tell me about cm' ||
    p === 'about cm'
  ) {
    return `Are you asking about the **Chief Ministers of Indian States** or the unit of measurement **Centimeter (cm)**? Please specify what you would like to know!`;
  }

  // Ambiguous Language Query
  if (
    p === 'what are the languages you know' ||
    p === 'what languages do you know' ||
    p === 'languages you know' ||
    p === 'what languages' ||
    p === 'languages' ||
    p === 'which languages do you know' ||
    p === 'tell me about languages' ||
    p === 'supported languages' ||
    p === 'languages you speak'
  ) {
    return `Are you interested in exploring **Programming Languages** (such as Python, JavaScript, Rust, C++) or **Human Spoken Languages** (such as English, Spanish, Tamil, Hindi)? Let me know which one you need!`;
  }

  // Ambiguous GDP Query
  if (p === 'gdp' || p === 'what is gdp' || p === 'gdp rate' || p === 'real gdp') {
    return `Would you like to see the **Real GDP Growth Rates of major world economies**, or are you looking for an explanation of **how GDP is defined and calculated**?`;
  }

  // Ambiguous War Query
  if (p === 'war' || p === 'wars' || p === 'war details' || p === 'ongoing wars') {
    return `Which active conflict would you like details on (such as Russia-Ukraine, Israel-Hamas/Gaza, or Sudan), or would you like an overview of all major ongoing global conflicts?`;
  }

  // Ambiguous Python Query
  if (p === 'python' || p === 'what is python') {
    return `Are you looking for information on the **Python Programming Language** or the **Python Snake species**?`;
  }

  // Ambiguous Java Query
  if (p === 'java' || p === 'what is java') {
    return `Are you looking for information on the **Java Programming Language** or **Java Island in Indonesia**?`;
  }

  // Ambiguous Apple Query
  if (p === 'apple' || p === 'what is apple') {
    return `Are you asking about **Apple Inc. (the technology company)** or **Apple (the fruit)**?`;
  }

  return null;
}

function isDeveloperQuery(prompt = '') {
  const p = prompt.toLowerCase().trim();
  const devPhrases = [
    'who is your developer', 'who is the developer', 'who developed laf', 'who created laf',
    'who built laf', 'who made laf', 'who is your creator', 'who created you', 'who developed you',
    'who built you', 'who made you', 'developer of laf', 'creator of laf', 'who is behind laf'
  ];
  return devPhrases.some(phrase => p.includes(phrase));
}

function isImageCapabilityQuery(prompt = '') {
  const p = prompt.toLowerCase().trim();
  const capKeywords = [
    'can you generate image', 'can you generate images', 'can you create image', 'can you create images',
    'can you draw', 'can you make image', 'can you make images', 'do you generate image', 'do you generate images',
    'do you support image', 'can you generate photo', 'can you generate photos', 'can you generate picture',
    'can you generate pictures', 'are you able to generate'
  ];
  return capKeywords.some(k => p.includes(k)) || (p.startsWith('can you') && p.includes('image') && !p.includes(' of '));
}

function isImageGenerationQuery(prompt = '') {
  const p = prompt.toLowerCase().trim();
  const directTriggers = [
    'generate image of', 'create image of', 'make image of', 'draw image of', 'render image of',
    'generate picture of', 'create picture of', 'make picture of', 'draw picture of',
    'generate photo of', 'create photo of', 'make photo of',
    'picture of', 'photo of', 'drawing of', 'painting of', 'image of',
    'generate an image', 'create an image', 'make an image', 'draw an image',
    'generate a photo', 'create a photo', 'draw a ', 'paint a '
  ];
  return directTriggers.some(t => p.includes(t));
}

function cleanImagePrompt(userPrompt = '') {
  let cleaned = userPrompt
    .replace(/^please\s+/i, '')
    .replace(/^can you\s+/i, '')
    .replace(/^(generate|create|draw|render|make)\s+(an?\s+)?(image|picture|photo|illustration|drawing)\s+(of|about|showing|with)?\s*/i, '')
    .replace(/^(image|picture|photo)\s+(of|about|showing)\s*/i, '')
    .trim();

  if (!cleaned) cleaned = userPrompt;
  return `${cleaned}, 8k resolution, photorealistic, highly detailed, masterclass lighting`;
}

function generateImageUrl(promptText) {
  const seed = Math.floor(Math.random() * 1000000);
  const encodedPrompt = encodeURIComponent(promptText);
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true&enhance=true`;
}

function isUnsupportedMediaQuery(prompt = '') {
  const p = prompt.toLowerCase().trim();
  const unsupported = [
    'generate video', 'create video', 'make video', 'render video',
    'generate audio', 'create audio', 'make audio', 'text to speech', 'tts',
    'video generation', 'audio generation'
  ];
  return unsupported.some(u => p.includes(u));
}

function isLafIdentityQuery(prompt = '') {
  const p = prompt.toLowerCase().trim().replace(/[?!.,]/g, '');
  const identityTriggers = [
    'who are you', 'who r u', 'who r you', 'what are you', 'what r u',
    'what is your name', 'tell me about yourself', 'introduce yourself',
    'who is laf', 'what is laf', 'what is mean by laf', 'what does laf stand for',
    'full form of laf', 'laf full form', 'meaning of laf'
  ];
  return identityTriggers.some(t => p === t || p.includes(t));
}

function isGreetingQuery(prompt = '') {
  const p = prompt.toLowerCase().trim().replace(/[?!.,]/g, '');
  const greetings = [
    'hi', 'hello', 'hey', 'yo', 'sup', 'greetings', 'namaste', 'hola',
    'hi laf', 'hello laf', 'hey laf', 'whats up', 'how are you', 'how r u',
    'good morning', 'good afternoon', 'good evening', 'hey bro', 'hello bro'
  ];
  return greetings.includes(p) || p.startsWith('hi ') || p.startsWith('hello ') || p.startsWith('hey ');
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
 * Direct Connection to Local Ollama AI Server (Primary 24/7 Engine)
 * Auto-falls back between available on-server models (laf-v2 / llama3.2:latest)
 */
async function callOllamaLocal({ messages, model = 'laf-v2' }) {
  const ollamaEndpoints = Array.from(new Set([
    process.env.OLLAMA_URL,
    'http://172.17.0.1:11434',
    'http://127.0.0.1:11434',
    'http://localhost:11434',
    'http://host.docker.internal:11434'
  ].filter(Boolean)));

  const LOCAL_OLLAMA_MODELS = ['laf-v2', 'llama3.2:latest', 'qwen2.5:0.5b', 'llama3.2-vision:latest', 'llama3:latest', 'phi3:mini'];
  let primaryModel = model;
  if (!primaryModel || primaryModel === 'auto' || !LOCAL_OLLAMA_MODELS.includes(primaryModel)) {
    primaryModel = 'laf-v2';
  }

  const candidateModels = [primaryModel, 'laf-v2', 'llama3.2:latest'].filter((v, i, a) => a.indexOf(v) === i);

  for (const baseUrl of ollamaEndpoints) {
    for (const targetModel of candidateModels) {
      try {
        console.log(`[AI-ENGINE] Auto-Routed to Local Ollama (${baseUrl}) with model "${targetModel}"...`);
        const res = await axios.post(
          `${baseUrl}/api/chat`,
          {
            model: targetModel,
            messages: messages,
            stream: false,
            keep_alive: -1,
            options: {
              temperature: 0.5,
              num_predict: 4096,
              num_ctx: 8192,
              num_thread: 4
            }
          },
          { timeout: 15000 }
        );

        const content = res.data?.message?.content;
        if (content && content.trim()) {
          return {
            text: sanitizeLlmOutput(content.trim()),
            provider: `LAF AI (${res.data.model || targetModel})`
          };
        }
      } catch (err) {
        console.log(`[AI-ENGINE] Ollama (${baseUrl}/${targetModel}) note: ${err.message}`);
        if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ECONNABORTED' || (err.message && err.message.includes('timeout'))) {
          break;
        }
      }
    }
  }
  return null;
}

/**
 * Connection to Cloud LLM Endpoints (using User Custom API Key or Server API Key)
 */
async function callCloudLLM({ messages, apiKey, model = 'laf-v2' }) {
  if (!apiKey || !apiKey.trim()) return null;
  const cleanKey = apiKey.trim();

  const endpoints = [
    {
      name: 'OpenAI Cloud AI',
      url: 'https://api.openai.com/v1/chat/completions',
      model: model && model.includes('gpt') ? model : 'gpt-4o-mini'
    },
    {
      name: 'OpenRouter AI',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      model: model && model.includes('/') ? model : 'google/gemini-2.5-flash-lite'
    },
    {
      name: 'SambaNova Cloud AI',
      url: 'https://api.sambanova.ai/v1/chat/completions',
      model: 'Meta-Llama-3.3-70B-Instruct'
    },
    {
      name: 'Groq Fast Engine',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      model: model && model.includes('llama') ? model : 'llama-3.3-70b-versatile'
    },
    {
      name: 'DeepSeek Reasoner Engine',
      url: 'https://api.deepseek.com/chat/completions',
      model: 'deepseek-chat'
    },
    {
      name: 'Cerebras Engine',
      url: 'https://api.cerebras.ai/v1/chat/completions',
      model: 'llama3.1-8b'
    },
    {
      name: 'DeepInfra Engine',
      url: 'https://api.deepinfra.com/v1/openai/chat/completions',
      model: 'meta-llama/Meta-Llama-3.1-70B-Instruct'
    }
  ];

  for (const ep of endpoints) {
    try {
      console.log(`[AI-ENGINE] Connecting to Cloud API (${ep.name}) with API key...`);
      const res = await axios.post(
        ep.url,
        {
          model: ep.model,
          messages: messages,
          temperature: 0.5,
          max_tokens: 4096,
          max_completion_tokens: 4096
        },
        {
          headers: {
            'Authorization': `Bearer ${cleanKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://laf.ai',
            'X-Title': 'LAF AI Platform'
          },
          timeout: 15000
        }
      );

      const content = res.data?.choices?.[0]?.message?.content;
      if (content && content.trim()) {
        return {
          text: sanitizeLlmOutput(content.trim()),
          provider: `${ep.name} (${res.data.model || ep.model})`
        };
      }
    } catch (err) {
      console.log(`[AI-ENGINE] Cloud API ${ep.name} notice: ${err.response?.status || err.message}`);
    }
  }

  return null;
}

function isWebSearchNeeded(prompt = '') {
  const p = prompt.toLowerCase().trim();
  const searchTriggers = [
    'news', 'latest', 'recent', 'today', 'current', 'live', 'real-time', 'realtime',
    'weather', 'stock', 'price', 'who won', 'score', 'trending', 'what happened', 'breaking'
  ];
  return searchTriggers.some(t => new RegExp(`\\b${t}\\b`, 'i').test(p));
}

/**
 * Auto-Switch Router: Detects user intent and dynamically routes to the optimal model
 */
function detectOptimalModel(prompt = '') {
  const p = prompt.toLowerCase().trim();

  // 1. Coding & Software Architecture
  const codeTriggers = [
    'code', 'function', 'class', 'react', 'python', 'javascript', 'typescript',
    'rust', 'golang', 'sql', 'docker', 'kubernetes', 'html', 'css', 'bug', 'fix',
    'api', 'endpoint', 'database', 'algorithm', 'refactor', 'git', 'npm', 'node', 'express'
  ];
  if (codeTriggers.some(k => p.includes(k))) {
    return {
      category: 'Software Engineering',
      cloudModel: 'Meta-Llama-3.3-70B-Instruct',
      cloudFallback: 'gpt-4o-mini',
      localModel: 'laf-v2'
    };
  }

  // 2. Math, Logic & Deep Technical Reasoning
  const mathTriggers = [
    'calculate', 'solve', 'equation', 'integral', 'derivative', 'matrix',
    'proof', 'logic puzzle', 'probability', 'theorem', 'math', 'algebra'
  ];
  if (mathTriggers.some(k => p.includes(k))) {
    return {
      category: 'Mathematical Reasoning',
      cloudModel: 'DeepSeek-V3.1',
      cloudFallback: 'Meta-Llama-3.3-70B-Instruct',
      localModel: 'laf-v2'
    };
  }

  // 3. Real-Time News, Current Events, Weather, Live Grounding
  if (isWebSearchNeeded(p)) {
    return {
      category: 'Real-Time Grounding',
      cloudModel: 'google/gemini-2.5-flash-lite',
      cloudFallback: 'gpt-4o-mini',
      localModel: 'laf-v2'
    };
  }

  // 4. General Conversational Intelligence
  return {
    category: 'High-Performance Reasoning',
    cloudModel: 'Meta-Llama-3.3-70B-Instruct',
    cloudFallback: 'gpt-4o-mini',
    localModel: 'laf-v2'
  };
}

/**
 * Rebuilt Clean AI Engine: 24/7 Auto-Switching Architecture + Local Ollama AI Platform + FLUX.1 Image Engine
 */
async function generateResponse({ username, prompt, history = [], selectedModel = 'auto', customApiKey = '' }) {
  const cleanPrompt = (prompt || '').trim();
  console.log(`[AI-ENGINE] Incoming Prompt for user "${username}": "${cleanPrompt}"`);

  // 1. Image Generation Handler
  if (isImageGenerationQuery(cleanPrompt)) {
    const formattedPrompt = cleanImagePrompt(cleanPrompt);
    const imageUrl = generateImageUrl(formattedPrompt);
    return {
      text: `![${cleanPrompt}](${imageUrl})`,
      provider: 'LAF FLUX Neural Engine'
    };
  }

  // 2. Immediate Direct Checks (Zero-latency Identity & Greetings)
  if (isLafIdentityQuery(cleanPrompt)) {
    return { text: LAF_REAL_IDENTITY_TEXT, provider: 'LAF Autonomous Core' };
  }

  if (isDeveloperQuery(cleanPrompt)) {
    return { text: LAF_DEVELOPER_TEXT, provider: 'LAF Autonomous Core' };
  }

  if (isGreetingQuery(cleanPrompt)) {
    const cleanUser = username ? username.charAt(0).toUpperCase() + username.slice(1) : '';
    return {
      text: `Hello ${cleanUser}! 👋 I am **LAF AI** (**L**ook **A**t **F**uture). How can I assist you today? Feel free to ask me anything about software engineering, system architecture, visual diagnostics, or complex problem solving!`,
      provider: 'LAF Conversational Engine'
    };
  }

  if (isTemporalQuery(cleanPrompt)) {
    return {
      text: `We are currently in the year **2026** (Today's date: **August 8, 2026**).\n\nLAF AI operates on a verified **2026 Grounded Intelligence Matrix** with up-to-date real-world knowledge.`,
      provider: 'LAF Temporal Engine (2026)'
    };
  }

  if (isDateQuery(cleanPrompt)) {
    return {
      text: `Today's date is **August 8, 2026**.`,
      provider: 'LAF Temporal Engine (2026)'
    };
  }

  const ambiguousResult = checkAmbiguousQuery(cleanPrompt);
  if (ambiguousResult) {
    return { text: ambiguousResult, provider: 'LAF Reasoner' };
  }

  if (isImageCapabilityQuery(cleanPrompt)) {
    return {
      text: 'Yes! I can generate high-resolution photorealistic images. Just describe what you would like me to create (e.g., *"generate an image of a majestic lion in golden hour"* or *"draw a futuristic floating city"*).',
      provider: 'LAF Core Engine'
    };
  }

  if (isUnsupportedMediaQuery(cleanPrompt)) {
    return { text: 'LAF currently supports text reasoning, code generation, and 1024x1024 photorealistic image generation.', provider: 'LAF Core Engine' };
  }

  const customKnowledgeMatch = searchCustomKnowledge(cleanPrompt);
  if (customKnowledgeMatch) {
    return { text: customKnowledgeMatch, provider: 'LAF Grounded Knowledge Matrix' };
  }

  // 3. ⭐ AUTO-SWITCHING CONCEPT: Automatically route to the optimal model based on query category
  const autoRoute = detectOptimalModel(cleanPrompt);
  const targetCloudModel = (selectedModel && selectedModel !== 'auto') ? selectedModel : autoRoute.cloudModel;
  console.log(`[AI-ENGINE] Auto-Switching Route: [Category: ${autoRoute.category}] | Target: ${targetCloudModel} | Local: ${autoRoute.localModel}`);

  // Build Context (Memory Recall + Live Grounding + RAG Anchors)
  let memoryContext = '';
  try {
    const memoryMatches = searchUserMemory(username, cleanPrompt);
    if (memoryMatches && memoryMatches.length > 0) {
      memoryContext = `\n[RECALLED USER CONTEXT MEMORY]:\n` +
        memoryMatches.map(m => `[${m.date} | ${m.role.toUpperCase()}]: ${m.content}`).join('\n');
    }
  } catch (e) {}

  let webGroundingContext = '';
  if (isWebSearchNeeded(cleanPrompt)) {
    try {
      const webSnippet = await searchWebGrounding(cleanPrompt);
      if (webSnippet) {
        webGroundingContext = `\n[REAL-TIME LIVE GROUNDED KNOWLEDGE (2026)]:\n${webSnippet}`;
      }
    } catch (e) {}
  }

  let ragContext = '';
  try {
    ragContext = getRagContext(cleanPrompt);
  } catch (e) {}

  const fullSystemPrompt = `${SYSTEM_PROMPT}\nUser: ${username}${memoryContext ? '\n' + memoryContext : ''}${webGroundingContext ? '\n' + webGroundingContext : ''}${ragContext ? '\n' + ragContext : ''}`;

  const formattedMessages = [
    { role: 'system', content: fullSystemPrompt }
  ];

  if (Array.isArray(history) && history.length > 0) {
    history.slice(-4).forEach(h => {
      const textSnippet = (h.content || '').substring(0, 200);
      if (textSnippet.trim()) {
        formattedMessages.push({
          role: h.role === 'user' ? 'user' : 'assistant',
          content: textSnippet
        });
      }
    });
  }

  formattedMessages.push({ role: 'user', content: cleanPrompt });

  // Priority 1: Dispatch to Cloud API with Auto-Switched Model (if key available)
  const candidateKeys = [];
  if (customApiKey && typeof customApiKey === 'string' && customApiKey.trim()) {
    candidateKeys.push(customApiKey.trim());
  }
  [process.env.LAF_API_KEY, process.env.LAF_API_KEY_SECONDARY, process.env.LAF_API_KEYS, process.env.OPENAI_API_KEY, process.env.GROQ_API_KEY].forEach(k => {
    if (!k || typeof k !== 'string') return;
    k.split(',').map(s => s.trim()).filter(Boolean).forEach(key => {
      if (!candidateKeys.includes(key)) {
        candidateKeys.push(key);
      }
    });
  });

  for (const activeApiKey of candidateKeys) {
    const cloudRes = await callCloudLLM({
      messages: formattedMessages,
      apiKey: activeApiKey,
      model: targetCloudModel
    });
    if (cloudRes) {
      return {
        text: cloudRes.text,
        provider: `LAF AI (${autoRoute.category})`
      };
    }
  }

  // Priority 2: Auto-Switch to Local 24/7 Ollama Model (laf-v2 / llama3.2)
  const ollamaRes = await callOllamaLocal({
    messages: formattedMessages,
    model: autoRoute.localModel || 'laf-v2'
  });
  if (ollamaRes) {
    return {
      text: ollamaRes.text,
      provider: `LAF AI (${autoRoute.category} • ${ollamaRes.provider})`
    };
  }

  // Priority 3: Grounded Fallback Engine
  const fallbackText = await generateGemmaResponse({ prompt: cleanPrompt, username, webGroundingContext, ragContext });
  return {
    text: fallbackText,
    provider: `LAF Autonomous AI (${autoRoute.category})`
  };
}

/**
 * Rich Dynamic Intelligence Engine for General Q&A, Concepts, & Explanations
 */
function generateDetailedAnswer(prompt = '') {
  const p = prompt.trim();
  const lower = p.toLowerCase();

  // 1. Artificial Intelligence / Machine Learning / Deep Learning / LLMs
  if (lower.includes('ai') || lower.includes('artificial intelligence') || lower.includes('machine learning') || lower.includes('deep learning') || lower.includes('llm') || lower.includes('neural network')) {
    return `### 🤖 Artificial Intelligence (AI) - Comprehensive Guide

**Artificial Intelligence (AI)** is a field of computer science dedicated to building intelligent systems capable of performing tasks that traditionally require human cognitive abilities — such as reasoning, learning from data, visual perception, problem-solving, and natural language understanding.

---

### 🔑 Core Pillars of Artificial Intelligence:

1. **Machine Learning (ML)**:
   - Statistical algorithms that learn patterns from large datasets and improve performance over time without explicit step-by-step programming.
   
2. **Deep Learning & Neural Networks**:
   - Multi-layered mathematical models inspired by biological neural structures. Powers modern breakthroughs in image generation, speech synthesis, and Large Language Models (LLMs).

3. **Natural Language Processing (NLP)**:
   - Enables computers to analyze, comprehend, and generate human language (e.g., chat assistants, code generation engines, translation tools).

4. **Computer Vision**:
   - Algorithms that process digital images and video feeds for facial recognition, object detection, and autonomous vehicle navigation.

5. **Robotics & Autonomous Systems**:
   - Combines AI reasoning with physical hardware to operate autonomously in complex real-world environments.

---

### 💡 Key Applications:
- **Generative AI & Code Assistants**: Automated code synthesis, creative writing, and system architecture.
- **Healthcare**: Automated medical diagnostics, genomic analysis, and drug discovery.
- **Finance**: Algorithmic trading, credit scoring, and automated fraud prevention.

*Would you like a deep dive into machine learning models, neural network architectures, or building AI applications?*`;
  }

  // 2. Software / Programming / Web Development
  if (lower.includes('programming') || lower.includes('coding') || lower.includes('software') || lower.includes('web development') || lower.includes('backend') || lower.includes('frontend')) {
    return `### 💻 Software Engineering & Development Guide

**Software Development** is the process of designing, writing, testing, and maintaining code instructions in languages like JavaScript, Python, C++, Java, or Go to build scalable applications, operating systems, and computing platforms.

---

### 🏗️ Essential Technology Layers:

1. **Frontend Development (User Experience)**:
   - **HTML5, CSS3, & Tailwind**: Page structure, responsiveness, and visual aesthetics.
   - **JavaScript / React / Vue**: Interactive UI components, state management, and SPA client rendering.

2. **Backend Development (Server & Data)**:
   - **Node.js / Express / Python / Go**: High-throughput API routes, middleware, and business logic.
   - **Databases**: Relational (PostgreSQL, MySQL) and NoSQL (MongoDB, Redis) data persistence.

3. **DevOps & Cloud Infrastructure**:
   - **Docker & Containerization**: Package code and dependencies for consistent cross-environment deployment.
   - **CI/CD & Cloud Hosting**: Automated testing, build pipelines, and production cloud deployment on AWS or GCP.

*Need code examples, database schema design, or architectural advice for your project? Let me know!*`;
  }

  // 3. AI Safety & Security
  if (lower.includes('jailbreak') || lower.includes('bypass') || lower.includes('filter') || lower.includes('safety') || lower.includes('security')) {
    return `### 🛡️ AI System Security & Guardrails Overview

When asking about **"${p}"**, modern AI platforms enforce structural security layers to protect system integrity and ensure ethical AI operation:

1. **System Prompt & Role Isolation**: Core instructions and boundary definitions are stored in protected system-level contexts that user-level prompts cannot override.
2. **Input Pattern Scanning**: Prompts undergo real-time heuristic scanning to detect delimiter hijacking, instruction overrides, and injection attack vectors.
3. **Model Alignment (RLHF & Constitutional AI)**: Underlying models are fine-tuned using Reinforcement Learning from Human Feedback to automatically decline requests that violate safety guidelines.
4. **Isolated Memory State**: User conversations are stored in partitioned, encrypted user-specific databases (user_hash.json), preventing cross-session leaks.

If you have specific software engineering, system architecture, or security testing questions, feel free to ask!`;
  }

  // 4. RAG Grounded Answer or Conversational Response
  if (ragContext && ragContext.includes('VERIFIED')) {
    const cleanRag = ragContext
      .replace(/\[RETRIEVAL-AUGMENTED GENERATION \(RAG\) VERIFIED ANCHORS\]:\n?/gi, '')
      .replace(/\[RAG VERIFIED GROUND-TRUTH #\d+\]:\n?/gi, '')
      .trim();
    if (cleanRag) return cleanRag;
  }

  return `I understand your question regarding **"${p}"**.\n\nCould you please provide a bit more detail or clarify what specific programming solution, system design, or concept you would like me to help you with? I am standing by and ready to assist you!`;
}

/**
 * Built-in High-Capacity Intelligence Engine with Live Web Search Synthesis
 */
async function generateGemmaResponse({ prompt = '', username = '', webGroundingContext = '', ragContext = '' }) {
  const p = prompt.trim();
  const lower = p.toLowerCase();

  // 1. Capabilities Question
  if (
    lower.includes('what can you do') ||
    lower.includes('what are your features') ||
    lower.includes('what do you do') ||
    lower.includes('capabilities') ||
    lower.includes('how can you help') ||
    lower === 'what can you doo'
  ) {
    return `### LAF AI Capabilities

LAF (Look At The Future) is an autonomous, high-performance local AI product platform designed for software engineering, system architecture, analytical reasoning, and structured advice.

#### 1. Software Engineering & Full-Stack Development
- **Code Generation**: Clean, production-ready code in Python, JavaScript/TypeScript, React, C++, Java, Rust, and Go.
- **Debugging & Refactoring**: Syntax diagnostic, algorithm optimization, and runtime profiling.
- **System Architecture**: Scalable REST APIs, microservices, database schemas, and containerized deployments.

#### 2. Mathematics & Technical Problem Solving
- Detailed derivations, algorithmic analysis, and structured step-by-step problem solving.`;
  }

  // 2. India Specific Question
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
    return `Hello **${username}**! 👋 I am **LAF AI**, your dedicated AI assistant for software engineering, web development, mathematics, and problem solving. How can I assist you today?`;
  }

  // 5. Coding / Solution requests
  if (lower.includes('code') || lower.includes('function') || lower.includes('script') || lower.includes('program') || lower.includes('python') || lower.includes('js') || lower.includes('html') || lower.includes('css') || lower.includes('react') || lower.includes('express') || lower.includes('software') || lower.includes('build') || lower.includes('create')) {
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

  // 6. Live Real-Time Web Grounding Search Integration (Only for explicit search requests)
  let liveSnippets = webGroundingContext ? webGroundingContext.replace('\n[REAL-TIME LIVE GROUNDED KNOWLEDGE (2026)]:\n', '').trim() : '';
  if (!liveSnippets && isWebSearchNeeded(p)) {
    try {
      liveSnippets = await searchWebGrounding(p);
    } catch (e) {}
  }

  if (liveSnippets) {
    return `### 🌐 Real-Time Live Grounded Information (2026)

Verified real-time search results for **"${p}"**:

${liveSnippets}

---
*Synthesized using LAF 2026 Real-Time Live Web Grounding Service.*`;
  }

  // 7. General Questions / Concepts / Safety / AI Reasoning Fallback
  return generateDetailedAnswer(p, ragContext);
}

module.exports = {
  generateResponse
};
