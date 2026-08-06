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
 * Direct Live Web Search Scraper (DuckDuckGo + Wikipedia)
 */
async function performLiveWebSearch(query = '') {
  const cleanQuery = query.trim();
  if (!cleanQuery) return '';

  const webResults = [];

  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery)}`;
    const ddgRes = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 5000
    });

    const regex = /class="result__snippet[^"]*"[^>]*>(.*?)<\/a>/gs;
    let match;
    let count = 0;
    while ((match = regex.exec(ddgRes.data)) !== null && count < 4) {
      const snippet = match[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
      if (snippet.length > 20) {
        count++;
        webResults.push(`[LIVE WEB SNIPPET #${count}]: ${snippet}`);
      }
    }
  } catch (err) {
    console.error('[WEB-SEARCH] DuckDuckGo search error:', err.message);
  }

  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQuery)}&limit=1&format=json`;
    const wikiRes = await axios.get(wikiUrl, {
      headers: { 'User-Agent': 'LAF-AI-Platform/1.2 (contact@laf.ai)' },
      timeout: 4000
    });
    const hits = wikiRes.data?.query?.search || [];
    if (hits.length > 0) {
      const title = hits[0].title;
      const sumUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
      const sumRes = await axios.get(sumUrl, {
        headers: { 'User-Agent': 'LAF-AI-Platform/1.2 (contact@laf.ai)' },
        timeout: 4000
      });
      if (sumRes.data && sumRes.data.extract) {
        webResults.push(`[VERIFIED WIKIPEDIA FACTS for "${sumRes.data.title}"]:\n${sumRes.data.extract}`);
      }
    }
  } catch (e) {}

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

    console.log(`[AI-ENGINE] Sending request to OmniRouter Free 70B Cloud Model (${targetModel})...`);

    const res = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: targetModel,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1500
      },
      { headers, timeout: 12000 }
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

  // 3. Direct Connection to Primary Google Gemma Model (google/gemma-2-9b-it:free)
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

  // Backup Gemma 27B Model
  const gemma27bRes = await callOmniRouter({
    messages: formattedMessages,
    model: 'google/gemma-2-27b-it',
    apiKey: customApiKey
  });
  if (gemma27bRes) {
    return {
      text: gemma27bRes.text,
      provider: enableWebSearch ? 'Google Gemma 27B + Web Search' : 'Google Gemma 27B'
    };
  }

  // Backup Free 70B Model
  const omniRes = await callOmniRouter({
    messages: formattedMessages,
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    apiKey: customApiKey
  });
  if (omniRes) return omniRes;

  // 5. Grounded Knowledge & Web Search Fallback
  const customHit = searchCustomKnowledge(cleanPrompt);
  if (customHit) {
    return {
      text: customHit,
      provider: 'LAF Intelligence Engine'
    };
  }

  return {
    text: liveSearchContext ? `${liveSearchContext}\n\n*Direct live web search compiled for "${cleanPrompt}".*` : `I have received your request regarding **"${cleanPrompt}"**. Please specify any additional details or requirements!`,
    provider: liveSearchContext ? 'LAF Live Web Search' : 'LAF Core Engine'
  };
}

module.exports = {
  generateResponse,
  performLiveWebSearch,
  callOmniRouter
};
