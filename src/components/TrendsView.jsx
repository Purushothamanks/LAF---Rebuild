import React, { useState, useEffect } from 'react';
import { Globe, RefreshCw, ExternalLink, Zap, Flame, ShieldAlert } from 'lucide-react';

export default function TrendsView() {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [lastUpdated, setLastUpdated] = useState('');

  const fetchTrends = async (force = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/trends${force ? '?refresh=true' : ''}`);
      const data = await res.json();
      if (data.success && data.trends) {
        setTrends(data.trends);
        setLastUpdated(new Date(data.lastUpdated).toLocaleTimeString());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  const filtered = filterCategory === 'ALL'
    ? trends
    : trends.filter(t => t.category.toUpperCase().includes(filterCategory));

  return (
    <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 className="text-glow" style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '6px' }}>
            Live World Trends & Global Intelligence
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Automatically updated real-time information and breaking trends from across the globe.
          </p>
        </div>

        <button
          onClick={() => fetchTrends(true)}
          className="btn-cyber"
          disabled={loading}
          style={{ padding: '10px 16px', fontSize: '0.85rem' }}
        >
          <RefreshCw style={{ width: '16px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {loading ? 'Updating Feed...' : 'Auto-Update Now'}
        </button>
      </div>

      {/* Category Filter Chips */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {['ALL', 'AI & TECHNOLOGY', 'GLOBAL BUSINESS', 'FUTURE SCIENCE'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: filterCategory === cat ? '1px solid var(--primary-cyan)' : '1px solid var(--border-color)',
              background: filterCategory === cat ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              color: filterCategory === cat ? 'var(--primary-cyan)' : 'var(--text-muted)',
              fontSize: '0.78rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Trend Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
        {filtered.map(item => (
          <div key={item.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  background: 'rgba(0, 240, 255, 0.15)',
                  color: 'var(--primary-cyan)',
                  border: '1px solid rgba(0, 240, 255, 0.3)'
                }}>
                  {item.category}
                </span>

                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  {item.updatedAt}
                </span>
              </div>

              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff', marginBottom: '8px', lineHeight: '1.35' }}>
                {item.title}
              </h3>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '14px' }}>
                {item.description}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                Source: {item.source}
              </span>

              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--primary-cyan)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', textDecoration: 'none', fontWeight: '600' }}
                >
                  Source <ExternalLink style={{ width: '13px' }} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
