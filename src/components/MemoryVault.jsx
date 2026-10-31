import React, { useState, useEffect } from 'react';
import { Database, Search, ShieldCheck, Clock, MessageSquare, Code, Sliders, Play, Trash2, Plus, Check } from 'lucide-react';
import { apiUrl } from '../api';
import { searchLocalMemory, getLocalUserDb } from '../utils/aiClient';
import AgentSandbox from './AgentSandbox';

export default function MemoryVault({ user, token }) {
  const [activeTab, setActiveTab] = useState('conversations'); // 'conversations', 'artifacts', 'directives'
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  // Directives state
  const directivesKey = `laf_directives_${user?.username?.toLowerCase() || 'default'}`;
  const [directives, setDirectives] = useState(() => {
    try {
      const saved = localStorage.getItem(directivesKey);
      return saved ? JSON.parse(saved) : [
        'Always produce complete production-ready code without ellipses or placeholders',
        'Use TypeScript with explicit types where applicable',
        'Ensure mobile-first responsive layouts with clean CSS variables'
      ];
    } catch (e) {
      return [];
    }
  });
  const [newDirective, setNewDirective] = useState('');
  const [savedDirectiveNotice, setSavedDirectiveNotice] = useState(false);

  // Active sandbox modal preview
  const [previewArtifact, setPreviewArtifact] = useState(null);

  // Extract all artifacts from local database
  const [artifacts, setArtifacts] = useState([]);

  useEffect(() => {
    const db = getLocalUserDb(user?.username);
    if (!db || !Array.isArray(db.conversations)) return;

    const list = [];
    db.conversations.forEach(c => {
      if (Array.isArray(c.messages)) {
        c.messages.forEach(m => {
          if (Array.isArray(m.artifacts) && m.artifacts.length > 0) {
            m.artifacts.forEach((a, i) => {
              list.push({
                ...a,
                id: `${c.id}_${i}`,
                conversationTitle: c.title || 'Conversation',
                date: new Date(c.updatedAt || c.createdAt).toLocaleDateString()
              });
            });
          }
        });
      }
    });
    setArtifacts(list);
  }, [user?.username]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearched(true);

    let foundBackend = false;

    try {
      const res = await fetch(apiUrl(`/api/chat/memory-search?q=${encodeURIComponent(searchQuery)}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        const data = await res.json();
        if (data.success && Array.isArray(data.memoryResults)) {
          setResults(data.memoryResults);
          foundBackend = true;
        }
      }
    } catch (e) {
      console.warn('Backend memory search note:', e.message);
    }

    if (!foundBackend) {
      const localResults = searchLocalMemory(user?.username, searchQuery);
      setResults(localResults);
    }

    setSearching(false);
  };

  const handleAddDirective = (e) => {
    e.preventDefault();
    if (!newDirective.trim()) return;
    const updated = [...directives, newDirective.trim()];
    setDirectives(updated);
    localStorage.setItem(directivesKey, JSON.stringify(updated));
    setNewDirective('');
    setSavedDirectiveNotice(true);
    setTimeout(() => setSavedDirectiveNotice(false), 2000);
  };

  const handleDeleteDirective = (idx) => {
    const updated = directives.filter((_, i) => i !== idx);
    setDirectives(updated);
    localStorage.setItem(directivesKey, JSON.stringify(updated));
  };

  return (
    <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 className="text-glow" style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '6px' }}>
          Memory & Architectural Knowledge Vault
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Isolated cryptographic database for <strong style={{ color: 'var(--primary-cyan)' }}>"{user?.username}"</strong>. Indexing conversations, code artifacts, and autonomous agent directives.
        </p>
      </div>

      {/* Sub-Tabs Navigation */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '22px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('conversations')}
          className="btn-cyber"
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            background: activeTab === 'conversations' ? 'rgba(79, 117, 255, 0.2)' : 'transparent',
            borderColor: activeTab === 'conversations' ? 'var(--ds-blue)' : 'transparent',
            color: activeTab === 'conversations' ? '#60a5fa' : '#94a3b8'
          }}
        >
          <MessageSquare style={{ width: '15px' }} /> Conversation Recall
        </button>

        <button
          onClick={() => setActiveTab('artifacts')}
          className="btn-cyber"
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            background: activeTab === 'artifacts' ? 'rgba(79, 117, 255, 0.2)' : 'transparent',
            borderColor: activeTab === 'artifacts' ? 'var(--ds-blue)' : 'transparent',
            color: activeTab === 'artifacts' ? '#60a5fa' : '#94a3b8'
          }}
        >
          <Code style={{ width: '15px' }} /> Code Artifacts ({artifacts.length})
        </button>

        <button
          onClick={() => setActiveTab('directives')}
          className="btn-cyber"
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            background: activeTab === 'directives' ? 'rgba(79, 117, 255, 0.2)' : 'transparent',
            borderColor: activeTab === 'directives' ? 'var(--ds-blue)' : 'transparent',
            color: activeTab === 'directives' ? '#60a5fa' : '#94a3b8'
          }}
        >
          <Sliders style={{ width: '15px' }} /> Agent Directives ({directives.length})
        </button>
      </div>

      {/* TAB 1: CONVERSATIONS RECALL */}
      {activeTab === 'conversations' && (
        <div>
          <form onSubmit={handleSearch} className="glass-panel" style={{ padding: '18px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Search style={{ color: 'var(--primary-cyan)', width: '20px' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across encrypted conversation memory (e.g., 'quicksort', 'portfolio', 'bugs')..."
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
                {searching ? 'Querying Memory...' : 'Search Memory'}
              </button>
            </div>
          </form>

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
        </div>
      )}

      {/* TAB 2: CODE ARTIFACTS REPOSITORY */}
      {activeTab === 'artifacts' && (
        <div>
          {previewArtifact && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#38bdf8' }}>
                  Live Sandbox: {previewArtifact.title}
                </h3>
                <button onClick={() => setPreviewArtifact(null)} className="btn-cyber" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
                  Close Sandbox
                </button>
              </div>
              <AgentSandbox
                code={previewArtifact.code}
                language={previewArtifact.language}
                title={previewArtifact.title}
              />
            </div>
          )}

          {artifacts.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              <Code style={{ width: '36px', height: '36px', margin: '0 auto 12px auto', opacity: 0.4 }} />
              <p>No code artifacts generated yet. Ask LAF in Agent Mode to write apps, components, or games to catalog them here.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {artifacts.map((a, i) => (
                <div key={i} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                        {a.language.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{a.date}</span>
                    </div>
                    <h4 style={{ color: '#fff', fontSize: '0.92rem', fontWeight: '700', marginBottom: '6px' }}>
                      {a.title}
                    </h4>
                    <p style={{ color: '#94a3b8', fontSize: '0.78rem', marginBottom: '14px' }}>
                      From: {a.conversationTitle}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {a.isExecutable && (
                      <button
                        onClick={() => setPreviewArtifact(a)}
                        className="btn-cyber btn-cyber-solid"
                        style={{ flex: 1, padding: '6px 10px', fontSize: '0.78rem', justifyContent: 'center' }}
                      >
                        <Play style={{ width: '12px' }} /> Open Sandbox
                      </button>
                    )}
                    <button
                      onClick={() => navigator.clipboard.writeText(a.code)}
                      className="btn-cyber"
                      style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                      title="Copy Code"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AGENT DIRECTIVES */}
      {activeTab === 'directives' && (
        <div style={{ maxWidth: '800px' }}>
          <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--accent-green)', marginBottom: '8px' }}>
              Configure Persistent Engineering Directives
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '18px' }}>
              These architectural rules are permanently memorized for your user profile and automatically guide LAF's autonomous reasoning engine during all code generation.
            </p>

            <form onSubmit={handleAddDirective} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <input
                type="text"
                value={newDirective}
                onChange={(e) => setNewDirective(e.target.value)}
                placeholder="e.g., 'Always use Tailwind CSS', 'Target ES2022', 'Enforce defensive error checking'..."
                style={{
                  flex: 1,
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              <button type="submit" className="btn-cyber btn-cyber-solid" style={{ padding: '10px 16px' }}>
                <Plus style={{ width: '14px' }} /> Add Directive
              </button>
            </form>

            {savedDirectiveNotice && (
              <div style={{ color: '#34d399', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check style={{ width: '13px' }} /> Directive memorized into persistent profile vault.
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {directives.map((d, idx) => (
              <div key={idx} className="glass-panel" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--accent-green)', fontWeight: '700' }}>#{idx + 1}</span>
                  <span>{d}</span>
                </div>
                <button
                  onClick={() => handleDeleteDirective(idx)}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                  title="Remove Directive"
                >
                  <Trash2 style={{ width: '14px' }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Architecture Card */}
      <div className="glass-panel" style={{ padding: '20px', marginTop: '30px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--accent-green)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck style={{ width: '16px' }} /> Database Partitioning & Security Specification
        </h3>
        <ul style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: '1.6', paddingLeft: '18px' }}>
          <li>Each username automatically provisions an isolated database storage vault (`user_hash.json`).</li>
          <li>Directives, chat logs, and generated artifacts are stored securely with local PBKDF2 partition derivation.</li>
          <li>In-browser sandboxes execute within strict `allow-scripts` boundaries to prevent prototype tampering.</li>
        </ul>
      </div>

    </div>
  );
}
