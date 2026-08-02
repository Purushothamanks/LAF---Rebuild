import React from 'react';
import { Brain, Globe, Sparkles, ChevronDown, Check } from 'lucide-react';

export default function Header({
  selectedModel,
  setSelectedModel,
  webSearchEnabled,
  setWebSearchEnabled,
  deepThinkingEnabled,
  setDeepThinkingEnabled,
  concisenessMode,
  setConcisenessMode
}) {
  return (
    <header style={{
      height: '56px',
      borderBottom: '1px solid var(--border-deepseek)',
      background: 'var(--bg-deepseek-dark)',
      display: 'flex',
      alignItems: 'center',
      justify: 'space-between',
      padding: '0 20px',
      zIndex: 10
    }}>
      {/* Model Selector Pill (DeepSeek R1 vs V3 style) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'var(--bg-deepseek-card)',
          border: '1px solid var(--border-deepseek)',
          padding: '4px',
          borderRadius: 'var(--radius-pill)'
        }}>
          <button
            onClick={() => setSelectedModel('LAF-R1')}
            className={`btn-ds-pill ${selectedModel === 'LAF-R1' ? 'btn-ds-pill-active' : ''}`}
            style={{ borderRadius: 'var(--radius-pill)', border: 'none' }}
          >
            <Brain style={{ width: '14px' }} />
            <span>LAF-R1 (Reasoning)</span>
          </button>

          <button
            onClick={() => setSelectedModel('LAF-V3')}
            className={`btn-ds-pill ${selectedModel === 'LAF-V3' ? 'btn-ds-pill-active' : ''}`}
            style={{ borderRadius: 'var(--radius-pill)', border: 'none' }}
          >
            <Sparkles style={{ width: '14px' }} />
            <span>LAF-V3 (Fast Chat)</span>
          </button>
        </div>
      </div>

      {/* Feature Toggles (Web Search & Deep Thinking & Conciseness) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        
        {/* Web Search Toggle */}
        <button
          onClick={() => setWebSearchEnabled(!webSearchEnabled)}
          className={`btn-ds-pill ${webSearchEnabled ? 'btn-ds-pill-active' : ''}`}
        >
          <Globe style={{ width: '14px' }} />
          <span>Search Web</span>
          {webSearchEnabled && <Check style={{ width: '12px' }} />}
        </button>

        {/* Deep Thinking Toggle */}
        <button
          onClick={() => setDeepThinkingEnabled(!deepThinkingEnabled)}
          className={`btn-ds-pill ${deepThinkingEnabled ? 'btn-ds-pill-active' : ''}`}
        >
          <Brain style={{ width: '14px' }} />
          <span>Deep Thinking</span>
          {deepThinkingEnabled && <Check style={{ width: '12px' }} />}
        </button>

        {/* Conciseness Selector */}
        <div style={{ borderLeft: '1px solid var(--border-deepseek)', paddingLeft: '8px', display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setConcisenessMode('short')}
            className={`btn-ds-pill ${concisenessMode === 'short' ? 'btn-ds-pill-active' : ''}`}
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
          >
            Short
          </button>
          <button
            onClick={() => setConcisenessMode('detailed')}
            className={`btn-ds-pill ${concisenessMode === 'detailed' ? 'btn-ds-pill-active' : ''}`}
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
          >
            Detailed
          </button>
        </div>

      </div>
    </header>
  );
}
