import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import AnalyticsCharts from '../components/AnalyticsCharts';
import CampusHeatmap from '../components/CampusHeatmap';
import StaffLeaderboard from '../components/StaffLeaderboard';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import { 
  BarChart3, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  SlidersHorizontal,
  RefreshCw,
  PlusCircle,
  Building,
  Star,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function AdminDashboard({ onSelectComplaint, onNavigateManagement, onNavigateSubmit }) {
  const { authFetch } = useAuth();
  const { showToast } = useNotification();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/analytics/dashboard');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Export complaints as CSV
  const handleExportCSV = async () => {
    try {
      const res = await authFetch('/api/complaints?limit=500');
      if (!res.ok) throw new Error('Failed to fetch complaints for export.');
      const data = await res.json();
      const items = data.complaints || [];

      const headers = ['Ticket Number', 'Title', 'Category', 'Location', 'Priority', 'Status', 'Student Name', 'Assigned Staff', 'Created At'];
      const rows = items.map(c => [
        `"${c.ticket_number}"`,
        `"${c.title.replace(/"/g, '""')}"`,
        `"${c.category}"`,
        `"${c.location.replace(/"/g, '""')}"`,
        `"${c.priority}"`,
        `"${c.status}"`,
        `"${c.student_name || ''}"`,
        `"${c.assigned_name || ''}"`,
        `"${new Date(c.created_at).toISOString()}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `CampusResolve_Complaints_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('CSV report downloaded successfully.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading || !analytics) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--primary)' }} />
        <div>Computing campus analytics & metrics...</div>
      </div>
    );
  }

  const { kpis, urgentQueue = [] } = analytics;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Banner */}
      <div 
        className="glass-panel responsive-banner" 
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(244, 63, 94, 0.1) 100%)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <ShieldCheck size={22} color="var(--primary)" />
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Campus Operations Analytics</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
            Real-time complaint telemetry, department workloads, resolution efficiency, and critical escalations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={16} />
            <span>Export CSV Report</span>
          </button>
          <button className="btn btn-primary" onClick={onNavigateManagement}>
            <SlidersHorizontal size={16} />
            <span>Manage All Tickets</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>
            <FileText size={24} />
          </div>
          <div>
            <div className="kpi-value">{kpis.total}</div>
            <div className="kpi-label">Total Campus Complaints</div>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(192, 132, 252, 0.15)', color: 'var(--secondary)' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="kpi-value">{kpis.pending}</div>
            <div className="kpi-label">Pending Review</div>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(251, 191, 36, 0.15)', color: 'var(--accent-amber)' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="kpi-value">{kpis.inProgress}</div>
            <div className="kpi-label">Under Active Work</div>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="kpi-value">{kpis.resolutionRate}%</div>
            <div className="kpi-label">Resolution Rate</div>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="kpi-value" style={{ color: kpis.critical > 0 ? 'var(--accent-rose)' : 'inherit' }}>
              {kpis.critical}
            </div>
            <div className="kpi-label">Critical Urgent Issues</div>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24' }}>
            <Star size={24} />
          </div>
          <div>
            <div className="kpi-value">{kpis.averageRating > 0 ? `${kpis.averageRating}★` : 'N/A'}</div>
            <div className="kpi-label">Student Satisfaction ({kpis.ratingCount})</div>
          </div>
        </div>
      </div>

      {/* Visual Charts */}
      <AnalyticsCharts analytics={analytics} />

      {/* Enterprise Feature 6: Campus Facility Heatmap */}
      <CampusHeatmap onSelectBuilding={() => onNavigateManagement()} />

      {/* Enterprise Feature 6: Staff Performance Leaderboard */}
      <StaffLeaderboard />

      {/* Urgent Issues Queue */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} color="var(--accent-rose)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>
              Urgent & Critical Attention Queue ({urgentQueue.length})
            </h2>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={onNavigateManagement}>
            <span>View All in Manager</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {urgentQueue.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--accent-emerald)' }}>
            <CheckCircle2 size={32} style={{ margin: '0 auto 8px' }} />
            <div style={{ fontWeight: '600' }}>Great job! No critical unresolved issues in queue.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {urgentQueue.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectComplaint(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <PriorityBadge priority={item.priority} size="sm" />
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                      #{item.ticket_number}: {item.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {item.location} • Student: {item.student_name}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <StatusBadge status={item.status} size="sm" />
                  <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Inspect <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
