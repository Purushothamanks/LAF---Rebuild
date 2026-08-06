const UNSUPPORTED_MSG = 'LAF currently does not support image, video, or audio generation features.';

/**
 * Generate AI Image
 */
async function generateImage({ prompt }) {
  return {
    success: false,
    type: 'image',
    error: UNSUPPORTED_MSG,
    message: UNSUPPORTED_MSG
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

