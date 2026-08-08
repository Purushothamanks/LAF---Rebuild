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
  const rawUsername = req.body.username;
  const username = sanitizeInput(rawUsername);

  if (!validateUsername(username)) {
    return res.status(400).json({
      error: 'Invalid username. Must be 2-30 characters (letters, numbers, spaces, underscores, hyphens).'
    });
  }

  // Issue session token for user
  const token = generateUserToken(username);

  // Initialize or fetch isolated user database
  const userDb = readUserDb(username);

  res.json({
    success: true,
    message: 'Authenticated successfully',
    token,
    user: {
      username: username,
      conversationsCount: userDb.conversations.length,
      createdAt: userDb.createdAt,
      userPreferences: userDb.userPreferences
    }
  });
});

/**
 * GET /api/auth/me
 * Validate current session token
 */
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const username = verifyUserToken(token);

  if (!username) {
    return res.status(401).json({ error: 'Unauthorized session or token expired' });
  }

  const userDb = readUserDb(username);
  res.json({
    success: true,
    user: {
      username,
      conversationsCount: userDb.conversations.length,
      createdAt: userDb.createdAt,
      userPreferences: userDb.userPreferences
    }
  });
});

module.exports = router;
