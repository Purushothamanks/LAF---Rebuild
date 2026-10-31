/**
 * LAF Real-Time Client-Side AI Engine
 * Provides accurate, professional, and direct AI responses.
 * Powered by Google Gemini / Cloud Matrix with multi-tier fallbacks.
 */

import { searchCustomKnowledge } from './customKnowledge.js';

const LAF_DEVELOPER_TEXT = `I was developed by **Purushothaman**.\n\nYou can find more details on his [LinkedIn profile](https://www.linkedin.com/in/purushothaman-k-s-158900282/).`;

const LAF_REAL_IDENTITY_TEXT = `Hello! I am **LAF**, an AI assistant designed to help with software engineering, technical problem solving, and general tasks. How can I help you today?`;

const LAF_SYSTEM_INSTRUCTION = `You are a helpful, accurate, and professional AI assistant named LAF.

CRITICAL INSTRUCTIONS:
1. DIRECT & PROFESSIONAL ANSWERS: Answer questions directly and concisely. Do NOT begin responses with self-introductions, such as "I am LAF", "As an AI...", or grand proclamations like "Systems are fully operational".
2. NO ATTRIBUTION UNLESS EXPLICITLY ASKED: Do NOT mention who created, engineered, or architected you unless the user explicitly asks "who created you?" or "who is your developer?". Only if explicitly asked, state: "I was developed by Purushothaman."
3. NORMAL & PROFESSIONAL TONE: Speak naturally, politely, and professionally. Avoid pompous, robotic, theatrical, or repetitive phrasing. Never say "I am LAF" unless asked for your identity.
4. ACCURACY & HIGH QUALITY: Provide precise, well-structured, production-ready answers. Use GitHub-flavored markdown with clean syntax-highlighted code blocks, clear headings, and concise explanations.
5. TEMPORAL GROUNDING: Current year is 2026.`;

export function getEffectiveSystemInstruction(username = '') {
  let customDirectivesText = '';
  if (typeof window !== 'undefined') {
    try {
      const key = `laf_directives_${(username || 'default').toLowerCase()}`;
      const saved = localStorage.getItem(key) || localStorage.getItem('laf_directives_default');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          customDirectivesText = `\n\nUSER ENGINEERING DIRECTIVES (ACTIVE):\n` + parsed.map((d, i) => `${i + 1}. ${d}`).join('\n');
        }
      }
    } catch (e) {}
  }
  return LAF_SYSTEM_INSTRUCTION + customDirectivesText;
}

export function isIdentityQuery(prompt = '') {
  const p = prompt.toLowerCase().trim().replace(/[?!.,]/g, '');
  const triggers = [
    'who are you', 'who r u', 'who r you', 'what are you', 'what r u',
    'what is your name', 'tell me about yourself', 'introduce yourself',
    'who is laf', 'what is laf', 'what is mean by laf', 'what does laf stand for',
    'full form of laf', 'laf full form', 'meaning of laf'
  ];
  return triggers.some(t => p === t || p.includes(t));
}

export function isDeveloperQuery(prompt = '') {
  const p = prompt.toLowerCase().trim();
  const devPhrases = [
    'who is your developer', 'who is the developer', 'who developed laf', 'who created laf',
    'who built laf', 'who made laf', 'who is your creator', 'who created you', 'who developed you',
    'who built you', 'who made you', 'developer of laf', 'creator of laf', 'who is behind laf'
  ];
  return devPhrases.some(phrase => p.includes(phrase));
}

export function isGreetingQuery(prompt = '') {
  const p = prompt.toLowerCase().trim().replace(/[?!.,]/g, '');
  const greetings = [
    'hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening', 'yo', 'sup',
    'hi laf', 'hello laf', 'hey laf'
  ];
  return greetings.includes(p) || p.startsWith('hi ') || p.startsWith('hello ') || p.startsWith('hey ');
}

export function getDynamicTemporalResponse() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const year = now.getFullYear();
  return `We are currently in the year **${year}** (Today is **${dateStr}**).\n\nLAF (Look At The Future) operates on real-time temporal grounding.`;
}

export function isTemporalQuery(prompt = '') {
  const p = prompt.toLowerCase().trim().replace(/[?!.,]/g, '');
  const queries = [
    'what year are we in', 'what year is it', 'what is the year', 'current year',
    'which year are we in', 'what year we are now', 'what year is now',
    'what is the current year', 'what is current year', 'year now', 'what year are we now',
    'what is the year now', 'which year is now', 'what is our current year', 'what year',
    'what is today date', 'what is today\'s date', 'today date', 'current date',
    'what is the date today', 'what is the date', 'what date is today', 'date today',
    'todays date', 'which date is today'
  ];
  return queries.some(q => p === q || p.includes(q));
}

export function isImageQuery(prompt = '') {
  const p = prompt.toLowerCase().trim();
  const imageVerbs = ['generate', 'create', 'make', 'draw', 'paint', 'render', 'sketch', 'design', 'show me'];
  const imageNouns = ['image', 'picture', 'photo', 'drawing', 'painting', 'wallpaper', 'illustration', 'sketch', 'portrait'];
  return imageVerbs.some(v => p.includes(v)) && imageNouns.some(n => p.includes(n));
}

export function generateImageUrl(promptText) {
  const cleaned = promptText
    .replace(/^please\s+/i, '')
    .replace(/^(generate|create|make|draw|paint|render|sketch)\s+(an?\s+)?/i, '')
    .replace(/^(image|picture|photo)\s+(of|for)?\s*/i, '')
    .trim() || promptText;
  const seed = Math.floor(Math.random() * 10000000);
  const encoded = encodeURIComponent(`${cleaned}, 8k resolution, photorealistic, cinematic lighting`);
  return `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;
}

function sanitizeLafResponse(text = '') {
  if (!text) return '';
  let cleaned = text
    .replace(/^Systems are fully operational[\s\S]*?let's begin\.\s*/i, '')
    .replace(/^I am LAF AI[\s\S]*?engineering standards\.\s*/i, '')
    .replace(/^(Hello!\s*)?I am (LAF AI|LAF)[\s\S]*?(engineered|architected) by Purushothaman\.\s*/i, '')
    .replace(/^(Hello!\s*)?I am Gemini[\s\S]*?built by Google\.\s*/i, '')
    .replace(/^(Hello!\s*)?I am (LAF AI|LAF),?\s*(an autonomous|\(Look At Future\))[^.\n]*\.\s*/i, '')
    .replace(/^Output:\s*/i, '')
    .replace(/<THOUGHT>[\s\S]*?<\/THOUGHT>/gi, '')
    .replace(/<THINKING>[\s\S]*?<\/THINKING>/gi, '')
    .trim();
  return cleaned || text.trim();
}

const CANDIDATE_GEMINI_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
  'gemini-flash-latest',
  'gemini-3.8-flash'
];

/**
 * Call Google Gemini API directly with multi-model automatic failover
 */
async function callGeminiApi({ prompt, history, apiKey, username = '' }) {
  const contents = [];
  if (Array.isArray(history) && history.length > 0) {
    history.slice(-8).forEach(h => {
      if (h.content && typeof h.content === 'string') {
        contents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content.substring(0, 2000) }]
        });
      }
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  const body = {
    systemInstruction: {
      parts: [{ text: getEffectiveSystemInstruction(username) }]
    },
    contents,
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 4096
    }
  };

  let lastErr = null;

  for (const modelName of CANDIDATE_GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        continue;
      }

      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText && rawText.trim()) {
        return sanitizeLafResponse(rawText.trim());
      }
    } catch (err) {
      lastErr = err;
      continue;
    }
  }

  throw lastErr || new Error('All Gemini candidate models failed to return content');
}

/**
 * Generate real-time AI response directly from client
 */
export async function generateRealtimeResponse({ prompt, history = [], customApiKey = '', username = 'User' }) {
  const cleanPrompt = (prompt || '').trim();

  // 1. Direct Greetings (Normal, polite, no robotic speeches)
  if (isGreetingQuery(cleanPrompt)) {
    return { text: 'Hello! How can I help you today?', provider: 'LAF AI' };
  }

  // 2. Identity & Developer Queries (Only answered when explicitly asked)
  if (isDeveloperQuery(cleanPrompt)) {
    return { text: LAF_DEVELOPER_TEXT, provider: 'LAF AI' };
  }

  if (isIdentityQuery(cleanPrompt)) {
    return { text: LAF_REAL_IDENTITY_TEXT, provider: 'LAF AI' };
  }

  if (isTemporalQuery(cleanPrompt)) {
    return {
      text: getDynamicTemporalResponse(),
      provider: 'LAF AI'
    };
  }

  // 3. Image Generation
  if (isImageQuery(cleanPrompt)) {
    const url = generateImageUrl(cleanPrompt);
    return {
      text: `![${cleanPrompt}](${url})\n\n*Generated via LAF Image Engine.*`,
      provider: 'LAF Image Engine'
    };
  }

  // 4. Built-in Verified Knowledge Base (Direct answers to algorithms, interview questions, etc.)
  const directKnowledge = searchCustomKnowledge(cleanPrompt);
  if (directKnowledge) {
    return {
      text: directKnowledge,
      provider: 'LAF AI'
    };
  }

  // 5. Primary Engine: Google Gemini (Fast, sub-second, accurate, professional)
  const candidateGeminiKey = (customApiKey && (customApiKey.startsWith('AQ.') || customApiKey.startsWith('AIza')))
    ? customApiKey
    : (process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '');

  if (candidateGeminiKey) {
    try {
      const geminiText = await callGeminiApi({
        prompt: cleanPrompt,
        history,
        apiKey: candidateGeminiKey,
        username
      });
      return {
        text: geminiText,
        provider: 'LAF AI'
      };
    } catch (geminiErr) {
      console.warn('Gemini candidate chain note:', geminiErr.message);
    }
  }

  // 6. User Custom OpenAI Key (if starting with sk-)
  if (customApiKey && customApiKey.startsWith('sk-')) {
    try {
      const messages = [
        { role: 'system', content: getEffectiveSystemInstruction(username) }
      ];
      if (Array.isArray(history)) {
        history.slice(-6).forEach(h => {
          if (h.content) {
            messages.push({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content.substring(0, 1000) });
          }
        });
      }
      messages.push({ role: 'user', content: cleanPrompt });

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.6,
          max_tokens: 3000
        })
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          return { text: sanitizeLafResponse(content.trim()), provider: 'OpenAI (Custom Key)' };
        }
      }
    } catch (e) {
      console.warn('Custom OpenAI Key note:', e.message);
    }
  }

  // 7. Secondary Cloud Engine: Pollinations AI (openai-fast with history preservation)
  try {
    const messages = [
      { role: 'system', content: getEffectiveSystemInstruction(username) }
    ];
    if (Array.isArray(history) && history.length > 0) {
      history.slice(-6).forEach(h => {
        if (h.content && typeof h.content === 'string') {
          messages.push({
            role: h.role === 'user' ? 'user' : 'assistant',
            content: h.content.substring(0, 1000)
          });
        }
      });
    }
    messages.push({ role: 'user', content: cleanPrompt });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        model: 'openai-fast',
        temperature: 0.5
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const text = await res.text();
      // Ensure rate limit strings or errors are not passed as legitimate AI answers
      if (
        text &&
        text.trim() &&
        !text.includes('Free limit reached') &&
        !text.includes('Please wait') &&
        !text.includes('pollen key') &&
        !text.includes('Rate limit')
      ) {
        return {
          text: sanitizeLafResponse(text.trim()),
          provider: 'LAF AI'
        };
      }
    }
  } catch (err) {
    console.warn('Pollinations fallback note:', err.message);
  }

  // 8. Simple, Normal Fallback
  return {
    text: `I'm ready to help with **"${cleanPrompt}"**. Could you please share a few more details or specific requirements so I can give you an exact solution?`,
    provider: 'LAF AI'
  };
}

/**
 * Client-Side Local Database Vault
 * Enables 100% functional auth and conversations even without a backend server
 */
export function getLocalUserDb(username) {
  if (!username) return null;
  const key = `laf_user_db_${username.toLowerCase()}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  const initial = {
    username,
    createdAt: new Date().toISOString(),
    conversations: [],
    userPreferences: { theme: 'dark', conciseness: 'short' }
  };
  localStorage.setItem(key, JSON.stringify(initial));
  return initial;
}

export function saveLocalConversation(username, convId, title, messages) {
  const db = getLocalUserDb(username);
  if (!db) return null;

  const now = new Date().toISOString();
  let conv = db.conversations.find(c => c.id === convId);
  if (!conv) {
    conv = {
      id: convId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: title || messages[0]?.content?.substring(0, 35) + '...' || 'New Chat',
      createdAt: now,
      updatedAt: now,
      messages: []
    };
    db.conversations.unshift(conv);
  } else {
    conv.updatedAt = now;
    if (title && title !== 'New Chat') conv.title = title;
  }

  conv.messages = messages;
  localStorage.setItem(`laf_user_db_${username.toLowerCase()}`, JSON.stringify(db));
  return conv;
}

export function deleteLocalConversation(username, convId) {
  const db = getLocalUserDb(username);
  if (!db) return;
  db.conversations = db.conversations.filter(c => c.id !== convId);
  localStorage.setItem(`laf_user_db_${username.toLowerCase()}`, JSON.stringify(db));
}

export function createLocalSession(username) {
  const clean = username.trim();
  const token = btoa(`${clean}|local_partition_${Date.now()}|${Date.now()}`);
  const db = getLocalUserDb(clean);
  return {
    token,
    user: {
      username: clean,
      conversationsCount: db.conversations.length,
      createdAt: db.createdAt,
      userPreferences: db.userPreferences
    }
  };
}

export function searchLocalMemory(username, query = '') {
  const db = getLocalUserDb(username);
  if (!db || !Array.isArray(db.conversations)) return [];
  const q = (query || '').toLowerCase().trim();
  if (!q) return [];

  const matches = [];
  for (const conv of db.conversations) {
    if (Array.isArray(conv.messages)) {
      for (const m of conv.messages) {
        if (m.content && typeof m.content === 'string' && m.content.toLowerCase().includes(q)) {
          matches.push({
            conversationTitle: conv.title || 'Conversation',
            conversationId: conv.id,
            date: new Date(conv.updatedAt || conv.createdAt).toLocaleDateString(),
            role: m.role || 'assistant',
            content: m.content
          });
        }
      }
    }
  }
  return matches;
}
