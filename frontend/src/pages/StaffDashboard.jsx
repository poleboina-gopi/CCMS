import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, getMediaUrl } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import ComplaintCard from '../components/ComplaintCard';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { 
  Wrench, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Filter, 
  Search, 
  RefreshCw, 
  User, 
  Building,
  ArrowRight,
  Image as ImageIcon,
  UploadCloud,
  X
} from 'lucide-react';

export default function StaffDashboard({ onSelectComplaint }) {
  const { user, authFetch } = useAuth();
  const { showToast } = useNotification();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState('assigned'); // 'assigned' (to department/me) | 'all'
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Quick Resolve modal state
  const [resolveTarget, setResolveTarget] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionFile, setResolutionFile] = useState(null);
  const [resolutionFilePreview, setResolutionFilePreview] = useState(null);
  const [submittingResolve, setSubmittingResolve] = useState(false);

  const fetchStaffData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (scope) params.append('scope', scope);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());

      const res = await authFetch(`/api/complaints?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setComplaints(data.complaints || []);
      }
    } catch (err) {
      console.error('Failed to load staff complaints:', err);
    } finally {
      setLoading(false);
    }
  }, [authFetch, scope, statusFilter, priorityFilter, debouncedSearch]);

  useEffect(() => {
    fetchStaffData();
  }, [fetchStaffData]);

  const handleQuickStatus = async (id, newStatus, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await authFetch(`/api/complaints/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status.');
      showToast(`Status updated to ${newStatus}.`, 'success');
      fetchStaffData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleResolutionFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast('Photo must be under 10MB.', 'error');
        return;
      }
      setResolutionFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setResolutionFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveResolutionFile = () => {
    setResolutionFile(null);
    setResolutionFilePreview(null);
  };

  const handleConfirmResolve = async (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      showToast('Please enter resolution notes.', 'error');
      return;
    }

    setSubmittingResolve(true);
    try {
      let res;
      if (resolutionFile) {
        const formData = new FormData();
        formData.append('status', 'Resolved');
        formData.append('resolution_notes', resolutionNotes.trim());
        formData.append('resolution_image', resolutionFile);
        if (resolutionFilePreview && resolutionFilePreview.startsWith('data:image/')) {
          formData.append('resolution_image_data', resolutionFilePreview);
        }
        res = await authFetch(`/api/complaints/${resolveTarget.id}/status`, {
          method: 'PUT',
          body: formData
        });
      } else {
        res = await authFetch(`/api/complaints/${resolveTarget.id}/status`, {
          method: 'PUT',
          body: JSON.stringify({
            status: 'Resolved',
            resolution_notes: resolutionNotes.trim()
          })
        });
      }

      if (!res.ok) throw new Error('Failed to mark resolved.');
      showToast('Complaint resolved successfully with verification!', 'success');
      setResolveTarget(null);
      setResolutionNotes('');
      setResolutionFile(null);
      setResolutionFilePreview(null);
      fetchStaffData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmittingResolve(false);
    }
  };

  const activeCount = complaints.filter(c => ['Assigned', 'In Progress', 'Under Review'].includes(c.status)).length;
  const resolvedCount = complaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length;
  const criticalCount = complaints.filter(c => c.priority === 'Critical' && !['Resolved', 'Closed'].includes(c.status)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Banner */}
      <div 
        className="glass-panel responsive-banner" 
        style={{
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Wrench size={22} color="var(--accent-amber)" />
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>
              {user?.department || 'Department Staff'} Work Portal
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
            Logged in as <strong>{user?.name}</strong>. Manage assigned maintenance orders, update job statuses, and record resolution proofs.
          </p>
        </div>

        {/* Scope Selector */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--bg-input)',
          padding: '4px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)'
        }}>
          <button
            onClick={() => setScope('assigned')}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.85rem',
              backgroundColor: scope === 'assigned' ? 'var(--primary)' : 'transparent',
              color: scope === 'assigned' ? '#ffffff' : 'var(--text-secondary)'
            }}
          >
            My Dept Queue ({complaints.length})
          </button>
          <button
            onClick={() => setScope('all')}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.85rem',
              backgroundColor: scope === 'all' ? 'var(--primary)' : 'transparent',
              color: scope === 'all' ? '#ffffff' : 'var(--text-secondary)'
            }}
          >
            All Campus Tickets
          </button>
        </div>
      </div>

      {/* Staff KPI Cards */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>
            <Building size={24} />
          </div>
          <div>
            <div className="kpi-value">{complaints.length}</div>
            <div className="kpi-label">Assigned Tickets</div>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(251, 191, 36, 0.15)', color: 'var(--accent-amber)' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="kpi-value">{activeCount}</div>
            <div className="kpi-label">Active / In Progress</div>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="kpi-value">{resolvedCount}</div>
            <div className="kpi-label">Resolved / Closed</div>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="kpi-value" style={{ color: criticalCount > 0 ? 'var(--accent-rose)' : 'inherit' }}>
              {criticalCount}
            </div>
            <div className="kpi-label">Urgent Criticals</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div className="responsive-filter-grid">
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '40px' }}
              placeholder="Search by ticket #, title, room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div style={{ flex: '0 1 180px' }}>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div style={{ flex: '0 1 160px' }}>
            <select
              className="form-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <button 
            className="btn btn-secondary"
            onClick={fetchStaffData}
            style={{ height: '42px' }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Complaints List */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '16px' }}>
          Work Queue ({complaints.length})
        </h2>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--primary)' }} />
            <div>Loading work orders...</div>
          </div>
        ) : complaints.length === 0 ? (
          <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={40} style={{ margin: '0 auto 12px', color: 'var(--accent-emerald)' }} />
            <h3 style={{ color: 'var(--text-primary)' }}>All caught up!</h3>
            <p style={{ fontSize: '0.875rem', marginTop: '4px' }}>
              No complaints currently pending in this queue.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {complaints.map(item => (
              <div 
                key={item.id}
                className="glass-card"
                style={{
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  cursor: 'pointer',
                  borderLeft: `5px solid ${item.priority === 'Critical' ? 'var(--accent-rose)' : 'var(--primary)'}`
                }}
                onClick={() => onSelectComplaint(item.id)}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 380px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '0.8rem', color: 'var(--primary)' }}>
                      #{item.ticket_number}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', backgroundColor: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
                      {item.category}
                    </span>
                    <PriorityBadge priority={item.priority} size="sm" />
                    <StatusBadge status={item.status} size="sm" />
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {item.title}
                  </h3>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.description}
                  </p>

                  {/* Attached Evidence Badge */}
                  {item.image_url && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '4px 8px',
                      backgroundColor: 'rgba(99, 102, 241, 0.08)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      borderRadius: 'var(--radius-sm)',
                      width: 'fit-content',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: 'var(--primary)'
                    }}>
                      <img
                        src={getMediaUrl(item.image_url)}
                        alt="Evidence"
                        style={{ width: '20px', height: '20px', borderRadius: '3px', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ImageIcon size={12} />
                        <span>Student Photo Evidence</span>
                      </span>
                    </div>
                  )}

                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', display: 'flex', gap: '12px', marginTop: '2px' }}>
                    <span>📍 {item.location}</span>
                    <span>👤 Student: {item.student_name}</span>
                  </div>
                </div>

                {/* Quick Staff Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  {item.status !== 'In Progress' && item.status !== 'Resolved' && item.status !== 'Closed' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => handleQuickStatus(item.id, 'In Progress', e)}
                    >
                      <span>Start Work</span>
                    </button>
                  )}

                  {item.status !== 'Resolved' && item.status !== 'Closed' && (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setResolveTarget(item);
                        setResolutionNotes('');
                        setResolutionFile(null);
                        setResolutionFilePreview(null);
                      }}
                    >
                      <CheckCircle2 size={14} />
                      <span>Mark Resolved</span>
                    </button>
                  )}

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onSelectComplaint(item.id)}
                  >
                    <span>Open Ticket</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolution Notes Modal */}
      {resolveTarget && (
        <div className="modal-overlay" onClick={() => setResolveTarget(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>
              Complete & Resolve Ticket #{resolveTarget.ticket_number}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Please enter what work or repairs were completed so the student and administrator can review:
            </p>

            <form onSubmit={handleConfirmResolve}>
              <div className="form-group">
                <label className="form-label">
                  <span>Work & Resolution Notes *</span>
                </label>
                <textarea
                  className="form-textarea"
                  placeholder="e.g. Replaced leaking valve, tested with 5 bar pressure for 30 minutes, normal operation confirmed."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              {/* Optional Proof Photo Upload */}
              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label">
                  <ImageIcon size={14} />
                  <span>Attach Repair / Resolution Photo Proof (Optional)</span>
                </label>

                {!resolutionFilePreview ? (
                  <label 
                    style={{
                      border: '1px dashed var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      backgroundColor: 'var(--bg-input)'
                    }}
                  >
                    <UploadCloud size={18} color="var(--primary)" />
                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                      Upload repair proof photo
                    </span>
                    <input
                      type="file"
                      accept="image/*,.jpg,.jpeg,.png,.webp"
                      onChange={handleResolutionFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    border: '1px solid var(--border-glass)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-tertiary)'
                  }}>
                    <img
                      src={resolutionFilePreview}
                      alt="Resolution Proof"
                      style={{ width: '45px', height: '45px', borderRadius: '4px', objectFit: 'cover' }}
                    />
                    <span style={{ fontSize: '0.8rem', flex: 1, color: 'var(--text-primary)', fontWeight: '600' }}>
                      {resolutionFile?.name}
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveResolutionFile}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setResolveTarget(null)}
                  disabled={submittingResolve}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={submittingResolve}
                >
                  {submittingResolve ? 'Saving...' : 'Submit Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
