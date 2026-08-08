const axios = require('axios');

/**
 * High-Performance Real-Time Web Search & Grounding Service
 * Fetches live search results from DuckDuckGo HTML & Wikipedia APIs
 */
async function searchWebGrounding(query = '') {
  if (!query || query.trim().length < 2) return null;
  const cleanQuery = query.trim();

  const results = [];

  // 1. DuckDuckGo HTML Search
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery)}`;
    const res = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 5000
    });

    const html = res.data || '';
    
    // Extract snippets from DuckDuckGo HTML
    const snippetMatches = html.match(/<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/gi) || [];
    const titleMatches = html.match(/<a class="result__title[^>]*>([\s\S]*?)<\/a>/gi) || [];

    for (let i = 0; i < Math.min(snippetMatches.length, 5); i++) {
      const snippetText = snippetMatches[i].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      const titleText = titleMatches[i] ? titleMatches[i].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : `Result ${i + 1}`;
      if (snippetText && snippetText.length > 15) {
        results.push(`• **${titleText}**: ${snippetText}`);
      }
    }
  } catch (err) {
    console.log(`[WEB-SEARCH] DDG HTML Search notice: ${err.message}`);
  }

  // 2. Wikipedia Summary REST API
  try {
    const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanQuery)}`;
    const wikiRes = await axios.get(wikiUrl, {
      headers: {
        'User-Agent': 'LAF-AI-Platform/1.2 (https://github.com/Purushothamanks/LAF---Rebuild)'
      },
      timeout: 4000
    });
    if (wikiRes.data && wikiRes.data.extract) {
      results.unshift(`• **Wikipedia Overview (${wikiRes.data.title || cleanQuery})**: ${wikiRes.data.extract}`);
    }
  } catch (err) {}

  if (results.length > 0) {
    const combined = results.slice(0, 5).join('\n\n');
    console.log(`[WEB-SEARCH] Retrieved ${results.length} live grounded snippets for query "${cleanQuery}"`);
    return combined;
  }

  return null;
}

module.exports = {
  searchWebGrounding
};
