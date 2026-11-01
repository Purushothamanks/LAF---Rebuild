import React, { useState, useEffect } from 'react';
import { 
  Play, Code, FileText, Copy, Check, Download, Maximize2, Minimize2, 
  X, RefreshCw, Sparkles, ExternalLink, Terminal, Eye, ChevronDown, 
  FileType, FileCode, Printer
} from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import AgentSandbox from './AgentSandbox';

/**
 * LAF Canvas - Intelligent Workspace Engine
 * Provides side-by-side real-time preview, code execution, document formatting,
 * and prominent multi-format document export.
 */
export default function LafCanvas({
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

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showExportModal) {
        setShowExportModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
    const cleanTitle = artifact.title || 'LAF Canvas Document';

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

  const exportFormats = [
    {
      id: 'pdf',
      title: 'PDF Document',
      extension: '.pdf',
      description: 'Print-ready formatted document with clean typography',
      icon: <Printer style={{ width: '18px', height: '18px' }} />,
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.14)',
      badgeBg: 'rgba(239, 68, 68, 0.2)',
      badgeColor: '#f87171'
    },
    {
      id: 'doc',
      title: 'Microsoft Word',
      extension: '.doc',
      description: 'Compatible with Microsoft Word, Google Docs & LibreOffice',
      icon: <FileType style={{ width: '18px', height: '18px' }} />,
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.14)',
      badgeBg: 'rgba(59, 130, 246, 0.2)',
      badgeColor: '#60a5fa'
    },
    {
      id: 'md',
      title: 'Markdown File',
      extension: '.md',
      description: 'GitHub Flavored Markdown with raw markdown syntax',
      icon: <FileText style={{ width: '18px', height: '18px' }} />,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.14)',
      badgeBg: 'rgba(16, 185, 129, 0.2)',
      badgeColor: '#34d399'
    },
    {
      id: 'html',
      title: 'HTML Web Page',
      extension: '.html',
      description: 'Standalone styled webpage viewable in any browser',
      icon: <FileCode style={{ width: '18px', height: '18px' }} />,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.14)',
      badgeBg: 'rgba(245, 158, 11, 0.2)',
      badgeColor: '#fbbf24'
    },
    {
      id: 'txt',
      title: 'Plain Text',
      extension: '.txt',
      description: 'Clean text file stripped of markdown markers and formatting',
      icon: <FileText style={{ width: '18px', height: '18px' }} />,
      color: '#a855f7',
      bg: 'rgba(168, 85, 247, 0.14)',
      badgeBg: 'rgba(168, 85, 247, 0.2)',
      badgeColor: '#c084fc'
    }
  ];

  return (
    <div 
      className={`laf-canvas-panel las-canvas-panel ${isFullscreen ? 'laf-canvas-fullscreen las-canvas-fullscreen' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: isFullscreen ? '#0d111a' : 'transparent',
        border: 'none',
        zIndex: isFullscreen ? 9999 : 80,
        position: isFullscreen ? 'fixed' : 'relative',
        inset: isFullscreen ? 0 : 'auto',
        borderRadius: isFullscreen ? 0 : 'inherit',
        overflow: 'hidden',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* LAF Canvas Header - Blur-Transparent Frosted Glass */}
      <div 
        className="laf-canvas-header"
      >
        {/* Left Title & Status */}
        <div className="laf-canvas-header-left" style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
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
                {artifact.title || (isCode ? 'LAF Canvas Code' : 'LAF Canvas Document')}
              </span>
              {isLiveUpdating && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', fontWeight: '700', padding: '1px 6px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
                  <span className="live-pulse-dot"></span> Live
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              LAF Canvas • {isCode ? (artifact.language || 'Code').toUpperCase() : 'Document'} • {wordCount}
            </span>
          </div>
        </div>

        {/* Center Tabs */}
        <div 
          className="laf-canvas-header-tabs"
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
        <div className="laf-canvas-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Export Notice Badge */}
          {exportNotice && (
            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#10b981', padding: '3px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              {exportNotice}
            </span>
          )}

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

          {/* Export Button - Opens Format Selector Modal */}
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            title="Choose format to export document"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '7px',
              background: 'rgba(79, 117, 255, 0.18)',
              border: '1px solid rgba(79, 117, 255, 0.45)',
              color: '#93c5fd',
              cursor: 'pointer',
              fontSize: '0.76rem',
              fontWeight: '700',
              transition: 'all 0.15s ease',
              boxShadow: '0 0 10px rgba(59, 130, 246, 0.2)'
            }}
          >
            <Download style={{ width: '13px', height: '13px' }} />
            <span>Export</span>
            <ChevronDown style={{ width: '12px', height: '12px', opacity: 0.8 }} />
          </button>

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
            title="Close LAF Canvas"
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

      {/* Canvas Body Viewport - Frosted Blur Transparent */}
      <div 
        style={{ 
          flex: 1, 
          overflow: 'hidden', 
          position: 'relative', 
          display: 'flex', 
          flexDirection: 'column',
          background: 'rgba(11, 15, 24, 0.6)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)'
        }}
      >
        {/* Tab 1: Interactive Preview for Web Code */}
        {activeTab === 'preview' && isCode && (
          <div style={{ width: '100%', height: '100%', background: 'transparent' }}>
            <AgentSandbox
              code={artifact.code}
              language={artifact.language || 'html'}
              title={artifact.title || 'LAF Canvas Live Preview'}
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
              background: 'rgba(8, 11, 18, 0.75)',
              padding: '18px 24px',
              fontFamily: 'var(--font-mono)'
            }}
          >
            <pre style={{ margin: 0, fontSize: '0.86rem', lineHeight: '1.6', color: '#e2e8f0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              <code>{artifact.code}</code>
            </pre>
          </div>
        )}

        {/* Tab 3: Rendered Document Viewer with Typography */}
        {activeTab === 'document' && !isCode && (
          <div 
            style={{ 
              width: '100%', 
              height: '100%', 
              overflowY: 'auto', 
              padding: '32px 44px',
              background: 'rgba(15, 23, 42, 0.35)',
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
              background: 'rgba(8, 11, 18, 0.75)',
              padding: '20px 26px',
              fontFamily: 'var(--font-mono)'
            }}
          >
            <pre style={{ margin: 0, fontSize: '0.86rem', lineHeight: '1.6', color: '#cbd5e1', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              <code>{artifact.content}</code>
            </pre>
          </div>
        )}
      </div>

      {/* Prominent High-Visibility Export Modal Dialog (Never Hidden, Always Centered) */}
      {showExportModal && (
        <div 
          className="export-modal-backdrop"
          onClick={() => setShowExportModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 8, 16, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 99999,
            animation: 'canvasFadeIn 0.15s ease'
          }}
        >
          <div 
            className="export-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '460px',
              maxHeight: '90vh',
              background: '#0f172a',
              border: '1px solid rgba(79, 117, 255, 0.35)',
              borderRadius: '16px',
              boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.85), 0 0 35px rgba(59, 130, 246, 0.15)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(30, 41, 59, 0.5)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                    boxShadow: '0 0 12px rgba(59, 130, 246, 0.4)'
                  }}
                >
                  <Download style={{ width: '16px', height: '16px' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#f8fafc' }}>
                    Export Document
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8' }}>
                    What kind of document would you like to export?
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '6px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Close"
              >
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            {/* Format Options List */}
            <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {exportFormats.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleExportFormat(item.id)}
                  className="export-format-row-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'rgba(30, 41, 59, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    width: '100%',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div 
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: item.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: item.color,
                        flexShrink: 0
                      }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#f1f5f9' }}>
                          {item.title}
                        </span>
                        <span 
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: '700',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: item.badgeBg,
                            color: item.badgeColor
                          }}
                        >
                          {item.extension}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                        {item.description}
                      </div>
                    </div>
                  </div>
                  <Download style={{ width: '15px', height: '15px', color: '#64748b' }} />
                </button>
              ))}
            </div>

            {/* Footer / Cancel */}
            <div 
              style={{
                padding: '12px 20px',
                background: 'rgba(15, 23, 42, 0.8)',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                justifyContent: 'flex-end'
              }}
            >
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
