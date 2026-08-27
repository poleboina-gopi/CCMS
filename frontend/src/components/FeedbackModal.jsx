import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Star, X, CheckCircle, MessageSquare } from 'lucide-react';

export default function FeedbackModal({ complaint, isOpen, onClose, onSubmitFeedback }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comments, setComments] = useState('');
  const [closeTicket, setCloseTicket] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !complaint) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmitFeedback({
        rating,
        comments,
        close_ticket: closeTicket
      });

      if (rating >= 4) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle size={20} color="var(--accent-emerald)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Resolution Feedback</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ticket #{complaint.ticket_number}</p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Star Rating Selector */}
          <div className="form-group" style={{ alignItems: 'center', textAlign: 'center', margin: '20px 0' }}>
            <label className="form-label" style={{ fontSize: '0.95rem' }}>How satisfied are you with the resolution?</label>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    transition: 'transform 0.15s ease'
                  }}
                  onFocus={(e) => e.target.style.transform = 'scale(1.2)'}
                  onBlur={(e) => e.target.style.transform = 'scale(1)'}
                >
                  <Star
                    size={32}
                    fill={(hoverRating || rating) >= star ? '#fbbf24' : 'none'}
                    color={(hoverRating || rating) >= star ? '#fbbf24' : 'var(--text-muted)'}
                  />
                </button>
              ))}
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-amber)', fontWeight: '700', marginTop: '6px' }}>
              {rating === 5 && '⭐️⭐️⭐️⭐️⭐️ Outstanding & Fast!'}
              {rating === 4 && '⭐️⭐️⭐️⭐️ Very Satisfied'}
              {rating === 3 && '⭐️⭐️⭐️ Satisfactory'}
              {rating === 2 && '⭐️⭐️ Needs Improvement'}
              {rating === 1 && '⭐️ Unsatisfied'}
            </span>
          </div>

          {/* Comments Textarea */}
          <div className="form-group">
            <label className="form-label">
              <MessageSquare size={15} />
              <span>Feedback Remarks (Optional)</span>
            </label>
            <textarea
              className="form-textarea"
              placeholder="Let us know how the department handled your request or if any follow-up is needed..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
            />
          </div>

          {/* Close Ticket Checkbox */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px',
            backgroundColor: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            marginBottom: '20px'
          }}>
            <input
              type="checkbox"
              id="closeTicketCheck"
              checked={closeTicket}
              onChange={(e) => setCloseTicket(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            <label htmlFor="closeTicketCheck" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
              Confirm and officially mark this complaint as <strong>Closed</strong>
            </label>
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
