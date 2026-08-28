import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import ComplaintCard from '../components/ComplaintCard';
import { 
  PlusCircle, 
  Search, 
  Filter, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';

export default function StudentDashboard({ onSelectComplaint, onNavigateSubmit }) {
  const { user, authFetch } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [kpis, setKpis] = useState({ total: 0, active: 0, inProgress: 0, resolved: 0 });

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchStudentData = useCallback(async () => {
    setLoading(true);
    try {
      // Build query string
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());

      const [complaintsRes, analyticsRes] = await Promise.all([
        authFetch(`/api/complaints?${params.toString()}`),
        authFetch('/api/analytics/dashboard')
      ]);

      if (complaintsRes.ok) {
        const data = await complaintsRes.json();
        setComplaints(data.complaints || []);
      }

      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        if (data.kpis) {
          setKpis({
            total: data.kpis.total,
            active: data.kpis.pending,
            inProgress: data.kpis.inProgress,
            resolved: data.kpis.resolved
          });
        }
      }
    } catch (err) {
      console.error('Fetch student dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, [authFetch, statusFilter, categoryFilter, priorityFilter, debouncedSearch]);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Student Welcome Banner */}
      <div 
        className="glass-panel responsive-banner" 
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '6px' }}>
            Welcome back, {user?.name.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
            Track your campus complaints, view live maintenance updates, or report a new issue.
          </p>
        </div>

        <button 
          className="btn btn-primary btn-lg"
          onClick={onNavigateSubmit}
          style={{ whiteSpace: 'nowrap' }}
        >
          <PlusCircle size={20} />
          <span>Submit New Complaint</span>
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>
            <FileText size={24} />
          </div>
          <div>
            <div className="kpi-value">{kpis.total}</div>
            <div className="kpi-label">Total Reported</div>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(192, 132, 252, 0.15)', color: 'var(--secondary)' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="kpi-value">{kpis.active}</div>
            <div className="kpi-label">Under Review</div>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(251, 191, 36, 0.15)', color: 'var(--accent-amber)' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <div className="kpi-value">{kpis.inProgress}</div>
            <div className="kpi-label">In Progress</div>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="kpi-value">{kpis.resolved}</div>
            <div className="kpi-label">Resolved & Closed</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div className="responsive-filter-grid">
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '40px' }}
              placeholder="Search by ticket #, title, or room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div style={{ flex: '0 1 180px' }}>
            <select
              className="form-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="Wi-Fi & IT">Wi-Fi & IT</option>
              <option value="Hostel Affairs">Hostel Affairs</option>
              <option value="Maintenance & Infrastructure">Maintenance</option>
              <option value="Electrical & Plumbing">Electrical & Plumbing</option>
              <option value="Academics">Academics</option>
              <option value="Canteen & Mess">Canteen & Mess</option>
              <option value="Transport">Transport</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ flex: '0 1 170px' }}>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button 
            className="btn btn-secondary btn-sm"
            onClick={fetchStudentData}
            title="Refresh List"
            style={{ height: '42px', padding: '0 16px' }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Complaints Grid */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
            My Complaints ({complaints.length})
          </h2>
          {complaints.length > 0 && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Click any card to track live timeline and view staff notes
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--primary)' }} />
            <div>Loading complaints...</div>
          </div>
        ) : complaints.length === 0 ? (
          <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <FileText size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No Complaints Found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', maxWidth: '420px', margin: '0 auto 20px' }}>
              {search || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your filters or search keywords.'
                : "You haven't submitted any complaints yet. Notice something broken around campus? Let us know!"}
            </p>
            <button className="btn btn-primary" onClick={onNavigateSubmit}>
              <PlusCircle size={16} />
              <span>Report an Issue</span>
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
            gap: '16px'
          }}>
            {complaints.map(item => (
              <ComplaintCard
                key={item.id}
                complaint={item}
                onSelect={onSelectComplaint}
                userRole="student"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
