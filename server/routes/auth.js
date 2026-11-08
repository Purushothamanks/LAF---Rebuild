const express = require('express');
const router = express.Router();
const { validateUsername, sanitizeInput } = require('../security/sanitize');
const { generateUserToken, verifyUserToken } = require('../security/encryption');
const { readUserDb, userExists, registerUser } = require('../services/database');

/**
 * POST /api/auth/login
 * Passwordless username authentication with optional email registration
 */
router.post('/login', (req, res) => {
  try {
    const rawUsername = req.body ? req.body.username : '';
    const rawEmail = req.body ? req.body.email : '';
    const username = sanitizeInput(rawUsername);
    const email = typeof rawEmail === 'string' ? sanitizeInput(rawEmail).trim().toLowerCase() : '';

    if (!validateUsername(username)) {
      return res.status(400).json({
        error: 'Invalid username. Must be 2-30 characters (letters, numbers, spaces, underscores, hyphens).'
      });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        error: 'Invalid email address format.'
      });
    }

    // Register/update user registry
    registerUser(username, email);

    // Issue session token for user
    const token = generateUserToken(username);

    // Initialize or fetch isolated user database
    let userDb = { conversations: [], createdAt: new Date().toISOString(), userPreferences: { theme: 'dark' }, email: email };
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
        email: email || userDb?.email || '',
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
        email: (userDb && userDb.email) ? userDb.email : '',
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
