const express = require('express');
const router = express.Router();
const { verifyUserToken } = require('../security/encryption');
const { sanitizeInput } = require('../security/sanitize');
const { generateImage, generateAudio, generateVideo } = require('../services/mediaEngine');
const { addMediaRecord } = require('../services/database');

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

/**
 * POST /api/media/image
 * Generate image using FLUX / SDXL
 */
router.post('/image', authMiddleware, async (req, res) => {
  try {
    const { prompt, width, height, model } = req.body;
    const cleanPrompt = sanitizeInput(prompt);

    if (!cleanPrompt) {
      return res.status(400).json({ error: 'Image prompt is required' });
    }

    const result = await generateImage({
      prompt: cleanPrompt,
      width: parseInt(width) || 1024,
      height: parseInt(height) || 1024,
      model: model || 'flux'
    });

    addMediaRecord(req.username, result);
    res.json(result);
  } catch (err) {
    console.error('Image generation error:', err);
    res.status(500).json({ error: 'Image generation failed' });
  }
});

/**
 * POST /api/media/audio
 * Generate audio speech from text
 */
router.post('/audio', authMiddleware, async (req, res) => {
  try {
    const { text, voice, speed } = req.body;
    const cleanText = sanitizeInput(text);

    if (!cleanText) {
      return res.status(400).json({ error: 'Audio text content is required' });
    }

    const result = await generateAudio({
      text: cleanText,
      voice: voice || 'alloy',
      speed: parseFloat(speed) || 1.0
    });

    addMediaRecord(req.username, result);
    res.json(result);
  } catch (err) {
    console.error('Audio generation error:', err);
    res.status(500).json({ error: 'Audio speech generation failed' });
  }
});

/**
 * POST /api/media/video
 * Generate video from prompt
 */
router.post('/video', authMiddleware, async (req, res) => {
  try {
    const { prompt, duration } = req.body;
    const cleanPrompt = sanitizeInput(prompt);

    if (!cleanPrompt) {
      return res.status(400).json({ error: 'Video prompt is required' });
    }

    const result = await generateVideo({
      prompt: cleanPrompt,
      duration: parseInt(duration) || 4
    });

    addMediaRecord(req.username, result);
    res.json(result);
  } catch (err) {
    console.error('Video generation error:', err);
    res.status(500).json({ error: 'Video generation failed' });
  }
});

module.exports = router;
