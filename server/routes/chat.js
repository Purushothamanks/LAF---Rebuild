const express = require('express');
const router = express.Router();
const { verifyUserToken } = require('../security/encryption');
const { sanitizeInput, detectThreats } = require('../security/sanitize');
const { generateResponse } = require('../services/aiEngine');
const { saveConversation, readUserDb, searchUserMemory } = require('../services/database');

// Middleware to enforce user session authentication
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const username = verifyUserToken(token);

  if (!username) {
    return res.status(401).json({ error: 'Unauthorized user session. Please enter your username.' });
  }

  req.username = username;
  next();
}

/**
 * POST /api/chat/send
 * Process prompt through fast reasoning AI engine and update isolated user DB
 */
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { prompt, conversationId, history = [], customApiKey, concisenessMode = 'short' } = req.body;
    const cleanPrompt = sanitizeInput(prompt);

    if (!cleanPrompt) {
      return res.status(400).json({ error: 'Prompt content cannot be empty.' });
    }

    if (detectThreats(cleanPrompt)) {
      return res.status(400).json({ error: 'Security Shield: Potential malicious injection pattern blocked.' });
    }

    // Generate AI response
    const aiResult = await generateResponse({
      username: req.username,
      prompt: cleanPrompt,
      history,
      customApiKey,
      concisenessMode
    });

    // Update conversation in user's isolated DB
    const updatedHistory = [
      ...history,
      { role: 'user', content: cleanPrompt, timestamp: new Date().toISOString() },
      { role: 'assistant', content: aiResult.text, provider: aiResult.provider, timestamp: new Date().toISOString() }
    ];

    const title = history.length === 0 ? cleanPrompt.substring(0, 35) + '...' : undefined;
    const savedConv = saveConversation(req.username, conversationId, title, updatedHistory);

    res.json({
      success: true,
      conversationId: savedConv.id,
      title: savedConv.title,
      response: {
        role: 'assistant',
        content: aiResult.text,
        provider: aiResult.provider,
        mode: aiResult.mode,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Chat processing error:', err);
    res.status(500).json({ error: 'Failed to process AI reasoning request.' });
  }
});

/**
 * GET /api/chat/conversations
 * Fetch list of conversations for current user
 */
router.get('/conversations', authMiddleware, (req, res) => {
  const db = readUserDb(req.username);
  const convList = db.conversations.map(c => ({
    id: c.id,
    title: c.title,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    messageCount: c.messages ? c.messages.length : 0
  }));
  res.json({ success: true, conversations: convList });
});

/**
 * GET /api/chat/conversation/:id
 * Fetch details of a specific conversation
 */
router.get('/conversation/:id', authMiddleware, (req, res) => {
  const db = readUserDb(req.username);
  const conv = db.conversations.find(c => c.id === req.params.id);

  if (!conv) {
    return res.status(404).json({ error: 'Conversation not found in your database' });
  }

  res.json({ success: true, conversation: conv });
});

/**
 * GET /api/chat/memory-search?q=query
 * Query user's historical conversations across all dates
 */
router.get('/memory-search', authMiddleware, (req, res) => {
  const query = req.query.q || '';
  const results = searchUserMemory(req.username, query);
  res.json({ success: true, query, memoryResults: results });
});

module.exports = router;
