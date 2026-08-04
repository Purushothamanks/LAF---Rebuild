# LAF AI ("Look at The Future") - Privacy Policy

**Effective Date:** August 4, 2026  
**Last Updated:** August 4, 2026  
**Data Controller:** Purushothamanks (LAF AI Platform)  
**Host:** `https://98.89.32.42.nip.io`

---

## 1. Our Commitment to Privacy
LAF AI ("Look at The Future") is engineered around strict privacy-by-design principles. We prioritize user privacy, data minimization, and total database isolation.

---

## 2. Information We Collect & How We Store It
- **User Authentication:** We do not require passwords or invasive personal information. Accounts are identified by a unique username and hashed session token.
- **Isolated User Partitions:** Conversation history and user settings are stored in individual JSON database files (`./data/users/user_{hash}.json`).
- **End-to-End Encryption (E2EE):** All chat logs and persistent records are encrypted using **AES-256-GCM** prior to writing to disk. Encryption keys are derived per user using **PBKDF2** with 10,000 iterations.

---

## 3. Data Usage & Zero Third-Party Monetization
- **No Data Selling:** We do NOT sell, rent, or trade user data or prompt histories to advertisers or third parties.
- **No Cross-User Analytics:** Data stored in one user's database partition is completely isolated and cannot be accessed or indexed by other users.
- **Feedback Submissions:** If you submit feedback via the Help & Feedback modal, your email address is used solely to deliver direct response messages to `purushothamanks1711@gmail.com`.

---

## 4. Security Measures
We deploy multi-layered security controls to protect the application:
- Express Rate Limiting (300 requests / 15 mins).
- Helmet HTTP Security Headers preventing XSS and clickjacking.
- HTTPS encryption via TLS 1.3 certificates.

---

## 5. User Control & Data Erasure
You have full right to delete your chat history at any time directly through the sidebar interface or by requesting complete partition deletion.

---

## 6. Contact Information
For privacy inquiries, contact the platform administrator at `purushothamanks1711@gmail.com`.
