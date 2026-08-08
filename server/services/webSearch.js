const axios = require('axios');

/**
 * Real-time Grounding & Search Service for LAF AI Platform
 * Queries DuckDuckGo and Wikipedia to retrieve up-to-date factual snippets
 */
async function searchWebGrounding(query = '') {
  if (!query || query.trim().length < 3) return null;
  const cleanQuery = query.trim();

  try {
    // 1. DuckDuckGo Instant Answer API
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}&format=json&no_html=1&skip_disambig=1`;
    const ddgRes = await axios.get(ddgUrl, { timeout: 4000 });

    let summary = '';
    if (ddgRes.data && ddgRes.data.AbstractText) {
      summary = ddgRes.data.AbstractText;
    } else if (ddgRes.data && ddgRes.data.Heading && ddgRes.data.RelatedTopics && ddgRes.data.RelatedTopics.length > 0) {
      const topic = ddgRes.data.RelatedTopics.find(t => t.Text);
      if (topic) summary = topic.Text;
    }

    // 2. Wikipedia Summary REST API fallback/supplement
    const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanQuery)}`;
    const wikiRes = await axios.get(wikiUrl, { timeout: 4000 }).catch(() => null);

    let wikiExtract = '';
    if (wikiRes && wikiRes.data && wikiRes.data.extract) {
      wikiExtract = wikiRes.data.extract;
    }

    const combined = (summary ? summary + '\n' : '') + wikiExtract;
    if (combined.trim()) {
      console.log(`[WEB-SEARCH] Grounded factual snippet retrieved for query "${cleanQuery}"`);
      return combined.trim();
    }
  } catch (err) {
    console.log(`[WEB-SEARCH] Grounding note: ${err.message}`);
  }

  return null;
}

module.exports = {
  searchWebGrounding
};
