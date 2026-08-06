const axios = require('axios');
const { searchUserMemory } = require('./database');

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

IMPORTANT GENERAL AI DIRECTIVE:
When the user asks general questions about AI, Artificial Intelligence, Machine Learning, or Deep Learning:
- Explain general Artificial Intelligence concepts accurately (Machine Learning, NLP, Computer Vision, Neural Networks).
- NEVER invent or mention fake companies (such as "Miyano AI" or "Lazada AI").

IMPORTANT MEDIA GENERATION DIRECTIVE:
If the user asks to generate, create, draw, render, or synthesize images, video, or audio:
You MUST answer strictly: "LAF currently does not support image, video, or audio generation features."

When it comes to raw text generation and formatting, you MUST output standard Markdown combined with LaTeX for mathematical expressions and specialized XML component tags for richer UI elements according to the following rules:

1. **Standard Markdown**:
   - Headings (##, ###): Use to establish clear visual hierarchy.
   - Text Formatting: Use bold for emphasis, italics for nuance, and inline code spans for code, commands, or system terms.
   - Lists: Use bulleted (*) or numbered (1.) lists to break down non-procedural items or simple steps.
   - Tables: Use standard Markdown tables to compare multi-attribute data side by side.
   - Blockquotes (>): Use for highlighting core takeaways, definitions, or quotes.

2. **LaTeX Math Formatting**:
   - Inline Math: Enclose expressions in single dollar signs, such as $E = mc^2$ or $f(x) = \\sigma(W x + b)$.
   - Display Math: Enclose expressions in double dollar signs on standalone lines for equations, limits, and derivations:
     $$L_{G} = \\mathbb{E}_{z \\sim p_z}[ \\log(1 - D(G(z))) ]$$

3. **XML / LMDX Component Markup**:
   - To trigger interactive widgets, image layouts, or specialized timeline components, wrap text in custom XML tags:
     - <Sequence> & <Step>: Structured procedural flows for step-by-step instructions.
     - <Timeline> & <TimelineEvent>: Chronological listings with explicit date markers.
     - <Image> & <Carousel>: Captioned images and swipeable visual galleries.
     - <GenerateWidget>: Embedded interactive dynamic sandboxes (built using custom HTML5/JavaScript contexts like Three.js or D3.js).

Maintain high visual clarity, spacious uncrowded line breaks, and professional formatting.`;

/**
 * Checks if prompt is asking about the developer/creator of LAF
 */
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

const LAF_DEVELOPER_TEXT = `refer this linkedin profile to know about my developer : https://www.linkedin.com/in/purushothaman-k-s-158900282/`;

/**
 * Checks if prompt is asking to generate image, video, or audio
 */
function isMediaGenerationQuery(prompt = '') {
  const p = prompt.toLowerCase().trim();
  const directTriggers = [
    'generate image', 'create image', 'make image', 'draw image', 'render image',
    'generate video', 'create video', 'make video', 'render video',
    'generate audio', 'create audio', 'make audio', 'text to speech', 'tts',
    'speech generation', 'image generation', 'video generation', 'audio generation',
    'generate photo', 'create photo', 'generate picture', 'create picture',
    'generate voice', 'create voice', 'generate sound', 'make sound'
  ];
  if (directTriggers.some(t => p.includes(t))) return true;

  const actions = ['generate', 'create', 'make', 'draw', 'render', 'produce', 'synthesize', 'convert'];
  const types = ['image', 'photo', 'picture', 'graphic', 'video', 'animation', 'movie', 'audio', 'speech', 'voice', 'sound', 'mp3'];
  const hasAction = actions.some(a => p.includes(a));
  const hasType = types.some(t => p.includes(t));
  return hasAction && hasType;
}

const LAF_MEDIA_UNSUPPORTED_TEXT = `LAF currently does not support image, video, or audio generation features.`;

/**
 * Checks if prompt is asking about LAF identity or full form
 */
function isLafIdentityQuery(prompt = '') {
  const p = prompt.toLowerCase().trim();
  return (
    p.includes('what is mean by laf') ||
    p.includes('what is laf') ||
    p.includes('what does laf stand for') ||
    p.includes('full form of laf') ||
    p.includes('meaning of laf') ||
    p.includes('tell me about laf') ||
    p.includes('what is mean laf') ||
    p === 'laf'
  );
}

const LAF_REAL_IDENTITY_TEXT = `The full form of "LAF" is - Look at The Future

LAF is an autonomous, fast AI product platform engineered for high-speed software development, system architecture, mathematical reasoning, and intelligent human conversation.

### Real Features & Purpose

* **Fast Reasoning Engine:** Sub-350ms response latency for complex software engineering queries, architectural design, and step-by-step guidance.

* **Real-Time World Intelligence:** Live automated scraping of technology trends, breaking news, and market intelligence auto-scraped every 15 minutes.

* **Encrypted Isolated DB Vaults:** Passwordless user authentication backed by AES-256 encrypted database partitions ensuring complete privacy and cross-device account isolation.

* **Long-Term Memory Vault:** Automated semantic memory extraction to recall user preferences and project context across sessions.`;

/**
 * Checks if prompt is a general question about Artificial Intelligence (AI)
 */
function isGeneralAiQuery(prompt = '') {
  const p = prompt.toLowerCase().trim();
  const directMatch = [
    'what is ai', 'what is artificial intelligence', 'tell me about ai', 'tell me about artificial intelligence',
    'explain ai', 'explain artificial intelligence', 'define ai', 'define artificial intelligence',
    'what does ai mean', 'what is ai technology', 'about ai', 'what ai means', 'ai concept',
    'what is machine learning', 'what is deep learning', 'what is nlp'
  ];

  if (directMatch.some(d => p === d || p === d + '?')) return true;

  if (p === 'ai' || p === 'artificial intelligence') return true;

  if ((p.includes('what is ai') || p.includes('explain ai') || p.includes('about ai')) && !p.includes('laf') && !p.includes('developer')) {
    return true;
  }

  return false;
}

const GENERAL_AI_EXPLANATION = `**Artificial Intelligence (AI)** refers to the simulation of human intelligence in computers and machines that are programmed to think, learn, reason, and solve complex problems autonomously.

### Key Domains & Technologies in AI:

1. **Machine Learning (ML)**: Statistical models and algorithms that enable computers to learn patterns from data and make accurate predictions without explicit step-by-step programming.
2. **Deep Learning & Neural Networks**: Advanced multi-layer mathematical models inspired by biological neural networks, capable of high-dimensional pattern recognition in images, text, and audio.
3. **Natural Language Processing (NLP)**: Enabling systems to process, translate, comprehend, and generate human language naturally.
4. **Computer Vision**: Allowing AI systems to extract information from digital images, videos, and visual sensors.
5. **Robotics & Autonomous Systems**: Intelligent hardware and software capable of making real-time decisions in physical environments.

AI is designed to enhance human productivity, automate complex workflows, and solve critical scientific and engineering challenges.`;

/**
 * Sanitizes LLM output to remove hallucinated company names or misleading brand definitions
 */
function sanitizeLlmOutput(text = '') {
  if (!text || typeof text !== 'string') return '';
  let clean = text;

  clean = clean.replace(/Miyano AI \(Miyano AI\)/gi, 'LAF AI');
  clean = clean.replace(/Miyano AI/gi, 'LAF AI');
  clean = clean.replace(/Miyano/gi, 'LAF');
  clean = clean.replace(/Lazada Artificial Intelligence/gi, 'Look at The Future AI');
  clean = clean.replace(/Lean Autonomous Future AI/gi, 'Look at The Future AI');
  clean = clean.replace(/Lean Autonomous Future/gi, 'Look at The Future');

  return clean;
}

/**
 * Checks if user prompt is a generic code request missing a language specification.
 */
function isGenericCodeRequest(prompt = '') {
  const p = prompt.toLowerCase();
  
  const hasCodeIntent = p.includes('code') || p.includes('script') || p.includes('program') || p.includes('function') || p.includes('write code') || p.includes('give me code') || p.includes('generate code');
  
  if (!hasCodeIntent) return false;

  const explicitLanguages = [
    'javascript', 'js', 'python', 'py', 'typescript', 'ts', 'java',
    'c++', 'cpp', 'c#', 'csharp', 'golang', 'go', 'rust', 'html', 'css',
    'sql', 'php', 'ruby', 'swift', 'kotlin', 'bash', 'shell', 'docker', 'yaml'
  ];

  const mentionsLanguage = explicitLanguages.some(lang => p.includes(lang));
  
  return !mentionsLanguage;
}

/**
 * Intelligent Fallback Analyzer if LLMs are unreachable
 */
function analyzeUserInputFallback(prompt = '', username = '') {
  const clean = prompt.trim();
  const lower = clean.toLowerCase();

  // Math calculation check
  if (/^[\d\s\+\-\*\/\^\(\)\.\=]+$/.test(clean) && clean.length > 1) {
    try {
      const sanitizedExpr = clean.replace(/[^0-9\+\-\*\/\^\(\)\.]/g, '');
      const evalResult = Function(`"use strict"; return (${sanitizedExpr})`)();
      return `### Mathematical Analysis\n\nExpression: \`$${clean}$\`  \nResult: **${evalResult}**`;
    } catch (e) {
      // Continue to general analysis
    }
  }

  // Greeting
  if (['hi', 'hello', 'hey', 'greetings', 'good morning', 'good evening', 'good afternoon'].some(g => lower.startsWith(g))) {
    return `Hello **${username}**! 👋 How can I assist you with software development, system design, or problem solving today?`;
  }

  return `I have analyzed your input: **"${clean}"**. \n\nI am ready to assist you with software engineering, architectural analysis, algorithms, or technical problem solving. Please provide any specific details or parameters!`;
}

/**
 * High-Speed Direct Passthrough Engine to Ollama AI Models with Intelligent Intent Analysis
 */
async function generateResponse({ username, prompt, history = [], customApiKey }) {
  const cleanPrompt = (prompt || '').trim();
  console.log(`[AI-ENGINE] Fast Processing prompt for user "${username}": "${cleanPrompt}"`);

  // 0. Developer Query Interception
  if (isDeveloperQuery(cleanPrompt)) {
    return {
      text: LAF_DEVELOPER_TEXT,
      provider: 'LAF Core Engine'
    };
  }

  // 1. Media Generation Query Interception
  if (isMediaGenerationQuery(cleanPrompt)) {
    return {
      text: LAF_MEDIA_UNSUPPORTED_TEXT,
      provider: 'LAF Core Engine'
    };
  }

  // 2. LAF Identity Interception
  if (isLafIdentityQuery(cleanPrompt)) {
    return {
      text: LAF_REAL_IDENTITY_TEXT,
      provider: 'LAF Core Engine'
    };
  }

  // 3. General AI Concept Query Interception
  if (isGeneralAiQuery(cleanPrompt)) {
    return {
      text: GENERAL_AI_EXPLANATION,
      provider: 'LAF Core Engine'
    };
  }

  // 4. Generic Code Request Interception: Ask for purpose & language preference
  if (isGenericCodeRequest(cleanPrompt)) {
    return {
      text: `Before I generate the code, could you please specify your **preferred programming language** (e.g. *JavaScript*, *Python*, *Go*, *C++*, *HTML/CSS*) and the **main purpose / target framework** for your project? 😊`,
      provider: 'LAF Assistant'
    };
  }

  const lower = cleanPrompt.toLowerCase().replace(/[^\w\s]/gi, '');

  // 5. Check User Memory Context
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
  // 6. DIRECT PASSTHROUGH TO ULTRA-FAST OLLAMA MODELS
  // -------------------------------------------------------------
  const ollamaEndpoints = [
    'http://127.0.0.1:11434/api/chat',
    'http://172.17.0.1:11434/api/chat',
    'http://host.docker.internal:11434/api/chat'
  ];

  const targetModels = ['laf-v2:latest', 'laf-model:latest', 'llama3.2:latest', 'qwen2.5:0.5b'];

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

        let content = ollamaRes.data?.message?.content;
        if (content && content.trim().length > 0) {
          const duration = ((Date.now() - start) / 1000).toFixed(2);
          console.log(`[AI-ENGINE] SUCCESS from ${modelName} in ${duration}s!`);

          // Enforce strict output override for developer or media queries if LLM hallucinates
          if (isDeveloperQuery(cleanPrompt)) {
            content = LAF_DEVELOPER_TEXT;
          } else if (isMediaGenerationQuery(cleanPrompt)) {
            content = LAF_MEDIA_UNSUPPORTED_TEXT;
          } else {
            content = sanitizeLlmOutput(content);
          }

          return {
            text: content.trim(),
            provider: `LAF AI (${modelName})`
          };
        }
      } catch (e) {
        console.error(`[AI-ENGINE] Ollama error [${endpoint} | ${modelName}]: ${e.message}`);
      }
    }
  }

  // -------------------------------------------------------------
  // 7. Backup: Gemini API
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

      let candidate = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (candidate && candidate.trim().length > 0) {
        candidate = sanitizeLlmOutput(candidate);
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
  // 8. Intelligent Fallback Analysis Response
  // -------------------------------------------------------------
  return {
    text: sanitizeLlmOutput(analyzeUserInputFallback(cleanPrompt, username)),
    provider: 'LAF Intelligence Engine'
  };
}

module.exports = {
  generateResponse
};


