import React, { useState, useEffect, useRef } from 'react';
import { Send, Volume2, Copy, Check, RefreshCw, ChevronDown, ChevronRight, Lightbulb } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export default function ChatView({
  user,
  token,
  customApiKey,
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
  const [expandedThoughts, setExpandedThoughts] = useState({});

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
      // Simulate R1 thinking process step
      const thoughtText = `Thinking Process:\n1. Analyzing request intent for user "${user.username}".\n2. Querying isolated encrypted memory DB index.\n3. Formulating direct, high-accuracy response.`;

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
          concisenessMode: 'short'
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

  const userInitial = (user?.username || 'U').substring(0, 1).toUpperCase();

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', background: 'var(--ds-bg-main)', paddingTop: '60px' }}>
      
      {/* Messages Scroll Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ maxWidth: '780px', width: '90%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {messages.length === 0 ? (
            /* Floating Centered Welcome Screen with Input Box */
            <div style={{ marginTop: '120px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgPneYG2HNT8jsgsviQT-3j0Mj4tN_xUqwl9a9KYP9YE5Bu8TVGPXSLDI&s=10"
                alt="LAF Logo"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  marginBottom: '16px',
                  border: '2px solid var(--ds-blue)',
                  boxShadow: '0 0 20px rgba(79, 117, 255, 0.4)'
                }}
              />

              <h1 style={{ fontSize: '2.1rem', fontWeight: '800', color: '#fff', marginBottom: '8px', fontFamily: 'var(--font-title)' }}>
                Hi, I'm LAF.
              </h1>
              <p style={{ color: 'var(--ds-text-secondary)', fontSize: '0.95rem', marginBottom: '36px' }}>
                How can I help you today?
              </p>

              {/* Floating Centered Oval Input Box */}
              <form onSubmit={handleSend} className="floating-input-card">
                <textarea
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Message LAF..."
                  rows={2}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none',
                    resize: 'none',
                    maxHeight: '160px'
                  }}
                />

                <button
                  type="submit"
                  disabled={loading || !inputPrompt.trim()}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: inputPrompt.trim() ? 'var(--ds-blue)' : 'var(--ds-bg-card)',
                    border: 'none',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    cursor: inputPrompt.trim() ? 'pointer' : 'default',
                    transition: 'all 0.15s ease',
                    flexShrink: 0
                  }}
                >
                  <Send style={{ width: '16px' }} />
                </button>
              </form>
            </div>
          ) : (
            /* Active Conversation Messages List (Perfectly Aligned Avatars) */
            messages.map((m, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                
                {/* Perfectly Aligned Circle Avatar Icon */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: m.role === 'user' ? 'var(--ds-blue-bg)' : 'transparent',
                  border: m.role === 'user' ? '1px solid var(--ds-blue)' : '2px solid var(--ds-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                  boxShadow: m.role === 'assistant' ? '0 0 10px rgba(79, 117, 255, 0.4)' : 'none',
                  overflow: 'hidden'
                }}>
                  {m.role === 'user' ? (
                    <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--ds-blue)', lineHeight: '1' }}>
                      {userInitial}
                    </span>
                  ) : (
                    <img
                      src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgPneYG2HNT8jsgsviQT-3j0Mj4tN_xUqwl9a9KYP9YE5Bu8TVGPXSLDI&s=10"
                      alt="LAF Logo"
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }}
                    />
                  )}
                </div>

                {/* Message Content & Header */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: '700', color: m.role === 'user' ? '#fff' : 'var(--ds-blue)', lineHeight: '1.2' }}>
                      {m.role === 'user' ? user.username : 'LAF AI'}
                    </div>

                    {m.role === 'assistant' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleSpeak(m.content, idx)} style={{ background: 'transparent', border: 'none', color: speakingIndex === idx ? 'var(--ds-blue)' : 'var(--ds-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Read Aloud">
                          <Volume2 style={{ width: '14px' }} />
                        </button>
                        <button onClick={() => handleCopy(m.content, idx)} style={{ background: 'transparent', border: 'none', color: copiedIndex === idx ? 'var(--accent-green)' : 'var(--ds-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Copy Response">
                          {copiedIndex === idx ? <Check style={{ width: '14px' }} /> : <Copy style={{ width: '14px' }} />}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Thinking Process Accordion Box */}
                  {m.role === 'assistant' && m.thought && (
                    <div className="ds-thought-container">
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

                  {/* Response Body */}
                  <div
                    style={{ fontSize: '0.95rem', lineHeight: '1.65', color: 'var(--ds-text-primary)' }}
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
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--ds-blue-bg)', border: '1px solid var(--ds-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <RefreshCw style={{ width: '15px', color: 'var(--ds-blue)', animation: 'spin 1s linear infinite' }} />
              </div>
              <span style={{ fontSize: '0.88rem', color: 'var(--ds-blue)', fontWeight: '600' }}>
                LAF is thinking & reasoning...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Bottom Input Card */}
      {messages.length > 0 && (
        <div style={{ padding: '0 20px 16px 20px', maxWidth: '780px', width: '100%', margin: '0 auto' }}>
          <form onSubmit={handleSend} className="floating-input-card">
            <textarea
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Message LAF..."
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
              disabled={loading || !inputPrompt.trim()}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: inputPrompt.trim() ? 'var(--ds-blue)' : 'var(--ds-bg-card)',
                border: 'none',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                cursor: inputPrompt.trim() ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
                flexShrink: 0
              }}
            >
              <Send style={{ width: '14px' }} />
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
