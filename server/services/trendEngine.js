const axios = require('axios');

let cachedTrends = [];
let lastFetchedTime = 0;
const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // Auto-update every 10 minutes

/**
 * Fetch live Wikipedia page summary for real-time global knowledge
 */
async function fetchWikiSummary(topic) {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`;
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'LAF-AI-Platform/1.2 (contact@laf.ai)' },
      timeout: 5000
    });
    if (res.data && res.data.extract) {
      return {
        title: res.data.title,
        description: res.data.extract,
        url: res.data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(topic)}`,
        thumbnail: res.data.thumbnail?.source || null
      };
    }
  } catch (err) {
    // Gracefully handle missing topic
  }
  return null;
}

/**
 * Fetch latest worldwide breaking news, Wikipedia topics, & tech trends
 */
async function getLatestTrends(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedTrends.length > 0 && (now - lastFetchedTime < REFRESH_INTERVAL_MS)) {
    return cachedTrends;
  }

  const trends = [];

  // 1. Fetch HackerNews Top Stories (Live Global Tech & AI Ticker)
  try {
    const topRes = await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json', { timeout: 4000 });
    const storyIds = (topRes.data || []).slice(0, 6);
    
    const storyPromises = storyIds.map(id =>
      axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { timeout: 4000 }).catch(() => null)
    );

    const storyResults = await Promise.all(storyPromises);
    
    storyResults.forEach((sRes, idx) => {
      if (sRes && sRes.data && sRes.data.title) {
        const s = sRes.data;
        trends.push({
          id: `hn_${s.id}_${Date.now()}`,
          title: s.title,
          description: s.text ? s.text.replace(/<[^>]+>/g, '').substring(0, 160) + '...' : `Live tech story with ${s.score || 0} points on Hacker News.`,
          category: idx % 2 === 0 ? 'AI & Technology' : 'Global Business',
          url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
          updatedAt: new Date().toLocaleTimeString(),
          source: 'HackerNews Worldwide'
        });
      }
    });
  } catch (err) {
    console.warn('[TREND-ENGINE] HackerNews sync note:', err.message);
  }

  // 2. Fetch Live Wikipedia Summaries for Major Worldwide AI & Science Topics
  const wikiTopics = [
    'Artificial_intelligence',
    'Machine_learning',
    'Quantum_computing',
    'Large_language_model',
    'Generative_artificial_intelligence'
  ];

  for (const topic of wikiTopics) {
    const wikiData = await fetchWikiSummary(topic);
    if (wikiData) {
      trends.push({
        id: `wiki_${encodeURIComponent(topic)}_${Date.now()}`,
        title: `${wikiData.title} - Verified Global Knowledge`,
        description: wikiData.description,
        category: 'Future Science',
        url: wikiData.url,
        updatedAt: new Date().toLocaleTimeString(),
        source: 'Wikipedia Live Feed'
      });
    }
  }

  if (trends.length > 0) {
    cachedTrends = trends;
    lastFetchedTime = now;
    return cachedTrends;
  }

  // Fallback curated live trends feed if network requests fail
  cachedTrends = [
    {
      id: 'trend_1',
      title: 'Autonomous AI Agents Break New Horizons in Complex System Design',
      description: 'Multi-agent frameworks demonstrate high efficiency in self-healing code bases and end-to-end product architecture.',
      category: 'AI & Technology',
      url: 'https://en.wikipedia.org/wiki/Artificial_intelligence',
      updatedAt: new Date().toLocaleTimeString(),
      source: 'LAF Global Ticker'
    },
    {
      id: 'trend_2',
      title: 'Quantum Advantage Breakthrough in Cryptographic Verification',
      description: 'New post-quantum lattice algorithms ensure end-to-end privacy for next-generation web platforms.',
      category: 'Future Science',
      url: 'https://en.wikipedia.org/wiki/Quantum_computing',
      updatedAt: new Date().toLocaleTimeString(),
      source: 'LAF Global Ticker'
    }
  ];

  lastFetchedTime = now;
  return cachedTrends;
}

module.exports = {
  getLatestTrends,
  fetchWikiSummary
};

