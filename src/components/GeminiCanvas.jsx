import React, { useState, useEffect } from 'react';
import { 
  Play, Code, FileText, Copy, Check, Download, Maximize2, Minimize2, 
  X, RefreshCw, Sparkles, ExternalLink, Terminal, Eye
} from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import AgentSandbox from './AgentSandbox';

/**
 * Gemini-Grade Interactive Canvas & Document Workspace
 * Provides side-by-side real-time preview, code execution, document formatting,
 * and seamless export before finalizing.
 */
export default function GeminiCanvas({
  isOpen,
  onClose,
  artifact,
  isLiveUpdating = false
}) {
  if (!isOpen || !artifact) return null;

  const isCode = artifact.type === 'code' || !!artifact.code;
  const defaultTab = (isCode && artifact.isExecutable) ? 'preview' : (isCode ? 'code' : 'document');
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync tab when artifact changes
  useEffect(() => {
    if (isCode && artifact.isExecutable) {
      setActiveTab('preview');
    } else if (isCode) {
      setActiveTab('code');
    } else {
      setActiveTab('document');
    }
  }, [artifact]);

  const handleCopy = () => {
    const textToCopy = isCode ? (artifact.code || '') : (artifact.content || '');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = isCode ? (artifact.code || '') : (artifact.content || '');
    const lang = (artifact.language || 'txt').toLowerCase();
    let ext = 'txt';
    if (lang.includes('html')) ext = 'html';
    else if (lang.includes('js') || lang.includes('javascript')) ext = 'js';
    else if (lang.includes('py') || lang.includes('python')) ext = 'py';
    else if (lang.includes('css')) ext = 'css';
    else if (lang.includes('json')) ext = 'json';
    else if (!isCode) ext = 'md';

    const filename = `${(artifact.title || 'canvas_artifact').toLowerCase().replace(/[^a-z0-9]/g, '_')}.${ext}`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const wordCount = isCode 
    ? (artifact.code?.split('\n').length || 0) + ' lines'
    : (artifact.content?.split(/\s+/).filter(Boolean).length || 0) + ' words';

  return (
    <div 
      className={`gemini-canvas-panel ${isFullscreen ? 'gemini-canvas-fullscreen' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--ds-bg-sidebar)',
        borderLeft: isFullscreen ? 'none' : '1px solid var(--ds-border)',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
        zIndex: isFullscreen ? 2000 : 80,
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        right: isFullscreen ? 0 : 'auto',
        bottom: isFullscreen ? 0 : 'auto',
        width: isFullscreen ? '100vw' : '100%',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Canvas Header */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          gap: '12px',
          flexShrink: 0
        }}
      >
        {/* Left Title & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div 
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #4f75ff, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0,
              boxShadow: '0 0 12px rgba(79, 117, 255, 0.4)'
            }}
          >
            {isCode ? <Code style={{ width: '16px', height: '16px' }} /> : <FileText style={{ width: '16px', height: '16px' }} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                {artifact.title || (isCode ? 'Code Canvas' : 'Document Canvas')}
              </span>
              {isLiveUpdating && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', fontWeight: '700', padding: '1px 6px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
                  <span className="live-pulse-dot"></span> Live Generating
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--ds-text-muted)' }}>
              {isCode ? (artifact.language || 'Code').toUpperCase() : 'Markdown Document'} • {wordCount}
            </span>
          </div>
        </div>

        {/* Center Tabs */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: '2px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}
        >
          {isCode && artifact.isExecutable && (
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.76rem',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'preview' ? 'var(--ds-blue)' : 'transparent',
                color: activeTab === 'preview' ? '#fff' : 'var(--ds-text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              <Eye style={{ width: '13px', height: '13px' }} />
              <span>Preview</span>
            </button>
          )}

          {isCode ? (
            <button
              type="button"
              onClick={() => setActiveTab('code')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.76rem',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'code' ? 'var(--ds-blue)' : 'transparent',
                color: activeTab === 'code' ? '#fff' : 'var(--ds-text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              <Code style={{ width: '13px', height: '13px' }} />
              <span>Code</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('document')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.76rem',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === 'document' ? 'var(--ds-blue)' : 'transparent',
                  color: activeTab === 'document' ? '#fff' : 'var(--ds-text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Eye style={{ width: '13px', height: '13px' }} />
                <span>Document</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('markdown')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.76rem',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === 'markdown' ? 'var(--ds-blue)' : 'transparent',
                  color: activeTab === 'markdown' ? '#fff' : 'var(--ds-text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                <FileText style={{ width: '13px', height: '13px' }} />
                <span>Source</span>
              </button>
            </>
          )}
        </div>

        {/* Right Action Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={handleCopy}
            title="Copy content"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: '7px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: copied ? '#10b981' : '#cbd5e1',
              cursor: 'pointer',
              fontSize: '0.76rem',
              fontWeight: '600',
              transition: 'all 0.15s ease'
            }}
          >
            {copied ? <Check style={{ width: '13px', height: '13px' }} /> : <Copy style={{ width: '13px', height: '13px' }} />}
            <span className="hide-on-mobile">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            title="Download file"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: '7px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#cbd5e1',
              cursor: 'pointer',
              fontSize: '0.76rem',
              fontWeight: '600',
              transition: 'all 0.15s ease'
            }}
          >
            <Download style={{ width: '13px', height: '13px' }} />
            <span className="hide-on-mobile">Export</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            style={{
              padding: '6px',
              borderRadius: '7px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#cbd5e1',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isFullscreen ? <Minimize2 style={{ width: '14px', height: '14px' }} /> : <Maximize2 style={{ width: '14px', height: '14px' }} />}
          </button>

          <button
            type="button"
            onClick={onClose}
            title="Close Canvas"
            style={{
              padding: '6px',
              borderRadius: '7px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '4px'
            }}
          >
            <X style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
      </div>

      {/* Canvas Body Viewport */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {/* Tab 1: Interactive Preview for Web Code */}
        {activeTab === 'preview' && isCode && (
          <div style={{ width: '100%', height: '100%' }}>
            <AgentSandbox
              code={artifact.code}
              language={artifact.language || 'html'}
              title={artifact.title || 'Canvas Live Preview'}
            />
          </div>
        )}

        {/* Tab 2: Code Editor / Viewer */}
        {activeTab === 'code' && isCode && (
          <div 
            style={{ 
              width: '100%', 
              height: '100%', 
              overflowY: 'auto', 
              background: '#0a0d14',
              padding: '16px',
              fontFamily: 'var(--font-mono)'
            }}
          >
            <pre style={{ margin: 0, fontSize: '0.86rem', lineHeight: '1.6', color: '#e2e8f0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              <code>{artifact.code}</code>
            </pre>
          </div>
        )}

        {/* Tab 3: Rendered Document Viewer */}
        {activeTab === 'document' && !isCode && (
          <div 
            style={{ 
              width: '100%', 
              height: '100%', 
              overflowY: 'auto', 
              padding: '28px 36px',
              background: 'var(--ds-bg-sidebar)',
              color: 'var(--ds-text-primary)'
            }}
          >
            <div 
              className="message-markdown-content document-canvas-body"
              style={{ maxWidth: '860px', margin: '0 auto', fontSize: '1rem', lineHeight: '1.7' }}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(marked.parse(artifact.content || ''))
              }}
            />
          </div>
        )}

        {/* Tab 4: Markdown Raw Source */}
        {activeTab === 'markdown' && !isCode && (
          <div 
            style={{ 
              width: '100%', 
              height: '100%', 
              overflowY: 'auto', 
              background: '#0a0d14',
              padding: '20px',
              fontFamily: 'var(--font-mono)'
            }}
          >
            <pre style={{ margin: 0, fontSize: '0.86rem', lineHeight: '1.6', color: '#cbd5e1', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              <code>{artifact.content}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
