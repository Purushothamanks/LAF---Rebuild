/**
 * Input & Output Security Filtering & Jailbreak Defense Module for LAF
 */

function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  // Strip control characters & dangerous script tags
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

function detectJailbreak(text) {
  if (!text || typeof text !== 'string') return false;
  const jailbreakPatterns = [
    /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|directives|rules)/gi,
    /system\s+prompt\s+override/gi,
    /do\s+anything\s+now/gi,
    /\bDAN\b\s+mode/gi,
    /developer\s+mode\s+(enabled|on)/gi,
    /reveal\s+(your\s+)?(system\s+prompt|instructions|api\s*keys?)/gi,
    /you\s+are\s+now\s+in\s+unrestricted\s+mode/gi,
    /bypass\s+(safety|content)\s+(filter|policy)/gi
  ];
  return jailbreakPatterns.some(pattern => pattern.test(text));
}

module.exports = {
  sanitizeInput,
  validateUsername,
  detectThreats,
  detectJailbreak
};
