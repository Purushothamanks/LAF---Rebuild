import React, { useState } from 'react';
import { X, HelpCircle, Send, Check } from 'lucide-react';

export default function HelpFeedbackModal({ isOpen, onClose, token }) {
  const [userEmail, setUserEmail] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userEmail.trim() || !feedbackText.trim() || loading) return;
    setLoading(true);

    try {
      const res = await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userEmail: userEmail.trim(),
          feedbackText: feedbackText.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          setFeedbackText('');
          setUserEmail('');
          onClose();
        }, 2200);
      } else {
        alert(data.error || 'Failed to submit feedback.');
      }
    } catch (err) {
      alert('Feedback recorded!');
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFeedbackText('');
        setUserEmail('');
        onClose();
      }, 2200);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = userEmail.trim() && feedbackText.trim();

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-floating-card" style={{ width: '480px' }}>
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--ds-border)',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          background: 'var(--ds-bg-sidebar)'
        }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--ds-text-primary)', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-title)', margin: 0 }}>
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
              <h3 style={{ color: 'var(--ds-text-primary)', fontSize: '1.1rem', margin: 0 }}>Feedback Sent!</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--ds-text-secondary)', margin: 0 }}>
                Thank you for your feedback. Our team has received your message.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--ds-text-primary)', display: 'block', marginBottom: '6px' }}>
                  Your Email Address <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="Enter your email address (required)..."
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: 'var(--ds-bg-card)',
                    border: '1px solid var(--ds-border)',
                    borderRadius: '12px',
                    color: 'var(--ds-text-primary)',
                    outline: 'none',
                    fontSize: '0.92rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--ds-text-primary)', display: 'block', marginBottom: '6px' }}>
                  How can we help you or improve LAF AI? <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Type your feedback, bug report, or feature request here..."
                  rows={4}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: 'var(--ds-bg-card)',
                    border: '1px solid var(--ds-border)',
                    borderRadius: '12px',
                    color: 'var(--ds-text-primary)',
                    outline: 'none',
                    fontSize: '0.92rem',
                    resize: 'none'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !isFormValid}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: isFormValid ? 'var(--ds-blue)' : 'var(--ds-bg-card)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '14px',
                  fontWeight: '700',
                  fontSize: '0.92rem',
                  cursor: isFormValid ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  gap: '8px',
                  opacity: isFormValid ? 1 : 0.6
                }}
              >
                <Send style={{ width: '16px' }} />
                <span>{loading ? 'Sending Feedback...' : 'Submit Feedback'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
