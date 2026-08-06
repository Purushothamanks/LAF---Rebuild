/**
 * Custom Knowledge & Dedicated Training Module for LAF AI
 * Provides production-grade code generators, framework templates, and technical knowledge.
 */

const KNOWLEDGE_BASE = {
  // HTML & CSS Templates
  portfolio: `Here is a complete, responsive **HTML & CSS Portfolio Website**:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Developer Portfolio</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --accent: #38bdf8;
      --text: #f8fafc;
      --muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
    body { background: var(--bg); color: var(--text); line-height: 1.6; padding: 2rem 1rem; }
    header { max-width: 1000px; margin: 0 auto 3rem auto; display: flex; justify-content: space-between; align-items: center; }
    nav a { color: var(--muted); text-decoration: none; margin-left: 1.5rem; transition: color 0.2s; }
    nav a:hover { color: var(--accent); }
    .hero { max-width: 1000px; margin: 4rem auto; text-align: center; }
    .hero h1 { font-size: 2.8rem; margin-bottom: 1rem; background: linear-gradient(135deg, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .hero p { font-size: 1.2rem; color: var(--muted); max-width: 600px; margin: 0 auto 2rem auto; }
    .btn { background: var(--accent); color: #0f172a; padding: 0.75rem 1.75rem; border-radius: 9999px; text-decoration: none; font-weight: 600; display: inline-block; }
    .projects { max-width: 1000px; margin: 5rem auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
    .card { background: var(--card-bg); padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
    .card h3 { margin-bottom: 0.5rem; color: var(--accent); }
    .card p { color: var(--muted); font-size: 0.95rem; }
    footer { text-align: center; color: var(--muted); margin-top: 5rem; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.05); }
  </style>
</head>
<body>
  <header>
    <h2>Developer Portfolio</h2>
    <nav>
      <a href="#about">About</a>
      <a href="#projects">Projects</a>
      <a href="#contact">Contact</a>
    </nav>
  </header>

  <section class="hero">
    <h1>Hello, I'm a Full-Stack Developer</h1>
    <p>I build high-performance web applications, modern UIs, and robust backend systems.</p>
    <a href="#contact" class="btn">Get In Touch</a>
  </section>

  <section id="projects" class="projects">
    <div class="card">
      <h3>⚡ AI Web Platform</h3>
      <p>Autonomous AI chat platform built with React, Node.js, and WebSockets.</p>
    </div>
    <div class="card">
      <h3>🔐 E2EE Security Vault</h3>
      <p>Zero-knowledge passwordless encrypted storage system built with Web Crypto API.</p>
    </div>
    <div class="card">
      <h3>🌐 High-Speed API Service</h3>
      <p>Microservice architecture deployed with Docker, Nginx, and Node.js backend.</p>
    </div>
  </section>

  <footer>
    <p>© 2026 Developer Portfolio. Built with HTML & CSS.</p>
  </footer>
</body>
</html>
\`\`\``,

  login_page: `Here is a modern, responsive **HTML & CSS Login Page**:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - Modern UI</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', system-ui, sans-serif; }
    body { background: #0b0f19; color: #f3f4f6; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .card { background: #111827; padding: 2.5rem; border-radius: 16px; border: 1px solid #1f2937; width: 100%; max-width: 400px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    h2 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem; text-align: center; }
    p.subtitle { color: #9ca3af; font-size: 0.875rem; text-align: center; margin-bottom: 2rem; }
    .group { margin-bottom: 1.25rem; }
    label { display: block; font-size: 0.875rem; margin-bottom: 0.5rem; color: #d1d5db; }
    input { width: 100%; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid #374151; background: #1f2937; color: #fff; outline: none; font-size: 0.95rem; }
    input:focus { border-color: #3b82f6; ring: 2px #3b82f6; }
    button { width: 100%; padding: 0.75rem; border-radius: 8px; border: none; background: #3b82f6; color: #fff; font-weight: 600; cursor: pointer; margin-top: 1rem; transition: background 0.2s; }
    button:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Welcome Back</h2>
    <p class="subtitle">Enter your credentials to access your account</p>
    <form onsubmit="event.preventDefault(); alert('Login submitted!');">
      <div class="group">
        <label>Email Address</label>
        <input type="email" placeholder="name@example.com" required />
      </div>
      <div class="group">
        <label>Password</label>
        <input type="password" placeholder="••••••••" required />
      </div>
      <button type="submit">Sign In</button>
    </form>
  </div>
</body>
</html>
\`\`\``,

  landing_page: `Here is a clean **HTML & CSS Landing Page** template:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SaaS Product - Landing Page</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, sans-serif; }
    body { background: #090d16; color: #e2e8f0; line-height: 1.5; }
    .container { max-width: 1100px; margin: 0 auto; padding: 2rem 1.5rem; }
    nav { display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 1.5rem; font-weight: 800; color: #38bdf8; }
    .hero { text-align: center; padding: 6rem 1rem; }
    .hero h1 { font-size: 3.5rem; font-weight: 800; margin-bottom: 1.5rem; }
    .hero p { font-size: 1.25rem; color: #94a3b8; max-width: 700px; margin: 0 auto 2.5rem auto; }
    .cta { background: #38bdf8; color: #090d16; font-weight: 700; padding: 1rem 2.5rem; border-radius: 9999px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <nav>
      <div class="logo">LAF Platform</div>
      <a href="#start" class="cta">Get Started</a>
    </nav>
    <section class="hero">
      <h1>Build Next-Gen Applications Faster</h1>
      <p>Empower your team with autonomous AI workflows, sub-350ms processing, and enterprise-grade security.</p>
      <a href="#start" class="cta">Start Free Trial</a>
    </section>
  </div>
</body>
</html>
\`\`\``,

  express_api: `Here is a complete **Node.js Express REST API** starter server:

\`\`\`javascript
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// In-memory data store
let items = [
  { id: 1, name: 'Sample Item 1', category: 'General' },
  { id: 2, name: 'Sample Item 2', category: 'Tech' }
];

// GET all items
app.get('/api/items', (req, res) => {
  res.json({ success: true, count: items.length, data: items });
});

// POST new item
app.post('/api/items', (req, res) => {
  const { name, category } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, error: 'Name is required' });
  }

  const newItem = { id: items.length + 1, name, category: category || 'General' };
  items.push(newItem);
  res.status(201).json({ success: true, data: newItem });
});

app.listen(PORT, () => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
});
\`\`\``,

  binary_search: `Here is a complete implementation of **Binary Search** in Python and JavaScript:

### Python Implementation:
\`\`\`python
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid  # Return index of found element
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1  # Target not found

# Usage:
numbers = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
result = binary_search(numbers, 23)
print(f"Target found at index: {result}")
\`\`\`

### JavaScript Implementation:
\`\`\`javascript
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

const numbers = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
console.log("Index of 23:", binarySearch(numbers, 23));
\`\`\``
};

/**
 * Searches custom trained knowledge base for matching query keywords
 */
function searchCustomKnowledge(prompt = '') {
  const p = prompt.toLowerCase();

  if (p.includes('portfolio') || (p.includes('html') && p.includes('css') && p.includes('code'))) {
    return KNOWLEDGE_BASE.portfolio;
  }
  if (p.includes('login') && (p.includes('page') || p.includes('html') || p.includes('form'))) {
    return KNOWLEDGE_BASE.login_page;
  }
  if (p.includes('landing page') || p.includes('website template')) {
    return KNOWLEDGE_BASE.landing_page;
  }
  if (p.includes('express') || p.includes('rest api') || p.includes('backend server')) {
    return KNOWLEDGE_BASE.express_api;
  }
  if (p.includes('binary search')) {
    return KNOWLEDGE_BASE.binary_search;
  }

  return null;
}

module.exports = {
  KNOWLEDGE_BASE,
  searchCustomKnowledge
};
