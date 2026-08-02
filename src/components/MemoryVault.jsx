import React, { useState } from 'react';
import { Database, Search, ShieldCheck, Clock, MessageSquare, Key } from 'lucide-react';

export default function MemoryVault({ user, token }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setSearching(true);
    setSearched(true);

    try {
      const res = await fetch(`/api/chat/memory-search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.memoryResults || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 className="text-glow" style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '6px' }}>
            Isolated Database & Memory Recall Vault
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Your user profile <strong style={{ color: 'var(--primary-cyan)' }}>"{user?.username}"</strong> has a dedicated AES-256 encrypted database partition. LAF recalls all past interactions seamlessly across weeks and months.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Search style={{ color: 'var(--primary-cyan)', width: '20px' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search past conversations (e.g. 'what did we talk about last week?', 'python', 'ideas')..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '0.95rem',
              outline: 'none'
            }}
          />
          <button type="submit" className="btn-cyber btn-cyber-solid" disabled={searching} style={{ padding: '10px 18px' }}>
            {searching ? 'Querying Isolated DB...' : 'Search Memory'}
          </button>
        </div>
      </form>

      {/* Search Results */}
      {searched && (
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--primary-cyan)', marginBottom: '14px' }}>
            Recalled Memory Logs ({results.length} entries found)
          </h3>

          {results.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {results.map((r, i) => (
                <div key={i} className="glass-panel" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MessageSquare style={{ width: '15px', color: 'var(--primary-cyan)' }} />
                      <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#fff' }}>
                        {r.conversationTitle}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      <Clock style={{ width: '13px' }} />
                      {r.date}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
                    <strong style={{ color: r.role === 'user' ? 'var(--primary-cyan)' : 'var(--primary-purple)' }}>
                      [{r.role.toUpperCase()}]:
                    </strong> {r.content}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)' }}>
              No previous conversation memory matched your search query in this user's isolated partition.
            </div>
          )}
        </div>
      )}

      {/* Partition Tech Architecture Card */}
      <div className="glass-panel" style={{ padding: '24px', marginTop: '30px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--accent-green)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck style={{ width: '18px' }} /> Database Partitioning & Security Specification
        </h3>
        <ul style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.7', paddingLeft: '20px' }}>
          <li>Each username automatically provisions an isolated JSON/SQLite database storage vault (`user_hash.json`).</li>
          <li>Chat logs are encrypted with per-user derived AES-256 keys prior to disk write.</li>
          <li>Cross-user data leakage is physically prevented by isolated file paths and HMACS.</li>
        </ul>
      </div>

    </div>
  );
}
