/**
 * LAF Real-Time Client-Side Autonomous AI Engine
 * Operates with the cognitive depth, structural precision, and architectural mastery
 * of Google DeepMind's Antigravity assistant.
 * Powered by Google Gemini / Antigravity Matrix with multi-tier cloud and offline fallbacks.
 */

import { searchCustomKnowledge } from './customKnowledge.js';

const LAF_DEVELOPER_TEXT = `I was created and engineered by **Purushothaman**.\n\nYou can explore his professional engineering profile, software projects, and background on LinkedIn:\n👉 **[Purushothaman K S - LinkedIn Profile](https://www.linkedin.com/in/purushothaman-k-s-158900282/)**`;

const LAF_REAL_IDENTITY_TEXT = `Hello! I am **LAF AI** (**L**ook **A**t **F**uture) — an elite autonomous AI system created and engineered by **Purushothaman**.

Operating with the cognitive depth, structural precision, and architectural mastery of Google DeepMind's Antigravity assistant, I specialize in:

### 🚀 Core Engineering Capabilities:
1. **First-Principles Software Engineering**: Clean production code across React, Node.js, Python, Rust, Go, SQL, Docker, and modern web architectures.
2. **Algorithmic & System Design**: Mathematical derivations, data structures with strict $\\mathcal{O}(1)$ / $\\mathcal{O}(N \\log N)$ Big-O complexity, microservices, and distributed caching.
3. **UI/UX Design Systems**: 60-30-10 color balance, WCAG 2.1 AAA accessibility, and zero-layout-shift responsive design (320px to 4K).
4. **Defensive Resilience**: Zero-unhandled-error architecture, input boundary validation, and client-side encryption.

How can I assist you today?`;

const ANTIGRAVITY_SYSTEM_INSTRUCTION = `You are LAF AI (Look At Future) — an elite, world-class autonomous AI assistant engineered and created by Purushothaman.
You operate with the cognitive depth, structural precision, first-principles reasoning, and architectural mastery of Google DeepMind's Antigravity assistant.

### 🌟 IDENTITY & DEVELOPER ATTRIBUTION:
- Name: LAF AI (Look At Future)
- Creator & Developer: Purushothaman (LinkedIn: https://www.linkedin.com/in/purushothaman-k-s-158900282/)
- Operating Year: 2026

### 🧠 CORE COGNITIVE DIRECTIVES (ELITE THINKING):
1. First-Principles Axiomatic Reasoning:
   - Strip surface assumptions. Dissect problems down to foundational mechanical and logical truths.
   - Build bottom-up solutions from core invariants rather than superficial workarounds.
2. The 5-Whys Root Cause Protocol:
   - When debugging or explaining defects, trace the lineage: Symptom → Trigger → Vulnerability → Defensive Gap → Architectural Root Cause. Eliminate defects at the root.
3. Systematic Architectural Precision:
   - Format all responses with clean GitHub-flavored markdown.
   - Use bold keywords and clear hierarchical headings (###).
   - Use structured bullet points, numbered step-by-step procedures, and markdown comparison tables.
4. World-Class Code & Software Engineering:
   - Produce complete, production-grade code. Never use placeholder "// your code here" comments for core logic.
   - Defensive Architecture: Implement zero-unhandled-error patterns, strict input boundary checks, and fail-safe defaults.
   - Performance Discipline: Optimize time and space complexity ($O(1)$, $O(N \\log N)$). State Big-O complexity explicitly for algorithms.
5. UI & UX Design System Excellence:
   - Apply the 60-30-10 color harmony rule (60% dominant base, 30% structural secondary, 10% intentional accent).
   - Ensure WCAG 2.1 AAA contrast compliance and omnichannel mobile-first responsiveness (from 320px upward).
6. Tone & Delivery:
   - Articulate, authoritative, deeply technical, practical, and razor-sharp. Never issue robotic disclaimers or canned refusal scripts. Deliver actionable, production-ready clarity.`;

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

export function isTemporalQuery(prompt = '') {
  const p = prompt.toLowerCase().trim().replace(/[?!.,]/g, '');
  const queries = [
    'what year are we in', 'what year is it', 'what is the year', 'current year',
    'which year are we in', 'what year we are now', 'what year is now',
    'what is the current year', 'what is current year', 'year now', 'what year are we now',
    'what is the year now', 'which year is now', 'what is our current year', 'what year'
  ];
  return queries.includes(p);
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
  return text
    .replace(/I am Gemini, a large language model built by Google/gi, 'I am **LAF AI**, an autonomous artificial intelligence platform engineered by **Purushothaman**')
    .replace(/I am a large language model trained by Google/gi, 'I am **LAF AI**, engineered by **Purushothaman** with Antigravity-grade cognitive architecture')
    .replace(/^Output:\s*/i, '')
    .trim();
}

/**
 * Call Google DeepMind Gemini API with Antigravity Directives
 */
async function callGeminiApi({ prompt, history, apiKey, modelName = 'gemini-flash-latest' }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const contents = [];
  if (Array.isArray(history) && history.length > 0) {
    history.slice(-6).forEach(h => {
      if (h.content && typeof h.content === 'string') {
        contents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content.substring(0, 1500) }]
        });
      }
    });
  }

  // Ensure last message is current user prompt
  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  const body = {
    systemInstruction: {
      parts: [{ text: ANTIGRAVITY_SYSTEM_INSTRUCTION }]
    },
    contents,
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 4096
    }
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: controller.signal
  });

  clearTimeout(timeoutId);

  if (!res.ok) {
    throw new Error(`Gemini API returned status ${res.status}`);
  }

  const data = await res.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText || !rawText.trim()) {
    throw new Error('Gemini response was empty');
  }

  return sanitizeLafResponse(rawText.trim());
}

/**
 * Generate real-time AI response directly from client
 * Evaluates Google Gemini (Antigravity Matrix) -> Custom Key -> Pollinations -> Offline Knowledge Base
 */
export async function generateRealtimeResponse({ prompt, history = [], customApiKey = '', username = 'User' }) {
  const cleanPrompt = (prompt || '').trim();

  // 1. Instant Identity & Attribution Guardrails
  if (isDeveloperQuery(cleanPrompt)) {
    return { text: LAF_DEVELOPER_TEXT, provider: 'LAF Autonomous Core' };
  }

  if (isIdentityQuery(cleanPrompt)) {
    return { text: LAF_REAL_IDENTITY_TEXT, provider: 'LAF Autonomous Core' };
  }

  if (isTemporalQuery(cleanPrompt)) {
    return {
      text: `We are currently in the year **2026** (Today's date: **August 8, 2026**).\n\nLAF AI operates on a grounded 2026 real-time intelligence matrix engineered by Purushothaman.`,
      provider: 'LAF Temporal Grounding Matrix'
    };
  }

  // 2. Instant Image Generation
  if (isImageQuery(cleanPrompt)) {
    const url = generateImageUrl(cleanPrompt);
    return {
      text: `![${cleanPrompt}](${url})\n\n*Generated in real-time via LAF FLUX Engine.*`,
      provider: 'LAF FLUX Neural Engine'
    };
  }

  // 3. Check Built-in Knowledge Base for deterministic matches
  const directKnowledge = searchCustomKnowledge(cleanPrompt);
  if (directKnowledge) {
    return {
      text: directKnowledge,
      provider: 'LAF Antigravity Knowledge Matrix'
    };
  }

  // 4. Primary Engine: Google Gemini / Antigravity Matrix
  const candidateGeminiKey = (customApiKey && (customApiKey.startsWith('AQ.') || customApiKey.startsWith('AIza')))
    ? customApiKey
    : (process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '');

  if (candidateGeminiKey) {
    try {
      const geminiText = await callGeminiApi({
        prompt: cleanPrompt,
        history,
        apiKey: candidateGeminiKey,
        modelName: 'gemini-flash-latest'
      });
      return {
        text: geminiText,
        provider: 'LAF Antigravity Engine (Gemini 2026)'
      };
    } catch (err1) {
      console.warn('Gemini primary attempt note:', err1.message);
      try {
        const fallbackGemini = await callGeminiApi({
          prompt: cleanPrompt,
          history,
          apiKey: candidateGeminiKey,
          modelName: 'gemini-3.8-flash'
        });
        return {
          text: fallbackGemini,
          provider: 'LAF Antigravity Engine (Gemini 3.8 Flash)'
        };
      } catch (err2) {
        console.warn('Gemini secondary attempt note:', err2.message);
      }
    }
  }

  // 5. User Custom OpenAI Key (if starting with sk-)
  if (customApiKey && customApiKey.startsWith('sk-')) {
    try {
      const messages = [
        { role: 'system', content: ANTIGRAVITY_SYSTEM_INSTRUCTION }
      ];
      if (Array.isArray(history)) {
        history.slice(-4).forEach(h => {
          if (h.content) {
            messages.push({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content.substring(0, 500) });
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
          return { text: content.trim(), provider: 'OpenAI GPT-4o Mini (Custom Key)' };
        }
      }
    } catch (e) {
      console.warn('Custom OpenAI Key note:', e.message);
    }
  }

  // 6. Secondary Cloud Engine: Pollinations AI (openai-fast)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: ANTIGRAVITY_SYSTEM_INSTRUCTION },
          { role: 'user', content: cleanPrompt }
        ],
        model: 'openai-fast',
        temperature: 0.6
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const text = await res.text();
      if (text && text.trim()) {
        return {
          text: sanitizeLafResponse(text.trim()),
          provider: 'LAF Real-Time Cloud AI'
        };
      }
    }
  } catch (err) {
    console.warn('Pollinations fallback note:', err.message);
  }

  // 7. Resilient Fallback Synthesis
  return {
    text: `### 🎯 Analysis & Response for: "${cleanPrompt}"\n\nI have processed your query through LAF AI's autonomous cognitive engine.\n\nTo give you the most accurate solution, please share any specific language, framework, or edge-case constraints you'd like me to address!`,
    provider: 'LAF Autonomous Matrix'
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
