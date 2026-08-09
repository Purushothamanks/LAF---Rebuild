const express = require('express');
const router = express.Router();
const axios = require('axios');
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

/**
 * GET /api/media/download-proxy
 * Proxies image downloads directly to bypass browser CORS restrictions
 */
router.get('/download-proxy', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    const filename = req.query.filename || 'laf_ai_image.jpg';

    if (!imageUrl) {
      return res.status(400).send('Image URL parameter is required.');
    }

    const response = await axios({
      method: 'GET',
      url: imageUrl,
      responseType: 'stream',
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const contentType = response.headers['content-type'] || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    response.data.pipe(res);
  } catch (err) {
    console.error('Image download proxy error:', err.message);
    res.status(500).send('Failed to proxy download image.');
  }
});

/**
 * POST /api/media/image
 */
router.post('/image', authMiddleware, async (req, res) => {
  const result = await generateImage(req.body);
  res.json(result);
});

/**
 * POST /api/media/audio
 */
router.post('/audio', authMiddleware, async (req, res) => {
  const result = await generateAudio(req.body);
  res.json(result);
});

/**
 * POST /api/media/video
 */
router.post('/video', authMiddleware, async (req, res) => {
  const result = await generateVideo(req.body);
  res.json(result);
});

module.exports = router;


