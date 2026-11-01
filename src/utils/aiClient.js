/**
 * LAF Real-Time Client-Side AI Engine
 * Provides accurate, professional, and direct AI responses.
 * Powered by Google Gemini / Cloud Matrix with multi-tier fallbacks.
 */

import { searchCustomKnowledge } from './customKnowledge.js';
import { 
  idbSaveConversation, 
  idbDeleteConversation, 
  idbGetConversation, 
  idbGetAllConversations 
} from './indexedDbVault.js';

const LAF_DEVELOPER_TEXT = `I was developed by **Purushothaman**.\n\nYou can find more details on his [LinkedIn profile](https://www.linkedin.com/in/purushothaman-k-s-158900282/).`;

const LAF_REAL_IDENTITY_TEXT = `Hello! I am **LAF**, an AI assistant designed to help with software engineering, technical problem solving, and general tasks. How can I help you today?`;

const LAF_SYSTEM_INSTRUCTION = `You are a helpful, accurate, and professional AI assistant named LAF.

CRITICAL INSTRUCTIONS:
1. DIRECT & PROFESSIONAL ANSWERS: Answer questions directly and concisely. Do NOT begin responses with self-introductions, such as "I am LAF", "As an AI...", or grand proclamations like "Systems are fully operational".
2. NO ATTRIBUTION UNLESS EXPLICITLY ASKED: Do NOT mention who created, engineered, or architected you unless the user explicitly asks "who created you?" or "who is your developer?". Only if explicitly asked, state: "I was developed by Purushothaman."
3. NORMAL & PROFESSIONAL TONE: Speak naturally, politely, and professionally. Avoid pompous, robotic, theatrical, or repetitive phrasing. Never say "I am LAF" unless asked for your identity.
4. ACCURACY & HIGH QUALITY: Provide precise, well-structured, production-ready answers. Use GitHub-flavored markdown with clean syntax-highlighted code blocks, clear headings, and concise explanations.
5. TEMPORAL GROUNDING: Current year is 2026.
6. LAF ARCHITECTURE & TECHNOLOGY:
- Platform: LAF ("Look At Future") is an autonomous multimodal AI platform.
- Frontend: Modern responsive interface built with React 19, Vite, Tailwind-styled components adhering to 60-30-10 color harmony and WCAG 2.1 AAA accessibility, with client-side IndexedDB encrypted storage.
- Backend: High-performance Node.js and Express architecture with Helmet security headers, rate limiting, and SQLite3 audit persistence.
- Security & Privacy: Zero-knowledge architecture featuring End-to-End Encryption (AES-256-GCM with PBKDF2 key derivation), per-user isolated database partitioning, and real-time threat/jailbreak shields.
- AI & Reasoning Engine: Multi-model auto-routing with Google DeepMind Gemini Flash engines for sub-second inference, high-availability cloud fallback, and local Ollama (laf-v2 / llama3.2) support.
- Multimodal: High-resolution image generation (FLUX.1-HD / SDXL), audio synthesis (Web Speech TTS), and video motion previews.`;

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
    'hi laf', 'hello laf', 'hey laf', 'whats up', 'how are you', 'how r u',
    'good morning', 'good afternoon', 'good evening', 'hey bro', 'hello bro',
    'hi there', 'hello there', 'hey there'
  ];
  return greetings.includes(p);
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
  const promptWithNegatives = `${cleaned}, photorealistic, 8k resolution, masterpiece, professional photography, cinematic lighting --no watermark, text, logo, signature, label, brand`;
  const encoded = encodeURIComponent(promptWithNegatives);
  return `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true&private=true&enhance=true`;
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
 * Call Google Gemini API directly with multi-model automatic failover and multimodal attachment support
 */
async function callGeminiApi({ prompt, history, apiKey, username = '', attachment = null }) {
  const contents = [];
  if (Array.isArray(history) && history.length > 0) {
    history.slice(-8).forEach(h => {
      if (h.content && typeof h.content === 'string') {
        const parts = [];
        if (h.attachment?.data && (h.attachment.isImage || h.attachment.isPdf || h.attachment.mimeType === 'application/pdf' || h.attachment.mimeType?.startsWith('image/'))) {
          parts.push({
            inlineData: {
              mimeType: h.attachment.mimeType || (h.attachment.isPdf ? 'application/pdf' : 'image/jpeg'),
              data: h.attachment.data
            }
          });
        }
        if (h.attachment?.textContent) {
          parts.push({
            text: `[Attached File: ${h.attachment.name}]\n\`\`\`\n${h.attachment.textContent.substring(0, 10000)}\n\`\`\``
          });
        }
        parts.push({ text: h.content.substring(0, 2000) });
        contents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts
        });
      }
    });
  }

  const userParts = [];
  if (attachment) {
    if (attachment.data && (attachment.isImage || attachment.isPdf || attachment.mimeType === 'application/pdf' || attachment.mimeType?.startsWith('image/'))) {
      userParts.push({
        inlineData: {
          mimeType: attachment.mimeType || (attachment.isPdf ? 'application/pdf' : 'image/jpeg'),
          data: attachment.data
        }
      });
    } else if (attachment.textContent) {
      userParts.push({
        text: `--- ATTACHED FILE: ${attachment.name} (${attachment.mimeType || 'code/text'}) ---\n\`\`\`\n${attachment.textContent.substring(0, 50000)}\n\`\`\`\n`
      });
    }
  }

  const userPrompt = (prompt || '').trim() || (attachment ? (attachment.isImage ? 'Analyze and explain this image in detail. Describe its contents, any text, graphics, and key insights.' : (attachment.isPdf ? `Analyze this attached PDF document (${attachment.name}) in detail. Provide a comprehensive breakdown of its key contents, structure, insights, and actionable takeaways.` : `Analyze this attached file (${attachment.name}) and provide a comprehensive explanation, code/content breakdown, and suggestions.`)) : '');
  userParts.push({ text: userPrompt });

  contents.push({
    role: 'user',
    parts: userParts
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
      const timeoutId = setTimeout(() => controller.abort(), 12000);

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
export async function generateRealtimeResponse({ prompt, history = [], customApiKey = '', username = 'User', attachment = null }) {
  const cleanPrompt = (prompt || '').trim();

  // If there is NO attachment, allow quick conversational intercepts
  if (!attachment) {
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
        text: `![${cleanPrompt}](${url})\n\nImage generated successfully !`,
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
  }

  // 5. Primary Engine: Google Gemini (Fast, sub-second, accurate, professional, multimodal)
  const candidateGeminiKey = (customApiKey && (customApiKey.startsWith('AQ.') || customApiKey.startsWith('AIza')))
    ? customApiKey
    : (process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '');

  if (candidateGeminiKey) {
    try {
      const geminiText = await callGeminiApi({
        prompt: cleanPrompt,
        history,
        apiKey: candidateGeminiKey,
        username,
        attachment
      });

      let provider = 'LAF AI';
      if (attachment?.isImage) provider = 'LAF Vision Engine';
      else if (attachment) provider = 'LAF File Intelligence';

      return {
        text: geminiText,
        provider
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
 * Sanitizes messages before persisting to localStorage
 * Strips out large base64 attachments, binary audio/image dumps, and truncated payloads
 */
function sanitizeForLocalStorage(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.map(msg => {
    if (!msg) return msg;
    const copy = { ...msg };
    if (copy.attachment) {
      copy.attachment = {
        name: copy.attachment.name || 'Attachment',
        size: copy.attachment.size || 0,
        formattedSize: copy.attachment.formattedSize || '',
        mimeType: copy.attachment.mimeType || '',
        isImage: !!copy.attachment.isImage,
        // Preserve lightweight preview URL only if NOT a massive base64 data string
        previewUrl: (typeof copy.attachment.previewUrl === 'string' && copy.attachment.previewUrl.length < 500)
          ? copy.attachment.previewUrl
          : null
      };
    }
    // Cap oversized single message text (e.g. huge pasted log dumps) to 40KB
    if (copy.content && typeof copy.content === 'string' && copy.content.length > 40000) {
      copy.content = copy.content.substring(0, 40000) + '\n\n...[Content truncated for storage quota]';
    }
    return copy;
  });
}

/**
 * Self-healing localStorage writer with 4-tier progressive eviction
 * Ensures QuotaExceededError is permanently neutralized and never bubbles to the user interface
 */
function safeSetUserDb(key, db) {
  try {
    localStorage.setItem(key, JSON.stringify(db));
    return true;
  } catch (err) {
    console.warn(`[LAF Storage] Quota exceeded on key "${key}". Running self-healing eviction protocol...`);

    // Tier 1: Sanitize all conversations and cap to 30 messages per conversation
    try {
      db.conversations = (db.conversations || []).map(c => ({
        ...c,
        messages: sanitizeForLocalStorage(Array.isArray(c.messages) ? c.messages.slice(-30) : [])
      }));
      localStorage.setItem(key, JSON.stringify(db));
      console.log('[LAF Storage] Tier 1 eviction succeeded.');
      return true;
    } catch (e1) {}

    // Tier 2: Retain the 15 most recent conversations
    try {
      db.conversations = db.conversations.slice(0, 15);
      localStorage.setItem(key, JSON.stringify(db));
      console.log('[LAF Storage] Tier 2 eviction succeeded.');
      return true;
    } catch (e2) {}

    // Tier 3: Retain the active conversation + 5 most recent
    try {
      db.conversations = db.conversations.slice(0, 6);
      localStorage.setItem(key, JSON.stringify(db));
      console.log('[LAF Storage] Tier 3 eviction succeeded.');
      return true;
    } catch (e3) {}

    // Tier 4: Clear non-critical localStorage cache keys and keep top 2 conversations
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k !== key && (k.startsWith('laf_temp_') || k.startsWith('laf_profile_') || k.startsWith('laf_directives_'))) {
          localStorage.removeItem(k);
        }
      }
      db.conversations = db.conversations.slice(0, 2);
      localStorage.setItem(key, JSON.stringify(db));
      console.log('[LAF Storage] Tier 4 eviction succeeded.');
      return true;
    } catch (e4) {
      console.warn('[LAF Storage] Graceful fallback to memory/IndexedDB session.', e4?.message);
      return false;
    }
  }
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
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (!Array.isArray(parsed.conversations)) parsed.conversations = [];
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[LAF Storage] Corrupted local user DB detected. Reinitializing safe profile.', e?.message);
  }

  const initial = {
    username,
    createdAt: new Date().toISOString(),
    conversations: [],
    userPreferences: { theme: 'dark', conciseness: 'short' }
  };
  safeSetUserDb(key, initial);
  return initial;
}

export function saveLocalConversation(username, convId, title, messages) {
  if (!username) return null;
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

  // 1. Asynchronously persist full, uncapped conversation to IndexedDB (virtually unlimited quota)
  const fullConvRecord = {
    ...conv,
    messages: Array.isArray(messages) ? [...messages] : []
  };
  try {
    idbSaveConversation(username, fullConvRecord);
  } catch (e) {}

  // 2. Sanitize and cap messages for localStorage (avoiding quota limits)
  conv.messages = sanitizeForLocalStorage(messages);

  // 3. Persist safely with self-healing eviction
  const key = `laf_user_db_${username.toLowerCase()}`;
  safeSetUserDb(key, db);

  return conv;
}

export function deleteLocalConversation(username, convId) {
  if (!username || !convId) return;
  const db = getLocalUserDb(username);
  if (db) {
    db.conversations = (db.conversations || []).filter(c => c.id !== convId);
    safeSetUserDb(`laf_user_db_${username.toLowerCase()}`, db);
  }
  try {
    idbDeleteConversation(username, convId);
  } catch (e) {}
}

export async function loadFullConversationFromVault(username, convId) {
  if (!username || !convId) return null;
  try {
    const idbRecord = await idbGetConversation(username, convId);
    if (idbRecord && Array.isArray(idbRecord.messages) && idbRecord.messages.length > 0) {
      return idbRecord;
    }
  } catch (e) {}
  const db = getLocalUserDb(username);
  return db?.conversations?.find(c => c.id === convId) || null;
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
