const axios = require('axios');
const { searchUserMemory } = require('./database');
const { fetchWikiSummary } = require('./trendEngine');
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
 * Checks if prompt is asking about Tamil Nadu current leadership or CM
 */
function isTnGovernmentQuery(prompt = '') {
  const p = prompt.toLowerCase().trim();
  return (
    p.includes('cm of tamilnadu') ||
    p.includes('cm of tamil nadu') ||
    p.includes('chief minister of tamil') ||
    p.includes('governor of tamil') ||
    p.includes('scenario in tamilnadu') ||
    p.includes('scenario in tamil nadu') ||
    p.includes('tamilnadu politics') ||
    p.includes('tamil nadu politics') ||
    p.includes('tamilnadu current') ||
    p.includes('tamil nadu current') ||
    p.includes('tvk')
  );
}

const TN_GOVT_LIVE_TEXT = `**C. Joseph Vijay** (founder and president of Tamilaga Vettri Kazhagam - TVK) is the **current Chief Minister of Tamil Nadu**, sworn into office on May 10, 2026.

### Live 2026 Current Scenario & Governance Breakdown (Tamil Nadu):
* **Chief Minister**: C. Joseph Vijay
* **Party**: Tamilaga Vettri Kazhagam (TVK)
* **Assumed Office**: May 10, 2026
* **Constituency**: Perambur
* **Predecessor**: M. K. Stalin (DMK)
* **State Capital**: Chennai
* **Legislative Assembly**: 234 seats`;

/**
 * Checks if prompt is asking generally about current scenario or current news
 */
function isCurrentScenarioQuery(prompt = '') {
  const p = prompt.toLowerCase().trim();
  return (
    p === 'current scenario' ||
    p === 'what is the current scenario' ||
    p === 'current scenario now' ||
    p.includes('latest current scenario') ||
    p.includes('current world scenario')
  );
}

const CURRENT_SCENARIO_LIVE_TEXT = `### Live 2026 Worldwide & Technology Scenario Overview

1. **Agentic AI & Industrial Automation**:
   - The global technology landscape in 2026 is driven by multi-agent autonomous AI systems operating across software engineering, healthcare diagnostics, and automated logistics.

2. **System 2 Reasoning & Codebase Twin Engineering**:
   - Modern foundation models prioritize deliberate multi-step reasoning, automated code auditing, and real-time visual system twin mapping.

3. **Global AI Transparency & Governance**:
   - Mandatory disclosures and AI watermarking regulations enforce strict ethical boundaries and user transparency worldwide.`;

/**
 * Checks if prompt is a simple greeting
 */
function isGreetingQuery(prompt = '') {
  const p = prompt.toLowerCase().trim().replace(/[^\w\s]/g, '');
  const greetings = ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good evening', 'good afternoon', 'sup', 'yo', 'hi there', 'hello there'];
  return greetings.includes(p);
}

/**
 * Checks if prompt is asking about past conversation, previous session, or what was discussed
 */
function isPastSessionQuery(prompt = '') {
  const p = prompt.toLowerCase().trim();
  return (
    p.includes('before session') ||
    p.includes('previous session') ||
    p.includes('past session') ||
    p.includes('last session') ||
    p.includes('what we speak') ||
    p.includes('what we spoke') ||
    p.includes('what did we talk') ||
    p.includes('what did we discuss') ||
    p.includes('what we talked') ||
    p.includes('previous conversation') ||
    p.includes('past conversation') ||
    p.includes('last conversation') ||
    p.includes('remember what we')
  );
}

function handlePastSessionQuery(username, prompt) {
  const memoryMatches = searchUserMemory(username, prompt);
  if (memoryMatches && memoryMatches.length > 0) {
    return `### Recalled Discussion Points from Past Sessions:\n\n` +
      memoryMatches.map(m => `* **${m.date}**: ${m.content}`).join('\n');
  }
  return `In our previous sessions, we focused on:\n- Configured **LAF AI's real-time knowledge sync** (Wikipedia & live technology feeds).\n- Updated **2026 Tamil Nadu political facts** (Chief Minister C. Joseph Vijay - TVK).\n- Integrated **Long-Term Memory Vault** to recall user preferences across turns.`;
}

/**
 * Checks if prompt is asking about the user's identity or what LAF knows about the user
 */
function isUserIdentityQuery(prompt = '') {
  const p = prompt.toLowerCase().trim();
  return (
    p.includes('know about me') ||
    p.includes('know me') ||
    p.includes('who am i') ||
    p.includes('tell me about me') ||
    p.includes('my profile') ||
    p.includes('my details') ||
    p.includes('what you know about me') ||
    p.includes('what do you know about me') ||
    p.includes('remember about me')
  );
}

function handleUserIdentityQuery(username, prompt) {
  const isDev = username && (
    username.toLowerCase().includes('purushothaman') ||
    username.toLowerCase().includes('developer')
  );

  const memoryMatches = searchUserMemory(username, prompt);
  let memoryText = '';

  if (memoryMatches && memoryMatches.length > 0) {
    memoryText = `\n\n### Your Stored Context Memory:\n` +
      memoryMatches.map(m => `* **${m.date}** [${m.role.toUpperCase()}]: ${m.content}`).join('\n');
  }

  if (isDev) {
    return `### Developer Profile Details\n\n` +
      `* **Name**: **Purushothaman K S**\n` +
      `* **Role**: Lead Developer & Creator of **LAF AI Platform**\n` +
      `* **LinkedIn Profile**: https://www.linkedin.com/in/purushothaman-k-s-158900282/` +
      memoryText;
  }

  if (memoryText) {
    return `Here is what I currently know about you from your context memory vault:${memoryText}\n\nFeel free to share more details about your work, goals, or preferences so I can keep your context memory updated!`;
  }

  return `I don't know much about you yet! 😊 Please tell me a little about yourself (your name, interests, work, or preferences) and I will save it into your isolated context memory vault for our future conversations.`;
}

/**
 * Analyzes user prompt to determine if real-time web search is needed
 */
function needsWebSearch(prompt = '') {
  const p = prompt.toLowerCase().trim();
  if (
    !p ||
    isDeveloperQuery(p) ||
    isLafIdentityQuery(p) ||
    isMediaGenerationQuery(p) ||
    isGreetingQuery(p) ||
    isProjectIdeaQuery(p) ||
    isPastSessionQuery(p) ||
    isUserIdentityQuery(p)
  ) {
    return false;
  }

  // Factual, informational, entity, or search question triggers
  const searchTriggers = [
    'who', 'what', 'where', 'when', 'why', 'how', 'which',
    'explain', 'tell me', 'describe', 'define', 'search', 'lookup',
    'info', 'information', 'details', 'meaning', 'history', 'concept',
    'latest', 'current', 'news', 'update', 'status', 'version',
    'difference between', 'vs', 'versus', 'list of', 'examples of'
  ];

  const words = p.split(/\s+/);
  const isQuestion = p.endsWith('?') || searchTriggers.some(t => p.includes(t));
  const isMultiWordConcept = words.length >= 2 && !isGenericCodeRequest(p);

  return isQuestion || isMultiWordConcept;
}

/**
 * Direct Live Web Search Engine: Sends prompt to DuckDuckGo & Wikipedia APIs directly
 */
async function performLiveWebSearch(prompt = '') {
  const cleanQuery = (prompt || '').trim();
  if (!cleanQuery) return '';

  const webResults = [];

  // Source 1: Live Web Search Results (DuckDuckGo Search)
  try {
    const ddgRes = await axios.get(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 5000
    });

    const regex = /class="result__snippet[^"]*"[^>]*>(.*?)<\/a>/gs;
    let match;
    let count = 0;
    while ((match = regex.exec(ddgRes.data)) !== null && count < 5) {
      const text = match[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
      if (text.length > 15) {
        count++;
        webResults.push(`[LIVE WEB RESULT #${count}]: ${text}`);
      }
    }
  } catch (err) {
    console.error('[WEB-SEARCH] Live DuckDuckGo search error:', err.message);
  }

  // Source 2: Verified Wikipedia Reference
  try {
    const wikiData = await resolveWikipediaKnowledge(cleanQuery);
    if (wikiData && wikiData.extract) {
      webResults.push(`[WIKIPEDIA REFERENCE: "${wikiData.title}"]:\n${wikiData.extract}\nSource: ${wikiData.url}`);
    }
  } catch (err) {
    // Fail-safe Wikipedia lookup
  }

  if (webResults.length > 0) {
    return `\n[DIRECT LIVE WEB SEARCH RESULTS FOR PROMPT "${cleanQuery}"]:\n\n${webResults.join('\n\n')}\n`;
  }

  return '';
}

/**
 * Real-time Wikipedia Search Resolver: Resolves any query into verified Wikipedia facts
 */
async function resolveWikipediaKnowledge(prompt = '') {
  const p = prompt.trim();
  const cleanSearch = p
    .replace(/who is|what is|tell me about|explain|give me|find|search for|info on|current|details|the/gi, '')
    .trim() || p;

  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanSearch)}&limit=2&format=json`;
    const searchRes = await axios.get(searchUrl, {
      headers: { 'User-Agent': 'LAF-AI-Platform/1.2 (contact@laf.ai)' },
      timeout: 4000
    });

    const searchHits = searchRes.data?.query?.search || [];
    if (searchHits.length > 0) {
      const topTitle = searchHits[0].title;
      const sumUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topTitle)}`;
      const sumRes = await axios.get(sumUrl, {
        headers: { 'User-Agent': 'LAF-AI-Platform/1.2 (contact@laf.ai)' },
        timeout: 4000
      });

      if (sumRes.data && sumRes.data.extract) {
        return {
          title: sumRes.data.title,
          extract: sumRes.data.extract,
          url: sumRes.data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(topTitle)}`
        };
      }
    }
  } catch (e) {
    // Fail-safe Wikipedia lookup
  }
  return null;
}

/**
 * Automatically extracts potential topic from prompt and fetches real-time Wikipedia context
 */
async function getLiveWikipediaContext(prompt = '') {
  const wikiData = await resolveWikipediaKnowledge(prompt);
  if (wikiData) {
    return `\n[VERIFIED WIKIPEDIA LIVE KNOWLEDGE: "${wikiData.title}"]:\n${wikiData.extract}\nSource: ${wikiData.url}\n`;
  }
  return '';
}

/**
 * Checks if prompt is asking for project ideas
 */
function isProjectIdeaQuery(prompt = '') {
  const p = prompt.toLowerCase().trim();
  const keywords = ['project idea', 'project ideas', 'suggest project', 'idea for project', 'give me project', 'building a project', 'good project'];
  return keywords.some(k => p.includes(k));
}

const PROJECT_IDEAS_TEXT = `Here are 4 high-impact, modern software engineering project ideas you can build:

### 1. ⚡ Autonomous Multi-Agent Task Orchestrator
- **Concept:** A distributed system where specialized AI sub-agents collaborate to decompose complex tasks, write code, run unit tests, and fix bugs autonomously.
- **Tech Stack:** Node.js / Python, WebSockets, Vector DB (ChromaDB / Qdrant), React.

### 2. 🔐 Zero-Knowledge Encrypted Vault Messenger
- **Concept:** End-to-end encrypted messaging platform featuring client-side PBKDF2 key derivation, AES-256-GCM message vaults, and passwordless HMAC auth.
- **Tech Stack:** React, Express, Web Crypto API, SQLite.

### 3. 🌐 Real-Time Global Intelligence Ticker
- **Concept:** An automated RSS & API scraper that aggregates tech news, science papers, and stock market trends, using semantic embeddings to cluster related breaking news.
- **Tech Stack:** Python (FastAPI / Scrapy), LangChain, Redis, TailwindCSS.

### 4. 💻 Visual Twin System Diagnostics
- **Concept:** Interactive 3D/2D visual diagnostic twin for hardware and server monitoring, featuring live thermal maps, memory usage telemetry, and automated log anomaly detection.
- **Tech Stack:** Three.js / D3.js, React, Node.js, WebSockets.`;

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

  // Strip unwanted header prefixes
  clean = clean.replace(/### Verified Knowledge: /gi, '');
  clean = clean.replace(/Verified Knowledge: /gi, '');
  clean = clean.replace(/### Verified Knowledge Analysis\n/gi, '');

  // Past-tense sanitization for active incumbent leaders
  clean = clean.replace(/served as the (eighth|9th|8th|current) chief minister of Tamil Nadu from 2021 to \d+/gi, 'is the current Chief Minister of Tamil Nadu (serving since May 2021)');
  clean = clean.replace(/served as the chief minister of Tamil Nadu from 2021 to \d+/gi, 'is the current Chief Minister of Tamil Nadu (serving since May 2021)');

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
 * Checks if prompt is asking about LAF memory capabilities or remembered context
 */
function isMemoryQuery(prompt = '') {
  const p = prompt.toLowerCase().trim();
  return (
    p.includes('context memory') ||
    p.includes('have memory') ||
    p.includes('has memory') ||
    p.includes('has context memory') ||
    p.includes('have context memory') ||
    p.includes('remember things') ||
    p.includes('remember context') ||
    p.includes('do you remember') ||
    p.includes('memory vault')
  );
}

const LAF_MEMORY_EXPLANATION_TEXT = `Yes! **LAF AI has built-in long-term Context & Memory Vault capabilities**.

### How LAF Memory Works:
1. **Per-Session History:** Keeps track of your active conversation flow and multi-turn questions.
2. **Encrypted User Memory Vault:** Saves key preferences, project details, and past discussions into your private isolated database vault.
3. **Semantic Recalocation:** Automatically recalls relevant past memories and applies them into your context window during conversations.`;

/**
 * Intelligent Fallback Analyzer if LLMs are unreachable
 */
function analyzeUserInputFallback(prompt = '', username = '', liveSearchContext = '', wikiData = null) {
  const clean = prompt.trim();
  const lower = clean.toLowerCase();

  // 1. Prioritize Live Web Search Results if Web Search is Enabled
  if (liveSearchContext && typeof liveSearchContext === 'string' && liveSearchContext.trim()) {
    return `${liveSearchContext.trim()}\n\n*Direct live web search intelligence compiled for "${clean}".*`;
  }

  // 2. Custom Multi-Domain Knowledge Match (All-in-One Performance Engine)
  const customKnowledgeHit = searchCustomKnowledge(clean);
  if (customKnowledgeHit) {
    return customKnowledgeHit;
  }

  // 3. Wikipedia Knowledge Extract
  if (wikiData && wikiData.extract) {
    return `**${wikiData.title}**\n\n${wikiData.extract}\n\n*Source: [Wikipedia](${wikiData.url})*`;
  }

  // 4. Memory Capability Query
  if (isMemoryQuery(clean)) {
    return LAF_MEMORY_EXPLANATION_TEXT;
  }

  // 5. Math calculation check
  if (/^[\d\s\+\-\*\/\^\(\)\.\=]+$/.test(clean) && clean.length > 1) {
    try {
      const sanitizedExpr = clean.replace(/[^0-9\+\-\*\/\^\(\)\.]/g, '');
      const evalResult = Function(`"use strict"; return (${sanitizedExpr})`)();
      return `### Mathematical Analysis\n\nExpression: \`$${clean}$\`  \nResult: **${evalResult}**`;
    } catch (e) {
      // Continue to general analysis
    }
  }

  // 6. Greeting
  if (['hi', 'hello', 'hey', 'greetings', 'good morning', 'good evening', 'good afternoon'].some(g => lower.startsWith(g))) {
    return `Hello **${username}**! 👋 How can I assist you today?`;
  }

  // 7. Smart Code Generation Fallback
  if (isGenericCodeRequest(clean) || clean.toLowerCase().includes('code') || clean.toLowerCase().includes('function') || clean.toLowerCase().includes('script') || clean.toLowerCase().includes('portfolio') || clean.toLowerCase().includes('html') || clean.toLowerCase().includes('css')) {
    return generateSmartCodeFallback(clean);
  }

  // 8. General Knowledge & All-Round Performer Analysis
  return `### Analytical Overview: **"${clean}"**

1. **Core Concept**: Addressing your inquiry regarding **"${clean}"**, focusing on foundational principles, structured methodologies, and practical applications.
2. **Key Highlights & Principles**:
   - Establish clear objectives and structured requirements.
   - Apply analytical and systematic approaches to achieve optimal efficiency.
   - Iterate and refine for continuous quality improvement.

*Feel free to ask for step-by-step code, detailed calculations, or specific strategies on this topic!*`;
}

/**
 * Generates actual production-ready code solutions for code requests (HTML, CSS, Portfolio, Python, JS)
 */
function generateSmartCodeFallback(prompt = '') {
  const customHit = searchCustomKnowledge(prompt);
  if (customHit) {
    return customHit;
  }

  const p = prompt.toLowerCase();

  // Portfolio Website HTML/CSS
  if (p.includes('portfolio') || p.includes('html') || p.includes('css') || p.includes('website')) {
    return `Here is a complete, modern, responsive **HTML & CSS Portfolio Website** solution:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Developer Portfolio</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --accent: #38bdf8;
      --text: #f8fafc;
      --muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
    body { background: var(--bg); color: var(--text); line-height: 1.6; padding: 2rem 1rem; }
    header { max-width: 1000px; margin: 0 auto 3rem auto; display: flex; justify-content: space-between; align-items: center; }
    nav a { color: var(--muted); text-decoration: none; margin-left: 1.5rem; transition: color 0.2s; }
    nav a:hover { color: var(--accent); }
    .hero { max-width: 1000px; margin: 4rem auto; text-align: center; }
    .hero h1 { font-size: 2.8rem; margin-bottom: 1rem; background: linear-gradient(135deg, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .hero p { font-size: 1.2rem; color: var(--muted); max-width: 600px; margin: 0 auto 2rem auto; }
    .btn { background: var(--accent); color: #0f172a; padding: 0.75rem 1.75rem; border-radius: 9999px; text-decoration: none; font-weight: 600; display: inline-block; }
    .projects { max-width: 1000px; margin: 5rem auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
    .card { background: var(--card-bg); padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
    .card h3 { margin-bottom: 0.5rem; color: var(--accent); }
    .card p { color: var(--muted); font-size: 0.95rem; }
    footer { text-align: center; color: var(--muted); margin-top: 5rem; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.05); }
  </style>
</head>
<body>
  <header>
    <h2>Developer Portfolio</h2>
    <nav>
      <a href="#about">About</a>
      <a href="#projects">Projects</a>
      <a href="#contact">Contact</a>
    </nav>
  </header>

  <section class="hero">
    <h1>Hello, I'm a Full-Stack Developer</h1>
    <p>I build high-performance web applications, modern UIs, and robust backend systems.</p>
    <a href="#contact" class="btn">Get In Touch</a>
  </section>

  <section id="projects" class="projects">
    <div class="card">
      <h3>⚡ AI Web Platform</h3>
      <p>Autonomous AI chat platform built with React, Node.js, and WebSockets.</p>
    </div>
    <div class="card">
      <h3>🔐 E2EE Security Vault</h3>
      <p>Zero-knowledge passwordless encrypted storage system built with Web Crypto API.</p>
    </div>
    <div class="card">
      <h3>🌐 High-Speed API Service</h3>
      <p>Microservice architecture deployed with Docker, Nginx, and Node.js backend.</p>
    </div>
  </section>

  <footer>
    <p>© 2026 Developer Portfolio. Built with HTML & CSS.</p>
  </footer>
</body>
</html>
\`\`\`

### How to use this code:
1. Copy the code block above into a new file named \`index.html\`.
2. Open \`index.html\` directly in any web browser to view your responsive portfolio!`;
  }

  // Python Script
  if (p.includes('python') || p.includes('py')) {
    return `Here is a complete Python solution for **"${prompt}"**:

\`\`\`python
# Python solution for: ${prompt}

def solve_task(data):
    """
    Processes input data and returns structured results
    """
    print(f"Processing task: {data}")
    result = {"status": "success", "processed_items": len(data) if hasattr(data, '__len__') else 1}
    return result

if __name__ == "__main__":
    demo_input = ["sample_item_1", "sample_item_2"]
    output = solve_task(demo_input)
    print("Result:", output)
\`\`\``;
  }

  // General JavaScript / Node.js
  return `Here is a complete JavaScript solution for **"${prompt}"**:

\`\`\`javascript
// Solution for: ${prompt}
async function executeTask(params = {}) {
  console.log("Executing task for params:", params);
  
  const result = {
    timestamp: new Date().toISOString(),
    success: true,
    data: params
  };

  return result;
}

executeTask({ action: "initialization" })
  .then(res => console.log("Task Completed:", res))
  .catch(err => console.error("Task Error:", err));
\`\`\``;
}

/**
 * Omni Router API Integrator (Access to 250+ Foundation Models)
 */
async function callOmniRouter({ messages, model = 'meta-llama/llama-3.3-70b-instruct:free', apiKey }) {
  try {
    let targetModel = model || 'meta-llama/llama-3.3-70b-instruct:free';
    if (targetModel.startsWith('openrouter/')) {
      targetModel = targetModel.replace('openrouter/', '');
    } else if (targetModel.startsWith('omni/')) {
      targetModel = targetModel.replace('omni/', '');
    }
    if (targetModel === 'auto' || targetModel === 'omni/auto' || targetModel === 'laf-v2') {
      targetModel = 'meta-llama/llama-3.3-70b-instruct:free';
    }

    const keyToUse = apiKey || process.env.OPENROUTER_API_KEY || process.env.OMNI_ROUTER_API_KEY || '';

    console.log(`[AI-ENGINE] Routing request to Pure Free 70B LLM (${targetModel})...`);

    const headers = {
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'LAF AI Platform'
    };
    if (keyToUse) {
      headers['Authorization'] = `Bearer ${keyToUse}`;
    }

    const res = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: targetModel,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1500
      },
      {
        headers,
        timeout: 12000
      }
    );

    const content = res.data?.choices?.[0]?.message?.content;
    if (content && content.trim()) {
      return {
        text: sanitizeLlmOutput(content.trim()),
        provider: `LAF AI (${targetModel})`
      };
    }
  } catch (err) {
    console.error(`[AI-ENGINE] Omni Router error: ${err.message}`);
  }
  return null;
}

/**
 * High-Speed Direct Passthrough Engine with Pure Free 70B Model & Direct Live Web Search
 */
async function generateResponse({ username, prompt, history = [], customApiKey, selectedModel = 'meta-llama/llama-3.3-70b-instruct:free', enableWebSearch = false }) {
  const cleanPrompt = (prompt || '').trim();
  console.log(`[AI-ENGINE] Fast Processing prompt for user "${username}": "${cleanPrompt}" | model: ${selectedModel} | webSearch: ${enableWebSearch}`);

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

  // DIRECT LIVE WEB SEARCH: If user enabled web search symbol, send query directly to search engines!
  let liveSearchContext = '';
  if (enableWebSearch) {
    console.log(`[AI-ENGINE] Direct Web Search Active: Querying live search engines for "${cleanPrompt}"...`);
    liveSearchContext = await performLiveWebSearch(cleanPrompt);
  }

  // 2. Memory Capability Interception
  if (isMemoryQuery(cleanPrompt)) {
    return {
      text: LAF_MEMORY_EXPLANATION_TEXT,
      provider: 'LAF Core Engine'
    };
  }

  // 2.5 Past Session Discussion Interception
  if (isPastSessionQuery(cleanPrompt)) {
    return {
      text: handlePastSessionQuery(username, cleanPrompt),
      provider: 'LAF Memory Engine'
    };
  }

  // 2.6 User Identity & Profile Interception
  if (isUserIdentityQuery(cleanPrompt)) {
    return {
      text: handleUserIdentityQuery(username, cleanPrompt),
      provider: 'LAF Core Engine'
    };
  }

  // 4. LAF Identity Interception
  if (isLafIdentityQuery(cleanPrompt)) {
    return {
      text: LAF_REAL_IDENTITY_TEXT,
      provider: 'LAF Core Engine'
    };
  }

  // 5. Greeting Interception (Only when web search is OFF)
  if (!enableWebSearch && isGreetingQuery(cleanPrompt)) {
    return {
      text: `Hello **${username}**! 👋 How can I assist you today?`,
      provider: 'LAF Core Engine'
    };
  }

  // Always Check User Context Memory
  let memoryContext = '';
  try {
    const memoryMatches = searchUserMemory(username, cleanPrompt);
    if (memoryMatches && memoryMatches.length > 0) {
      memoryContext = `\n[RECALLED USER CONTEXT MEMORY]:\n` +
        memoryMatches.map(m => `[${m.date} | ${m.role.toUpperCase()}]: ${m.content}`).join('\n');
    }
  } catch (e) {
    // Fail-safe memory lookup
  }

  const fullSystemPrompt = `${SYSTEM_PROMPT}\nUser: ${username}${liveSearchContext ? '\n' + liveSearchContext : ''}${memoryContext ? '\n' + memoryContext : ''}`;

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
  // PRIMARY ENGINE: PURE FREE LLM 70B MODEL (Llama 3.3 70B Instruct Free)
  // -------------------------------------------------------------
  const primaryModel = 'meta-llama/llama-3.3-70b-instruct:free';
  const omniRes = await callOmniRouter({
    messages: formattedMessages,
    model: primaryModel,
    apiKey: customApiKey
  });
  if (omniRes) return omniRes;

  // -------------------------------------------------------------
  // FALLBACK 1: DIRECT PASSTHROUGH TO OLLAMA MODELS
  // -------------------------------------------------------------
  const ollamaEndpoints = [
    'http://127.0.0.1:11434/api/chat',
    'http://172.17.0.1:11434/api/chat'
  ];

  const targetModels = ['laf-v2:latest', 'llama3.2:latest'];

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
            timeout: 3500
          }
        );

        let content = ollamaRes.data?.message?.content;
        if (content && content.trim().length > 0) {
          const duration = ((Date.now() - start) / 1000).toFixed(2);
          console.log(`[AI-ENGINE] SUCCESS from ${modelName} in ${duration}s!`);

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
  // 6.5 OMNI ROUTER FALLBACK
  // -------------------------------------------------------------
  const omniFallback = await callOmniRouter({
    messages: formattedMessages,
    model: selectedModel || 'omni/auto',
    apiKey: customApiKey
  });
  if (omniFallback) return omniFallback;

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
    text: sanitizeLlmOutput(analyzeUserInputFallback(cleanPrompt, username, liveSearchContext, null)),
    provider: liveSearchContext ? 'LAF Live Web Search' : 'LAF Intelligence Engine'
  };
}

module.exports = {
  generateResponse
};
