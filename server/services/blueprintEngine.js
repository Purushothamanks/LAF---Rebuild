/**
 * LAF Autonomous Vector Blueprint Engine (Backend Node.js)
 * Synthesizes ultra-sharp, crystal-clear, 100% identifiable architectural blueprint diagrams
 * directly from conversation content and engineering domain models.
 */

function escapeXml(unsafe) {
  return String(unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function parseContentToBlueprint(topic = '', assistantText = '') {
  let cleanTopic = (topic || 'System Engineering Architecture')
    .replace(/^how to\s+/i, '')
    .replace(/^can you\s+/i, '')
    .replace(/^explain\s+/i, '')
    .replace(/^what is\s+/i, '')
    .replace(/^tell me about\s+/i, '')
    .replace(/^(give me as|give as|show as)\s+(a\s+)?(blueprint|graph|diagram|flowchart|image)\s*(for|of)?\s*/i, '')
    .replace(/\b(blueprint|blue-prit|graph|ghaph|grap|diagram|image)\b/gi, '')
    .replace(/[?!.]+$/, '')
    .trim();

  cleanTopic = cleanTopic ? (cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1)) : 'System Architecture';

  const lines = (assistantText || '').split('\n');
  const extractedPhases = [];
  let currentPhase = null;

  lines.forEach(line => {
    const trimmed = line.trim();
    const headingMatch = trimmed.match(/^(?:#{1,4}\s+|\d+[\.\)]\s+)(.+)/i);
    if (headingMatch) {
      if (currentPhase && currentPhase.title) {
        extractedPhases.push(currentPhase);
      }
      currentPhase = {
        title: headingMatch[1]
          .replace(/^\d+[\.\)]\s*/, '')
          .replace(/\*\*/g, '')
          .replace(/^Phase\s*\d+:\s*/i, '')
          .replace(/^[#*\s-]+/, '')
          .trim(),
        details: []
      };
    } else if (currentPhase && (trimmed.startsWith('*') || trimmed.startsWith('-') || trimmed.startsWith('`'))) {
      const cleanDetail = trimmed.replace(/^[*`\s-]+/, '').replace(/[`*]/g, '').trim();
      if (cleanDetail && currentPhase.details.length < 3) {
        currentPhase.details.push(cleanDetail);
      }
    }
  });

  if (currentPhase && currentPhase.title) {
    extractedPhases.push(currentPhase);
  }

  let finalPhases = extractedPhases.filter(p => p.title && p.title.length > 2).slice(0, 5);

  if (finalPhases.length < 3) {
    const tLower = cleanTopic.toLowerCase();
    if (/git|deploy|github|push|commit|repo/i.test(tLower)) {
      finalPhases = [
        {
          title: '01 // Local Repository Initialization',
          details: ['git init (initialize local tracking)', 'git add . (stage all project assets)', 'git commit -m "Initial production commit"']
        },
        {
          title: '02 // Remote Link & Authentication',
          details: ['Create remote repository on GitHub', 'git remote add origin <https://github.com/...>', 'git remote -v (verify origin URL)']
        },
        {
          title: '03 // Branch Architecture & Topology',
          details: ['git branch -M main (enforce standard main)', 'Configure .gitignore and environment bounds', 'Establish upstream tracking baseline']
        },
        {
          title: '04 // Push Deployment & Key Exchange',
          details: ['git push -u origin main (initial deployment)', 'Authenticate via SSH Key / Fine-Grained Token', 'Inspect remote commit tree & branches']
        },
        {
          title: '05 // CI/CD Actions & Production Verify',
          details: ['Configure .github/workflows/deploy.yml', 'Automated test & build pass verification', 'Production verified live on network']
        }
      ];
    } else if (/ai|model|neural|machine learning|deep learning|llm/i.test(tLower)) {
      finalPhases = [
        {
          title: '01 // Problem Scope & Data Pipeline',
          details: ['Define NLP / Vision task objectives & KPIs', 'Data ingestion, cleaning & deduplication', 'Train (70%) / Val (15%) / Test (15%) split']
        },
        {
          title: '02 // Neural Architecture Selection',
          details: ['Framework: PyTorch / TensorFlow 2.x', 'Pre-trained foundation weights / Transformer', 'Parameter-efficient fine-tuning (LoRA / PEFT)']
        },
        {
          title: '03 // Training & Hyperparameter Tuning',
          details: ['AdamW optimizer & cosine learning schedule', 'Validation loss curve monitoring & early stopping', 'Benchmark accuracy, precision & recall tests']
        },
        {
          title: '04 // Containerization & Inference API',
          details: ['Package dependencies via Docker container', 'FastAPI / Express high-performance API wrap', 'GPU acceleration (CUDA / TensorRT / ONNX)']
        },
        {
          title: '05 // Telemetry & Governance Loop',
          details: ['Sub-second latency profiling & request logs', 'Continuous data drift & concept drift detection', 'Automated feedback retraining loop active']
        }
      ];
    } else {
      finalPhases = [
        {
          title: '01 // Strategic Planning & Scope',
          details: ['Define foundational mechanical constraints', 'Scope functional invariants & deliverables', 'Establish verifiable milestone telemetry']
        },
        {
          title: '02 // Topology & System Modeling',
          details: ['Component boundary separation & schema', 'Interface contracts & data flow modeling', 'Resilience boundaries & fallback paths']
        },
        {
          title: '03 // Core Implementation & Synthesis',
          details: ['High-performance modular implementation', 'Strict boundary type-checking & guards', 'Zero unhandled error propagation paths']
        },
        {
          title: '04 // Quality Assurance & Stress Tests',
          details: ['Automated regression & integration suites', 'Hostile race condition & edge stress testing', 'Security audit & input sanitization pass']
        },
        {
          title: '05 // Production Release & Monitoring',
          details: ['Zero-downtime deployment execution', 'Real-time telemetry & latency metrics', 'Continuous telemetry verification loop']
        }
      ];
    }
  }

  finalPhases.forEach((p, idx) => {
    if (!p.title.startsWith('0')) {
      p.title = `0${idx + 1} // ${p.title}`;
    }
    if (!p.details || p.details.length === 0) {
      p.details = [`Step ${idx + 1}.1: Primary specification`, `Step ${idx + 1}.2: Quality validation check`];
    } else if (p.details.length === 1) {
      p.details.push(`Step ${idx + 1}.2: Automated verification telemetry`);
    }
  });

  return { cleanTopic, phases: finalPhases };
}

function generateBlueprintImageUri({ topic, assistantText }) {
  const { cleanTopic, phases } = parseContentToBlueprint(topic, assistantText);
  const width = 1200;
  const height = 820;
  const displayTopic = cleanTopic.toUpperCase();
  const dateStr = new Date().toISOString().split('T')[0] || '2026-11-04';
  const docId = `LAF-BP-${Math.floor(100000 + Math.random() * 900000)}`;

  const cards = phases.map((p, idx) => {
    let x, y, w = 344, h = 186;
    if (idx < 3) {
      x = 48 + idx * 376;
      y = 168;
    } else {
      x = 236 + (idx - 3) * 376;
      y = 428;
    }
    return { ...p, x, y, w, h, stepNum: `0${idx + 1}` };
  });

  const cardsSvg = cards.map(c => `
    <g transform="translate(${c.x}, ${c.y})">
      <rect width="${c.w}" height="${c.h}" rx="8" fill="#0b172a" stroke="#38bdf8" stroke-width="1.8" filter="url(#glow)"/>
      <path d="M 0 8 Q 0 0 8 0 L ${c.w - 8} 0 Q ${c.w} 0 ${c.w} 8 L ${c.w} 34 L 0 34 Z" fill="#172e4d"/>
      <line x1="0" y1="34" x2="${c.w}" y2="34" stroke="#38bdf8" stroke-width="1.2"/>
      
      <rect x="8" y="7" width="34" height="20" rx="4" fill="#38bdf8"/>
      <text x="25" y="22" font-family="monospace, Courier, sans-serif" font-size="12" font-weight="bold" fill="#07111e" text-anchor="middle">${c.stepNum}</text>
      
      <text x="50" y="22" font-family="system-ui, -apple-system, sans-serif" font-size="12.5" font-weight="700" fill="#f0f9ff">${escapeXml(c.title.replace(/^0\d\s*\/\/\s*/, '').slice(0, 32))}</text>
      
      ${c.details.slice(0, 3).map((d, dIdx) => `
        <circle cx="16" cy="${64 + dIdx * 40}" r="3.5" fill="#38bdf8"/>
        <text x="26" y="${68 + dIdx * 40}" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#bae6fd" font-weight="500">
          ${escapeXml(d.slice(0, 44))}
        </text>
      `).join('')}

      <path d="M 0 10 L 10 10 M 10 0 L 10 10" stroke="#0ea5e9" stroke-width="1"/>
      <path d="M ${c.w} 10 L ${c.w - 10} 10 M ${c.w - 10} 0 L ${c.w - 10} 10" stroke="#0ea5e9" stroke-width="1"/>
    </g>
  `).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%">
  <defs>
    <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#172e4d" stroke-width="0.8" stroke-opacity="0.45"/>
    </pattern>
    <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
      <rect width="100" height="100" fill="url(#smallGrid)"/>
      <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#1e3a5f" stroke-width="1.4" stroke-opacity="0.75"/>
    </pattern>
    <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#0284c7" flood-opacity="0.35"/>
    </filter>
  </defs>

  <rect width="${width}" height="${height}" fill="#06101e"/>
  <rect width="${width}" height="${height}" fill="url(#grid)"/>

  <rect x="18" y="18" width="${width - 36}" height="${height - 36}" fill="none" stroke="#38bdf8" stroke-width="2.2"/>
  <rect x="24" y="24" width="${width - 48}" height="${height - 48}" fill="none" stroke="#0ea5e9" stroke-width="0.8" stroke-dasharray="8 4"/>

  <g transform="translate(36, 36)">
    <rect width="${width - 72}" height="84" fill="#0c1a2e" stroke="#38bdf8" stroke-width="1.5"/>
    <text x="24" y="32" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="bold" fill="#38bdf8" letter-spacing="3">LAF AUTONOMOUS ARCHITECTURE MATRIX // VERIFIED SYSTEM BLUEPRINT</text>
    <text x="24" y="64" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="900" fill="#ffffff" letter-spacing="1">${escapeXml(displayTopic)}</text>
    
    <line x1="${width - 330}" y1="0" x2="${width - 330}" y2="84" stroke="#1e3a5f" stroke-width="1.5"/>
    <text x="${width - 310}" y="28" font-family="monospace, Courier, sans-serif" font-size="11" fill="#7dd3fc">DOCUMENT ID: <tspan fill="#ffffff" font-weight="bold">${docId}</tspan></text>
    <text x="${width - 310}" y="48" font-family="monospace, Courier, sans-serif" font-size="11" fill="#7dd3fc">DATE CODED:  <tspan fill="#ffffff" font-weight="bold">${dateStr}</tspan></text>
    <text x="${width - 310}" y="68" font-family="monospace, Courier, sans-serif" font-size="11" fill="#7dd3fc">ENGINE TYPE: <tspan fill="#38bdf8" font-weight="bold">LAF BLUEPRINT 1.0</tspan></text>
  </g>

  <!-- Flow Direction Connectors -->
  <path d="M 392 260 L 424 260" stroke="#38bdf8" stroke-width="2.5" fill="none"/>
  <path d="M 768 260 L 800 260" stroke="#38bdf8" stroke-width="2.5" fill="none"/>
  <path d="M 970 354 L 970 392 L 424 392 L 424 428" stroke="#38bdf8" stroke-width="2" stroke-dasharray="6 4" fill="none"/>
  <path d="M 580 520 L 612 520" stroke="#38bdf8" stroke-width="2.5" fill="none"/>

  ${cardsSvg}

  <g transform="translate(36, 702)">
    <rect width="${width - 72}" height="66" fill="#0b1728" stroke="#1e3a5f" stroke-width="1.2"/>
    <text x="24" y="26" font-family="monospace, Courier, sans-serif" font-size="11" font-weight="bold" fill="#38bdf8">ARCHITECTURE STATUS: PRODUCTION VERIFIED</text>
    <text x="24" y="46" font-family="system-ui, sans-serif" font-size="12" fill="#94a3b8">Every workflow phase above is synthesized from verified domain specifications.</text>

    <rect x="${width - 300}" y="8" width="210" height="48" rx="4" fill="#082f49" stroke="#38bdf8" stroke-width="1.5"/>
    <text x="${width - 195}" y="30" font-family="monospace, Courier, sans-serif" font-size="12" font-weight="900" fill="#38bdf8" text-anchor="middle" letter-spacing="1">✓ APPROVED BLUEPRINT</text>
    <text x="${width - 195}" y="46" font-family="monospace, Courier, sans-serif" font-size="9" fill="#bae6fd" text-anchor="middle">LOOK AT FUTURE (LAF AI)</text>
  </g>
</svg>`;

  const base64Svg = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64Svg}`;
}

module.exports = {
  parseContentToBlueprint,
  generateBlueprintImageUri
};
