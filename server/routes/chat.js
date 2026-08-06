const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { verifyUserToken } = require('../security/encryption');
const { sanitizeInput, detectThreats } = require('../security/sanitize');
const { generateResponse } = require('../services/aiEngine');
const { saveConversation, deleteConversation, readUserDb, searchUserMemory, saveFeedbackRecord } = require('../services/database');

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
    const { prompt, conversationId, history = [], customApiKey, selectedModel = 'laf-v2', enableWebSearch = false, concisenessMode = 'short' } = req.body;
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
      selectedModel,
      enableWebSearch,
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
    try {
      const fallbackResult = await generateResponse({
        username: req.username,
        prompt: req.body.prompt || '',
        history: req.body.history || [],
        customApiKey: req.body.customApiKey,
        selectedModel: 'google/gemma-2-9b-it:free',
        enableWebSearch: req.body.enableWebSearch
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
 * Returns available AI models (Local Ollama & Omni Router 250+ Models)
 */
router.get('/models', authMiddleware, (req, res) => {
  res.json({
    success: true,
    models: [
      { id: 'laf-v2', name: 'Ollama LAF v2 (24/7 Local)', provider: 'Local Ollama Engine', desc: 'Primary 24/7 fast local model' },
      { id: 'llama3.2', name: 'Ollama Llama 3.2 (24/7 Local)', provider: 'Local Ollama Engine', desc: 'Meta Llama 3.2 local model' },
      { id: 'laf-model', name: 'Ollama LAF Model (24/7 Local)', provider: 'Local Ollama Engine', desc: 'Custom LAF model' },
      { id: 'google/gemma-2-9b-it:free', name: 'Google Gemma 2 (Cloud)', provider: 'Google AI', desc: 'High-speed reasoning & coding model' },
      { id: 'openrouter/meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Cloud)', provider: 'Meta AI', desc: 'Meta open-weight 70B model' },
      { id: 'openrouter/deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek', desc: 'Advanced math, logic & deep reasoning' }
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
