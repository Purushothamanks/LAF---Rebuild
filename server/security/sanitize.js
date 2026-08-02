/**
 * Input & Output Security Filtering Module for LAF
 */

function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  // Strip control characters & dangerous scripts
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim();
}

function validateUsername(username) {
  if (!username || typeof username !== 'string') return false;
  const clean = username.trim();
  // Allow alphanumeric, underscores, hyphens, spaces between 2 and 30 characters
  return /^[a-zA-Z0-9_\- ]{2,30}$/.test(clean);
}

function detectThreats(text) {
  if (!text) return false;
  const threatSignatures = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /onerror\s*=/gi,
    /onload\s*=/gi,
    /eval\s*\(/gi,
    /exec\s*\(/gi
  ];
  return threatSignatures.some(sig => sig.test(text));
}

module.exports = {
  sanitizeInput,
  validateUsername,
  detectThreats
};
