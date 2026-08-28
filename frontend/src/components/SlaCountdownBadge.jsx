import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

/**
 * Enterprise SLA Countdown Badge
 * Renders real-time ticking time remaining or breach alert based on sla_deadline
 */
export default function SlaCountdownBadge({ deadline, status, isEscalated, slaHours = 48, size = 'md' }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isOverdue, setIsOverdue] = useState(false);
  const [percentLeft, setPercentLeft] = useState(100);

  const isComplete = status === 'Resolved' || status === 'Closed';

  useEffect(() => {
    if (!deadline || isComplete) return;

    function updateTimer() {
      const now = new Date().getTime();
      const target = new Date(deadline).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setIsOverdue(true);
        const overdueDiff = Math.abs(diff);
        const hours = Math.floor(overdueDiff / (1000 * 60 * 60));
        const mins = Math.floor((overdueDiff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${mins}m overdue`);
        setPercentLeft(0);
      } else {
        setIsOverdue(false);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const totalDuration = (slaHours || 48) * 3600 * 1000;
        const remainingRatio = Math.max(0, Math.min(100, Math.round((diff / totalDuration) * 100)));
        setTimeLeft(`${hours}h ${mins}m left`);
        setPercentLeft(remainingRatio);
      }
    }

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // update every minute
    return () => clearInterval(interval);
  }, [deadline, isComplete, slaHours]);

  if (isComplete) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: size === 'sm' ? '0.7rem' : '0.75rem',
        fontWeight: '700',
        padding: size === 'sm' ? '2px 6px' : '3px 8px',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        color: 'var(--accent-emerald)',
        border: '1px solid rgba(16, 185, 129, 0.25)'
      }}>
        <CheckCircle2 size={size === 'sm' ? 12 : 13} />
        <span>SLA Met</span>
      </span>
    );
  }

  if (!deadline || !timeLeft) return null;

  let bg = 'rgba(16, 185, 129, 0.12)';
  let color = 'var(--accent-emerald)';
  let border = 'rgba(16, 185, 129, 0.25)';

  if (isOverdue || isEscalated) {
    bg = 'rgba(244, 63, 94, 0.15)';
    color = 'var(--accent-rose)';
    border = 'rgba(244, 63, 94, 0.4)';
  } else if (percentLeft < 30) {
    bg = 'rgba(251, 191, 36, 0.15)';
    color = 'var(--accent-amber)';
    border = 'rgba(251, 191, 36, 0.35)';
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      fontSize: size === 'sm' ? '0.7rem' : '0.75rem',
      fontWeight: '700',
      padding: size === 'sm' ? '2px 7px' : '3px 9px',
      borderRadius: 'var(--radius-sm)',
      backgroundColor: bg,
      color: color,
      border: `1px solid ${border}`,
      letterSpacing: '0.01em',
      animation: (isOverdue || isEscalated) ? 'pulseCrit 2s infinite' : 'none'
    }}
    title={`Target SLA: ${slaHours} Hours (${isOverdue ? 'Deadline Exceeded' : 'On Track'})`}
    >
      {isOverdue || isEscalated ? <AlertTriangle size={size === 'sm' ? 11 : 13} /> : <Clock size={size === 'sm' ? 11 : 13} />}
      <span>{isEscalated && isOverdue ? `Escalated: ${timeLeft}` : `SLA: ${timeLeft}`}</span>
    </span>
  );
}
