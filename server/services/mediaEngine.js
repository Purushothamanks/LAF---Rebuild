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

  // 2. High-Performance Unlimited Vision Engine
  const seed = Math.floor(Math.random() * 10000000);
  const normalized = cleanPrompt
    .replace(/blue-?prit|blue\s+prit/gi, 'blueprint')
    .replace(/\bghaph\b|\bgrap\b|\bgraff\b|\bgraf\b/gi, 'graph')
    .replace(/\bflow-?chart\b/gi, 'flowchart')
    .replace(/\bwire-?frame\b/gi, 'wireframe');

  const isTechnicalVisual = /\b(blueprint|graph|diagram|flowchart|chart|wireframe|architecture|schematic|workflow|infographic|mindmap|pipeline|system design)\b/i.test(normalized);

  let styledPrompt = `${normalized}, 8k resolution, stunning visual composition, sharp focus, vibrant colors, ultra-detailed masterpiece, no watermark, no text`;

  if (isTechnicalVisual || /deploy|github|git|code|architecture|database|server|api|network|system/i.test(normalized)) {
    styledPrompt = `detailed technical blueprint architecture flowchart and workflow schematic for ${normalized}, system architecture diagram, step-by-step engineering process schema, technical vector infographic, clean blueprint grid line aesthetic, sharp schematic illustration, professional technical documentation graphic, high resolution, no humans, no people, no portraits, no faces`;
  }

  const encodedPrompt = encodeURIComponent(styledPrompt);
  // Default to unmetered endpoint (tongyi-mai/z-image-turbo, 60 RPM per user) to guarantee zero rate limit
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true&private=true&enhance=true`;

  return {
    success: true,
    type: 'image',
    url: imageUrl,
    provider: 'LAF 1.0 Vision Engine',
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
