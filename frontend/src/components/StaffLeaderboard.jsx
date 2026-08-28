import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Trophy, Star, Clock, CheckCircle2, Award, ShieldCheck, Wrench } from 'lucide-react';

export default function StaffLeaderboard() {
  const { authFetch } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await authFetch('/api/analytics/leaderboard');
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data.leaderboard || []);
        }
      } catch (err) {
        console.error('Fetch leaderboard error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, [authFetch]);

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading department technician rankings...
      </div>
    );
  }

  if (leaderboard.length === 0) return null;

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={18} color="#fbbf24" />
            <span>Department Staff Performance Leaderboard</span>
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Ranked by total resolutions, Mean Time to Resolution (MTTR), and student satisfaction CSAT ratings.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {leaderboard.slice(0, 5).map((staff, idx) => {
          const rankColors = ['#fbbf24', '#94a3b8', '#b45309'];
          const isTopThree = idx < 3;

          return (
            <div
              key={staff.id}
              className="glass-card"
              style={{
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              {/* Left Rank & Avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: isTopThree ? rankColors[idx] : 'var(--bg-tertiary)',
                  color: isTopThree ? '#000000' : 'var(--text-muted)',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {idx + 1}
                </div>

                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.925rem', color: 'var(--text-primary)' }}>
                    {staff.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {staff.department} • {staff.role === 'admin' ? 'Administrator' : 'Staff Specialist'}
                  </div>
                </div>
              </div>

              {/* Stats Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {/* Resolved Count */}
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  padding: '3px 9px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: 'var(--accent-emerald)'
                }}>
                  <CheckCircle2 size={13} />
                  <span>{staff.resolved_count} Resolved</span>
                </span>

                {/* MTTR (Hours) */}
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  padding: '3px 9px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(99, 102, 241, 0.12)',
                  color: 'var(--primary)'
                }}>
                  <Clock size={13} />
                  <span>MTTR: {staff.mttr_hours > 0 ? `${staff.mttr_hours}h` : '< 1h'}</span>
                </span>

                {/* CSAT Star Rating */}
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  padding: '3px 9px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(251, 191, 36, 0.15)',
                  color: 'var(--accent-amber)'
                }}>
                  <Star size={13} fill="var(--accent-amber)" />
                  <span>{staff.avg_rating} / 5.0</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
