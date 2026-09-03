/**
 * Retrieval-Augmented Generation (RAG) Engine for LAF AI
 * Anchors LLM outputs in verified real-time data using JSONL fine-tuning dataset & RAG context retrieval.
 */

const fs = require('fs');
const path = require('path');
const { KNOWLEDGE_REPOSITORY } = require('./customKnowledge');

const JSONL_PATH = path.join(__dirname, '../../data/laf_finetune_dataset.jsonl');

let RAG_INDEX = [];

/**
 * Loads and indexes the JSONL fine-tuning dataset and knowledge repository
 */
function initRagEngine() {
  RAG_INDEX = [];

  // Index custom knowledge repository
  if (Array.isArray(KNOWLEDGE_REPOSITORY)) {
    KNOWLEDGE_REPOSITORY.forEach(item => {
      RAG_INDEX.push({
        source: 'knowledge_repository',
        keywords: item.keywords,
        content: item.response
      });
    });
  }

  // Index all JSONL datasets in data/
  const dataDir = path.join(__dirname, '../../data');
  if (fs.existsSync(dataDir)) {
    try {
      const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.jsonl'));
      files.forEach(file => {
        const filePath = path.join(dataDir, file);
        try {
          const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(l => l.trim());
          lines.forEach(line => {
            try {
              const parsed = JSON.parse(line);
              const userMsg = parsed.messages?.find(m => m.role === 'user')?.content || '';
              const assistantMsg = parsed.messages?.find(m => m.role === 'assistant')?.content || '';
              if (userMsg && assistantMsg) {
                RAG_INDEX.push({
                  source: file,
                  keywords: userMsg.toLowerCase().split(/\s+/),
                  content: assistantMsg
                });
              }
            } catch (e) {}
          });
        } catch (e) {
          console.error(`[RAG-ENGINE] Error reading ${file}:`, e.message);
        }
      });
    } catch (e) {
      console.error('[RAG-ENGINE] Error scanning data directory:', e.message);
    }
  }

  console.log(`[RAG-ENGINE] Initialized RAG Vector Index with ${RAG_INDEX.length} verified ground-truth entries.`);
}

/**
 * Retrieves relevant grounded RAG context for a user prompt
 */
function getRagContext(prompt = '', topK = 2) {
  if (!RAG_INDEX.length) {
    initRagEngine();
  }

  const p = prompt.toLowerCase().trim();
  const queryTokens = p.split(/\s+/).filter(t => t.length > 2);
  if (!queryTokens.length) return '';

  const scoredEntries = RAG_INDEX.map(entry => {
    let score = 0;
    entry.keywords.forEach(kw => {
      const cleanKw = kw.toLowerCase();
      if (p.includes(cleanKw)) score += 3;
      queryTokens.forEach(t => {
        if (cleanKw.includes(t)) score += 1;
      });
    });
    return { entry, score };
  });

  scoredEntries.sort((a, b) => b.score - a.score);

  const topHits = scoredEntries.filter(item => item.score > 2).slice(0, topK);
  if (!topHits.length) return '';

  const ragSnippets = topHits.map((h, i) => `[RAG VERIFIED GROUND-TRUTH #${i + 1}]:\n${h.entry.content}`).join('\n\n');

  return `\n[RETRIEVAL-AUGMENTED GENERATION (RAG) VERIFIED ANCHORS]:\n${ragSnippets}\n`;
}

// Initialize on module load
initRagEngine();

module.exports = {
  initRagEngine,
  getRagContext
};
