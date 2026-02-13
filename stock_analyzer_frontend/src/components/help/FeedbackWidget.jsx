import React, { useState } from 'react';

// PUBLIC_INTERFACE
export default function FeedbackWidget({ resourceId }) {
  /** Lightweight feedback component for help/onboarding resources (client-side only). */
  const [rating, setRating] = useState(null); // 'up' | 'down'
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function submit(nextRating) {
    setRating(nextRating);
    try {
      window.sessionStorage.setItem(
        `sia.feedback.${resourceId}`,
        JSON.stringify({ rating: nextRating, comment, at: new Date().toISOString() })
      );
    } catch {
      // ignore
    }
    setSubmitted(true);
  }

  return (
    <div aria-label="Feedback widget">
      <div className="row">
        <span className="small-muted">Was this helpful?</span>
        <button
          type="button"
          className={rating === 'up' ? 'btn primary' : 'btn'}
          onClick={() => submit('up')}
          aria-label="Mark as helpful"
        >
          👍
        </button>
        <button
          type="button"
          className={rating === 'down' ? 'btn danger' : 'btn'}
          onClick={() => submit('down')}
          aria-label="Mark as not helpful"
        >
          👎
        </button>
      </div>

      <label className="small-muted" htmlFor={`fb-${resourceId}`} style={{ display: 'block', marginTop: 8 }}>
        Optional comment
      </label>
      <input
        id={`fb-${resourceId}`}
        className="input"
        style={{ width: '100%' }}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="What could be improved?"
      />

      {submitted ? (
        <div className="small-muted" role="status" aria-live="polite" style={{ marginTop: 6 }}>
          Thanks for the feedback (stored locally for this session).
        </div>
      ) : null}
    </div>
  );
}
