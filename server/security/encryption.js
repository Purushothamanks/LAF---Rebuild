const crypto = require('crypto');

// Master secret for session signing & key derivation
const MASTER_SECRET = process.env.JWT_SECRET || 'LAF_LOOK_AT_FUTURE_SUPER_SECURE_MASTER_KEY_2026_PROD';

/**
 * Hash username into safe filesystem and database isolation key
 */
function hashUsername(username) {
  if (!username) throw new Error('Username is required for database isolation');
  const clean = username.trim().toLowerCase();
  return crypto.createHmac('sha256', MASTER_SECRET).update(clean).digest('hex').substring(0, 32);
}

/**
 * Derive per-user AES-256 encryption key from username and master secret
 */
function getDerivedUserKey(username) {
  const userHash = hashUsername(username);
  return crypto.pbkdf2Sync(userHash, MASTER_SECRET, 10000, 32, 'sha256');
}

/**
 * Encrypt data using AES-256-GCM for End-to-End database security
 */
function encryptText(text, username) {
  if (!text) return text;
  const key = getDerivedUserKey(username);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

/**
 * Decrypt text using AES-256-GCM
 */
function decryptText(cipherString, username) {
  if (!cipherString || !cipherString.includes(':')) return cipherString;
  try {
    const parts = cipherString.split(':');
    if (parts.length !== 3) return cipherString;
    
    const [ivHex, tagHex, encryptedText] = parts;
    const key = getDerivedUserKey(username);
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed for user record, returning raw/fallback:', err.message);
    return cipherString;
  }
}

/**
 * Generate session token for username (Passwordless authentication)
 */
function generateUserToken(username) {
  const cleanUser = username.trim();
  const timestamp = Date.now();
  const userHash = hashUsername(cleanUser);
  const payload = `${cleanUser}|${userHash}|${timestamp}`;
  const signature = crypto.createHmac('sha256', MASTER_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}|${signature}`).toString('base64');
}

/**
 * Verify session token and extract username
 */
function verifyUserToken(token) {
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parts = decoded.split('|');
    if (parts.length !== 4) return null;
    
    const [username, userHash, timestamp, signature] = parts;
    const payload = `${username}|${userHash}|${timestamp}`;
    const expectedSignature = crypto.createHmac('sha256', MASTER_SECRET).update(payload).digest('hex');
    
    if (signature !== expectedSignature) return null;
    return username;
  } catch (e) {
    return null;
  }
}

module.exports = {
  hashUsername,
  getDerivedUserKey,
  encryptText,
  decryptText,
  generateUserToken,
  verifyUserToken
};
