/**
 * Comprehensive All-in-One Multi-Domain Knowledge Base & Custom Trained AI Engine
 * Covers Software Engineering, Web UI, Data Science, General Science, Mathematics,
 * Business Strategy, Professional Writing, Career Guidance, and Productivity.
 */

const KNOWLEDGE_REPOSITORY = [
  // 1. HTML/CSS Portfolio
  {
    keywords: ['portfolio', 'html css portfolio', 'build portfolio', 'developer portfolio', 'personal website'],
    category: 'HTML/CSS UI',
    response: `Here is a complete, modern, responsive **HTML & CSS Developer Portfolio Website**:

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
\`\`\``
  },

  // 2. Login Page UI
  {
    keywords: ['login page', 'login form', 'html login', 'css login', 'sign in page'],
    category: 'HTML/CSS UI',
    response: `Here is a modern, dark-themed **HTML & CSS Login Page**:

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
\`\`\``
  },

  // 3. General Science & Quantum Mechanics
  {
    keywords: ['quantum mechanics', 'quantum computing', 'theory of relativity', 'physics', 'einstein'],
    category: 'Science & Physics',
    response: `### 🔬 Quantum Physics & Advanced Mechanics Breakdown

**Quantum Mechanics** is the fundamental theory in physics that describes the physical properties of nature at the atomic and subatomic scale.

#### 1. Core Principles:
- **Wave-Particle Duality:** Matter and light exhibit behaviors of both continuous waves and discrete particles (photons/electrons).
- **Superposition:** Quantum states can exist in multiple combinations simultaneously until measured (e.g. $|\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle$).
- **Quantum Entanglement:** Intertwined particles where the quantum state of one instantly dictates the state of another, regardless of distance.
- **Heisenberg Uncertainty Principle:** Formulated as $\\Delta x \\cdot \\Delta p \\ge \\frac{\\hbar}{2}$, stating position and momentum cannot be simultaneously measured with arbitrary precision.

#### 2. Applications:
- **Quantum Computing:** Qubits leverage superposition and entanglement to execute complex factorization and chemical simulation algorithms exponentially faster.
- **Semiconductors & Lasers:** Modern transistors, CPUs, and optical communications rely on quantum energy band theory.`
  },

  // 4. Mathematics & Calculus
  {
    keywords: ['calculus', 'algebra', 'linear algebra', 'derivative', 'integral', 'probability'],
    category: 'Mathematics',
    response: `### 📐 Mathematical Foundations & Analysis

Mathematical reasoning provides the foundation for computer science, quantitative finance, and physical modeling.

#### 1. Differential & Integral Calculus:
- **Derivatives (Rate of Change):**
  $$f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$
- **Fundamental Theorem of Calculus:**
  $$\\int_{a}^{b} f(x) \\, dx = F(b) - F(a)$$

#### 2. Linear Algebra:
- **Matrix Multiplication:** For $A \\in \\mathbb{R}^{m \\times n}$ and $B \\in \\mathbb{R}^{n \\times p}$, product $C = AB \\in \\mathbb{R}^{m \\times p}$ where $c_{ij} = \\sum_{k=1}^{n} a_{ik} b_{kj}$.
- **Eigenvalues & Eigenvectors:** Solves $A v = \\lambda v$, central to PCA dimension reduction and PageRank algorithms.`
  },

  // 5. Business Strategy & Entrepreneurship
  {
    keywords: ['business strategy', 'startup', 'marketing funnel', 'business model', 'entrepreneurship'],
    category: 'Business & Management',
    response: `### 💼 High-Growth Startup Strategy & Execution Framework

Building a sustainable, high-growth venture requires aligning product value, customer acquisition channels, and capital efficiency.

#### 1. The 4 Pillars of Product-Market Fit (PMF):
1. **Value Proposition:** Solving an urgent, high-friction pain point for a distinct target audience.
2. **Unit Economics:** Ensuring Customer Lifetime Value exceeds Customer Acquisition Cost ($LTV : CAC \\ge 3:1$).
3. **Distribution Flywheel:** Leveraging organic referral loops, SEO, content marketing, and strategic partnerships.
4. **Retention Engine:** High daily/weekly active usage ($DAU/MAU$) driving strong expansion MRR.

#### 2. Execution Roadmap:
- **Phase 1 (MVP):** Launch minimal functional product to validate core retention metrics.
- **Phase 2 (Growth):** Optimize conversion funnels, onboarding flows, and paid acquisition.
- **Phase 3 (Scale):** Expand sales capacity, automate operations, and solidify competitive moat.`
  },

  // 6. Resume & Cover Letter Writing
  {
    keywords: ['resume', 'cover letter', 'cold email', 'write resume', 'job application'],
    category: 'Professional Writing',
    response: `### 📄 Professional High-Impact Resume & Email Strategy

A high-converting resume uses quantifiable achievements and the Google XYZ Formula (*"Accomplished [X], as measured by [Y], by doing [Z]"*).

#### Sample Executive Resume Summary:
> **Senior Full-Stack Engineer & Architect** with 5+ years of experience engineering high-throughput microservices and modern web applications. Proven track record of reducing latency by 45% and scaling user bases from 10k to 1M+ active users.

#### High-Converting Cold Email Template:
\`\`\`text
Subject: Full-Stack Engineering Inquiry - [Your Name]

Hi [Hiring Manager Name],

I came across [Company Name]'s recent work on [Specific Initiative/Product] and was thoroughly impressed by your engineering approach.

Over the past [X] years, I have specialized in building scalable React and Node.js applications, recently optimizing API throughput by 60% and reducing database load.

I would love to contribute to [Company Name]'s upcoming goals. Are you available for a brief 10-minute chat this week?

Best regards,
[Your Name]
[LinkedIn Profile Link] | [Portfolio Link]
\`\`\``
  },

  // 7. Productivity & Time Management
  {
    keywords: ['productivity', 'pomodoro', 'time management', 'feynman technique', 'study habits'],
    category: 'Personal Development',
    response: `### ⚡ High-Performance Productivity & Study Blueprint

Attaining deep focus and rapid skill acquisition relies on structured cognitive frameworks:

#### 1. The Feynman Technique for Deep Learning:
1. **Choose a Concept:** Select a topic you want to master.
2. **Explain it Simply:** Write out an explanation as if teaching a 10-year-old (no complex jargon).
3. **Identify Knowledge Gaps:** Re-read your explanation; wherever you get stuck, revisit source material.
4. **Refine & Analogize:** Simplify your wording and create intuitive real-world analogies.

#### 2. The 90/20 High-Output Work Cycles:
- **Block 90 Minutes:** Uninterrupted single-task focus (zero notifications or tab switching).
- **Take 20 Minutes Recovery:** Complete mental disconnect (walk, hydrate, rest eyes).
- **Limit to 3 Core Deep Blocks/Day:** Yields 4.5 hours of peak cognitive throughput.`
  }
];

/**
 * Searches multi-domain knowledge base for matching query keywords
 */
function searchCustomKnowledge(prompt = '') {
  const p = prompt.toLowerCase().trim();
  if (!p) return null;

  for (const item of KNOWLEDGE_REPOSITORY) {
    if (item.keywords.some(k => p.includes(k))) {
      return item.response;
    }
  }

  return null;
}

module.exports = {
  KNOWLEDGE_REPOSITORY,
  searchCustomKnowledge
};
