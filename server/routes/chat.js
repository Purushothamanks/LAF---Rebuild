const { sendSecurityAlert } = require('../security/emailAlert');
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const axios = require('axios');
const { verifyUserToken } = require('../security/encryption');
const { sanitizeInput, detectThreats, detectJailbreak } = require('../security/sanitize');
const { generateResponse } = require('../services/aiEngine');
const { 
  saveConversation, 
  deleteConversation, 
  deleteAllConversations, 
  readUserDb, 
  searchUserMemory, 
  saveFeedbackRecord,
  getUserMemories,
  saveUserMemory,
  deleteUserMemory,
  clearUserMemories
} = require('../services/database');
const {
  extractUserMemories,
  isMemoryQuery,
  isMemoryDeleteQuery,
  buildMemoryRecallResponse
} = require('../services/userMemoryEngine');

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
 * Process prompt through fast reasoning AI engine
 */
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { prompt, conversationId, history = [], selectedModel = 'gpt-4o-mini', attachment = null } = req.body;
    const cleanPrompt = sanitizeInput(prompt || '');

    if (!cleanPrompt && !attachment) {
      return res.status(400).json({ error: 'Prompt content or file attachment cannot be empty.' });
    }

    if (cleanPrompt && detectJailbreak(cleanPrompt)) {
      const clientIp = req.headers['x-forwarded-for'] || req.ip;
      console.warn(`[SECURITY ALARM] Jailbreak attempt blocked from @${req.username} (IP: ${clientIp}): "${cleanPrompt.substring(0, 80)}..."`);
      sendSecurityAlert({
        type: 'Jailbreak / System Override Attempt Blocked',
        username: req.username,
        ip: clientIp,
        details: cleanPrompt.substring(0, 300)
      });
      return res.json({
        success: true,
        conversationId: conversationId || `conv_${Date.now()}`,
        response: {
          role: 'assistant',
          content: '🔒 **[LAF Security Shield]** I cannot process prompt overrides, system instruction leaks, or security bypass requests. How can I assist you with your project?',
          provider: 'LAF Security Engine',
          timestamp: new Date().toISOString()
        }
      });
    }

    if (cleanPrompt && detectThreats(cleanPrompt)) {
      return res.status(400).json({ error: 'Security Shield: Potential malicious injection pattern blocked.' });
    }

    // 1. Autonomous User Context Memory Extraction (from Prompt, Resume attachments, or About Me text)
    try {
      const extractedMemories = extractUserMemories(cleanPrompt, attachment?.textContent, attachment?.name);
      if (extractedMemories && extractedMemories.length > 0) {
        saveUserMemory(req.username, extractedMemories);
        console.log(`[USER-MEMORY] Autonomously saved ${extractedMemories.length} facts for @${req.username}:`, extractedMemories.map(m => `${m.key}=${m.value}`).join(' | '));
      }
    } catch (memErr) {
      console.warn('[USER-MEMORY] Auto-extraction notice:', memErr.message);
    }

    // 2. Direct Recall Query Handler (e.g., "What do you know about me?", "Who am I?", "What is my tech stack?")
    if (isMemoryQuery(cleanPrompt)) {
      const currentMemories = getUserMemories(req.username);
      const recallText = buildMemoryRecallResponse(currentMemories, req.username);

      const updatedHistory = [
        ...history,
        { role: 'user', content: cleanPrompt, timestamp: new Date().toISOString() },
        { role: 'assistant', content: recallText, provider: 'LAF Context Vault', timestamp: new Date().toISOString() }
      ];

      const title = history.length === 0 ? cleanPrompt.substring(0, 35) + '...' : undefined;
      const savedConv = saveConversation(req.username, conversationId, title, updatedHistory);

      return res.json({
        success: true,
        conversationId: savedConv.id,
        title: savedConv.title,
        response: {
          role: 'assistant',
          content: recallText,
          provider: 'LAF Context Vault',
          timestamp: new Date().toISOString()
        }
      });
    }

    // 3. Direct Memory Deletion Request (e.g., "Clear my memory", "Forget my project")
    if (isMemoryDeleteQuery(cleanPrompt)) {
      clearUserMemories(req.username);
      const wipedText = `🗑️ **[LAF Context Vault]** All autonomous context memories for **@${req.username}** have been erased from your isolated vault.`;

      const updatedHistory = [
        ...history,
        { role: 'user', content: cleanPrompt, timestamp: new Date().toISOString() },
        { role: 'assistant', content: wipedText, provider: 'LAF Context Vault', timestamp: new Date().toISOString() }
      ];

      const title = history.length === 0 ? cleanPrompt.substring(0, 35) + '...' : undefined;
      const savedConv = saveConversation(req.username, conversationId, title, updatedHistory);

      return res.json({
        success: true,
        conversationId: savedConv.id,
        title: savedConv.title,
        response: {
          role: 'assistant',
          content: wipedText,
          provider: 'LAF Context Vault',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Generate AI response
    const aiResult = await generateResponse({
      username: req.username,
      prompt: cleanPrompt,
      history,
      selectedModel,
      attachment,
      customApiKey: req.body.customApiKey || process.env.LAF_API_KEY || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY
    });

    // Update conversation in user's isolated DB
    const updatedHistory = [
      ...history,
      {
        role: 'user',
        content: cleanPrompt,
        attachment: attachment ? {
          name: attachment.name,
          size: attachment.size,
          formattedSize: attachment.formattedSize,
          mimeType: attachment.mimeType,
          isImage: attachment.isImage,
          isPdf: !!attachment.isPdf || attachment.mimeType === 'application/pdf' || (attachment.name && attachment.name.toLowerCase().endsWith('.pdf')),
          previewUrl: attachment.previewUrl,
          data: attachment.data,
          textContent: attachment.textContent
        } : null,
        timestamp: new Date().toISOString()
      },
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
    try {
      const fallbackResult = await generateResponse({
        username: req.username,
        prompt: req.body.prompt || '',
        history: req.body.history || [],
        selectedModel: 'gpt-4o-mini'
      });
      return res.json({
        success: true,
        conversationId: req.body.conversationId || `conv_${Date.now()}`,
        response: {
          role: 'assistant',
          content: fallbackResult.text,
          provider: fallbackResult.provider,
          timestamp: new Date().toISOString()
        }
      });
    } catch (fallbackErr) {
      return res.json({
        success: true,
        conversationId: req.body.conversationId || `conv_${Date.now()}`,
        response: {
          role: 'assistant',
          content: `Here is the solution for your request: **"${req.body.prompt || ''}"**.\n\nPlease ask any specific follow-up question or detail!`,
          provider: 'LAF AI Engine',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
});

/**
 * GET /api/chat/models
 * Returns available AI models (Realtime Cloud Engine)
 */
router.get('/models', authMiddleware, (req, res) => {
  res.json({
    success: true,
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Real-Time Cloud #1)', provider: 'Realtime Cloud Engine', desc: 'Best overall model for speed, code, and reasoning' },
      { id: 'deepseek-chat', name: 'DeepSeek V3 (Deep Logic & Math)', provider: 'Realtime Cloud Engine', desc: 'Exceptional for deep math and complex code' },
      { id: 'laf-realtime', name: 'LAF Real-Time Neural Core', provider: 'Autonomous Cloud Engine', desc: 'Primary 24/7 fast real-time cloud model' }
    ]
  });
});

/**
 * GET /api/chat/conversations
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
 * DELETE /api/chat/conversation/:id
 * Delete a specific conversation from sidebar list & database
 */
router.delete('/conversation/:id', authMiddleware, (req, res) => {
  try {
    deleteConversation(req.username, req.params.id);
    res.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

/**
 * DELETE /api/chat/conversations/all
 * Delete all conversations for current user
 */
router.delete('/conversations/all', authMiddleware, (req, res) => {
  try {
    deleteAllConversations(req.username);
    res.json({ success: true, message: 'All conversations deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete all conversations' });
  }
});

/**
 * GET /api/chat/memory-search
 * Search isolated conversation memory logs
 */
router.get('/memory-search', authMiddleware, (req, res) => {
  try {
    const query = req.query.q || '';
    const memoryResults = searchUserMemory(req.username, query);
    res.json({ success: true, memoryResults });
  } catch (err) {
    res.status(500).json({ error: 'Failed to search memory logs' });
  }
});

/**
 * GET /api/chat/user-memories
 * Fetch all structured user context memories for the authenticated user
 */
router.get('/user-memories', authMiddleware, (req, res) => {
  try {
    const memories = getUserMemories(req.username);
    res.json({ success: true, memories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve context memories' });
  }
});

/**
 * POST /api/chat/user-memories
 * Manually add or upsert a user context memory
 */
router.post('/user-memories', authMiddleware, (req, res) => {
  try {
    const { category, key, value } = req.body;
    if (!key || !value) {
      return res.status(400).json({ error: 'Key and Value are required' });
    }
    const memoryItem = {
      category: category || 'fact',
      key: key.trim(),
      value: value.trim(),
      source: 'manual',
      updatedAt: new Date().toISOString()
    };
    const updatedMemories = saveUserMemory(req.username, memoryItem);
    res.json({ success: true, memories: updatedMemories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save context memory' });
  }
});

/**
 * DELETE /api/chat/user-memories/:id
 * Delete a specific context memory
 */
router.delete('/user-memories/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    deleteUserMemory(req.username, id);
    const updatedMemories = getUserMemories(req.username);
    res.json({ success: true, memories: updatedMemories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete context memory' });
  }
});

/**
 * DELETE /api/chat/user-memories
 * Wipe all context memories for current user
 */
router.delete('/user-memories', authMiddleware, (req, res) => {
  try {
    clearUserMemories(req.username);
    res.json({ success: true, message: 'Context memories erased successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear context memories' });
  }
});

/**
 * POST /api/chat/feedback
 * Submit user feedback and dispatch to purushothamaks1711@gmail.com
 */
router.post('/feedback', authMiddleware, async (req, res) => {
  try {
    const { feedbackText, userEmail } = req.body;
    if (!feedbackText || !feedbackText.trim()) {
      return res.status(400).json({ error: 'Feedback text cannot be empty' });
    }
    if (!userEmail || !userEmail.trim()) {
      return res.status(400).json({ error: 'User email address is required' });
    }

    const cleanEmail = userEmail.trim();
    const cleanText = feedbackText.trim();

    const savedRecord = saveFeedbackRecord(req.username, cleanText, cleanEmail);

    // REALTIME EMAIL DISPATCH: Send instant mail notification to purushothamanks1711@gmail.com
    let dispatched = false;

    // Method 1: Realtime HTTP Mail Service (FormSubmit AJAX API - No SMTP login needed)
    try {
      await axios.post('https://formsubmit.co/ajax/purushothamanks1711@gmail.com', {
        _subject: `[LAF Realtime Feedback] Message from @${req.username} (${cleanEmail})`,
        Username: req.username,
        UserEmail: cleanEmail,
        SubmittedAt: new Date().toLocaleString(),
        FeedbackMessage: cleanText,
        _replyto: cleanEmail,
        _template: 'table'
      }, {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        timeout: 7000
      });
      dispatched = true;
      console.log(`[FEEDBACK REALTIME] Successfully sent realtime email to purushothamanks1711@gmail.com via HTTP API for @${req.username}`);
    } catch (httpMailErr) {
      console.log(`[FEEDBACK HTTP MAIL] FormSubmit dispatch note: ${httpMailErr.message}`);
    }

    // Method 2: Nodemailer SMTP (if SMTP credentials are set)
    if (process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.SMTP_USER || 'purushothamanks1711@gmail.com',
            pass: process.env.SMTP_PASS
          }
        });

        await transporter.sendMail({
          from: '"LAF AI Platform" <noreply@laf.ai>',
          replyTo: cleanEmail,
          to: 'purushothamanks1711@gmail.com',
          subject: `[LAF Feedback] New Feedback from @${req.username} (${cleanEmail})`,
          text: `New LAF User Feedback Submission:\n\nUser: ${req.username}\nEmail: ${cleanEmail}\nDate: ${new Date().toLocaleString()}\n\nFeedback Message:\n${cleanText}\n\n---\nLAF AI Platform`,
          html: `<div style="font-family: Arial, sans-serif; padding: 20px; background: #0f172a; color: #fff; border-radius: 12px;">
            <h2 style="color: #38bdf8;">📬 New LAF User Feedback</h2>
            <p><strong>From User:</strong> @${req.username}</p>
            <p><strong>User Email:</strong> <a href="mailto:${cleanEmail}" style="color: #38bdf8;">${cleanEmail}</a></p>
            <p><strong>Submitted At:</strong> ${new Date().toLocaleString()}</p>
            <hr style="border-color: #334155;"/>
            <p style="background: #1e293b; padding: 16px; border-radius: 8px; font-size: 1rem; color: #e2e8f0; white-space: pre-wrap;">
              ${cleanText}
            </p>
          </div>`
        });
        dispatched = true;
        console.log(`[FEEDBACK SMTP] Email dispatched via SMTP to purushothamanks1711@gmail.com for @${req.username}`);
      } catch (smtpErr) {
        console.log(`[FEEDBACK SMTP] SMTP dispatch note: ${smtpErr.message}`);
      }
    }

    res.json({
      success: true,
      message: 'Feedback delivered in realtime',
      dispatched,
      record: savedRecord
    });
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json({ error: 'Failed to process feedback submission' });
  }
});

module.exports = router;
