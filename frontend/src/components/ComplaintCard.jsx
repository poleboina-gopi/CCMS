import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import SlaCountdownBadge from './SlaCountdownBadge';
import { getMediaUrl, useAuth } from '../context/AuthContext';
import { 
  MapPin, 
  Calendar, 
  MessageSquare, 
  User, 
  ArrowRight, 
  Building, 
  Star,
  CheckCircle2,
  Image as ImageIcon,
  ThumbsUp,
  GitMerge
} from 'lucide-react';

const categoryColors = {
  'Wi-Fi & IT': '#06b6d4',
  'Hostel Affairs': '#8b5cf6',
  'Hostel': '#8b5cf6',
  'Maintenance & Infrastructure': '#f59e0b',
  'Infrastructure': '#f59e0b',
  'Infrastructure & Maintenance': '#f59e0b',
  'Electrical & Plumbing': '#f43f5e',
  'Academics': '#6366f1',
  'Canteen & Mess': '#10b981',
  'Mess / Canteen': '#10b981',
  'Transport': '#ec4899',
  'Transportation': '#ec4899',
  'Library': '#3b82f6',
  'Sports & Gymnasium': '#14b8a6',
  'Security & Discipline': '#e11d48',
  'Other': '#64748b'
};

export default function ComplaintCard({ complaint = {}, onSelect, onQuickAssign, onQuickStatus, userRole }) {
  const { authFetch } = useAuth();
  const [upvotesCount, setUpvotesCount] = useState(complaint?.upvotes_count || 0);
  const [hasUpvoted, setHasUpvoted] = useState(complaint?.has_upvoted || false);
  const [upvoting, setUpvoting] = useState(false);

  if (!complaint || !complaint.id) return null;

  const categoryColor = categoryColors[complaint.category] || 'var(--primary)';

  const formattedDate = complaint.created_at ? new Date(complaint.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) : '';

  const handleUpvote = async (e) => {
    e.stopPropagation();
    if (upvoting) return;
    setUpvoting(true);

    // Optimistic UI update
    const prevCount = upvotesCount;
    const prevStatus = hasUpvoted;
    setUpvotesCount(prevStatus ? prevCount - 1 : prevCount + 1);
    setHasUpvoted(!prevStatus);

    try {
      const res = await authFetch(`/api/complaints/${complaint.id}/upvote`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setUpvotesCount(data.upvotes_count);
        setHasUpvoted(data.has_upvoted);
      } else {
        // Rollback
        setUpvotesCount(prevCount);
        setHasUpvoted(prevStatus);
      }
    } catch (err) {
      setUpvotesCount(prevCount);
      setHasUpvoted(prevStatus);
    } finally {
      setUpvoting(false);
    }
  };

  return (
    <div 
      className="glass-card"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        cursor: 'pointer',
        borderLeft: `4px solid ${categoryColor}`
      }}
      onClick={() => onSelect(complaint.id)}
    >
      <div>
        {/* Card Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: '800',
              fontFamily: 'monospace',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-tertiary)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)'
            }}>
              #{complaint.ticket_number}
            </span>

            <span style={{
              fontSize: '0.75rem',
              fontWeight: '700',
              color: categoryColor,
              backgroundColor: `${categoryColor}18`,
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)'
            }}>
              {complaint.category}
            </span>

            {complaint.duplicate_count > 0 && (
              <span style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--primary)'
              }}>
                <GitMerge size={11} />
                <span>+{complaint.duplicate_count} merged</span>
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <PriorityBadge priority={complaint.priority} size="sm" />
            <StatusBadge status={complaint.status} size="sm" />
          </div>
        </div>

        {/* Complaint Title */}
        <h3 style={{
          fontSize: '1.05rem',
          fontWeight: '700',
          marginBottom: '8px',
          color: 'var(--text-primary)',
          lineHeight: '1.4'
        }}>
          {complaint.title}
        </h3>

        {/* Complaint Description Snippet */}
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          lineHeight: '1.5',
          marginBottom: '14px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {complaint.description}
        </p>

        {/* Attached Photo Badge / Thumbnail Preview */}
        {complaint.image_url && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 10px',
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '14px',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: 'var(--primary)'
          }}>
            <img
              src={getMediaUrl(complaint.image_url)}
              alt="Evidence thumbnail"
              style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ImageIcon size={13} />
              <span>Evidence Photo Attached</span>
            </span>
          </div>
        )}

        {/* Location & Details */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          padding: '10px 12px',
          backgroundColor: 'var(--bg-input)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          marginBottom: '16px',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={14} color="var(--primary)" />
            <span style={{ fontWeight: '500' }}>{complaint.location}</span>
          </div>

          {complaint.assigned_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
              <User size={14} color="var(--accent-emerald)" />
              <span>Assigned to: <strong>{complaint.assigned_name}</strong> ({complaint.department || 'Staff'})</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          {/* SLA Countdown Timer */}
          <SlaCountdownBadge
            deadline={complaint.sla_deadline}
            status={complaint.status}
            isEscalated={complaint.is_escalated}
            slaHours={complaint.sla_hours}
            size="sm"
          />

          {/* Upvote / Me Too Button */}
          <button
            type="button"
            className="btn btn-sm"
            onClick={handleUpvote}
            style={{
              padding: '2px 9px',
              fontSize: '0.75rem',
              fontWeight: '700',
              borderRadius: 'var(--radius-full)',
              backgroundColor: hasUpvoted ? 'rgba(99, 102, 241, 0.18)' : 'var(--bg-tertiary)',
              color: hasUpvoted ? 'var(--primary)' : 'var(--text-muted)',
              border: hasUpvoted ? '1px solid var(--primary)' : '1px solid var(--border-color)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Click to upvote this issue (+1)"
          >
            <ThumbsUp size={12} fill={hasUpvoted ? 'currentColor' : 'none'} />
            <span>Me Too ({upvotesCount})</span>
          </button>
        </div>

        {complaint.feedback_rating && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginBottom: '12px',
            padding: '4px 8px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderRadius: 'var(--radius-sm)',
            width: 'fit-content'
          }}>
            <CheckCircle2 size={13} color="#10b981" />
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#10b981' }}>
              Student Rating: {complaint.feedback_rating}★
            </span>
          </div>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '10px',
          borderTop: '1px solid var(--border-color)',
          fontSize: '0.775rem',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={13} /> {formattedDate}
            </span>
            {complaint.comments_count > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MessageSquare size={13} /> {complaint.comments_count}
              </span>
            )}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: 'var(--primary)',
            fontWeight: '700',
            fontSize: '0.8rem'
          }}>
            <span>Details</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}
