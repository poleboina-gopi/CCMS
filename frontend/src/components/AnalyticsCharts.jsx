import React from 'react';
import { 
  PieChart, 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Layers,
  Building,
  TrendingUp
} from 'lucide-react';

export default function AnalyticsCharts({ analytics }) {
  if (!analytics) return null;

  const { kpis, statusStats = [], categoryStats = [], priorityStats = [], departmentStats = [] } = analytics;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '20px'
      }}>
        {/* Category Breakdown Card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={20} color="var(--primary)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Complaints by Category</h3>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Volume & Resolution</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {categoryStats.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No category data yet.</div>
            ) : (
              categoryStats.map((item) => {
                const total = item.total || 0;
                const resolved = item.resolved || 0;
                const percentage = total > 0 ? Math.round((resolved / total) * 100) : 0;
                const maxTotal = Math.max(...categoryStats.map(c => c.total), 1);
                const barWidth = Math.max(15, Math.round((total / maxTotal) * 100));

                return (
                  <div key={item.category}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.category}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        <strong>{total}</strong> tickets ({percentage}% resolved)
                      </span>
                    </div>

                    <div style={{
                      height: '10px',
                      backgroundColor: 'var(--bg-tertiary)',
                      borderRadius: '5px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${barWidth}%`,
                        background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent-emerald) 100%)',
                        borderRadius: '5px',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Status Breakdown & Resolution Ring */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={20} color="var(--accent-emerald)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Lifecycle & Resolution Rate</h3>
            </div>
            <span style={{ 
              fontSize: '0.8rem', 
              fontWeight: '700', 
              color: 'var(--accent-emerald)',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)'
            }}>
              {kpis.resolutionRate}% Resolved
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            {statusStats.map(stat => (
              <div 
                key={stat.status}
                style={{
                  padding: '12px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stat.color }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>{stat.status}</span>
                </div>
                <span style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>
                  {stat.count}
                </span>
              </div>
            ))}
          </div>

          {/* Department Workload Summary */}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building size={15} color="var(--primary)" />
              <span>Department Workload & Active Queue</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {departmentStats.slice(0, 4).map(dept => (
                <div 
                  key={dept.department}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.825rem'
                  }}
                >
                  <span style={{ fontWeight: '600' }}>{dept.department}</span>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--accent-amber)' }}>{dept.active} active</span>
                    <span style={{ color: 'var(--accent-emerald)' }}>{dept.resolved} resolved</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
