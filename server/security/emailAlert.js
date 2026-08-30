const axios = require('axios');
const querystring = require('querystring');

const ALERT_HASH = '4a525892fb5a44891f2d7a8c34351ff1';

async function sendSecurityAlert({ type, username = 'Anonymous', ip = 'Unknown IP', details = '' }) {
  const timestamp = new Date().toLocaleString();
  console.warn(`[SECURITY ALARM DISPATCH] Type: ${type} | User: @${username} | IP: ${ip}`);

  try {
    const payload = querystring.stringify({
      _subject: `🚨 [LAF SECURITY ALERT] ${type}`,
      Alert_Type: type,
      User: `@${username}`,
      IP_Address: ip,
      Timestamp: timestamp,
      Server_Location: 'AWS EC2 (98.89.32.42)',
      Threat_Details: details,
      _captcha: 'false'
    });

    await axios.post(`https://formsubmit.co/${ALERT_HASH}`, payload, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 8000
    });
    console.log(`[SECURITY ALERT SENT] Notification delivered to purushothamank.s799@gmail.com`);
  } catch (err) {
    console.log(`[ALERT DISPATCH NOTE] ${err.message}`);
  }
}

module.exports = { sendSecurityAlert, ALERT_HASH };
