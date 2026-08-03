const fs = require('fs');
const path = require('path');
const { hashUsername, encryptText, decryptText } = require('../security/encryption');

const DATA_DIR = path.join(__dirname, '../../data/users');
const FEEDBACK_FILE = path.join(__dirname, '../../data/feedback.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

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
  const filePath = getUserDbPath(username);
  return fs.existsSync(filePath);
}

/**
 * Read user isolated database
 */
function readUserDb(username) {
  const filePath = getUserDbPath(username);
  if (!fs.existsSync(filePath)) {
    const initialDb = {
      username: username,
      createdAt: new Date().toISOString(),
      conversations: [], // array of { id, title, createdAt, updatedAt, messages: [] }
      mediaGenerations: [], // array of { id, type, prompt, url, createdAt }
      memorySummary: '', // cumulative context summary
      userPreferences: { conciseness: 'short', autoSpeak: false, theme: 'dark' }
    };
    fs.writeFileSync(filePath, JSON.stringify(initialDb, null, 2), 'utf8');
    return initialDb;
  }
  
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    
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
    return data;
  } catch (err) {
    console.error(`Error reading DB for user ${username}:`, err);
    return { username, conversations: [], mediaGenerations: [] };
  }
}

/**
 * Save user isolated database (encrypting message contents)
 */
function saveUserDb(username, dbData) {
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
 * Search user's historical conversations for memory recall
 */
function searchUserMemory(username, query) {
  const db = readUserDb(username);
  if (!db.conversations || db.conversations.length === 0) {
    return [];
  }
  
  const q = (query || '').toLowerCase().trim();
  const matchedMessages = [];
  
  db.conversations.forEach(conv => {
    const convDate = new Date(conv.updatedAt || conv.createdAt).toLocaleDateString();
    conv.messages.forEach(msg => {
      if (!msg.content) return;
      const contentLower = msg.content.toLowerCase();
      if (!q || contentLower.includes(q) || q.includes('last week') || q.includes('yesterday') || q.includes('speak') || q.includes('previous') || q.includes('talked')) {
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
  
  return matchedMessages.slice(0, 15);
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

module.exports = {
  getUserDbPath,
  userExists,
  readUserDb,
  saveUserDb,
  saveConversation,
  deleteConversation,
  searchUserMemory,
  saveFeedbackRecord
};
