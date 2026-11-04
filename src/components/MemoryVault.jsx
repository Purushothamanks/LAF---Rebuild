import React, { useState, useEffect } from 'react';
import { 
  Database, Search, ShieldCheck, Clock, MessageSquare, Code, Sliders, Play, 
  Trash2, Plus, Check, Brain, ArrowLeft, Sparkles, User, Briefcase, Layers, 
  FolderGit2, Edit2, AlertCircle, RefreshCw, X
} from 'lucide-react';
import { apiUrl } from '../api';
import { 
  searchLocalMemory, 
  getLocalUserDb, 
  getLocalUserMemories, 
  saveLocalUserMemory, 
  deleteLocalUserMemory, 
  clearLocalUserMemories 
} from '../utils/aiClient';
import { CATEGORIES } from '../utils/userMemoryEngine';
import AgentSandbox from './AgentSandbox';

export default function MemoryVault({ user, token, onBackToChat }) {
  // Tabs: 'context' (DEFAULT), 'conversations', 'artifacts', 'directives'
  const [activeTab, setActiveTab] = useState('context');
  
  // Context Memories State
  const [memories, setMemories] = useState([]);
  const [memorySearch, setMemorySearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [newMemCategory, setNewMemCategory] = useState(CATEGORIES.TECH_STACK);
  const [newMemKey, setNewMemKey] = useState('');
  const [newMemValue, setNewMemValue] = useState('');
  const [isSavingMem, setIsSavingMem] = useState(false);
  const [editingMemId, setEditingMemId] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Conversation Search State
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

  // Fetch / Sync Context Memories from backend and local cache
  const loadMemories = async () => {
    const local = getLocalUserMemories(user?.username);
    setMemories(local);

    if (token) {
      try {
        const res = await fetch(apiUrl('/api/chat/user-memories'), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const ct = res.headers.get('content-type') || '';
        if (res.ok && ct.includes('application/json')) {
          const data = await res.json();
          if (data.success && Array.isArray(data.memories)) {
            setMemories(data.memories);
            // Sync with local storage
            data.memories.forEach(m => saveLocalUserMemory(user?.username, m));
          }
        }
      } catch (err) {
        console.warn('Backend memories sync note:', err.message);
      }
    }
  };

  useEffect(() => {
    loadMemories();
  }, [user?.username, token]);

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

  // Context Memory Handlers
  const handleSaveNewMemory = async (e) => {
    e.preventDefault();
    if (!newMemKey.trim() || !newMemValue.trim()) return;

    setIsSavingMem(true);
    const item = {
      category: newMemCategory,
      key: newMemKey.trim(),
      value: newMemValue.trim(),
      source: 'manual',
      updatedAt: new Date().toISOString()
    };

    // Save locally
    const updatedLocal = saveLocalUserMemory(user?.username, item);
    setMemories(updatedLocal);

    // Save on backend
    if (token) {
      try {
        await fetch(apiUrl('/api/chat/user-memories'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(item)
        });
      } catch (err) {}
    }

    setNewMemKey('');
    setNewMemValue('');
    setIsAddingMemory(false);
    setIsSavingMem(false);
  };

  const handleDeleteMemory = async (id) => {
    const updatedLocal = deleteLocalUserMemory(user?.username, id);
    setMemories(updatedLocal);

    if (token) {
      try {
        await fetch(apiUrl(`/api/chat/user-memories/${id}`), {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {}
    }
  };

  const handleClearAllMemories = async () => {
    if (!window.confirm('Are you sure you want to erase all context memories? LAF will no longer remember your identity, stack, or active projects.')) {
      return;
    }

    clearLocalUserMemories(user?.username);
    setMemories([]);

    if (token) {
      try {
        await fetch(apiUrl('/api/chat/user-memories'), {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {}
    }
  };

  const handleSaveEditMemory = async (mem) => {
    if (!editValue.trim()) return;
    const updatedItem = {
      ...mem,
      value: editValue.trim(),
      updatedAt: new Date().toISOString()
    };

    const updatedLocal = saveLocalUserMemory(user?.username, updatedItem);
    setMemories(updatedLocal);

    if (token) {
      try {
        await fetch(apiUrl('/api/chat/user-memories'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updatedItem)
        });
      } catch (err) {}
    }

    setEditingMemId(null);
    setEditValue('');
  };

  // Conversation Search Handler
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

  // Directives Handlers
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

  // Filtered Context Memories
  const filteredMemories = memories.filter(m => {
    const matchesCategory = selectedCategoryFilter === 'all' || m.category === selectedCategoryFilter;
    const q = memorySearch.toLowerCase().trim();
    const matchesSearch = !q || 
      (m.key && m.key.toLowerCase().includes(q)) || 
      (m.value && m.value.toLowerCase().includes(q)) ||
      (m.category && m.category.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case CATEGORIES.IDENTITY: return <User style={{ width: '15px', color: '#60a5fa' }} />;
      case CATEGORIES.ROLE: return <Briefcase style={{ width: '15px', color: '#c084fc' }} />;
      case CATEGORIES.TECH_STACK: return <Layers style={{ width: '15px', color: '#38bdf8' }} />;
      case CATEGORIES.PROJECT: return <FolderGit2 style={{ width: '15px', color: '#34d399' }} />;
      case CATEGORIES.PREFERENCE: return <Sliders style={{ width: '15px', color: '#fbbf24' }} />;
      default: return <Sparkles style={{ width: '15px', color: '#f472b6' }} />;
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case CATEGORIES.IDENTITY: return '#60a5fa';
      case CATEGORIES.ROLE: return '#c084fc';
      case CATEGORIES.TECH_STACK: return '#38bdf8';
      case CATEGORIES.PROJECT: return '#34d399';
      case CATEGORIES.PREFERENCE: return '#fbbf24';
      default: return '#f472b6';
    }
  };

  return (
    <div style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '24px 28px', maxWidth: '1280px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      {/* Top Header & Navigation Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(79, 117, 255, 0.15)', border: '1px solid var(--ds-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain style={{ width: '20px', color: 'var(--ds-blue)' }} />
            </div>
            <h1 className="text-glow" style={{ fontSize: '1.7rem', fontWeight: '800', margin: 0, fontFamily: 'var(--font-title)' }}>
              Memory & Knowledge Vault
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
            Cryptographically isolated memory matrix for <strong style={{ color: 'var(--primary-cyan)' }}>@{user?.username || 'User'}</strong>. Real-time context learning, conversation indexing, and agent directives.
          </p>
        </div>

        {onBackToChat && (
          <button
            onClick={onBackToChat}
            className="btn-cyber"
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.86rem',
              color: '#fff',
              background: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'var(--ds-border)'
            }}
          >
            <ArrowLeft style={{ width: '15px' }} /> Return to Chat
          </button>
        )}
      </div>

      {/* Sub-Tabs Navigation */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid var(--ds-border)', paddingBottom: '12px', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('context')}
          className="btn-cyber"
          style={{
            padding: '8px 18px',
            borderRadius: '10px',
            fontSize: '0.86rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: activeTab === 'context' ? 'rgba(79, 117, 255, 0.22)' : 'transparent',
            borderColor: activeTab === 'context' ? 'var(--ds-blue)' : 'transparent',
            color: activeTab === 'context' ? '#60a5fa' : '#94a3b8'
          }}
        >
          <Brain style={{ width: '16px' }} /> User Context Memory ({memories.length})
        </button>

        <button
          onClick={() => setActiveTab('conversations')}
          className="btn-cyber"
          style={{
            padding: '8px 18px',
            borderRadius: '10px',
            fontSize: '0.86rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: activeTab === 'conversations' ? 'rgba(79, 117, 255, 0.22)' : 'transparent',
            borderColor: activeTab === 'conversations' ? 'var(--ds-blue)' : 'transparent',
            color: activeTab === 'conversations' ? '#60a5fa' : '#94a3b8'
          }}
        >
          <MessageSquare style={{ width: '16px' }} /> Conversation Recall
        </button>

        <button
          onClick={() => setActiveTab('artifacts')}
          className="btn-cyber"
          style={{
            padding: '8px 18px',
            borderRadius: '10px',
            fontSize: '0.86rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: activeTab === 'artifacts' ? 'rgba(79, 117, 255, 0.22)' : 'transparent',
            borderColor: activeTab === 'artifacts' ? 'var(--ds-blue)' : 'transparent',
            color: activeTab === 'artifacts' ? '#60a5fa' : '#94a3b8'
          }}
        >
          <Code style={{ width: '16px' }} /> Code Artifacts ({artifacts.length})
        </button>

        <button
          onClick={() => setActiveTab('directives')}
          className="btn-cyber"
          style={{
            padding: '8px 18px',
            borderRadius: '10px',
            fontSize: '0.86rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: activeTab === 'directives' ? 'rgba(79, 117, 255, 0.22)' : 'transparent',
            borderColor: activeTab === 'directives' ? 'var(--ds-blue)' : 'transparent',
            color: activeTab === 'directives' ? '#60a5fa' : '#94a3b8'
          }}
        >
          <Sliders style={{ width: '16px' }} /> Agent Directives ({directives.length})
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: 🧠 USER CONTEXT MEMORY (WHAT LAF KNOWS ABOUT YOU) */}
      {/* ========================================================= */}
      {activeTab === 'context' && (
        <div>
          {/* Autonomous Learning Status Banner */}
          <div className="glass-panel" style={{ padding: '18px 22px', marginBottom: '22px', borderRadius: '14px', border: '1px solid rgba(79, 117, 255, 0.25)', background: 'linear-gradient(135deg, rgba(79, 117, 255, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#10b981' }}>
                    Autonomous Context Learning Active
                  </span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff', margin: '0 0 4px 0' }}>
                  What LAF Understands About You
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: 0, maxWidth: '780px' }}>
                  LAF autonomously parses your conversations to extract your role, tech stack, current projects, and coding preferences. This context is injected into every prompt so LAF tailors code and recommendations specifically for you.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddingMemory(!isAddingMemory)}
                  className="btn-cyber btn-cyber-solid"
                  style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus style={{ width: '15px' }} /> Add Custom Memory
                </button>

                {memories.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllMemories}
                    className="btn-cyber"
                    style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '0.84rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    title="Wipe all memories"
                  >
                    <Trash2 style={{ width: '15px' }} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Add Memory Modal / Inline Form */}
          {isAddingMemory && (
            <form onSubmit={handleSaveNewMemory} className="glass-panel" style={{ padding: '18px 22px', marginBottom: '22px', borderRadius: '14px', border: '1px solid var(--ds-blue)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus style={{ width: '16px', color: 'var(--ds-blue)' }} /> Add Memory Entry
                </h4>
                <button type="button" onClick={() => setIsAddingMemory(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <X style={{ width: '16px' }} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Category
                  </label>
                  <select
                    value={newMemCategory}
                    onChange={(e) => setNewMemCategory(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--ds-border)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#fff',
                      fontSize: '0.86rem',
                      outline: 'none'
                    }}
                  >
                    <option value={CATEGORIES.IDENTITY}>Identity & Name</option>
                    <option value={CATEGORIES.ROLE}>Role / Occupation</option>
                    <option value={CATEGORIES.TECH_STACK}>Primary Tech Stack</option>
                    <option value={CATEGORIES.PROJECT}>Active Project</option>
                    <option value={CATEGORIES.PREFERENCE}>Coding Preference</option>
                    <option value={CATEGORIES.FACT}>Personal Fact / Location</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Fact Title / Key
                  </label>
                  <input
                    type="text"
                    value={newMemKey}
                    onChange={(e) => setNewMemKey(e.target.value)}
                    placeholder="e.g., Primary Language, Current Goal..."
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--ds-border)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#fff',
                      fontSize: '0.86rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Details / Value
                  </label>
                  <input
                    type="text"
                    value={newMemValue}
                    onChange={(e) => setNewMemValue(e.target.value)}
                    placeholder="e.g., React 19, TypeScript, Tailwind CSS, Vite..."
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--ds-border)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#fff',
                      fontSize: '0.86rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddingMemory(false)}
                  className="btn-cyber"
                  style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingMem}
                  className="btn-cyber btn-cyber-solid"
                  style={{ padding: '6px 16px', fontSize: '0.82rem' }}
                >
                  {isSavingMem ? 'Saving...' : 'Save to Vault'}
                </button>
              </div>
            </form>
          )}

          {/* Search & Category Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
            <div style={{ position: 'relative', minWidth: '260px', flex: 1 }}>
              <Search style={{ position: 'absolute', left: '12px', top: '10px', width: '16px', color: 'var(--text-dim)' }} />
              <input
                type="text"
                value={memorySearch}
                onChange={(e) => setMemorySearch(e.target.value)}
                placeholder="Filter memories by keyword, stack, or role..."
                style={{
                  width: '100%',
                  background: 'var(--ds-bg-card)',
                  border: '1px solid var(--ds-border)',
                  borderRadius: '10px',
                  padding: '8px 14px 8px 36px',
                  color: '#fff',
                  fontSize: '0.86rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Category Pills */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
              {[
                { id: 'all', label: 'All' },
                { id: CATEGORIES.IDENTITY, label: 'Identity' },
                { id: CATEGORIES.ROLE, label: 'Role' },
                { id: CATEGORIES.TECH_STACK, label: 'Tech Stack' },
                { id: CATEGORIES.PROJECT, label: 'Projects' },
                { id: CATEGORIES.PREFERENCE, label: 'Preferences' }
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat.id)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.76rem',
                    fontWeight: '600',
                    border: '1px solid',
                    borderColor: selectedCategoryFilter === cat.id ? 'var(--ds-blue)' : 'var(--ds-border)',
                    background: selectedCategoryFilter === cat.id ? 'rgba(79, 117, 255, 0.2)' : 'var(--ds-bg-card)',
                    color: selectedCategoryFilter === cat.id ? '#60a5fa' : 'var(--ds-text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Memory Cards Grid */}
          {filteredMemories.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center', borderRadius: '16px' }}>
              <Brain style={{ width: '42px', height: '42px', margin: '0 auto 14px auto', color: 'var(--ds-blue)', opacity: 0.5 }} />
              <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: '700', marginBottom: '8px' }}>
                No Context Memories Found
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', maxWidth: '520px', margin: '0 auto 16px auto', lineHeight: '1.5' }}>
                As you chat with LAF, it will automatically remember details like your preferred name, tech stack (e.g. <em>"My stack is React and Node.js"</em>), active project, or coding style. You can also click "+ Add Custom Memory" above!
              </p>
              <button
                type="button"
                onClick={() => setIsAddingMemory(true)}
                className="btn-cyber btn-cyber-solid"
                style={{ padding: '8px 18px', fontSize: '0.84rem' }}
              >
                <Plus style={{ width: '14px' }} /> Add Your First Memory
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {filteredMemories.map((m) => {
                const color = getCategoryColor(m.category);
                const isEditing = editingMemId === m.id;

                return (
                  <div
                    key={m.id || m.key}
                    className="glass-panel"
                    style={{
                      padding: '18px 20px',
                      borderRadius: '14px',
                      border: `1px solid rgba(255, 255, 255, 0.08)`,
                      borderLeft: `4px solid ${color}`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative'
                    }}
                  >
                    <div>
                      {/* Card Header: Category & Source Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {getCategoryIcon(m.category)}
                          <span style={{ fontSize: '0.74rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color }}>
                            {m.category?.replace('_', ' ')}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-dim)' }}>
                            {m.source === 'chat' ? '⚡ Auto-learned' : '✍️ Manual'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteMemory(m.id)}
                            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                            title="Delete memory"
                          >
                            <Trash2 style={{ width: '14px', color: '#f87171' }} />
                          </button>
                        </div>
                      </div>

                      {/* Key Title */}
                      <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>
                        {m.key}
                      </div>

                      {/* Value / Content */}
                      {isEditing ? (
                        <div style={{ marginBottom: '12px' }}>
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            style={{
                              width: '100%',
                              background: 'rgba(0,0,0,0.5)',
                              border: '1px solid var(--ds-blue)',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              color: '#fff',
                              fontSize: '0.86rem',
                              outline: 'none',
                              marginBottom: '8px'
                            }}
                          />
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleSaveEditMemory(m)}
                              className="btn-cyber btn-cyber-solid"
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingMemId(null)}
                              className="btn-cyber"
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          style={{ 
                            fontSize: '0.88rem', 
                            color: 'var(--text-primary)', 
                            background: 'rgba(0, 0, 0, 0.25)', 
                            padding: '10px 12px', 
                            borderRadius: '8px', 
                            marginBottom: '10px',
                            wordBreak: 'break-word',
                            lineHeight: '1.4',
                            border: '1px solid rgba(255,255,255,0.04)'
                          }}
                        >
                          {m.value}
                        </div>
                      )}
                    </div>

                    {/* Card Footer: Timestamp & Edit Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock style={{ width: '12px' }} />
                        {m.updatedAt ? new Date(m.updatedAt).toLocaleDateString() : 'Active'}
                      </span>

                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMemId(m.id);
                            setEditValue(m.value);
                          }}
                          style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem' }}
                        >
                          <Edit2 style={{ width: '12px' }} /> Edit
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CONVERSATION RECALL */}
      {/* ========================================================= */}
      {activeTab === 'conversations' && (
        <div>
          <form onSubmit={handleSearch} className="glass-panel" style={{ padding: '18px', marginBottom: '24px', borderRadius: '14px' }}>
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
              <button type="submit" className="btn-cyber btn-cyber-solid" disabled={searching} style={{ padding: '10px 18px', borderRadius: '8px' }}>
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
                    <div key={i} className="glass-panel" style={{ padding: '16px 20px', borderRadius: '12px' }}>
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
                <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)', borderRadius: '12px' }}>
                  No previous conversation memory matched your search query in this user's isolated partition.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: CODE ARTIFACTS REPOSITORY */}
      {/* ========================================================= */}
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
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: '#64748b', borderRadius: '14px' }}>
              <Code style={{ width: '36px', height: '36px', margin: '0 auto 12px auto', opacity: 0.4 }} />
              <p>No code artifacts generated yet. Ask LAF in Agent Mode to write apps, components, or games to catalog them here.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {artifacts.map((a, i) => (
                <div key={i} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '12px' }}>
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

      {/* ========================================================= */}
      {/* TAB 4: AGENT DIRECTIVES */}
      {/* ========================================================= */}
      {activeTab === 'directives' && (
        <div style={{ maxWidth: '800px' }}>
          <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', borderRadius: '14px' }}>
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
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              <button type="submit" className="btn-cyber btn-cyber-solid" style={{ padding: '10px 16px', borderRadius: '8px' }}>
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
              <div key={idx} className="glass-panel" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '10px' }}>
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
      <div className="glass-panel" style={{ padding: '20px', marginTop: '30px', borderRadius: '14px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--accent-green)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck style={{ width: '16px' }} /> Database Partitioning & Security Specification
        </h3>
        <ul style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: '1.6', paddingLeft: '18px', margin: 0 }}>
          <li>Each username automatically provisions an isolated cryptographic database storage vault (`user_hash.json`).</li>
          <li>Directives, context memories, chat logs, and generated artifacts are stored securely with local PBKDF2 partition derivation.</li>
          <li>In-browser sandboxes execute within strict `allow-scripts` boundaries to prevent prototype tampering.</li>
        </ul>
      </div>

    </div>
  );
}
