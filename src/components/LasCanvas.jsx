import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Code, FileText, Copy, Check, Download, Maximize2, Minimize2, 
  X, RefreshCw, Sparkles, ExternalLink, Terminal, Eye, ChevronDown, 
  FileType, FileCode, Printer
} from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import AgentSandbox from './AgentSandbox';

/**
 * Las Canvas - Intelligent Workspace Engine
 * Provides side-by-side real-time preview, code execution, document formatting,
 * and multi-format document export.
 */
export default function LasCanvas({
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
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportNotice, setExportNotice] = useState('');
  const exportMenuRef = useRef(null);

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

  // Close export menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportModal(false);
      }
    };
    if (showExportModal) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showExportModal]);

  const handleCopy = () => {
    const textToCopy = isCode ? (artifact.code || '') : (artifact.content || '');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Multi-format Document Exporter (PDF, Word, Markdown, HTML, Plain Text)
   */
  const handleExportFormat = (format) => {
    const title = (artifact.title || 'document').replace(/[^a-zA-Z0-9_-]/g, '_');
    const rawContent = isCode ? (artifact.code || '') : (artifact.content || '');
    const cleanTitle = artifact.title || 'Las Canvas Document';

    if (format === 'pdf') {
      // Print formatted document to PDF via browser print dialogue
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const renderedHtml = isCode 
          ? `<pre style="font-family: monospace; white-space: pre-wrap; background: #f8fafc; padding: 20px; border-radius: 8px;"><code>${rawContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`
          : marked.parse(rawContent);

        printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${cleanTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1, h2, h3 { color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    pre { background: #f1f5f9; padding: 14px; border-radius: 6px; overflow-x: auto; font-family: monospace; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
    th { background: #f8fafc; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${cleanTitle}</h1>
  <div>${DOMPurify.sanitize(renderedHtml)}</div>
</body>
</html>`);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } else if (format === 'doc') {
      // Word (.doc / .docx compatible HTML package)
      const renderedHtml = isCode
        ? `<pre><code>${rawContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`
        : marked.parse(rawContent);

      const docContent = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>${cleanTitle}</title></head>
<body><h1>${cleanTitle}</h1><div>${renderedHtml}</div></body>
</html>`;
      const blob = new Blob(['\ufeff' + docContent], { type: 'application/msword' });
      triggerDownload(blob, `${title}.doc`);
    } else if (format === 'html') {
      const renderedHtml = isCode
        ? `<pre><code>${rawContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`
        : marked.parse(rawContent);
      const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${cleanTitle}</title>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.6; color: #0f172a; max-width: 840px; margin: 40px auto; padding: 0 20px; }
    pre { background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 8px; overflow-x: auto; font-family: monospace; }
    code { font-family: monospace; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; }
  </style>
</head>
<body>
  <h1>${cleanTitle}</h1>
  ${DOMPurify.sanitize(renderedHtml)}
</body>
</html>`;
      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      triggerDownload(blob, `${title}.html`);
    } else if (format === 'txt') {
      // Plain text (strip markdown symbols)
      const cleanPlain = rawContent
        .replace(/^#+\s+/gm, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`{3}[a-z]*\n([\s\S]*?)`{3}/g, '$1')
        .replace(/`([^`]+)`/g, '$1');
      const blob = new Blob([cleanPlain], { type: 'text/plain;charset=utf-8' });
      triggerDownload(blob, `${title}.txt`);
    } else {
      // Default Markdown (.md) or Source code extension
      const lang = (artifact.language || 'txt').toLowerCase();
      let ext = 'md';
      if (isCode) {
        if (lang.includes('html')) ext = 'html';
        else if (lang.includes('js')) ext = 'js';
        else if (lang.includes('py')) ext = 'py';
        else if (lang.includes('css')) ext = 'css';
        else if (lang.includes('json')) ext = 'json';
        else ext = lang || 'txt';
      }
      const blob = new Blob([rawContent], { type: 'text/plain;charset=utf-8' });
      triggerDownload(blob, `${title}.${ext}`);
    }

    setShowExportModal(false);
    setExportNotice(`Exported as ${format.toUpperCase()}`);
    setTimeout(() => setExportNotice(''), 2500);
  };

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const wordCount = isCode 
    ? (artifact.code?.split('\n').length || 0) + ' lines'
    : (artifact.content?.split(/\s+/).filter(Boolean).length || 0) + ' words';

  return (
    <div 
      className={`las-canvas-panel ${isFullscreen ? 'las-canvas-fullscreen' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#0d111a',
        borderLeft: isFullscreen ? 'none' : '1px solid var(--ds-border)',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
        zIndex: isFullscreen ? 2000 : 80,
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        right: isFullscreen ? 0 : 'auto',
        bottom: isFullscreen ? 0 : 'auto',
        width: isFullscreen ? '100vw' : '100%',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Las Canvas Header - Pixel Perfect Alignment */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px)',
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
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0,
              boxShadow: '0 0 14px rgba(79, 117, 255, 0.45)'
            }}
          >
            {isCode ? <Code style={{ width: '16px', height: '16px' }} /> : <FileText style={{ width: '16px', height: '16px' }} />}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px' }}>
                {artifact.title || (isCode ? 'Las Canvas Code' : 'Las Canvas Document')}
              </span>
              {isLiveUpdating && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', fontWeight: '700', padding: '1px 6px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
                  <span className="live-pulse-dot"></span> Live
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Las Canvas • {isCode ? (artifact.language || 'Code').toUpperCase() : 'Document'} • {wordCount}
            </span>
          </div>
        </div>

        {/* Center Tabs */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.35)',
            borderRadius: '9999px',
            padding: '3px',
            border: '1px solid rgba(255,255,255,0.08)'
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
                padding: '4px 12px',
                borderRadius: '9999px',
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
                padding: '4px 12px',
                borderRadius: '9999px',
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
                  padding: '4px 12px',
                  borderRadius: '9999px',
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
                  padding: '4px 12px',
                  borderRadius: '9999px',
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
                <span>Markdown</span>
              </button>
            </>
          )}
        </div>

        {/* Right Action Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
          {/* Copy Button */}
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

          {/* Export Dropdown Button - Asks User What Kind of Document */}
          <div ref={exportMenuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowExportModal(!showExportModal)}
              title="Choose format to export document"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                borderRadius: '7px',
                background: 'rgba(79, 117, 255, 0.15)',
                border: '1px solid rgba(79, 117, 255, 0.4)',
                color: '#93c5fd',
                cursor: 'pointer',
                fontSize: '0.76rem',
                fontWeight: '700',
                transition: 'all 0.15s ease'
              }}
            >
              <Download style={{ width: '13px', height: '13px' }} />
              <span>Export</span>
              <ChevronDown style={{ width: '12px', height: '12px' }} />
            </button>

            {/* Export Format Selector Dialog */}
            {showExportModal && (
              <div 
                className="export-dropdown-card"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  width: '230px',
                  background: 'rgba(15, 23, 42, 0.98)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid var(--ds-border)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                  padding: '8px',
                  zIndex: 2100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ padding: '6px 10px', fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  What kind of document to export?
                </div>

                <button
                  type="button"
                  onClick={() => handleExportFormat('pdf')}
                  className="export-option-btn"
                >
                  <Printer style={{ width: '14px', height: '14px', color: '#ef4444' }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.8rem' }}>PDF Document</div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Print / Save as PDF (.pdf)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportFormat('doc')}
                  className="export-option-btn"
                >
                  <FileType style={{ width: '14px', height: '14px', color: '#3b82f6' }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.8rem' }}>Word Document</div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Microsoft Word (.doc)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportFormat('md')}
                  className="export-option-btn"
                >
                  <FileText style={{ width: '14px', height: '14px', color: '#10b981' }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.8rem' }}>Markdown File</div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>GitHub Flavored (.md)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportFormat('html')}
                  className="export-option-btn"
                >
                  <FileCode style={{ width: '14px', height: '14px', color: '#f59e0b' }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.8rem' }}>HTML Web Page</div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Standalone Page (.html)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportFormat('txt')}
                  className="export-option-btn"
                >
                  <FileText style={{ width: '14px', height: '14px', color: '#a855f7' }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.8rem' }}>Plain Text</div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Clean text file (.txt)</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Fullscreen Toggle */}
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

          {/* Close Canvas */}
          <button
            type="button"
            onClick={onClose}
            title="Close Las Canvas"
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
              marginLeft: '2px'
            }}
          >
            <X style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
      </div>

      {/* Export Confirmation Toast */}
      {exportNotice && (
        <div style={{ padding: '6px 14px', background: 'rgba(16, 185, 129, 0.15)', borderBottom: '1px solid rgba(16, 185, 129, 0.4)', color: '#10b981', fontSize: '0.78rem', fontWeight: '700', textAlign: 'center' }}>
          ✅ {exportNotice}
        </div>
      )}

      {/* Canvas Body Viewport */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {/* Tab 1: Interactive Preview for Web Code */}
        {activeTab === 'preview' && isCode && (
          <div style={{ width: '100%', height: '100%' }}>
            <AgentSandbox
              code={artifact.code}
              language={artifact.language || 'html'}
              title={artifact.title || 'Las Canvas Live Preview'}
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
              background: '#090d16',
              padding: '20px',
              fontFamily: 'var(--font-mono)'
            }}
          >
            <pre style={{ margin: 0, fontSize: '0.86rem', lineHeight: '1.65', color: '#e2e8f0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              <code>{artifact.code}</code>
            </pre>
          </div>
        )}

        {/* Tab 3: Rendered Document Viewer with Enhanced Typography */}
        {activeTab === 'document' && !isCode && (
          <div 
            style={{ 
              width: '100%', 
              height: '100%', 
              overflowY: 'auto', 
              padding: '32px 40px',
              background: '#0e1320',
              color: 'var(--ds-text-primary)'
            }}
          >
            <div 
              className="message-markdown-content document-canvas-body"
              style={{ maxWidth: '820px', margin: '0 auto', fontSize: '1.02rem', lineHeight: '1.75' }}
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
              background: '#090d16',
              padding: '24px',
              fontFamily: 'var(--font-mono)'
            }}
          >
            <pre style={{ margin: 0, fontSize: '0.86rem', lineHeight: '1.65', color: '#cbd5e1', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              <code>{artifact.content}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
