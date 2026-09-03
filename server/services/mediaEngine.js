const axios = require('axios');

const UNSUPPORTED_MSG = 'LAF currently does not support audio or video generation features.';

/**
 * Generate AI Image via Cloud API or High-Resolution FLUX Engine
 */
async function generateImage({ prompt, apiKey }) {
  const cleanPrompt = (prompt || '').trim();
  if (!cleanPrompt) {
    return { success: false, error: 'Prompt is required.' };
  }

  // 1. If API Key provided, try OpenAI DALL-E
  const key = apiKey || process.env.OPENAI_API_KEY || process.env.LAF_API_KEY || process.env.LAF_API_KEY_SECONDARY;
  if (key && key.startsWith('sk-')) {
    try {
      const res = await axios.post(
        'https://api.openai.com/v1/images/generations',
        {
          prompt: cleanPrompt,
          n: 1,
          size: '1024x1024'
        },
        {
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      const url = res.data?.data?.[0]?.url;
      if (url) {
        return {
          success: true,
          type: 'image',
          url,
          provider: 'OpenAI DALL-E 3',
          prompt: cleanPrompt
        };
      }
    } catch (e) {
      console.log('[MEDIA-ENGINE] Cloud image API notice, falling back to FLUX:', e.message);
    }
  }

  // 2. High-Performance FLUX Neural Engine
  const seed = Math.floor(Math.random() * 10000000);
  const encodedPrompt = encodeURIComponent(`${cleanPrompt}, 8k resolution, photorealistic, cinematic lighting, ultra-detailed masterpiece`);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true&enhance=true`;

  return {
    success: true,
    type: 'image',
    url: imageUrl,
    provider: 'LAF FLUX Neural Engine',
    prompt: cleanPrompt
  };
}

/**
 * Generate AI Speech / Audio
 */
async function generateAudio({ text }) {
  return {
    success: false,
    type: 'audio',
    error: UNSUPPORTED_MSG,
    message: UNSUPPORTED_MSG
  };
}

/**
 * Generate AI Video
 */
async function generateVideo({ prompt }) {
  return {
    success: false,
    type: 'video',
    error: UNSUPPORTED_MSG,
    message: UNSUPPORTED_MSG
  };
}

module.exports = {
  generateImage,
  generateAudio,
  generateVideo
};
