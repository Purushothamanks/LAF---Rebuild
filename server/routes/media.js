const express = require('express');
const router = express.Router();
const { verifyUserToken } = require('../security/encryption');
const { generateImage, generateAudio, generateVideo } = require('../services/mediaEngine');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const username = verifyUserToken(token);

  if (!username) {
    return res.status(401).json({ error: 'Unauthorized session.' });
  }

  req.username = username;
  next();
}

const UNSUPPORTED_MSG = 'LAF currently does not support image, video, or audio generation features.';

/**
 * POST /api/media/image
 */
router.post('/image', authMiddleware, async (req, res) => {
  const result = await generateImage(req.body);
  res.status(400).json(result);
});

/**
 * POST /api/media/audio
 */
router.post('/audio', authMiddleware, async (req, res) => {
  const result = await generateAudio(req.body);
  res.status(400).json(result);
});

/**
 * POST /api/media/video
 */
router.post('/video', authMiddleware, async (req, res) => {
  const result = await generateVideo(req.body);
  res.status(400).json(result);
});

module.exports = router;

