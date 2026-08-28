import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building, AlertTriangle, CheckCircle2, Clock, Flame, ChevronRight } from 'lucide-react';

export default function CampusHeatmap({ onSelectBuilding }) {
  const { authFetch } = useAuth();
  const [heatmaps, setHeatmaps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHeatmaps() {
      try {
        const res = await authFetch('/api/analytics/heatmaps');
        if (res.ok) {
          const data = await res.json();
          setHeatmaps(data.heatmaps || []);
        }
      } catch (err) {
        console.error('Fetch heatmap error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHeatmaps();
  }, [authFetch]);

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading campus facility telemetry...
      </div>
    );
  }

  if (heatmaps.length === 0) return null;

  const maxComplaints = Math.max(...heatmaps.map(h => h.total), 1);

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flame size={18} color="var(--accent-rose)" />
            <span>Campus Facility Heatmap & Zone Activity</span>
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Live complaint density across hostel blocks, academic wings, labs, and student centers.
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
        gap: '14px'
      }}>
        {heatmaps.map((item) => {
          const densityPercent = Math.round((item.total / maxComplaints) * 100);
          const isHighDensity = densityPercent > 60 || item.critical > 0;

          return (
            <div
              key={item.building}
              className="glass-card"
              style={{
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                borderLeft: `4px solid ${isHighDensity ? 'var(--accent-rose)' : 'var(--primary)'}`,
                cursor: onSelectBuilding ? 'pointer' : 'default'
              }}
              onClick={() => onSelectBuilding && onSelectBuilding(item.building)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building size={16} color="var(--primary)" />
                  <span style={{ fontWeight: '700', fontSize: '0.925rem', color: 'var(--text-primary)' }}>
                    {item.building}
                  </span>
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: item.active > 0 ? 'rgba(251, 191, 36, 0.15)' : 'rgba(16, 185, 129, 0.12)',
                  color: item.active > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)'
                }}>
                  {item.total} total ({item.active} active)
                </span>
              </div>

              {/* Density Bar */}
              <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${densityPercent}%`,
                  height: '100%',
                  background: isHighDensity
                    ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                    : 'linear-gradient(90deg, #6366f1, #10b981)',
                  borderRadius: '3px',
                  transition: 'width 0.5s ease'
                }} />
              </div>

              {/* Status Breakdown Pills */}
              <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} color="var(--accent-amber)" />
                  <span>{item.active} Active</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} color="var(--accent-emerald)" />
                  <span>{item.resolved} Resolved</span>
                </span>
                {item.critical > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-rose)', fontWeight: '700' }}>
                    <AlertTriangle size={12} />
                    <span>{item.critical} Critical</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
