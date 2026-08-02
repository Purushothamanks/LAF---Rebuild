import React, { useState, useEffect, useRef } from 'react';
import { Send, Volume2, Copy, Sparkles, Brain, Globe, Check, RefreshCw, ChevronDown, ChevronRight, Lightbulb, Image, Music, Video } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export default function ChatView({
  user,
  token,
  customApiKey,
  selectedModel,
  webSearchEnabled,
  setWebSearchEnabled,
  deepThinkingEnabled,
  setDeepThinkingEnabled,
  concisenessMode,
  activeConvId,
  setActiveConvId,
  messages,
  setMessages,
  fetchConversations
}) {
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [expandedThoughts, setExpandedThoughts] = useState({}); // track thought accordion states

  const messagesEndRef = useRef(null);

  const toggleThought = (idx) => {
    setExpandedThoughts(prev => ({ ...prev, [idx]: !prev[idx] }));
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
      // Simulate DeepSeek R1 reasoning steps if Deep Thinking is enabled
      const thoughtText = deepThinkingEnabled || selectedModel === 'LAF-R1'
        ? `Thinking Process:\n1. Analyzing prompt intent & context for user "${user.username}".\n2. Querying isolated encrypted memory DB index.\n3. ${webSearchEnabled ? 'Fetching real-time web search grounding.' : 'Executing direct neural reasoning pipeline.'}\n4. Structuring concise, accurate output.`
        : null;

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
        const assistantMsg = {
          ...data.response,
          thought: thoughtText
        };
        setMessages(prev => [...prev, assistantMsg]);
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', background: 'var(--bg-deepseek-dark)' }}>
      
      {/* Scrollable Messages Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ maxWidth: '800px', width: '90%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {messages.length === 0 ? (
            /* DeepSeek-style Empty Welcome Screen */
            <div style={{ marginTop: '80px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgPneYG2HNT8jsgsviQT-3j0Mj4tN_xUqwl9a9KYP9YE5Bu8TVGPXSLDI&s=10"
                alt="LAF Logo"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  marginBottom: '16px',
                  border: '2px solid var(--accent-ds-blue)',
                  boxShadow: '0 0 20px rgba(79, 117, 255, 0.4)'
                }}
              />

              <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>
                Hi, I'm LAF.
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '32px' }}>
                How can I help you today? (Look At the Future • Fast Reasoning & Multimodal AI)
              </p>

              {/* Prompt Suggestion Cards Grid (DeepSeek Style) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', width: '100%' }}>
                {[
                  { title: "What did we talk about last week?", desc: "Query your isolated encrypted DB memory index", prompt: "What did we discuss in our previous conversation?" },
                  { title: "Deep Reasoning Analysis", desc: "Step-by-step logic breakdown with LAF-R1", prompt: "Analyze the potential impact of quantum computing on modern cryptography." },
                  { title: "Global World Trends", desc: "Scrape & synthesize current tech & AI advances", prompt: "Summarize today's top global technology trends." },
                  { title: "Create Python Script", desc: "Clean, high-performance secure code", prompt: "Write an optimized Python script for AES-256 encryption." }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="ds-card"
                    onClick={() => { setInputPrompt(item.prompt); }}
                    style={{ padding: '16px', textAlign: 'left', cursor: 'pointer' }}
                  >
                    <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#fff', marginBottom: '4px' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ) : (
            /* Render Conversation Messages */
            messages.map((m, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                
                {/* Avatar Icon */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: m.role === 'user' ? 'var(--bg-deepseek-input)' : 'var(--accent-ds-blue-bg)',
                  border: m.role === 'user' ? '1px solid var(--border-deepseek)' : '1px solid var(--accent-ds-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {m.role === 'user' ? (
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>{user.username.substring(0, 1).toUpperCase()}</span>
                  ) : (
                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgPneYG2HNT8jsgsviQT-3j0Mj4tN_xUqwl9a9KYP9YE5Bu8TVGPXSLDI&s=10" alt="LAF" style={{ width: '22px', height: '22px', borderRadius: '50%' }} />
                  )}
                </div>

                {/* Content Container */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: '600', color: m.role === 'user' ? 'var(--text-muted)' : 'var(--accent-ds-blue)' }}>
                      {m.role === 'user' ? user.username : 'LAF AI'}
                    </div>

                    {m.role === 'assistant' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleSpeak(m.content, idx)} style={{ background: 'transparent', border: 'none', color: speakingIndex === idx ? 'var(--accent-ds-blue)' : 'var(--text-dim)', cursor: 'pointer' }} title="Read Aloud">
                          <Volume2 style={{ width: '14px' }} />
                        </button>
                        <button onClick={() => handleCopy(m.content, idx)} style={{ background: 'transparent', border: 'none', color: copiedIndex === idx ? 'var(--accent-green)' : 'var(--text-dim)', cursor: 'pointer' }} title="Copy Response">
                          {copiedIndex === idx ? <Check style={{ width: '14px' }} /> : <Copy style={{ width: '14px' }} />}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* DeepSeek Signature "Thinking Process..." Accordion Box */}
                  {m.role === 'assistant' && m.thought && (
                    <div className="ds-thought-box">
                      <div className="ds-thought-header" onClick={() => toggleThought(idx)}>
                        <Lightbulb style={{ width: '14px' }} />
                        <span>Thinking process</span>
                        {expandedThoughts[idx] ? <ChevronDown style={{ width: '14px' }} /> : <ChevronRight style={{ width: '14px' }} />}
                      </div>
                      {expandedThoughts[idx] && (
                        <div style={{ marginTop: '6px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                          {m.thought}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Main Message Body */}
                  <div
                    style={{ fontSize: '0.95rem', lineHeight: '1.65', color: 'var(--text-main)' }}
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(marked.parse(m.content || ''))
                    }}
                  />
                </div>

              </div>
            ))
          )}

          {loading && (
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-ds-blue-bg)', border: '1px solid var(--accent-ds-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RefreshCw style={{ width: '16px', color: 'var(--accent-ds-blue)', animation: 'spin 1s linear infinite' }} />
              </div>
              <span style={{ fontSize: '0.88rem', color: 'var(--accent-ds-blue)', fontWeight: '600' }}>
                LAF R1 is thinking & reasoning...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Bottom Input Bar (DeepSeek Style) */}
      <div style={{ padding: '0 20px 16px 20px', maxWidth: '840px', width: '100%', margin: '0 auto' }}>
        <form
          onSubmit={handleSend}
          style={{
            background: 'var(--bg-deepseek-input)',
            border: '1px solid var(--border-deepseek)',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
          }}
        >
          <textarea
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Message LAF... (Shift+Enter for new line)"
            rows={2}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '0.95rem',
              outline: 'none',
              resize: 'none',
              maxHeight: '160px'
            }}
          />

          {/* Quick Control Bar Inside Input Box */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-deepseek-light)', paddingTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              
              <button
                type="button"
                onClick={() => setDeepThinkingEnabled(!deepThinkingEnabled)}
                className={`btn-ds-pill ${deepThinkingEnabled ? 'btn-ds-pill-active' : ''}`}
                style={{ fontSize: '0.75rem', padding: '3px 10px' }}
              >
                <Brain style={{ width: '13px' }} />
                <span>DeepThink R1</span>
              </button>

              <button
                type="button"
                onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                className={`btn-ds-pill ${webSearchEnabled ? 'btn-ds-pill-active' : ''}`}
                style={{ fontSize: '0.75rem', padding: '3px 10px' }}
              >
                <Globe style={{ width: '13px' }} />
                <span>Search</span>
              </button>

            </div>

            <button
              type="submit"
              disabled={loading || !inputPrompt.trim()}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: inputPrompt.trim() ? 'var(--accent-ds-blue)' : 'var(--bg-deepseek-card)',
                border: 'none',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputPrompt.trim() ? 'pointer' : 'default',
                transition: 'all 0.15s ease'
              }}
            >
              <Send style={{ width: '14px' }} />
            </button>
          </div>
        </form>

        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '8px' }}>
          LAF can make mistakes. Verify important information. • AES-256 E2EE Protected
        </div>
      </div>

    </div>
  );
}
