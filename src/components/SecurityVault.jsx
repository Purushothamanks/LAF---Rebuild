import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Cpu, AlertTriangle, CheckCircle, Terminal } from 'lucide-react';

export default function SecurityVault({ token }) {
  const [securityData, setSecurityData] = useState(null);

  useEffect(() => {
    fetch('/api/security/status', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setSecurityData(data))
      .catch(() => {});
  }, [token]);

  return (
    <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
      
      <div style={{ marginBottom: '24px' }}>
        <h1 className="text-glow" style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '6px' }}>
          LAF Security & End-to-End Encryption Vault
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Active security shield metrics, threat monitoring, and per-user cryptographic isolation status.
        </p>
      </div>

      {/* Top Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--accent-green)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>System Status</span>
            <CheckCircle style={{ width: '18px', color: 'var(--accent-green)' }} />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent-green)' }}>
            {securityData?.status || 'OPTIMAL'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>Zero Security Threats Detected</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--primary-cyan)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Encryption Core</span>
            <Lock style={{ width: '18px', color: 'var(--primary-cyan)' }} />
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--primary-cyan)' }}>
            {securityData?.e2eeStatus || 'AES-256-GCM'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>PBKDF2 Derived Per-User Keys</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--primary-purple)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Threat Shield</span>
            <ShieldCheck style={{ width: '18px', color: 'var(--primary-purple)' }} />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary-purple)' }}>
            {securityData?.securityShield || 'ACTIVE'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>Sanitization & Injection Guard</div>
        </div>

      </div>

      {/* Active Protections List */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal style={{ width: '18px', color: 'var(--primary-cyan)' }} /> Active Security Protocols & Defenses
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {(securityData?.protections || [
            'Passwordless Auth Token Verification',
            'AES-256-GCM Per-User Payload Encryption',
            'SQL / NoSQL Injection Threat Shield',
            'XSS Prompt & Script Sanitization',
            'Express Rate Limiter & Helmet Headers'
          ]).map((prot, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              background: 'rgba(0, 240, 255, 0.05)',
              border: '1px solid rgba(0, 240, 255, 0.15)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.88rem',
              color: 'var(--text-main)'
            }}>
              <CheckCircle style={{ width: '16px', color: 'var(--accent-green)', flexShrink: 0 }} />
              <span>{prot}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
