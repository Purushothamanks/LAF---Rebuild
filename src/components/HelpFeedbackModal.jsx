import React, { useState } from 'react';
import { X, HelpCircle, Send, Check } from 'lucide-react';

export default function HelpFeedbackModal({ isOpen, onClose }) {
  const [feedbackText, setFeedbackText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFeedbackText('');
      onClose();
    }, 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justify: 'center',
      background: 'rgba(5, 7, 15, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      padding: '16px'
    }}>
      <div style={{
        width: '480px',
        maxWidth: '100%',
        background: 'var(--ds-bg-sidebar)',
        border: '1px solid var(--ds-border)',
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6), 0 0 30px rgba(79, 117, 255, 0.3)',
        borderRadius: 'var(--radius-bent)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--ds-border)',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          background: 'rgba(28, 33, 45, 0.9)'
        }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-title)', margin: 0 }}>
            <HelpCircle style={{ width: '20px', color: 'var(--ds-blue)' }} /> Help & Feedback
          </h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
            title="Close"
          >
            <X />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#10b981', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #10b981' }}>
                <Check style={{ width: '24px' }} />
              </div>
              <h3 style={{ color: '#fff', fontSize: '1.1rem', margin: 0 }}>Feedback Received!</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--ds-text-secondary)', margin: 0 }}>Thank you for helping us improve LAF AI.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--ds-text-primary)', display: 'block', marginBottom: '8px' }}>
                  How can we help you or improve LAF AI?
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Type your feedback, bug report, or feature request here..."
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: 'var(--ds-bg-card)',
                    border: '1px solid var(--ds-border)',
                    borderRadius: '14px',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.92rem',
                    resize: 'none'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={!feedbackText.trim()}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: feedbackText.trim() ? 'var(--ds-blue)' : 'var(--ds-bg-card)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '14px',
                  fontWeight: '700',
                  fontSize: '0.92rem',
                  cursor: feedbackText.trim() ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  gap: '8px'
                }}
              >
                <Send style={{ width: '16px' }} /> Submit Feedback
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
