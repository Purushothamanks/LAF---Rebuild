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
  const isTechnicalVisual = /blue-?prit|blueprint|graph|ghaph|diagram|flow-?chart|chart|wireframe|architecture|schematic|workflow|infographic|mindmap|pipeline/i.test(cleanPrompt);

  let styledPrompt = `${cleanPrompt}, 8k resolution, stunning visual composition, sharp focus, vibrant colors, ultra-detailed masterpiece`;
  let negative = 'girl, woman, female, model, portrait, human face, watermark, signature, text, error, blurry, low quality, bad anatomy, deformed';

  if (isTechnicalVisual || /deploy|github|git|code|architecture|database|server|api|network|system/i.test(cleanPrompt)) {
    styledPrompt = `detailed technical blueprint architecture flowchart and workflow graph showing ${cleanPrompt}, system architecture diagram, step-by-step engineering process schema, technical vector infographic, clean blueprint grid line aesthetic, sharp schematic illustration, professional technical documentation graphic, high resolution`;
    negative = 'girl, woman, female, human face, portrait, model, person, selfie, character, anime, photography, blurry, deformed, low resolution, messy, chaotic, watermark, distorted';
  }

  const encodedPrompt = encodeURIComponent(styledPrompt);
  const encodedNeg = encodeURIComponent(negative);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true&private=true&enhance=true&negative_prompt=${encodedNeg}`;

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
