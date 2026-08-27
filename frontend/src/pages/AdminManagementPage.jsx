import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import AssignModal from '../components/AssignModal';
import ComplaintCard from '../components/ComplaintCard';
import { 
  Search, 
  Filter, 
  UserCheck, 
  CheckCircle2, 
  LayoutList, 
  LayoutGrid, 
  RefreshCw, 
  Building, 
  Calendar, 
  ArrowUpDown,
  MoreVertical,
  ExternalLink
} from 'lucide-react';

export default function AdminManagementPage({ onSelectComplaint }) {
  const { authFetch } = useAuth();
  const { showToast } = useNotification();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

  // Selected for Assign Modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (deptFilter !== 'all') params.append('department', deptFilter);
      if (search.trim()) params.append('search', search.trim());
      params.append('limit', '200');

      const res = await authFetch(`/api/complaints?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setComplaints(data.complaints || []);
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  }, [authFetch, statusFilter, categoryFilter, priorityFilter, deptFilter, search]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const openAssignModal = (complaint, e) => {
    e.stopPropagation();
    setSelectedComplaint(complaint);
    setIsAssignOpen(true);
  };

  const handleQuickStatusChange = async (complaintId, newStatus, e) => {
    e.stopPropagation();
    try {
      const res = await authFetch(`/api/complaints/${complaintId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Status update failed.');
      showToast(`Updated to ${newStatus}.`, 'success');
      fetchComplaints();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header & View Switcher */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Campus Complaint Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Filter, triage, assign departments, and manage lifecycle stages across all campus facilities.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--bg-input)',
          padding: '4px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)'
        }}>
          <button
            onClick={() => setViewMode('table')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.825rem',
              backgroundColor: viewMode === 'table' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'table' ? '#ffffff' : 'var(--text-secondary)'
            }}
          >
            <LayoutList size={15} />
            <span>Table View</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.825rem',
              backgroundColor: viewMode === 'grid' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'grid' ? '#ffffff' : 'var(--text-secondary)'
            }}
          >
            <LayoutGrid size={15} />
            <span>Card Grid</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          alignItems: 'center'
        }}>
          {/* Search */}
          <div style={{ position: 'relative', gridColumn: 'span 2' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '40px' }}
              placeholder="Search by ticket #, title, room, student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Department */}
          <div>
            <select className="form-select" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="all">All Departments</option>
              <option value="Wi-Fi & IT">Wi-Fi & IT</option>
              <option value="Hostel Affairs">Hostel Affairs</option>
              <option value="Maintenance & Infrastructure">Maintenance</option>
              <option value="Electrical & Plumbing">Electrical & Plumbing</option>
              <option value="Academics">Academics</option>
              <option value="Canteen & Mess">Canteen & Mess</option>
              <option value="Transport">Transport</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <select className="form-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="all">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          {/* Refresh */}
          <button 
            className="btn btn-secondary"
            onClick={fetchComplaints}
            style={{ height: '42px' }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Content: Table or Grid */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
            Showing <strong>{complaints.length}</strong> complaints matching criteria
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--primary)' }} />
            <div>Loading complaints...</div>
          </div>
        ) : complaints.length === 0 ? (
          <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Building size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <h3>No complaints found</h3>
            <p style={{ fontSize: '0.875rem', marginTop: '4px' }}>Try clearing your filters or search keywords.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '20px'
          }}>
            {complaints.map(item => (
              <ComplaintCard
                key={item.id}
                complaint={item}
                onSelect={onSelectComplaint}
                userRole="admin"
              />
            ))}
          </div>
        ) : (
          <div className="glass-panel" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  <th style={{ padding: '14px 18px' }}>Ticket # & Title</th>
                  <th style={{ padding: '14px 18px' }}>Category & Location</th>
                  <th style={{ padding: '14px 18px' }}>Student</th>
                  <th style={{ padding: '14px 18px' }}>Department / Assigned</th>
                  <th style={{ padding: '14px 18px' }}>Priority</th>
                  <th style={{ padding: '14px 18px' }}>Status</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onSelectComplaint(item.id)}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {/* Ticket & Title */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '0.75rem', color: 'var(--primary)' }}>
                        #{item.ticket_number}
                      </div>
                      <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </div>
                    </td>

                    {/* Category & Location */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.category}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {item.location}
                      </div>
                    </td>

                    {/* Student */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: '600' }}>{item.student_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.student_roll || item.student_email}
                      </div>
                    </td>

                    {/* Department & Staff */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: '600', color: item.department ? 'var(--text-primary)' : 'var(--accent-amber)' }}>
                        {item.department || 'Unassigned'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.assigned_name || 'No staff assigned'}
                      </div>
                    </td>

                    {/* Priority */}
                    <td style={{ padding: '14px 18px' }}>
                      <PriorityBadge priority={item.priority} size="sm" />
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 18px' }}>
                      <StatusBadge status={item.status} size="sm" />
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => openAssignModal(item, e)}
                          title="Assign Department & Staff"
                        >
                          <UserCheck size={14} />
                          <span>Assign</span>
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectComplaint(item.id);
                          }}
                          title="Open Ticket"
                        >
                          <ExternalLink size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      <AssignModal
        complaint={selectedComplaint}
        isOpen={isAssignOpen}
        onClose={() => {
          setIsAssignOpen(false);
          setSelectedComplaint(null);
        }}
        onAssignSuccess={fetchComplaints}
      />
    </div>
  );
}
