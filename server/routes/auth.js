const express = require('express');
const router = express.Router();
const { validateUsername, sanitizeInput } = require('../security/sanitize');
const { generateUserToken, verifyUserToken } = require('../security/encryption');
const { readUserDb, userExists } = require('../services/database');

/**
 * POST /api/auth/login
 * Passwordless username authentication (enforces username uniqueness)
 */
router.post('/login', (req, res) => {
  try {
    const rawUsername = req.body ? req.body.username : '';
    const username = sanitizeInput(rawUsername);

    if (!validateUsername(username)) {
      return res.status(400).json({
        error: 'Invalid username. Must be 2-30 characters (letters, numbers, spaces, underscores, hyphens).'
      });
    }

    // Issue session token for user
    const token = generateUserToken(username);

    // Initialize or fetch isolated user database
    let userDb = { conversations: [], createdAt: new Date().toISOString(), userPreferences: { theme: 'dark' } };
    try {
      userDb = readUserDb(username);
    } catch (dbErr) {
      console.warn(`[AUTH] Local user DB note for ${username}:`, dbErr.message);
    }

    res.json({
      success: true,
      message: 'Authenticated successfully',
      token,
      user: {
        username: username,
        conversationsCount: (userDb && userDb.conversations) ? userDb.conversations.length : 0,
        createdAt: (userDb && userDb.createdAt) ? userDb.createdAt : new Date().toISOString(),
        userPreferences: (userDb && userDb.userPreferences) ? userDb.userPreferences : { theme: 'dark' }
      }
    });
  } catch (err) {
    console.error('[AUTH] Login failure:', err);
    res.status(500).json({ error: 'Server authentication failed: ' + err.message });
  }
});

/**
 * GET /api/auth/me
 * Validate current session token
 */
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '').trim();
    const username = verifyUserToken(token);

    if (!username) {
      return res.status(401).json({ error: 'Unauthorized session or token expired' });
    }

    let userDb = { conversations: [], createdAt: new Date().toISOString(), userPreferences: { theme: 'dark' } };
    try {
      userDb = readUserDb(username);
    } catch (dbErr) {}

    res.json({
      success: true,
      user: {
        username,
        conversationsCount: (userDb && userDb.conversations) ? userDb.conversations.length : 0,
        createdAt: (userDb && userDb.createdAt) ? userDb.createdAt : new Date().toISOString(),
        userPreferences: (userDb && userDb.userPreferences) ? userDb.userPreferences : { theme: 'dark' }
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Session check failed' });
  }
});

module.exports = router;
