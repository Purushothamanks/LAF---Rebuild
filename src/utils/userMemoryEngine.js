/**
 * LAF Autonomous User Context Memory Engine (Client-Side)
 * Automatically extracts, structure, sanitizes, persists, and recalls
 * personalized user context in the browser's zero-knowledge vault.
 */

export const CATEGORIES = {
  IDENTITY: 'identity',
  ROLE: 'role',
  TECH_STACK: 'tech_stack',
  PROJECT: 'project',
  PREFERENCE: 'preference',
  FACT: 'fact'
};

const FALSE_POSITIVE_ROLES = [
  'sorry', 'asking', 'testing', 'trying', 'wondering', 'confused', 'getting',
  'ready', 'happy', 'fine', 'good', 'okay', 'here', 'back', 'done', 'sure',
  'curious', 'looking', 'going', 'hoping', 'thinking'
];

/**
 * Autonomous heuristic NLP pattern extractor for personal user statements
 */
export function extractUserMemories(text = '') {
  if (!text || typeof text !== 'string') return [];
  const clean = text.trim();
  if (clean.length < 3 || clean.length > 2000) return [];

  // Reject questions asking about other things or hypothetical queries
  if (/^(?:can you|could you|how do i|what is|why is|is it|what if i were|pretend i am)\b/i.test(clean)) {
    return [];
  }

  const extracted = [];

  // 1. IDENTITY & NAME EXTRACTION
  const namePatterns = [
    /(?:my name is|i am called|call me|i'm called|my name's)\s+([A-Z][a-zA-Z0-9_\-\s]{1,30})/i,
    /(?:myself|this is)\s+([A-Z][a-zA-Z0-9_\-\s]{1,30})(?:\s+here|\s+speaking)?/i
  ];
  for (const regex of namePatterns) {
    const match = clean.match(regex);
    if (match && match[1]) {
      let val = match[1].replace(/[.,!?;]+$/, '').trim();
      val = val.replace(/[,;.]?\s+(?:and\s+)?(?:i\s+am|i'm|i\s+work|my\s+role|my\s+tech|my\s+project|i\s+build|i\s+prefer).*$/i, '').trim();
      const firstWord = val.split(' ')[0].toLowerCase();
      if (!FALSE_POSITIVE_ROLES.includes(firstWord) && val.length >= 2 && !/^(a|an|the|just|not)\b/i.test(val)) {
        extracted.push({
          category: CATEGORIES.IDENTITY,
          key: 'Preferred Name',
          value: val
        });
        break;
      }
    }
  }

  // 2. ROLE & OCCUPATION EXTRACTION
  const rolePatterns = [
    /(?:i work as(?: an?| the)?|i'm(?: an?| the)?|i am(?: an?| the)?|my role is(?: an?| the)?|my profession is)\s+([a-zA-Z0-9_\-\s/]+?(?:developer|engineer|architect|designer|student|scientist|manager|consultant|founder|ceo|cto|lead|programmer|analyst|creator|freelancer|researcher|specialist|dev))/i,
    /(?:i am studying|i study)\s+([a-zA-Z0-9_\-\s/]{3,50})/i
  ];
  for (const regex of rolePatterns) {
    const match = clean.match(regex);
    if (match && match[1]) {
      let val = match[1].replace(/[.,!?;]+$/, '').trim();
      val = val.replace(/[,;.]?\s+(?:and\s+)?(?:i\s+am|i'm|i\s+work|my\s+tech|my\s+project|i\s+build|i\s+prefer|and\s+my).*$/i, '').trim();
      const firstWord = val.split(' ')[0].toLowerCase();
      if (!FALSE_POSITIVE_ROLES.includes(firstWord) && val.length >= 3) {
        const cleanVal = val.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        extracted.push({
          category: CATEGORIES.ROLE,
          key: 'Role / Occupation',
          value: cleanVal
        });
        break;
      }
    }
  }

  // 3. TECH STACK & TOOLS EXTRACTION
  const techStackPatterns = [
    /(?:my tech stack is|our tech stack is|my stack is|i specialize in|i code in|i work with|i use|i'm using|we use|built with)\s+([a-zA-Z0-9_\-\s,.#+/]{3,120})/i,
    /(?:my primary (?:language|framework|database|stack) is)\s+([a-zA-Z0-9_\-\s,.#+/]{2,60})/i
  ];
  for (const regex of techStackPatterns) {
    const match = clean.match(regex);
    if (match && match[1]) {
      let val = match[1].replace(/[.,!?;]+$/, '').trim();
      val = val.replace(/[,;.]?\s+(?:and\s+)?(?:i\s+am|i'm|i\s+work|my\s+role|my\s+project|i\s+build|i\s+prefer).*$/i, '').trim();
      val = val.replace(/\s+(?:for my|to build|in my|every day|right now|currently).*$/i, '').trim();
      if (val.length >= 2 && !/^(it|that|this|something|nothing|them|anything)\b/i.test(val)) {
        extracted.push({
          category: CATEGORIES.TECH_STACK,
          key: 'Primary Tech Stack',
          value: val
        });
        break;
      }
    }
  }

  // 4. ACTIVE PROJECT EXTRACTION
  const projectPatterns = [
    /(?:i am building|i'm building|i am working on|i'm working on|my project is|my app is|developing an app called|working on a project called|my current project is)\s+([a-zA-Z0-9_\-\s.:/]{3,80})/i
  ];
  for (const regex of projectPatterns) {
    const match = clean.match(regex);
    if (match && match[1]) {
      let val = match[1].replace(/[.,!?;]+$/, '').trim();
      val = val.replace(/[,;.]?\s+(?:and\s+)?(?:i\s+am|i'm|i\s+work|my\s+tech|my\s+role|i\s+prefer).*$/i, '').trim();
      val = val.replace(/\s+(?:using|with|in|for|to)\s+.*$/i, '').trim();
      val = val.replace(/^(?:an?\s+)?(?:ai\s+)?(?:app|application|platform|tool|website|site|system|saas|project)\s+(?:called|named)\s+/i, '').trim();
      if (val.length >= 2 && !/^(it|something|an app|a project|this)\b/i.test(val)) {
        extracted.push({
          category: CATEGORIES.PROJECT,
          key: 'Active Project',
          value: val
        });
        break;
      }
    }
  }

  // 5. CODING & INTERACTION PREFERENCES
  const prefPatterns = [
    /(?:i prefer|always provide|always write|always give me|don't give me|never use|make sure your answers are|keep your responses)\s+([a-zA-Z0-9_\-\s.:/]{4,100})/i
  ];
  for (const regex of prefPatterns) {
    const match = clean.match(regex);
    if (match && match[1]) {
      let val = match[1].replace(/[.,!?;]+$/, '').trim();
      val = val.replace(/[,;.]?\s+(?:and\s+)?(?:i\s+am|i'm|my\s+project|my\s+tech).*$/i, '').trim();
      if (val.length >= 4) {
        extracted.push({
          category: CATEGORIES.PREFERENCE,
          key: 'Coding & Interaction Style',
          value: val
        });
        break;
      }
    }
  }

  // 6. LOCATION / TIMEZONE / GENERAL FACTS
  const locationPatterns = [
    /(?:i am based in|i live in|i'm from|i am located in|my location is)\s+([a-zA-Z0-9_\-\s,]{2,50})/i,
    /(?:my timezone is|i am in timezone)\s+([a-zA-Z0-9_\-\s/+]{2,30})/i
  ];
  for (const regex of locationPatterns) {
    const match = clean.match(regex);
    if (match && match[1]) {
      let val = match[1].replace(/[.,!?;]+$/, '').trim();
      val = val.replace(/[,;.]?\s+(?:and\s+)?(?:i\s+am|i'm|my\s+tech|my\s+project).*$/i, '').trim();
      if (val.length >= 2) {
        extracted.push({
          category: CATEGORIES.FACT,
          key: 'Location & Timezone',
          value: val
        });
        break;
      }
    }
  }

  return extracted;
}

/**
 * Merges newly extracted memories with existing memories in-place or returns updated list
 */
export function mergeUserMemories(existingList = [], newMemories = []) {
  if (!Array.isArray(existingList)) existingList = [];
  if (!Array.isArray(newMemories) || newMemories.length === 0) return existingList;

  const result = [...existingList];
  const now = new Date().toISOString();

  for (const item of newMemories) {
    if (!item || !item.key || !item.value) continue;

    const existingIdx = result.findIndex(m => 
      m.category === item.category && 
      m.key.toLowerCase() === item.key.toLowerCase()
    );

    if (existingIdx !== -1) {
      result[existingIdx] = {
        ...result[existingIdx],
        value: item.value,
        updatedAt: now
      };
    } else {
      result.unshift({
        id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        category: item.category || CATEGORIES.FACT,
        key: item.key,
        value: item.value,
        confidence: item.confidence || 0.95,
        source: 'chat',
        createdAt: now,
        updatedAt: now
      });
    }
  }

  return result;
}

/**
 * Format user context memories into system instructions block
 */
export function formatUserMemoriesForPrompt(memories = []) {
  if (!Array.isArray(memories) || memories.length === 0) return '';

  const lines = memories.map(m => `- ${m.key}: ${m.value}`);
  return `\n[LEARNED USER CONTEXT MEMORY]:\nYou are conversing with a verified user. LAF has autonomously learned the following persistent context about them across sessions:\n${lines.join('\n')}\nTailor all responses, default libraries, code style, and architectural advice to naturally align with this user context. Address them by name if their name is known.\n`;
}

/**
 * Detect if the user is asking what LAF knows about them
 */
export function isMemoryQuery(prompt = '') {
  const p = prompt.toLowerCase().trim().replace(/[?!.,]/g, '');
  const queries = [
    'what do you know about me',
    'what do u know about me',
    'who am i',
    'who am i to you',
    'tell me about me',
    'tell me about myself',
    'what is my name',
    'do you know my name',
    'what is my role',
    'what is my job',
    'what is my profession',
    'what is my tech stack',
    'what stack do i use',
    'what do i use',
    'what is my project',
    'what am i building',
    'what is my current project',
    'what are my preferences',
    'what do you remember about me',
    'what did you learn about me',
    'show my memory',
    'show my profile memory',
    'what context do you have on me',
    'my context memory',
    'what is in my memory vault',
    'do you remember me'
  ];
  return queries.some(q => p === q || p.startsWith(q));
}

/**
 * Detect if user wants to delete or forget a context memory
 */
export function isMemoryDeleteQuery(prompt = '') {
  const p = prompt.toLowerCase().trim().replace(/[?!.,]/g, '');
  const triggers = [
    'forget my project', 'forget my tech stack', 'forget my name',
    'forget who i am', 'clear my memory', 'forget everything about me',
    'delete my memory', 'wipe my context memory'
  ];
  return triggers.some(t => p.includes(t));
}

/**
 * Generate a friendly, rich Markdown response summarizing what LAF knows about the user
 */
export function buildMemoryRecallResponse(memories = [], username = 'User') {
  if (!Array.isArray(memories) || memories.length === 0) {
    return `### 🧠 LAF Context Memory Vault\n\nI don't have any saved personal facts or context stored for **@${username}** yet.\n\nAs we chat, whenever you share your:\n- **Preferred Name** *(e.g., "My name is...")*\n- **Role / Occupation** *(e.g., "I work as a Full-Stack Engineer")*\n- **Tech Stack** *(e.g., "My tech stack is React, Tailwind, and Node.js")*\n- **Active Projects** *(e.g., "I'm building an AI app called...")*\n- **Preferences & Directives** *(e.g., "Always write TypeScript")*\n\nI will autonomously remember them and adapt every response to your specific workflow! You can also manage or add memories anytime in your **Memory Vault**.`;
  }

  const categoryIcons = {
    [CATEGORIES.IDENTITY]: '👤',
    [CATEGORIES.ROLE]: '💼',
    [CATEGORIES.TECH_STACK]: '⚡',
    [CATEGORIES.PROJECT]: '🚀',
    [CATEGORIES.PREFERENCE]: '⚙️',
    [CATEGORIES.FACT]: '📌'
  };

  const listItems = memories.map(m => {
    const icon = categoryIcons[m.category] || '🔹';
    return `- ${icon} **${m.key}**: \`${m.value}\``;
  }).join('\n');

  return `### 🧠 What LAF Knows About You (@${username})\n\nHere is your current active context memory that I use to personalize your experience:\n\n${listItems}\n\n*All context memories are cryptographically isolated to your account. You can view, edit, add, or wipe them anytime in the **Memory Vault**.*`;
}
