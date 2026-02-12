import React, { useState } from "react";
import styles from "./FeedbackWidget.module.css";

const STORAGE_KEY = "sia.helpFeedback";

// PUBLIC_INTERFACE
export default function FeedbackWidget({ contentId }) {
  /** Collects quick feedback on help content; stored client-side for demo purposes. */
  const [rating, setRating] = useState(null); // "up"|"down"|null
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    const payload = {
      contentId,
      rating,
      comment: comment.trim(),
      timestamp: new Date().toISOString()
    };
    const prev = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([payload, ...prev].slice(0, 50)));
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2200);
  };

  return (
    <section className={styles.wrap} aria-label="Feedback">
      <h3 className={styles.h3}>Was this helpful?</h3>

      <div className={styles.row} role="group" aria-label="Helpfulness rating">
        <button className={`btn ${rating === "up" ? "secondary" : ""}`} onClick={() => setRating("up")} aria-label="Thumbs up">
          👍
        </button>
        <button className={`btn ${rating === "down" ? "secondary" : ""}`} onClick={() => setRating("down")} aria-label="Thumbs down">
          👎
        </button>
      </div>

      <div className="field">
        <label htmlFor={`comment_${contentId}`}>Optional comment</label>
        <textarea
          id={`comment_${contentId}`}
          className="textarea"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us what could be improved…"
        />
      </div>

      <div className={styles.actions}>
        <button className="btn primary" onClick={submit} disabled={!rating} aria-label="Submit feedback">
          Submit
        </button>
        {submitted && (
          <div role="status" className={styles.thanks} aria-live="polite">
            Thanks for the feedback.
          </div>
        )}
      </div>
    </section>
  );
}
