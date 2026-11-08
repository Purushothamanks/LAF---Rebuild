const express = require('express');
const router = express.Router();
const { 
  getRegisteredUsers, 
  getSubscribedUsers, 
  registerUser, 
  saveBroadcastHistory, 
  getBroadcastHistory,
  clearAllUserDatabases
} = require('../services/database');
const { sendFeatureAnnouncement, sendGrandLaunchNotification } = require('../services/emailService');
const { sanitizeInput } = require('../security/sanitize');

/**
 * GET /api/admin/subscribers
 * Return subscribers and statistics
 */
router.get('/subscribers', (req, res) => {
  try {
    const allUsers = getRegisteredUsers();
    const subscribers = getSubscribedUsers();
    res.json({
      success: true,
      totalUsers: allUsers.length,
      subscribersCount: subscribers.length,
      subscribers: subscribers.map(s => ({ username: s.username, email: s.email, registeredAt: s.registeredAt }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve subscribers: ' + err.message });
  }
});

/**
 * POST /api/admin/register-launch
 * Pre-register a user for Grand Launch and feature updates
 */
router.post('/register-launch', (req, res) => {
  try {
    const rawUsername = req.body?.username || '';
    const rawEmail = req.body?.email || '';

    const username = sanitizeInput(rawUsername).trim();
    const email = sanitizeInput(rawEmail).trim().toLowerCase();

    if (!username || username.length < 2) {
      return res.status(400).json({ error: 'Valid username is required.' });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }

    const record = registerUser(username, email);

    res.json({
      success: true,
      message: 'Registered successfully for Grand Launch!',
      user: record
    });
  } catch (err) {
    res.status(500).json({ error: 'Launch registration failed: ' + err.message });
  }
});

/**
 * POST /api/admin/broadcast-feature
 * Broadcast feature release to registered users with Developer Permission
 */
router.post('/broadcast-feature', async (req, res) => {
  try {
    const { featureTitle, featureDetails, developerPermission } = req.body || {};

    if (!developerPermission) {
      return res.status(403).json({
        error: 'Permission Denied: Developer permission is strictly required to broadcast email updates.'
      });
    }

    if (!featureTitle || !featureDetails) {
      return res.status(400).json({
        error: 'featureTitle and featureDetails are required.'
      });
    }

    const subscribers = getSubscribedUsers();
    const result = await sendFeatureAnnouncement({
      featureTitle: sanitizeInput(featureTitle),
      featureDetails: sanitizeInput(featureDetails),
      recipients: subscribers,
      developerPermission: Boolean(developerPermission)
    });

    saveBroadcastHistory({
      type: 'FEATURE_RELEASE',
      title: featureTitle,
      sentCount: result.sent,
      totalRecipients: result.total
    });

    res.json({
      success: true,
      message: `Feature update successfully broadcasted to ${result.sent} users.`,
      result
    });
  } catch (err) {
    console.error('[ADMIN BROADCAST ERROR]', err);
    res.status(500).json({ error: 'Broadcast failed: ' + err.message });
  }
});

/**
 * POST /api/admin/broadcast-launch
 * Broadcast Grand Launch celebration email to all registered users
 */
router.post('/broadcast-launch', async (req, res) => {
  try {
    const subscribers = getSubscribedUsers();
    const result = await sendGrandLaunchNotification({ recipients: subscribers });

    saveBroadcastHistory({
      type: 'GRAND_LAUNCH_1PM',
      title: 'Grand Launch Diwali Celebration (1:00 PM)',
      sentCount: result.sent,
      totalRecipients: result.total
    });

    res.json({
      success: true,
      message: `Grand Launch announcement dispatched to ${result.sent} users.`,
      result
    });
  } catch (err) {
    res.status(500).json({ error: 'Grand launch broadcast failed: ' + err.message });
  }
});

/**
 * POST /api/admin/wipe-database
 * Clear all user databases for fresh launch
 */
router.post('/wipe-database', (req, res) => {
  try {
    clearAllUserDatabases();
    res.json({
      success: true,
      message: 'All user database files and conversation histories have been wiped cleanly.'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to wipe database: ' + err.message });
  }
});

module.exports = router;
