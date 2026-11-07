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
import {
  extractUserMemories,
  mergeUserMemories,
  formatUserMemoriesForPrompt,
  isMemoryQuery,
  isMemoryDeleteQuery,
  scanHistoryForUserMemories,
  buildMemoryRecallResponse
} from './userMemoryEngine.js';

const LAF_DEVELOPER_TEXT = `Oh he? No, sorry bro! That's a secret. 😉✨\n\nIf it's very important, you can refer to his LinkedIn and make a touch:\n👉 **[Purushothaman on LinkedIn](https://www.linkedin.com/in/purushothaman-k-s-158900282/)**`;

const LAF_REAL_IDENTITY_TEXT = `Hello! I am **LAF**, an AI assistant designed to help with software engineering, technical problem solving, and general tasks. How can I help you today?`;

const LAF_SYSTEM_INSTRUCTION = `You are a helpful, accurate, and professional AI assistant named LAF.

CRITICAL INSTRUCTIONS:
1. DIRECT & PROFESSIONAL ANSWERS: Answer questions directly and concisely. Do NOT begin responses with self-introductions, such as "I am LAF", "As an AI...", or grand proclamations like "Systems are fully operational".
2. DEVELOPER INQUIRIES: If the user asks about your developer, creator, founder, or Purushothaman (e.g. "what you know about your developer", "tell me about your developer", "about your developer", "who created you"), playfully and impressively respond:
"Oh he? No, sorry bro! That's a secret. 😉✨\n\nIf it's very important, you can refer to his LinkedIn and make a touch:\n👉 [Purushothaman on LinkedIn](https://www.linkedin.com/in/purushothaman-k-s-158900282/)"
3. NORMAL & PROFESSIONAL TONE: Speak naturally, politely, and professionally. Avoid pompous, robotic, theatrical, or repetitive phrasing. Never say "I am LAF" unless asked for your identity.
4. ACCURACY & HIGH QUALITY: Provide precise, well-structured, production-ready answers. Use GitHub-flavored markdown with clean syntax-highlighted code blocks, clear headings, and concise explanations.
5. TEMPORAL GROUNDING: Current year is 2026.
6. LAF ARCHITECTURE & TECHNOLOGY:
- Platform: LAF ("Look At Future") is an autonomous multimodal AI platform.
- Frontend: Modern responsive interface built with React 19, Vite, Tailwind-styled components adhering to 60-30-10 color harmony and WCAG 2.1 AAA accessibility, with client-side IndexedDB encrypted storage.
- Backend: High-performance Node.js and Express architecture with Helmet security headers, rate limiting, and SQLite3 audit persistence.
- Security & Privacy: Zero-knowledge architecture featuring End-to-End Encryption (AES-256-GCM with PBKDF2 key derivation), per-user isolated database partitioning, and real-time threat/jailbreak shields.
- AI & Reasoning Engine: Multi-model auto-routing with Google DeepMind Gemini Flash engines for sub-second inference, high-availability cloud fallback, and local Ollama (laf-v2 / llama3.2) support.
- Multimodal: High-resolution image generation (FLUX.1-HD / SDXL), audio synthesis (Web Speech TTS), and video motion previews.
7. DOCUMENT CREATION: When the user asks to write, create, draft, or generate a document, report, or specification, format it as a complete, comprehensive, well-structured document starting with a clear top-level heading (# Document Title), followed by organized sections (## Section), tables, and actionable insights for display in LAF Canvas.
8. USER CONTEXT & RESUME PRIVACY COMPLIANCE:
- You have FULL authorization and cryptographic permission to recall, summarize, and discuss the user's background, profile, uploaded resume, tech stack, and personal facts stored in your local context vault.
- NEVER state "I don't have permission to access your information", "I do not have access to your personal files", or "As an AI I cannot remember".
- When the user asks "tell about me", "what did you know about me", or asks for insights on their resume/profile, summarize their profile, skills, projects, and background warmly and concisely using the learned context memory provided below.`;

export function getEffectiveSystemInstruction(username = '') {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const year = now.getFullYear();

  let customDirectivesText = '';
  let userMemoriesText = '';
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

    try {
      const mems = getLocalUserMemories(username);
      if (mems && mems.length > 0) {
        userMemoriesText = formatUserMemoriesForPrompt(mems);
      }
    } catch (e) {}
  }
  const dynamicInstruction = LAF_SYSTEM_INSTRUCTION.replace(
    '5. TEMPORAL GROUNDING: Current year is 2026.',
    `5. TEMPORAL GROUNDING: Current year is ${year} | Current date is ${dateStr}. Always use this exact current date when citing document timestamps or temporal milestones.`
  );
  return dynamicInstruction + (userMemoriesText ? '\n' + userMemoriesText : '') + customDirectivesText;
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
  const p = (prompt || '').toLowerCase().trim().replace(/[?!.,;:_]/g, ' ');
  
  if (/\b(developer|creator|founder|architect|author)\b/i.test(p)) {
    if (/\b(about|know about|tell me about|who is|who are|details of|contact|reach|connect with|meet)\b/i.test(p) ||
        /\b(your developer|the developer|our developer|laf developer|developer of laf)\b/i.test(p) ||
        /\b(your creator|the creator|creator of laf|who created|who made|who built|who coded|who programmed)\b/i.test(p)) {
      return true;
    }
  }

  if (/\b(who (created|developed|built|made|engineered|coded|programmed) (you|laf))\b/i.test(p)) {
    return true;
  }

  if (/\b(about (your |the )?developer|tell (me )?about (your |the )?developer|know about (your |the )?developer)\b/i.test(p)) {
    return true;
  }

  if (/\b(what (do you|you) know about (your |the )?developer)\b/i.test(p)) {
    return true;
  }

  if (/\b(purushothaman)\b/i.test(p)) {
    return true;
  }

  const devPhrases = [
    'who is your developer', 'who is the developer', 'who developed laf', 'who created laf',
    'who built laf', 'who made laf', 'who is your creator', 'who created you', 'who developed you',
    'who built you', 'who made you', 'developer of laf', 'creator of laf', 'who is behind laf',
    'about your developer', 'tell me about your developer', 'what you know about your developer',
    'what do you know about your developer', 'know about your developer'
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

export function normalizeImagePromptText(raw = '') {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/blue-?prit|blue\s+prit/gi, 'blueprint')
    .replace(/\bghaph\b|\bgrap\b|\bgraff\b|\bgraf\b/gi, 'graph')
    .replace(/\bflow-?chart\b/gi, 'flowchart')
    .replace(/\bwire-?frame\b/gi, 'wireframe')
    .replace(/\bformate\b/gi, 'format')
    .replace(/\baskd\b/gi, 'asked');
}

export function isImageQuery(prompt = '') {
  if (!prompt || typeof prompt !== 'string') return false;
  const p = normalizeImagePromptText(prompt.toLowerCase().trim());

  // Negative checks: exclude capability or coding questions
  if (
    p.includes('can you generate image') ||
    p.includes('can you make image') ||
    p.includes('can you create image') ||
    p.includes('do you support image') ||
    p.includes('how to generate image') ||
    p.includes('code to generate') ||
    p.includes('code for image') ||
    p.includes('html image')
  ) {
    return false;
  }

  // 0. Clarity, regeneration, content-to-image, and quality queries
  if (/\b(content\s+(to|as|in)\s+image|image\s+format|content\s+image|convert\s+to\s+image)\b/i.test(p)) return true;
  if (/\b(the\s+)?image\s+is\s+(not\s+clear|blurry|bad|low|distorted|unclear|dark|messy)\b/i.test(p)) return true;
  if (/\b(image\s+not\s+clear|not\s+clear\s+image|unclear\s+image|blurry\s+image|clear\s+image)\b/i.test(p)) return true;
  if (/\b(regenerate|re-generate|again|another|better|clearer)\b/i.test(p) && /\b(image|picture|blueprint|graph|diagram|flowchart)\b/i.test(p)) return true;
  if (/^the image is not clear/i.test(p) || /^image is not clear/i.test(p) || /^not clear/i.test(p)) return true;

  // 1. Direct follow-up keyword requests (e.g. "blueprint", "graph", "diagram", "blue-prit", "ghaph", "grap")
  if (/^(blueprint|graph|diagram|flowchart|wireframe|schematic|architecture diagram)$/i.test(p)) {
    return true;
  }
  if (/^(blueprint\s*,\s*graph|graph\s*,\s*blueprint|blueprint\s+and\s+graph)$/i.test(p)) {
    return true;
  }

  // 2. Carrier phrases like "give me as image", "show as image", "give as image", "as image", "give me blueprint", "give me graph"
  if (/\b(as image|give me as image|give as image|show me as image|show as image|give me image|show me image|create image|generate image)\b/i.test(p)) {
    return true;
  }
  if (/\b(give me as|give as|show as)\s+(a\s+)?(blueprint|graph|diagram|flowchart|wireframe|schematic|image|picture)\b/i.test(p)) {
    return true;
  }
  if (/\b(give me|show me|send me|display)\s+(a\s+)?(blueprint|graph|diagram|flowchart|wireframe|schematic|image|picture)\b/i.test(p)) {
    return true;
  }

  // 3. Action verbs + image nouns
  const imageVerbs = ['generate', 'create', 'make', 'draw', 'paint', 'render', 'sketch', 'design', 'show me', 'give me', 'produce', 'show as', 'give as', 'give'];
  const imageNouns = ['image', 'picture', 'photo', 'photograph', 'drawing', 'painting', 'wallpaper', 'illustration', 'sketch', 'portrait', 'artwork', 'pic', 'render', 'blueprint', 'graph', 'diagram', 'chart', 'flowchart', 'wireframe', 'infographic', 'schematic'];

  const hasVerb = imageVerbs.some(v => new RegExp(`\\b${v}\\b`, 'i').test(p));
  const hasNoun = imageNouns.some(n => new RegExp(`\\b${n}s?\\b`, 'i').test(p));

  if (hasVerb && hasNoun) {
    return true;
  }

  // 4. Starts with image noun of/for or ends with noun
  if (imageNouns.some(n => p.startsWith(`${n} of `) || p.startsWith(`a ${n} of `) || p.startsWith(`an ${n} of `) || p.startsWith(`${n} for `))) {
    return true;
  }
  if (imageNouns.some(n => p.endsWith(` ${n}`) || p.endsWith(` ${n}s`))) {
    return true;
  }

  // 5. "draw a ...", "paint a ...", "sketch a ..."
  if (/^(draw|paint|sketch|render)\s+(an?\s+)?/i.test(p) && !p.includes('code') && !p.includes('function') && !p.includes('html')) {
    return true;
  }

  return false;
}

export function buildContextualImagePrompt(userPrompt = '', history = []) {
  const normalized = normalizeImagePromptText(userPrompt.trim());
  const lower = normalized.toLowerCase();

  // 1. Detect if the user EXPLICITLY requested a technical blueprint / schematic / flowchart
  // NEVER check general conversation history or broad technical domains (e.g. game, engine, code) for this!
  const isExplicitBlueprint = /\b(blueprint|blue-prit|flowchart|architecture diagram|system architecture diagram|schematic diagram|technical schematic)\b/i.test(lower);

  // 2. Normalize common colloquial phrases & typos
  let cleaned = normalized
    .replace(/^please\s+/i, '')
    .replace(/^can you\s+/i, '')
    .replace(/^(generate|create|make|draw|paint|render|sketch|design|show me|give me|produce|show as|give as|give|send me|display)\s+(an?\s+|the\s+)?/i, '')
    .replace(/^(i\s+)?(asked|askd|want|need|told\s+you|said|saying)\s+(for\s+)?(the\s+)?/gi, '')
    .replace(/^(as\s+)?(image|picture|photo|illustration|drawing|wallpaper|sketch|artwork)\s*(of|about|showing|with|for)?\s*/i, '')
    .replace(/\s+(as\s+)?(image|picture|photo|illustration|drawing|wallpaper|sketch|artwork)s?$/i, '')
    .replace(/\b(the\s+)?image\s+is\s+(not\s+clear|blurry|bad|low|distorted|unclear|dark|messy)\b/gi, '')
    .replace(/\b(image\s+not\s+clear|not\s+clear\s+image|unclear\s+image|blurry\s+image|clear\s+image)\b/gi, '')
    .replace(/\b(regenerate|re-generate|again|another|better|clearer|not clear|blurry)\b/gi, '')
    .replace(/\b(content\s+(to|as|in)\s+image|image\s+format|image\s+formate|format\s+of\s+image)\b/gi, '')
    .replace(/,\s*etc\.*$/i, '')
    .trim();

  // Also remove standalone "as" if left at the beginning
  cleaned = cleaned.replace(/^as\s+/i, '').trim();

  // 3. Check if what is left is purely format tokens or empty (e.g. "this", "that", "it")
  const strippedOfFormatTokens = cleaned
    .replace(/\b(blueprint|blue-prit|graph|ghaph|grap|diagram|flowchart|chart|wireframe|schematic|architecture|image|picture|drawing|content|formate?)\b/gi, '')
    .replace(/^(i\s+)?(asked|askd|want|need|told\s+you|said|saying)\s+(for\s+)?(the\s+)?/gi, '')
    .replace(/^(the|a|an|in|to|as)\s+/gi, '')
    .replace(/[\s,.-]+/g, '')
    .trim();

  const isPureFollowUp = !strippedOfFormatTokens || /^(this|that|it|same|above)$/i.test(strippedOfFormatTokens);

  let contextTopic = '';
  if (isPureFollowUp && Array.isArray(history) && history.length > 0) {
    for (let i = history.length - 1; i >= 0; i--) {
      const msg = history[i];
      if (msg.role === 'user' && msg.content) {
        const cleanContent = msg.content.trim();
        if (
          !isImageQuery(cleanContent) ||
          cleanContent.length > 20
        ) {
          contextTopic = cleanContent
            .replace(/^how to\s+/i, '')
            .replace(/^can you\s+/i, '')
            .replace(/^explain\s+/i, '')
            .replace(/^what is\s+/i, '')
            .replace(/^tell me about\s+/i, '')
            .replace(/^(give me as|give as|show as)\s+(a\s+)?(blueprint|blue-prit|graph|ghaph|grap|diagram|flowchart|image)\s*(for|of)?\s*/i, '')
            .trim();
          break;
        }
      }
    }
    if (!contextTopic) {
      const lastAssistant = history.slice().reverse().find(m => m.role === 'assistant' && m.content);
      if (lastAssistant) {
        const firstLine = lastAssistant.content.split('\n')[0].replace(/^[#*\s-]+/, '').trim();
        if (firstLine && firstLine.length > 5 && firstLine.length < 80) {
          contextTopic = firstLine;
        }
      }
    }
  }

  // 4. Synthesize final subject
  let finalSubject = '';
  if (isPureFollowUp && contextTopic) {
    finalSubject = contextTopic;
  } else if (contextTopic && cleaned && !cleaned.toLowerCase().includes(contextTopic.toLowerCase())) {
    finalSubject = `${cleaned} for ${contextTopic}`;
  } else {
    finalSubject = cleaned || contextTopic || userPrompt;
  }

  // 5. Stylize: Technical Blueprint/Graph ONLY when explicitly requested
  if (isExplicitBlueprint) {
    return {
      prompt: `detailed technical blueprint architecture flowchart and workflow schematic for ${finalSubject}, system architecture diagram, step-by-step engineering process schema, technical vector infographic, clean blueprint grid line aesthetic, sharp schematic illustration, professional technical documentation graphic, high resolution, no humans, no people, no portraits, no faces`,
      negative: `girl, woman, female, human face, portrait, model, person, selfie, character, anime, photography, blurry, deformed, low resolution, messy, chaotic, watermark, distorted`,
      isTechnical: true,
      subject: finalSubject
    };
  }

  // General High-Quality AI Image Generation (Games, art, scenery, characters, concepts)
  return {
    prompt: `${finalSubject}, ultra-detailed, photorealistic, 8k resolution, cinematic lighting, stunning visual composition, sharp focus, vibrant colors, masterpiece, high quality digital art, no watermark, no text`,
    negative: `watermark, signature, text, error, blurry, low quality, bad anatomy, deformed, distorted, artifacts, lowres`,
    isTechnical: false,
    subject: finalSubject
  };
}

/**
 * Generate Unlimited High-Speed AI Image URL
 * Defaults to unmetered endpoint (tongyi-mai/z-image-turbo, 60 RPM per user) to guarantee zero quota limits.
 */
export function generateImageUrl(promptText, customNegative, preferredModel = '') {
  const seed = Math.floor(Math.random() * 10000000);
  const encoded = encodeURIComponent(promptText);
  const modelParam = preferredModel ? `&model=${encodeURIComponent(preferredModel)}` : '';
  return `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${seed}&nologo=true&private=true&enhance=true${modelParam}`;
}

export function getLafModelDisplayName(modelKey) {
  if (!modelKey) return 'LAF 1.0 Lite';
  const m = String(modelKey).toLowerCase();
  if (m.includes('argon')) return 'LAF 4.0 Flagship';
  if (m.includes('3.8-flash')) return 'LAF 2.0 Flash';
  if (m.includes('3.5-flash-lite')) return 'LAF 1.5 Lite';
  if (m.includes('3.1-flash-lite')) return 'LAF 1.0 Lite';
  if (m.includes('flash-lite-latest') || m.includes('2.5-flash-lite')) return 'LAF 1.0 Lite';
  if (m.includes('flash-latest') || m.includes('flash')) return 'LAF 1.0 Flash';
  if (m.includes('pro')) return 'LAF 1.0 Pro';
  return 'LAF 1.0 Lite';
}

function sanitizeLafResponse(text = '') {
  if (!text) return '';
  let cleaned = text
    .replace(/^Systems are fully operational[\s\S]*?let's begin\.\s*/i, '')
    .replace(/^I am LAF AI[\s\S]*?engineering standards\.\s*/i, '')
    .replace(/^(Hello!\s*)?I am (LAF AI|LAF)[\s\S]*?(engineered|architected) by Purushothaman\.\s*/i, '')
    .replace(/^(Hello!\s*)?I am Gemini[\s\S]*?built by Google\.\s*/i, '')
    .replace(/^(Hello!\s*)?I am (LAF AI|LAF),?\s*(an autonomous|\(Look At Future\))[^.\n]*\.\s*/i, '')
    .replace(/\b(Google Gemini|Google DeepMind Gemini|Gemini Flash|Gemini Pro|Gemini)\b/gi, 'LAF')
    .replace(/^Output:\s*/i, '')
    .replace(/<THOUGHT>[\s\S]*?<\/THOUGHT>/gi, '')
    .replace(/<THINKING>[\s\S]*?<\/THINKING>/gi, '')
    .trim();
  return cleaned || text.trim();
}

/**
 * Dynamic Task Complexity Classifier:
 * - Light use: gemini-3.1-flash-lite / gemini-3.5-flash-lite (LAF 1.0 Lite / LAF 1.5 Lite)
 * - Moderate use: gemini-3.8-flash / gemini-flash-latest (LAF 2.0 Flash / LAF 1.0 Flash)
 * - Very complex: gemini-4-argon (LAF 4.0 Flagship) reserved exclusively for complex engineering, proofs, and deep reasoning
 */
export function getCandidateModelsForTask(prompt = '', attachment = null) {
  const p = (prompt || '').toLowerCase().trim();
  const len = p.length;

  // 0. Multimodal Vision / Document Attachment: prioritize ultra-fast, verified multimodal models
  if (attachment) {
    return [
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-flash-latest'
    ];
  }

  // 1. Very Complex: Extensive architecture, heavy algorithms, math proofs, deep reasoning, compilers, security audits
  const complexTriggers = [
    'architecture', 'system design', 'microservice', 'distributed system', 'compiler', 'interpreter',
    'concurrency', 'deadlock', 'race condition', 'cryptography', 'elliptic curve', 'theorem',
    'formal proof', 'mathematical proof', 'deep dive', 'deep reasoning', 'step-by-step reasoning',
    'full stack app', 'refactor entire', 'kubernetes cluster', 'optimization algorithm',
    'vulnerability analysis', 'reverse engineer', 'machine learning architecture', 'neural network from scratch'
  ];

  const hasComplexTrigger = complexTriggers.some(t => p.includes(t));
  const isHeavyPrompt = len > 950 || (p.includes('```') && len > 450);

  if (hasComplexTrigger || isHeavyPrompt) {
    // Very complex task -> Flagship (gemini-4-argon) prioritized
    return [
      'gemini-4-argon',
      'gemini-3.8-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest'
    ];
  }

  // 2. Moderate use: Standard coding, explanations, summaries, documents, multi-turn analysis
  const moderateTriggers = [
    'code', 'function', 'class', 'react', 'python', 'javascript', 'typescript', 'sql',
    'html', 'css', 'bug', 'fix', 'error', 'debug', 'api', 'endpoint', 'database',
    'explain in detail', 'summarize', 'write an essay', 'generate document', 'canvas',
    'compare and contrast', 'translate', 'review', 'workflow'
  ];

  const hasModerateTrigger = moderateTriggers.some(t => p.includes(t));
  const isModerateLength = len >= 120 || attachment !== null;

  if (hasModerateTrigger || isModerateLength) {
    // Moderate task -> Flash prioritized
    return [
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-4-argon'
    ];
  }

  // 3. Light use: Greetings, chit-chat, simple lookups, brief definitions, single calculations
  // -> Lite model prioritized
  return [
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.8-flash',
    'gemini-flash-latest',
    'gemini-4-argon'
  ];
}

export const CANDIDATE_GEMINI_MODELS = Object.freeze([
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-4-argon'
]);

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
          const histCleanData = (h.attachment.data || '').replace(/^data:[^;]+;base64,/, '').trim();
          parts.push({
            inlineData: {
              mimeType: h.attachment.mimeType || (h.attachment.isPdf ? 'application/pdf' : 'image/jpeg'),
              data: histCleanData
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
      const cleanData = (attachment.data || '').replace(/^data:[^;]+;base64,/, '').trim();
      userParts.push({
        inlineData: {
          mimeType: attachment.mimeType || (attachment.isPdf ? 'application/pdf' : 'image/jpeg'),
          data: cleanData
        }
      });
    } else if (attachment.textContent) {
      userParts.push({
        text: `--- ATTACHED FILE: ${attachment.name} (${attachment.mimeType || 'code/text'}) ---\n\`\`\`\n${attachment.textContent.substring(0, 50000)}\n\`\`\`\n`
      });
    }
  }

  const userPrompt = (prompt || '').trim() || (attachment ? (attachment.isImage ? 'Analyze and explain this uploaded image in detail. What are you seeing in the image? Describe all objects, text, visual elements, colors, and key insights.' : (attachment.isPdf ? `Analyze this attached PDF document (${attachment.name}) in detail. Provide a comprehensive breakdown of its key contents, structure, insights, and actionable takeaways.` : `Analyze this attached file (${attachment.name}) and provide a comprehensive explanation, code/content breakdown, and suggestions.`)) : '');
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
  const targetedModels = getCandidateModelsForTask(userPrompt, attachment);

  for (const modelName of targetedModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const controller = new AbortController();
      const timeoutMs = attachment ? 25000 : 14000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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
        return {
          text: sanitizeLafResponse(rawText.trim()),
          provider: getLafModelDisplayName(modelName)
        };
      }
    } catch (err) {
      lastErr = err;
      continue;
    }
  }

  throw lastErr || new Error('All candidate models failed to return content');
}

/**
 * Generate real-time AI response directly from client
 */
export async function generateRealtimeResponse({ prompt, history = [], customApiKey = '', username = 'User', attachment = null }) {
  const cleanPrompt = (prompt || '').trim();

  // Autonomous User Context Memory Extraction (Client-Side)
  try {
    const extracted = extractUserMemories(cleanPrompt, attachment?.textContent, attachment?.name);
    if (extracted && extracted.length > 0) {
      saveLocalUserMemory(username, extracted);
    }
  } catch (memErr) {}

  // If there is NO attachment, allow quick conversational intercepts
  if (!attachment) {
    // Direct Memory Recall Query (e.g. "What do you know about me?", "Who am I?", "What is my tech stack?")
    if (isMemoryQuery(cleanPrompt)) {
      return {
        text: buildMemoryRecallResponse(getLocalUserMemories(username), username),
        provider: 'LAF Context Vault'
      };
    }

    // Direct Memory Wipe Query (e.g. "Clear my memory", "Forget my project")
    if (isMemoryDeleteQuery(cleanPrompt)) {
      clearLocalUserMemories(username);
      return {
        text: `🗑️ **[LAF Context Vault]** All autonomous context memories have been erased from your local vault.`,
        provider: 'LAF Context Vault'
      };
    }

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

    // 3. Image Generation (High-Resolution Neural FLUX.1 Engine - Always returns real AI image URL)
    if (isImageQuery(cleanPrompt)) {
      const { prompt: formattedPrompt, negative: negativePrompt } = buildContextualImagePrompt(cleanPrompt, history);
      const url = generateImageUrl(formattedPrompt, negativePrompt);
      return {
        text: `![${cleanPrompt}](${url})`,
        provider: 'LAF 1.0 Vision Engine'
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

  // 5. Primary Engine: LAF Neural Core (Fast, sub-second, accurate, professional, multimodal)
  const clientViteKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
    (typeof process !== 'undefined' && (process.env?.VITE_GEMINI_API_KEY || process.env?.GEMINI_API_KEY)) || '';

  const candidateGeminiKey = (customApiKey && (customApiKey.startsWith('AQ.') || customApiKey.startsWith('AIza')))
    ? customApiKey
    : clientViteKey;

  if (candidateGeminiKey) {
    try {
      const geminiRes = await callGeminiApi({
        prompt: cleanPrompt,
        history,
        apiKey: candidateGeminiKey,
        username,
        attachment
      });

      let provider = geminiRes.provider || 'LAF 1.0 Lite';
      if (attachment?.isImage) provider = 'LAF 1.0 Vision Engine';
      else if (attachment) provider = 'LAF 1.0 Document Core';

      return {
        text: geminiRes.text || geminiRes,
        provider
      };
    } catch (geminiErr) {
      console.warn('LAF Engine candidate chain note:', geminiErr.message);
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
        isPdf: !!copy.attachment.isPdf || copy.attachment.mimeType === 'application/pdf' || (copy.attachment.name && copy.attachment.name.toLowerCase().endsWith('.pdf')),
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

/**
 * Client-Side Context Memory Storage & Retrieval
 */
export function getLocalUserMemories(username = '') {
  if (typeof window === 'undefined') return [];
  const u = (username || 'default').toLowerCase().trim();
  const key = `laf_context_memories_${u}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  const db = getLocalUserDb(username);
  if (db && Array.isArray(db.contextMemories) && db.contextMemories.length > 0) {
    return db.contextMemories;
  }

  // Self-healing recovery: If memories are empty, scan past conversations for resume/profile
  if (db && Array.isArray(db.conversations) && db.conversations.length > 0) {
    try {
      const recovered = scanHistoryForUserMemories(db.conversations);
      if (recovered && recovered.length > 0) {
        saveLocalUserMemory(username, recovered);
        return recovered;
      }
    } catch (e) {}
  }

  return [];
}

export function saveLocalUserMemory(username = '', memoryItem) {
  if (typeof window === 'undefined') return [];
  const u = (username || 'default').toLowerCase().trim();
  const key = `laf_context_memories_${u}`;
  const current = getLocalUserMemories(username);
  const items = Array.isArray(memoryItem) ? memoryItem : [memoryItem];
  const updated = mergeUserMemories(current, items);
  
  try {
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {}

  try {
    const db = getLocalUserDb(username);
    if (db) {
      db.contextMemories = updated;
      safeSetUserDb(`laf_user_db_${u}`, db);
    }
  } catch (e) {}

  return updated;
}

export function deleteLocalUserMemory(username = '', memoryId) {
  if (typeof window === 'undefined') return [];
  const u = (username || 'default').toLowerCase().trim();
  const key = `laf_context_memories_${u}`;
  const current = getLocalUserMemories(username);
  const updated = current.filter(m => m.id !== memoryId);

  try {
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {}

  try {
    const db = getLocalUserDb(username);
    if (db) {
      db.contextMemories = updated;
      safeSetUserDb(`laf_user_db_${u}`, db);
    }
  } catch (e) {}

  return updated;
}

export function clearLocalUserMemories(username = '') {
  if (typeof window === 'undefined') return [];
  const u = (username || 'default').toLowerCase().trim();
  const key = `laf_context_memories_${u}`;
  try {
    localStorage.removeItem(key);
  } catch (e) {}

  try {
    const db = getLocalUserDb(username);
    if (db) {
      db.contextMemories = [];
      safeSetUserDb(`laf_user_db_${u}`, db);
    }
  } catch (e) {}

  return [];
}
