import React, { useState, useEffect, useRef } from 'react';
import { Send, Volume2, Copy, Sparkles, Plus, History, Brain, Check, RefreshCw, Layers } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export default function ChatView({ user, token, customApiKey }) {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [concisenessMode, setConcisenessMode] = useState('short'); // 'short' or 'detailed'
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);

  const messagesEndRef = useRef(null);

  // Fetch user conversations list on mount
  useEffect(() => {
    fetchConversations();
  }, [token]);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/chat/conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations);
        if (data.conversations.length > 0 && !activeConvId) {
          loadConversation(data.conversations[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadConversation = async (convId) => {
    try {
      const res = await fetch(`/api/chat/conversation/${convId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.conversation) {
        setActiveConvId(data.conversation.id);
        setMessages(data.conversation.messages || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || loading) return;

    const userMsgText = inputPrompt.trim();
    setInputPrompt('');
    
    // Append optimistic user message
    const newHistory = [...messages, { role: 'user', content: userMsgText, timestamp: new Date().toISOString() }];
    setMessages(newHistory);
    setLoading(true);

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: userMsgText,
          conversationId: activeConvId,
          history: messages,
          customApiKey,
          concisenessMode
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActiveConvId(data.conversationId);
        setMessages(prev => [...prev, data.response]);
        fetchConversations();
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: `Error: ${data.error || 'Failed to process request'}`, provider: 'System Error' }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Connection error with LAF reasoning cluster.', provider: 'Offline' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSpeak = (text, idx) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (speakingIndex === idx) {
        setSpeakingIndex(null);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.onend = () => setSpeakingIndex(null);
      setSpeakingIndex(idx);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
      
      {/* Conversation History Drawer (Toggleable on Desktop/Mobile) */}
      <div style={{
        width: showHistorySidebar ? '260px' : '0',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        background: 'rgba(10, 14, 30, 0.9)',
        borderRight: showHistorySidebar ? '1px solid var(--border-color)' : 'none',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)' }}>
          <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--primary-cyan)' }}>Chat History</span>
          <button className="btn-cyber" onClick={startNewChat} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
            <Plus style={{ width: '14px' }} /> New
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {conversations.map(c => (
            <div
              key={c.id}
              onClick={() => loadConversation(c.id)}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '6px',
                background: activeConvId === c.id ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                border: activeConvId === c.id ? '1px solid var(--primary-cyan)' : '1px solid transparent',
                cursor: 'pointer',
                fontSize: '0.85rem',
                color: activeConvId === c.id ? '#fff' : 'var(--text-muted)'
              }}
            >
              <div style={{ fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.title || 'Untitled Conversation'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                {new Date(c.updatedAt || c.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
        
        {/* Sub-Header bar */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(14, 18, 38, 0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setShowHistorySidebar(!showHistorySidebar)}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-glow)',
                color: 'var(--primary-cyan)',
                borderRadius: '6px',
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem'
              }}
            >
              <History style={{ width: '15px' }} /> History
            </button>

            <span style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-main)' }}>
              LAF Fast Reasoning Workspace
            </span>
          </div>

          {/* Conciseness Mode Toggle (Requirement 14) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setConcisenessMode('short')}
              style={{
                background: concisenessMode === 'short' ? 'var(--primary-cyan)' : 'transparent',
                color: concisenessMode === 'short' ? '#000' : 'var(--text-muted)',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '16px',
                fontWeight: '700',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Short & Accurate
            </button>
            <button
              onClick={() => setConcisenessMode('detailed')}
              style={{
                background: concisenessMode === 'detailed' ? 'var(--primary-purple)' : 'transparent',
                color: concisenessMode === 'detailed' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '16px',
                fontWeight: '700',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Detailed / Elaborate
            </button>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.length === 0 ? (
            <div style={{ margin: 'auto', textAlign: 'center', maxWidth: '500px', padding: '40px 20px' }}>
              <div style={{ width: '70px', height: '70px', margin: '0 auto 16px auto', borderRadius: '50%', background: 'rgba(0, 240, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--primary-cyan)' }}>
                <Brain style={{ width: '36px', color: 'var(--primary-cyan)' }} />
              </div>
              <h2 className="text-glow" style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '8px' }}>
                How can LAF assist you today?
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '24px' }}>
                Ask anything! LAF provides ultra-fast, human-minded reasoning, instant memory recall, and multimodal generation capabilities.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  "What did we discuss in our last conversation?",
                  "Synthesize the current global tech trends",
                  "Create a Python script for encryption",
                  "Explain quantum computing in detail"
                ].map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setInputPrompt(s); }}
                    className="glass-panel"
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '0.82rem',
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                      border: '1px solid rgba(0, 240, 255, 0.2)'
                    }}
                  >
                    "{s}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  className="glass-panel"
                  style={{
                    maxWidth: '85%',
                    padding: '16px 20px',
                    borderRadius: m.role === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                    background: m.role === 'user'
                      ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.2) 0%, rgba(138, 43, 226, 0.2) 100%)'
                      : 'rgba(14, 18, 38, 0.85)',
                    border: m.role === 'user'
                      ? '1px solid rgba(0, 240, 255, 0.4)'
                      : '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                      {m.role === 'user' ? (
                        <span style={{ color: 'var(--primary-cyan)' }}>You ({user.username})</span>
                      ) : (
                        <>
                          <Sparkles style={{ width: '14px', color: 'var(--primary-cyan)' }} />
                          <span className="text-glow">LAF AI</span>
                          {m.provider && (
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                              {m.provider}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {m.role === 'assistant' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => handleSpeak(m.content, idx)}
                          style={{ background: 'transparent', border: 'none', color: speakingIndex === idx ? 'var(--primary-cyan)' : 'var(--text-dim)', cursor: 'pointer' }}
                          title="Read aloud"
                        >
                          <Volume2 style={{ width: '15px' }} />
                        </button>
                        <button
                          onClick={() => handleCopy(m.content, idx)}
                          style={{ background: 'transparent', border: 'none', color: copiedIndex === idx ? 'var(--accent-green)' : 'var(--text-dim)', cursor: 'pointer' }}
                          title="Copy message"
                        >
                          {copiedIndex === idx ? <Check style={{ width: '15px' }} /> : <Copy style={{ width: '15px' }} />}
                        </button>
                      </div>
                    )}
                  </div>

                  <div
                    style={{ fontSize: '0.95rem', lineHeight: '1.65', color: '#f0f4fc' }}
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(marked.parse(m.content || ''))
                    }}
                  />
                </div>
              </div>
            ))
          )}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div className="glass-panel" style={{ padding: '14px 20px', borderRadius: '18px 18px 18px 2px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <RefreshCw style={{ width: '16px', color: 'var(--primary-cyan)', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '0.88rem', color: 'var(--primary-cyan)', fontWeight: '600' }}>
                  LAF Fast Reasoning in progress...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Dock */}
        <form onSubmit={handleSend} style={{ padding: '16px 20px', background: 'rgba(7, 9, 19, 0.95)', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(14, 18, 38, 0.9)', border: '1px solid var(--border-glow)', borderRadius: 'var(--radius-md)', padding: '6px 12px' }}>
            <textarea
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Message LAF... (Shift+Enter for multiline)"
              rows={1}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none',
                resize: 'none',
                maxHeight: '120px'
              }}
            />

            <button
              type="submit"
              className="btn-cyber btn-cyber-solid"
              disabled={loading || !inputPrompt.trim()}
              style={{ padding: '10px 18px', borderRadius: 'var(--radius-sm)' }}
            >
              <Send style={{ width: '16px' }} />
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
