const fs = require('fs');
const path = require('path');
const { hashUsername, encryptText, decryptText } = require('../security/encryption');

const DATA_DIR = path.join(__dirname, '../../data/users');
const FEEDBACK_FILE = path.join(__dirname, '../../data/feedback.json');
const REGISTERED_USERS_FILE = path.join(__dirname, '../../data/registered_users.json');
const BROADCAST_HISTORY_FILE = path.join(__dirname, '../../data/broadcast_history.json');

// In-memory resilient cache for read-only sandboxes or fallback sessions
const memoryDbCache = new Map();

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {}

/**
 * Get file path for isolated user DB
 */
function getUserDbPath(username) {
  const userHash = hashUsername(username);
  return path.join(DATA_DIR, `user_${userHash}.json`);
}

/**
 * Check if a user database file already exists
 */
function userExists(username) {
  if (memoryDbCache.has(username)) return true;
  const filePath = getUserDbPath(username);
  try {
    return fs.existsSync(filePath);
  } catch (e) {
    return false;
  }
}

/**
 * Read user isolated database
 */
function readUserDb(username) {
  const filePath = getUserDbPath(username);
  let fileExists = false;
  try {
    fileExists = fs.existsSync(filePath);
  } catch (e) {
    fileExists = false;
  }

  if (!fileExists) {
    if (memoryDbCache.has(username)) {
      return memoryDbCache.get(username);
    }
    const initialDb = {
      username: username,
      createdAt: new Date().toISOString(),
      conversations: [], // array of { id, title, createdAt, updatedAt, messages: [] }
      mediaGenerations: [], // array of { id, type, prompt, url, createdAt }
      memorySummary: '', // cumulative context summary
      contextMemories: [], // autonomous structured user context memories
      userPreferences: { conciseness: 'short', autoSpeak: false, theme: 'dark' }
    };
    try {
      fs.writeFileSync(filePath, JSON.stringify(initialDb, null, 2), 'utf8');
    } catch (e) {}
    memoryDbCache.set(username, initialDb);
    return initialDb;
  }
  
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    
    // Ensure contextMemories array exists
    if (!Array.isArray(data.contextMemories)) {
      data.contextMemories = [];
    }
    
    // Decrypt messages for user
    if (data.conversations && Array.isArray(data.conversations)) {
      data.conversations.forEach(conv => {
        if (conv.messages && Array.isArray(conv.messages)) {
          conv.messages.forEach(msg => {
            if (msg.encryptedContent) {
              msg.content = decryptText(msg.encryptedContent, username);
            }
          });
        }
      });
    }
    memoryDbCache.set(username, data);
    return data;
  } catch (err) {
    if (memoryDbCache.has(username)) {
      return memoryDbCache.get(username);
    }
    const fallbackDb = { username, conversations: [], mediaGenerations: [], contextMemories: [] };
    memoryDbCache.set(username, fallbackDb);
    return fallbackDb;
  }
}

/**
 * Save user isolated database (encrypting message contents)
 */
function saveUserDb(username, dbData) {
  // Always update in-memory cache first
  memoryDbCache.set(username, dbData);

  try {
    const filePath = getUserDbPath(username);
    
    // Clone to encrypt before writing to disk
    const copy = JSON.parse(JSON.stringify(dbData));
    if (copy.conversations && Array.isArray(copy.conversations)) {
      copy.conversations.forEach(conv => {
        if (conv.messages && Array.isArray(conv.messages)) {
          conv.messages.forEach(msg => {
            if (msg.content) {
              msg.encryptedContent = encryptText(msg.content, username);
              // Delete raw content from disk version for security
              delete msg.content;
            }
          });
        }
      });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(copy, null, 2), 'utf8');
  } catch (e) {
    // File system is read-only or in isolated sandbox; in-memory cache holds state safely
  }
}

/**
 * Add or update conversation in user DB
 */
function saveConversation(username, conversationId, title, messages) {
  const db = readUserDb(username);
  const now = new Date().toISOString();
  
  let conv = db.conversations.find(c => c.id === conversationId);
  if (!conv) {
    conv = {
      id: conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: title || 'New Conversation',
      createdAt: now,
      updatedAt: now,
      messages: []
    };
    db.conversations.unshift(conv);
  } else {
    conv.updatedAt = now;
    if (title && title !== 'New Conversation') conv.title = title;
  }
  
  conv.messages = messages;
  saveUserDb(username, db);
  return conv;
}

/**
 * Delete a specific conversation from user DB
 */
function deleteConversation(username, conversationId) {
  const db = readUserDb(username);
  if (db.conversations && Array.isArray(db.conversations)) {
    db.conversations = db.conversations.filter(c => c.id !== conversationId);
    saveUserDb(username, db);
  }
  return true;
}

/**
 * Delete all conversations for a user
 */
function deleteAllConversations(username) {
  const db = readUserDb(username);
  db.conversations = [];
  saveUserDb(username, db);
  return true;
}

/**
 * Delete all conversation files across all users and flush memory cache
 */
function clearAllUserDatabases() {
  memoryDbCache.clear();
  if (fs.existsSync(DATA_DIR)) {
    const files = fs.readdirSync(DATA_DIR);
    for (const f of files) {
      if (f.startsWith('user_') && f.endsWith('.json')) {
        try {
          fs.unlinkSync(path.join(DATA_DIR, f));
        } catch (e) {}
      }
    }
  }
  return true;
}

/**
 * Register or update user with optional email address for update broadcasts
 */
function registerUser(username, email = '') {
  if (!username) return null;
  const cleanUser = username.trim();
  const cleanEmail = (email || '').trim().toLowerCase();

  let users = [];
  try {
    if (fs.existsSync(REGISTERED_USERS_FILE)) {
      users = JSON.parse(fs.readFileSync(REGISTERED_USERS_FILE, 'utf8'));
      if (!Array.isArray(users)) users = [];
    }
  } catch (e) {
    users = [];
  }

  const existingIdx = users.findIndex(u => u.username && u.username.toLowerCase() === cleanUser.toLowerCase());
  const now = new Date().toISOString();

  let record;
  if (existingIdx >= 0) {
    record = users[existingIdx];
    if (cleanEmail) record.email = cleanEmail;
    record.lastLoginAt = now;
    users[existingIdx] = record;
  } else {
    record = {
      username: cleanUser,
      email: cleanEmail,
      registeredAt: now,
      lastLoginAt: now
    };
    users.push(record);
  }

  try {
    fs.writeFileSync(REGISTERED_USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (e) {
    console.warn('[DB] Failed to save registered_users.json:', e.message);
  }

  // Also record email in userDb if exists
  try {
    const userDb = readUserDb(cleanUser);
    if (userDb) {
      userDb.email = cleanEmail || userDb.email || '';
      saveUserDb(cleanUser, userDb);
    }
  } catch (e) {}

  return record;
}

/**
 * Get all registered users
 */
function getRegisteredUsers() {
  try {
    if (fs.existsSync(REGISTERED_USERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(REGISTERED_USERS_FILE, 'utf8'));
      return Array.isArray(data) ? data : [];
    }
  } catch (e) {}
  return [];
}

/**
 * Get all users who have registered a valid email address
 */
function getSubscribedUsers() {
  const users = getRegisteredUsers();
  return users.filter(u => u && u.email && /\S+@\S+\.\S+/.test(u.email));
}

/**
 * Record a broadcast event in broadcast_history.json
 */
function saveBroadcastHistory(record) {
  let history = [];
  try {
    if (fs.existsSync(BROADCAST_HISTORY_FILE)) {
      history = JSON.parse(fs.readFileSync(BROADCAST_HISTORY_FILE, 'utf8'));
      if (!Array.isArray(history)) history = [];
    }
  } catch (e) {
    history = [];
  }

  history.unshift({
    ...record,
    timestamp: new Date().toISOString()
  });

  try {
    fs.writeFileSync(BROADCAST_HISTORY_FILE, JSON.stringify(history.slice(0, 50), null, 2), 'utf8');
  } catch (e) {}
  return true;
}

/**
 * Get broadcast history
 */
function getBroadcastHistory() {
  try {
    if (fs.existsSync(BROADCAST_HISTORY_FILE)) {
      const data = JSON.parse(fs.readFileSync(BROADCAST_HISTORY_FILE, 'utf8'));
      return Array.isArray(data) ? data : [];
    }
  } catch (e) {}
  return [];
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Search user's historical conversations for memory recall
 */
function searchUserMemory(username, query) {
  const db = readUserDb(username);
  if (!db.conversations || db.conversations.length === 0) {
    return [];
  }
  
  const q = (query || '').toLowerCase().trim();
  if (!q) return [];

  const isExplicitMemoryQuery = 
    q.includes('last week') || 
    q.includes('yesterday') || 
    q.includes('previous conversation') || 
    q.includes('do you remember') || 
    q.includes('what did we talk');

  const matchedMessages = [];
  
  db.conversations.forEach(conv => {
    const convDate = new Date(conv.updatedAt || conv.createdAt).toLocaleDateString();
    conv.messages.forEach(msg => {
      if (!msg.content) return;
      const contentLower = msg.content.toLowerCase();
      
      let isMatch = false;
      if (isExplicitMemoryQuery) {
        isMatch = true;
      } else if (q.length >= 4) {
        try {
          const regex = new RegExp(`\\b${escapeRegExp(q)}\\b`, 'i');
          isMatch = regex.test(contentLower);
        } catch (e) {
          isMatch = contentLower.includes(q);
        }
      }

      if (isMatch) {
        matchedMessages.push({
          conversationId: conv.id,
          conversationTitle: conv.title,
          date: convDate,
          role: msg.role,
          content: msg.content
        });
      }
    });
  });
  
  return matchedMessages.slice(0, 10);
}

/**
 * Save user feedback entry to server storage
 */
function saveFeedbackRecord(username, text, userEmail = '') {
  let feedbackList = [];
  if (fs.existsSync(FEEDBACK_FILE)) {
    try {
      feedbackList = JSON.parse(fs.readFileSync(FEEDBACK_FILE, 'utf8'));
    } catch (e) {
      feedbackList = [];
    }
  }
  
  const record = {
    id: `fb_${Date.now()}`,
    username,
    userEmail,
    text,
    targetEmail: 'purushothamanks1711@gmail.com',
    createdAt: new Date().toISOString()
  };
  
  feedbackList.unshift(record);
  fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(feedbackList, null, 2), 'utf8');
  return record;
}

/**
 * Get all context memories for a user
 * Features self-healing fallback to past conversations if memories are not yet compiled
 */
function getUserMemories(username) {
  const db = readUserDb(username);
  let mems = Array.isArray(db.contextMemories) ? db.contextMemories : [];
  if (mems.length === 0 && Array.isArray(db.conversations) && db.conversations.length > 0) {
    try {
      const { scanHistoryForUserMemories } = require('./userMemoryEngine');
      const recovered = scanHistoryForUserMemories(db.conversations);
      if (recovered && recovered.length > 0) {
        db.contextMemories = recovered;
        saveUserDb(username, db);
        return recovered;
      }
    } catch (e) {}
  }
  return mems;
}

/**
 * Save / upsert a single context memory or list of memories
 */
function saveUserMemory(username, memoryItem) {
  const db = readUserDb(username);
  if (!Array.isArray(db.contextMemories)) {
    db.contextMemories = [];
  }
  const { mergeUserMemories } = require('./userMemoryEngine');
  const items = Array.isArray(memoryItem) ? memoryItem : [memoryItem];
  db.contextMemories = mergeUserMemories(db.contextMemories, items);
  saveUserDb(username, db);
  return db.contextMemories;
}

/**
 * Delete a context memory by id
 */
function deleteUserMemory(username, memoryId) {
  const db = readUserDb(username);
  if (Array.isArray(db.contextMemories)) {
    db.contextMemories = db.contextMemories.filter(m => m.id !== memoryId);
    saveUserDb(username, db);
  }
  return true;
}

/**
 * Clear all context memories for a user
 */
function clearUserMemories(username) {
  const db = readUserDb(username);
  db.contextMemories = [];
  saveUserDb(username, db);
  return true;
}

/**
 * Update all context memories for a user in batch
 */
function updateUserMemoriesBatch(username, newMemoriesList) {
  const db = readUserDb(username);
  db.contextMemories = Array.isArray(newMemoriesList) ? newMemoriesList : [];
  saveUserDb(username, db);
  return db.contextMemories;
}

module.exports = {
  getUserDbPath,
  userExists,
  readUserDb,
  saveUserDb,
  saveConversation,
  deleteConversation,
  deleteAllConversations,
  clearAllUserDatabases,
  searchUserMemory,
  saveFeedbackRecord,
  getUserMemories,
  saveUserMemory,
  deleteUserMemory,
  clearUserMemories,
  updateUserMemoriesBatch,
  registerUser,
  getRegisteredUsers,
  getSubscribedUsers,
  saveBroadcastHistory,
  getBroadcastHistory
};
