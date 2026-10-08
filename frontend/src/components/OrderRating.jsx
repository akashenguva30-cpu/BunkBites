import React, { useState } from 'react';
import api from '../api/axiosConfig';

export default function OrderRating({ orderId, initialFeedback, onFeedbackSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (initialFeedback) {
    return (
      <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '15px' }}>
          <strong style={{ fontWeight: '600' }}>Your Rating:</strong> 
          <span style={{ color: '#ffc107', marginLeft: '8px' }}>
            {'★'.repeat(initialFeedback.rating)}{'☆'.repeat(5 - initialFeedback.rating)}
          </span>
        </p>
        {initialFeedback.comment && <p style={{ fontStyle: 'italic', margin: '8px 0', color: 'var(--text-secondary)' }}>"{initialFeedback.comment}"</p>}
        <p style={{ color: 'var(--success-color)', margin: '8px 0 0 0', fontWeight: '500', fontSize: '14px' }}>✓ Reviewed</p>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/feedback', { orderId, rating, comment });
      onFeedbackSubmitted(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: 'var(--text-primary)' }}>Rate your order</h4>
      <div style={{ display: 'flex', gap: '4px', fontSize: '28px', cursor: 'pointer', marginBottom: '16px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            style={{ color: (hoverRating || rating) >= star ? '#ffc107' : 'var(--border-color)', transition: 'color 0.2s' }}
          >
            ★
          </span>
        ))}
      </div>
      <textarea
        placeholder="Any comments? (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
        style={{ width: '100%', height: '80px', marginBottom: '16px', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
      />
      {error && <p style={{ color: 'var(--error-color)', margin: '0 0 12px 0', fontSize: '14px' }}>{error}</p>}
      <button 
        onClick={handleSubmit} 
        disabled={submitting || rating === 0}
        className="primary-btn"
        style={{ width: '100%', padding: '12px', fontSize: '15px', opacity: (submitting || rating === 0) ? 0.5 : 1 }}
      >
        {submitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </div>
  );
}
