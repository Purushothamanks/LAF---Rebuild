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
        
        const fullContent = data.response.content || '';
        const thoughtText = `Thinking Process:\n1. Analyzing intent for ${user.username}.\n2. Querying memory DB.\n3. Generating output via ${data.response.provider || 'LAF Neural Model'}.`;

        const assistantMsgIndex = newHistory.length;
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: '', provider: data.response.provider, thought: thoughtText }
        ]);

        let currentText = '';
        const chunkSize = Math.max(1, Math.floor(fullContent.length / 40));
        let charIdx = 0;

        const streamInterval = setInterval(() => {
          charIdx += chunkSize;
          if (charIdx >= fullContent.length) {
            currentText = fullContent;
            clearInterval(streamInterval);
            setLoading(false);
          } else {
            currentText = fullContent.substring(0, charIdx);
          }

          setMessages(prev => {
            const updated = [...prev];
            if (updated[assistantMsgIndex]) {
              updated[assistantMsgIndex] = {
                ...updated[assistantMsgIndex],
                content: currentText
              };
            }
            return updated;
          });
        }, 20);

        fetchConversations();
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: `Error: ${data.error || 'Failed to process request'}`, provider: 'System Error' }
        ]);
        setLoading(false);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Connection error with LAF reasoning cluster.', provider: 'Offline' }
      ]);
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

  const userInitial = (user?.username || 'P').substring(0, 1).toUpperCase();

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', background: 'var(--ds-bg-main)', paddingTop: '60px' }}>
      
      {/* Messages Scroll Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ maxWidth: '780px', width: '90%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {messages.length === 0 ? (
            /* Floating Centered Welcome Screen */
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
                  boxShadow: '0 0 24px rgba(79, 117, 255, 0.4)'
                }}
              />

              <h1 style={{ fontSize: '2.1rem', fontWeight: '800', color: '#fff', marginBottom: '8px', fontFamily: 'var(--font-title)' }}>
                Hi, I'm LAF.
              </h1>
              <p style={{ color: 'var(--ds-text-secondary)', fontSize: '0.95rem', marginBottom: '36px' }}>
                How can I help you today?
              </p>

              {/* Floating Centered Oval Input Box */}
              <form onSubmit={handleSend} className="floating-input-card" style={{ background: 'rgba(23, 28, 38, 0.95)' }}>
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
            /* Active Conversation Messages List (NO BOX SHAPES, ACTUAL TEXT ONLY) */
            messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: isUser ? 'row-reverse' : 'row',
                    gap: '14px',
                    alignItems: 'flex-start',
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '88%'
                  }}
                >
                  {/* Avatar Icon (Dead Centered 32px Circle) */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      minWidth: '32px',
                      minHeight: '32px',
                      borderRadius: '50%',
                      background: isUser ? 'var(--ds-blue)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'center',
                      flexShrink: 0,
                      overflow: 'hidden',
                      marginTop: '2px',
                      boxShadow: !isUser ? '0 0 10px rgba(79, 117, 255, 0.4)' : 'none'
                    }}
                  >
                    {isUser ? (
                      <span style={{
                        fontSize: '0.85rem',
                        fontWeight: '800',
                        color: '#fff',
                        margin: 0,
                        padding: 0,
                        lineHeight: 1,
                        textAlign: 'center',
                        display: 'inline-block'
                      }}>
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

                  {/* Clean Text Message Container (NO CARD BOX / NO BACKGROUND / ACTUAL TEXT ONLY) */}
                  <div style={{ flex: 1, minWidth: 0, textAlign: isUser ? 'right' : 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: isUser ? 'flex-end' : 'space-between', marginBottom: '4px', gap: '12px' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: '700', color: isUser ? 'var(--ds-text-secondary)' : 'var(--ds-blue)' }}>
                        {isUser ? user.username : 'LAF AI'}
                      </div>

                      {!isUser && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => handleSpeak(m.content, idx)} style={{ background: 'transparent', border: 'none', color: speakingIndex === idx ? 'var(--ds-blue)' : 'var(--ds-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Read Aloud">
                            <Volume2 style={{ width: '13px' }} />
                          </button>
                          <button onClick={() => handleCopy(m.content, idx)} style={{ background: 'transparent', border: 'none', color: copiedIndex === idx ? 'var(--accent-green)' : 'var(--ds-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Copy Response">
                            {copiedIndex === idx ? <Check style={{ width: '13px' }} /> : <Copy style={{ width: '13px' }} />}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Thinking Process Accordion Box for AI */}
                    {!isUser && m.thought && (
                      <div className="ds-thought-container" style={{ margin: '4px 0 8px 0' }}>
                        <div className="ds-thought-header" onClick={() => toggleThought(idx)}>
                          <Lightbulb style={{ width: '13px' }} />
                          <span>Thinking process</span>
                          {expandedThoughts[idx] ? <ChevronDown style={{ width: '13px' }} /> : <ChevronRight style={{ width: '13px' }} />}
                        </div>
                        {expandedThoughts[idx] && (
                          <div style={{ marginTop: '6px', whiteSpace: 'pre-wrap', lineHeight: '1.45', fontSize: '0.82rem', textAlign: 'left' }}>
                            {m.thought}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actual Pure Text Message (No Box Shape / No Background) */}
                    <div
                      style={{
                        fontSize: '0.96rem',
                        lineHeight: '1.65',
                        color: 'var(--ds-text-primary)',
                        display: 'inline-block',
                        textAlign: isUser ? 'right' : 'left'
                      }}
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(marked.parse(m.content || ''))
                      }}
                    />
                  </div>

                </div>
              );
            })
          )}

          {loading && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', alignSelf: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--ds-blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <RefreshCw style={{ width: '15px', color: 'var(--ds-blue)', animation: 'spin 1s linear infinite' }} />
              </div>
              <span style={{ fontSize: '0.88rem', color: 'var(--ds-blue)', fontWeight: '600' }}>
                LAF is thinking & streaming real-time...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Bottom Input Card */}
      {messages.length > 0 && (
        <div style={{ padding: '0 20px 16px 20px', maxWidth: '780px', width: '100%', margin: '0 auto' }}>
          <form onSubmit={handleSend} className="floating-input-card" style={{ background: 'rgba(23, 28, 38, 0.95)' }}>
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
