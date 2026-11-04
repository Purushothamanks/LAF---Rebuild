/**
 * LAF Autonomous User Context Memory Engine
 * Automatically extracts, structures, sanitizes, persists, and recalls
 * personalized user context (identity, role, tech stack, active projects, preferences, facts)
 * from both conversational chat, uploaded resumes (PDF/docs), and "about me" profile texts.
 */

const CATEGORIES = {
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
  'curious', 'looking', 'going', 'hoping', 'thinking', 'just', 'not'
];

function cleanValue(v) {
  return v ? v.replace(/[.,!?;]+$/, '').trim() : '';
}

/**
 * Deep resume & profile text parser
 * Extracts structured candidate identity, role, skills, projects, and contact info from resumes/CVs
 */
function parseResumeAndProfile(text = '') {
  if (!text || typeof text !== 'string') return [];
  const clean = text.trim();
  if (clean.length < 15) return [];

  const memories = [];
  const lines = clean.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // 1. EXTRACT NAME
  let detectedName = null;
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const line = lines[i];
    if (/^(resume|curriculum vitae|\bcv\b|page \d|contact|profile|portfolio|summary)/i.test(line)) continue;
    if (/@|http|\.com|\+?\d{10}/.test(line)) continue;

    const nameMatch = line.match(/^(?:name|candidate|profile of|full name)\s*[:\-]\s*([a-zA-Z\s.]+)/i);
    if (nameMatch && nameMatch[1]) {
      detectedName = nameMatch[1].trim();
      break;
    }

    if (/^[A-Za-z\s.]{3,40}$/.test(line) && line.split(/\s+/).length <= 5 && !/(developer|engineer|manager|resume|profile|summary|skills|experience|education)/i.test(line)) {
      detectedName = line.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      break;
    }
  }

  if (detectedName) {
    memories.push({
      category: CATEGORIES.IDENTITY,
      key: 'Candidate Name',
      value: detectedName
    });
  }

  // 2. EXTRACT ROLE / TITLE
  let detectedRole = null;
  const roleMatch = clean.match(/(?:role|title|position|designation|current role)\s*[:\-]\s*([a-zA-Z0-9_\-\s/]+)/i);
  if (roleMatch && roleMatch[1]) {
    detectedRole = roleMatch[1].split(/\r?\n/)[0].trim();
  } else {
    for (let i = 0; i < Math.min(lines.length, 8); i++) {
      const line = lines[i];
      if (/^(?:hi|hello|dear|hey|to|from|subject|template|re|fwd|inquiry)\b/i.test(line) || /\[.*\]/.test(line)) continue;
      if (/(developer|engineer|architect|designer|student|scientist|manager|consultant|founder|lead|programmer|analyst|devops|full[- ]?stack|frontend|backend)/i.test(line)) {
        if (!/^(experience|skills|summary|education|projects|certifications)/i.test(line) && line.length < 70) {
          detectedRole = line.replace(/^[|•\-\s]+/, '').trim();
          break;
        }
      }
    }
  }

  if (detectedRole && !/^(?:hi|hello|dear|hey|to|from|subject|template|re|fwd|inquiry)\b/i.test(detectedRole) && !/\[.*\]/.test(detectedRole)) {
    memories.push({
      category: CATEGORIES.ROLE,
      key: 'Role / Profession',
      value: detectedRole
    });
  }

  // 3. EXTRACT TECHNICAL SKILLS
  const skillsRegex = /(?:technical skills|skills|technologies|tech stack|core competencies|tools & technologies|languages & frameworks)\s*[:\-]?\s*([\s\S]*?)(?=(?:\r?\n\s*\r?\n\s*[A-Z]{3,}|experience|education|projects|certifications|work history|$))/i;
  const skillsBlock = clean.match(skillsRegex);
  if (skillsBlock && skillsBlock[1]) {
    const rawSkills = skillsBlock[1]
      .replace(/(?:languages|frontend|backend|frameworks|databases|tools|libraries|devops|cloud)\s*[:\-]/gi, '')
      .replace(/[\r\n•\-|]+/g, ', ')
      .split(/[,;]+/)
      .map(s => s.trim())
      .filter(s => s.length >= 2 && s.length <= 40 && !/^(and|or|etc|various|including)$/i.test(s));

    const uniqueSkills = [...new Set(rawSkills)].slice(0, 16);
    if (uniqueSkills.length > 0) {
      memories.push({
        category: CATEGORIES.TECH_STACK,
        key: 'Primary Tech Stack',
        value: uniqueSkills.join(', ')
      });
    }
  }

  // 4. EXTRACT RECENT PROJECTS
  const projectsRegex = /(?:projects|key projects|personal projects|notable projects)\s*[:\-]?\s*([\s\S]*?)(?=(?:\r?\n\s*\r?\n\s*[A-Z]{3,}|experience|education|skills|certifications|$))/i;
  const projectBlock = clean.match(projectsRegex);
  if (projectBlock && projectBlock[1]) {
    const projectLines = projectBlock[1]
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 3 && l.length < 80 && !/^(description|technologies|built with|features|github|link)/i.test(l));

    if (projectLines.length > 0) {
      const topProject = projectLines[0].replace(/^[•\-\d.)\s]+/, '').replace(/[:\-].*$/, '').trim();
      if (topProject.length >= 2) {
        memories.push({
          category: CATEGORIES.PROJECT,
          key: 'Active / Recent Project',
          value: topProject
        });
      }
    }
  }

  // 5. EXTRACT LOCATION
  const locMatch = clean.match(/(?:location|address|based in)\s*[:\-]\s*([a-zA-Z\s,]+)/i) ||
    clean.match(/\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?),\s*(India|USA|United States|UK|Canada|Germany|Tamil Nadu|California|Texas)\b/i);
  if (locMatch) {
    const loc = (locMatch[1] ? (locMatch[2] ? `${locMatch[1]}, ${locMatch[2]}` : locMatch[1]) : locMatch[0]).trim();
    if (loc.length >= 3 && loc.length <= 50) {
      memories.push({
        category: CATEGORIES.FACT,
        key: 'Location',
        value: loc
      });
    }
  }

  // 6. EXTRACT EMAIL
  const emailMatch = clean.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch && emailMatch[1]) {
    memories.push({
      category: CATEGORIES.FACT,
      key: 'Contact Email',
      value: emailMatch[1]
    });
  }

  return memories;
}

/**
 * Autonomous heuristic NLP pattern extractor for personal user statements & "about me" narratives
 */
function extractUserMemories(text = '', attachmentText = '', attachmentName = '') {
  const combined = [text, attachmentText].filter(Boolean).join('\n\n').trim();
  if (!combined || combined.length < 3) return [];

  // If text looks like a resume or document, run resume parser first
  const isResumeLike = 
    /(?:resume|curriculum vitae|\bcv\b|experience|education|technical skills|projects|summary|objective|employment)/i.test(combined) ||
    /resume|cv|profile|bio/i.test(attachmentName || '');

  let baseMemories = [];
  if (isResumeLike) {
    baseMemories = parseResumeAndProfile(combined);
  }

  // Reject queries asking about other things or hypothetical queries
  if (/^(?:can you|could you|how do i|what is|why is|is it|what if i were|pretend i am)\b/i.test(text.trim())) {
    return baseMemories;
  }

  const clean = combined;
  const extracted = [...baseMemories];

  const addMemory = (category, key, value, confidence = 0.95) => {
    const val = cleanValue(value);
    if (!val || val.length < 2) return;
    const exists = extracted.find(m => m.category === category && m.key.toLowerCase() === key.toLowerCase());
    if (exists) {
      exists.value = val;
    } else {
      extracted.push({ category, key, value: val, confidence });
    }
  };

  // 1. IDENTITY & NAME EXTRACTION
  const namePatterns = [
    /(?:my name is|i am called|call me|i'm called|my name's)\s+([A-Z][a-zA-Z0-9_\-\s]{1,30})/i,
    /(?:myself|this is)\s+([A-Z][a-zA-Z0-9_\-\s]{1,30})(?:\s+here|\s+speaking)?/i,
    /(?:about me\s*[:\-]?\s*(?:i am|myself|this is)?\s*)([A-Z][a-zA-Z0-9_\-\s]{1,30})/i,
    /(?:i am|i'm)\s+([A-Z][a-zA-Z]{1,20})\b(?!\s+(?:a|an|the|working|building|using|trying|studying|learning|going|looking|fine|good|ok|okay|sorry|here|back|done|not|ready|excited|confused|asking))/
  ];
  for (const regex of namePatterns) {
    const match = clean.match(regex);
    if (match && match[1]) {
      let val = match[1].replace(/[.,!?;]+$/, '').trim();
      val = val.replace(/[,;.]?\s+(?:and\s+)?(?:i\s+am|i'm|i\s+work|my\s+role|my\s+tech|my\s+project|i\s+build|i\s+prefer|living|based).*$/i, '').trim();
      const firstWord = val.split(' ')[0].toLowerCase();
      if (!FALSE_POSITIVE_ROLES.includes(firstWord) && val.length >= 2 && !/^(a|an|the|just|not)\b/i.test(val)) {
        addMemory(CATEGORIES.IDENTITY, 'Preferred Name', val);
        break;
      }
    }
  }

  // 2. ROLE & OCCUPATION EXTRACTION
  const rolePatterns = [
    /(?:i work as(?: an?| the)?|i'm(?: an?| the)?|i am(?: an?| the)?|my role is(?: an?| the)?|my profession is)\s+([a-zA-Z0-9_\-\s/]+?(?:developer|engineer|architect|designer|student|scientist|manager|consultant|founder|ceo|cto|lead|programmer|analyst|creator|freelancer|researcher|specialist|dev))/i,
    /(?:i am studying|i study)\s+([a-zA-Z0-9_\-\s/]{3,50})/i,
    /(?:about me\s*[:\-]?.*?)(?:i am(?: an?| the)?|i'm(?: an?| the)?)\s+([a-zA-Z0-9_\-\s/]+?(?:developer|engineer|architect|designer|scientist|lead))/i
  ];
  for (const regex of rolePatterns) {
    const match = clean.match(regex);
    if (match && match[1]) {
      let val = match[1].replace(/[.,!?;]+$/, '').trim();
      val = val.replace(/[,;.]?\s+(?:and\s+)?(?:i\s+am|i'm|i\s+work|my\s+tech|my\s+project|i\s+build|i\s+prefer|and\s+my|living|based).*$/i, '').trim();
      const firstWord = val.split(' ')[0].toLowerCase();
      if (!FALSE_POSITIVE_ROLES.includes(firstWord) && val.length >= 3 && !/^(?:hi|hello|dear|hey|to|from|subject|template|re|fwd|inquiry)\b/i.test(val) && !/\[.*\]/.test(val)) {
        const cleanVal = val.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        addMemory(CATEGORIES.ROLE, 'Role / Profession', cleanVal);
        break;
      }
    }
  }

  // 3. TECH STACK & TOOLS EXTRACTION
  const techStackPatterns = [
    /(?:my tech stack is|our tech stack is|my stack is|i specialize in|i code in|i work with|i use|i'm using|we use|built with|build web apps using|build apps with)\s+([a-zA-Z0-9_\-\s,.#+/]{3,140})/i,
    /(?:my primary (?:language|framework|database|stack) is)\s+([a-zA-Z0-9_\-\s,.#+/]{2,60})/i
  ];
  for (const regex of techStackPatterns) {
    const match = clean.match(regex);
    if (match && match[1]) {
      let val = match[1].replace(/[.,!?;]+$/, '').trim();
      val = val.replace(/[,;.]?\s+(?:and\s+)?(?:i\s+am|i'm|i\s+work|my\s+role|my\s+project|i\s+build|i\s+prefer|my\s+active).*$/i, '').trim();
      val = val.replace(/\s+(?:for my|to build|in my|every day|right now|currently).*$/i, '').trim();
      if (val.length >= 2 && !/^(it|that|this|something|nothing|them|anything)\b/i.test(val)) {
        addMemory(CATEGORIES.TECH_STACK, 'Primary Tech Stack', val);
        break;
      }
    }
  }

  // 4. ACTIVE PROJECT EXTRACTION
  const projectPatterns = [
    /(?:i am building|i'm building|i am working on|i'm working on|my project is|my active project is|my current project is|my app is|developing an app called|working on a project called)\s+([a-zA-Z0-9_\-\s.:/]{3,80})/i
  ];
  for (const regex of projectPatterns) {
    const match = clean.match(regex);
    if (match && match[1]) {
      let val = match[1].replace(/[.,!?;]+$/, '').trim();
      val = val.replace(/[,;.]?\s+(?:and\s+)?(?:i\s+am|i'm|i\s+work|my\s+tech|my\s+role|i\s+prefer).*$/i, '').trim();
      val = val.replace(/\s+(?:using|with|in|for|to)\s+.*$/i, '').trim();
      val = val.replace(/^(?:an?\s+)?(?:ai\s+)?(?:app|application|platform|tool|website|site|system|saas|project)\s+(?:called|named)\s+/i, '').trim();
      if (val.length >= 2 && !/^(it|something|an app|a project|this)\b/i.test(val)) {
        addMemory(CATEGORIES.PROJECT, 'Active / Recent Project', val);
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
        addMemory(CATEGORIES.PREFERENCE, 'Coding & Interaction Style', val);
        break;
      }
    }
  }

  // 6. LOCATION / TIMEZONE / GENERAL FACTS
  const locationPatterns = [
    /(?:i am based in|i live in|i'm from|i am located in|my location is|living in)\s+([a-zA-Z0-9_\-\s,]{2,50})/i,
    /(?:my timezone is|i am in timezone)\s+([a-zA-Z0-9_\-\s/+]{2,30})/i
  ];
  for (const regex of locationPatterns) {
    const match = clean.match(regex);
    if (match && match[1]) {
      let val = match[1].replace(/[.,!?;]+$/, '').trim();
      val = val.replace(/[,;.]?\s+(?:and\s+)?(?:i\s+am|i'm|my\s+tech|my\s+project|i\s+build).*$/i, '').trim();
      if (val.length >= 2) {
        addMemory(CATEGORIES.FACT, 'Location', val);
        break;
      }
    }
  }

  return extracted;
}

/**
 * Merges newly extracted memories with existing memories in-place or returns updated list
 */
function mergeUserMemories(existingList = [], newMemories = []) {
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
function formatUserMemoriesForPrompt(memories = []) {
  if (!Array.isArray(memories) || memories.length === 0) return '';

  const lines = memories.map(m => `- ${m.key}: ${m.value}`);
  return `\n[LEARNED USER CONTEXT MEMORY]:\nYou are conversing with a verified user. LAF has autonomously learned the following persistent context about them across sessions:\n${lines.join('\n')}\nTailor all responses, default libraries, code style, and architectural advice to naturally align with this user context. Address them by name if their name is known. You have full permission to discuss and reference these details with the user.\n`;
}

/**
 * Detect if the user is asking what LAF knows about them
 * Handles natural conversational variations ("tell about me", "what did you know about me", etc.)
 */
function isMemoryQuery(prompt = '') {
  if (!prompt || typeof prompt !== 'string') return false;
  const p = prompt.toLowerCase().trim().replace(/[?!.,'"]/g, '');
  if (!p) return false;

  const explicitQueries = [
    'tell about me',
    'tell me about me',
    'tell me about myself',
    'tell about myself',
    'what did you know about me',
    'what do you know about me',
    'what you know about me',
    'what do u know about me',
    'what did u know about me',
    'what did you learn about me',
    'what do you remember about me',
    'what did you remember about me',
    'what have you learned about me',
    'what have you remembered about me',
    'who am i',
    'who am i to you',
    'do you know me',
    'do you remember me',
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
    'what context do you have on me',
    'my context memory',
    'what is in my memory vault',
    'what is my resume',
    'tell me about my resume',
    'what did you understand about me',
    'what do you understand about me',
    'analyze me',
    'what did i tell you about myself',
    'what did i share about myself',
    'show my profile',
    'show my memory',
    'about me'
  ];

  if (explicitQueries.some(q => p === q || p.startsWith(q))) {
    return true;
  }

  // Regex flexible matching for inquiries about personal knowledge / resume
  if (/\b(?:tell|know|remember|learn|recall|describe|understand)\b.*\b(?:about me|about myself|who i am|my profile|my resume|my background)\b/i.test(p)) {
    return true;
  }
  if (/\bwhat\s+(?:did|do|have)\s+you\s+(?:know|remember|learn|understood|gathered|saved)\s+about\s+me\b/i.test(p)) {
    return true;
  }
  if (/^(?:who\s+am\s+i|about\s+me|my\s+profile|my\s+details|my\s+background)\b/i.test(p)) {
    return true;
  }

  return false;
}

/**
 * Detect if user wants to delete or forget a context memory
 */
function isMemoryDeleteQuery(prompt = '') {
  const p = prompt.toLowerCase().trim().replace(/[?!.,]/g, '');
  const triggers = [
    'forget my project', 'forget my tech stack', 'forget my name',
    'forget who i am', 'clear my memory', 'forget everything about me',
    'delete my memory', 'wipe my context memory'
  ];
  return triggers.some(t => p.includes(t));
}

/**
 * Self-healing history scanner: If memory vault is empty, scans past user conversations
 * for uploaded resume text or "about me" statements and recovers them on the fly.
 */
function scanHistoryForUserMemories(conversations = []) {
  if (!Array.isArray(conversations) || conversations.length === 0) return [];

  let recovered = [];
  for (const conv of conversations) {
    if (!Array.isArray(conv.messages)) continue;
    for (const msg of conv.messages) {
      if (msg.role === 'user') {
        const text = msg.content || '';
        const attText = msg.attachment?.textContent || '';
        const attName = msg.attachment?.name || '';
        const found = extractUserMemories(text, attText, attName);
        if (found.length > 0) {
          recovered = mergeUserMemories(recovered, found);
        }
      }
    }
  }
  return recovered;
}

/**
 * Generate a friendly, rich Markdown response summarizing what LAF knows about the user
 */
function buildMemoryRecallResponse(memories = [], username = 'User') {
  if (!Array.isArray(memories) || memories.length === 0) {
    return `### 🧠 LAF Context Memory Vault\n\nI don't have any saved personal facts or context stored for **@${username}** yet.\n\nAs we chat, whenever you share your:\n- **Resume or CV** *(upload as a PDF, doc, or text)*\n- **About Me / Bio** *(e.g., "I am Purushothaman, a Full-Stack Engineer...")*\n- **Tech Stack & Projects** *(e.g., "My tech stack is React, Node.js...")*\n- **Coding Preferences** *(e.g., "Always write TypeScript")*\n\nI will autonomously remember them across conversations and adapt every response to your specific workflow! You can also view or add memories anytime in your **Memory Vault**.`;
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

module.exports = {
  CATEGORIES,
  parseResumeAndProfile,
  extractUserMemories,
  mergeUserMemories,
  formatUserMemoriesForPrompt,
  isMemoryQuery,
  isMemoryDeleteQuery,
  scanHistoryForUserMemories,
  buildMemoryRecallResponse
};
