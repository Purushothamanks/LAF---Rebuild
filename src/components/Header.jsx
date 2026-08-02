import React from 'react';
import { Brain, Globe, Sparkles, Check } from 'lucide-react';

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
      height: '52px',
      borderBottom: '1px solid var(--ds-border)',
      background: 'var(--ds-bg-main)',
      display: 'flex',
      alignItems: 'center',
      justify: 'space-between',
      padding: '0 20px',
      zIndex: 10
    }}>
      {/* DeepSeek Model Selector Switcher */}
      <div className="ds-model-toggle">
        <button
          onClick={() => setSelectedModel('LAF-R1')}
          className={`ds-model-btn ${selectedModel === 'LAF-R1' ? 'active' : ''}`}
        >
          <Brain style={{ width: '14px' }} />
          <span>LAF-R1</span>
        </button>

        <button
          onClick={() => setSelectedModel('LAF-V3')}
          className={`ds-model-btn ${selectedModel === 'LAF-V3' ? 'active' : ''}`}
        >
          <Sparkles style={{ width: '14px' }} />
          <span>LAF-V3</span>
        </button>
      </div>

      {/* Feature Toggles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        
        <button
          onClick={() => setDeepThinkingEnabled(!deepThinkingEnabled)}
          className={`ds-control-btn ${deepThinkingEnabled ? 'active' : ''}`}
        >
          <Brain style={{ width: '13px' }} />
          <span>DeepThink (R1)</span>
          {deepThinkingEnabled && <Check style={{ width: '12px' }} />}
        </button>

        <button
          onClick={() => setWebSearchEnabled(!webSearchEnabled)}
          className={`ds-control-btn ${webSearchEnabled ? 'active' : ''}`}
        >
          <Globe style={{ width: '13px' }} />
          <span>Search</span>
          {webSearchEnabled && <Check style={{ width: '12px' }} />}
        </button>

        <div style={{ borderLeft: '1px solid var(--ds-border)', paddingLeft: '8px', display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setConcisenessMode('short')}
            className={`ds-control-btn ${concisenessMode === 'short' ? 'active' : ''}`}
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
          >
            Short
          </button>
          <button
            onClick={() => setConcisenessMode('detailed')}
            className={`ds-control-btn ${concisenessMode === 'detailed' ? 'active' : ''}`}
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
          >
            Detailed
          </button>
        </div>

      </div>
    </header>
  );
}
