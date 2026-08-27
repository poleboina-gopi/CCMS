import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import TimelineTracker from '../components/TimelineTracker';
import FeedbackModal from '../components/FeedbackModal';
import AssignModal from '../components/AssignModal';
import { 
  ArrowLeft, 
  MapPin, 
  User, 
  Calendar, 
  Clock, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  UserCheck, 
  AlertTriangle, 
  Building, 
  Phone, 
  Mail, 
  Star, 
  ShieldCheck, 
  FileText,
  Lock,
  Eye,
  Trash2
} from 'lucide-react';

export default function ComplaintDetailsPage({ complaintId, onNavigateBack }) {
  const { user, authFetch, isAdmin, isStaff, isStudent } = useAuth();
  const { showToast } = useNotification();

  const [complaint, setComplaint] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  // Modals
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [statusUpdateNote, setStatusUpdateNote] = useState('');
  const [showStatusPrompt, setShowStatusPrompt] = useState(null);

  const fetchDetails = useCallback(async () => {
    try {
      const res = await authFetch(`/api/complaints/${complaintId}`);
      if (!res.ok) {
        throw new Error('Complaint not found or access denied.');
      }
      const data = await res.json();
      setComplaint(data.complaint);
      setComments(data.comments || []);
    } catch (err) {
      showToast(err.message, 'error');
      onNavigateBack();
    } finally {
      setLoading(false);
    }
  }, [complaintId, authFetch, showToast, onNavigateBack]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Handle Comment Submission
  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSendingComment(true);
    try {
      const res = await authFetch(`/api/complaints/${complaintId}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          message: newComment.trim(),
          is_internal: isInternalComment
        })
      });

      if (!res.ok) throw new Error('Failed to post comment.');
      const data = await res.json();
      setComments(prev => [...prev, data.comment]);
      setNewComment('');
      setIsInternalComment(false);
      showToast('Comment posted.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSendingComment(false);
    }
  };

  // Handle Status Update
  const handleUpdateStatus = async (newStatus, note = '') => {
    try {
      const res = await authFetch(`/api/complaints/${complaintId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: newStatus,
          resolution_notes: note || null
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update status.');
      }

      showToast(`Complaint status updated to ${newStatus}.`, 'success');
      setShowStatusPrompt(null);
      setStatusUpdateNote('');
      fetchDetails();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Handle Priority Change
  const handleUpdatePriority = async (newPriority) => {
    try {
      const res = await authFetch(`/api/complaints/${complaintId}/priority`, {
        method: 'PUT',
        body: JSON.stringify({ priority: newPriority })
      });

      if (!res.ok) throw new Error('Failed to change priority.');
      showToast(`Priority updated to ${newPriority}.`, 'success');
      fetchDetails();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Handle Feedback Submission
  const handleSubmitFeedback = async (feedbackData) => {
    const res = await authFetch(`/api/complaints/${complaintId}/feedback`, {
      method: 'POST',
      body: JSON.stringify(feedbackData)
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to submit feedback.');
    }

    showToast('Feedback submitted! Thank you.', 'success');
    fetchDetails();
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this complaint ticket?')) return;
    try {
      const res = await authFetch(`/api/complaints/${complaintId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete complaint.');
      showToast(data.message || 'Complaint removed successfully.', 'info');
      onNavigateBack();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading || !complaint) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div>Loading complaint details...</div>
      </div>
    );
  }

  const isOwner = user?.id === complaint.student_id;
  const canManage = isAdmin || isStaff;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={onNavigateBack} 
            className="btn btn-secondary btn-sm"
            style={{ width: '38px', height: '38px', padding: 0, borderRadius: '50%' }}
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontFamily: 'monospace',
                fontWeight: '800',
                fontSize: '0.85rem',
                color: 'var(--text-muted)'
              }}>
                #{complaint.ticket_number}
              </span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                backgroundColor: 'rgba(99, 102, 241, 0.12)',
                color: 'var(--primary)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)'
              }}>
                {complaint.category}
              </span>
            </div>

            <h1 style={{ fontSize: '1.6rem', fontWeight: '800', marginTop: '2px' }}>
              {complaint.title}
            </h1>
          </div>
        </div>

        {/* Status & Priority Indicators & Delete Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <PriorityBadge priority={complaint.priority} size="md" />
          <StatusBadge status={complaint.status} size="md" />

          {(isAdmin || (isOwner && complaint.status === 'Submitted')) && (
            <button
              onClick={handleDelete}
              className="btn btn-secondary btn-sm"
              title="Delete Complaint"
              style={{ color: 'var(--accent-rose)' }}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Lifecycle Step Tracker */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <TimelineTracker
          currentStatus={complaint.status}
          createdAt={complaint.created_at}
          resolvedAt={complaint.resolved_at}
          closedAt={complaint.closed_at}
        />
      </div>

      {/* Main Grid: Details Left, Comments/Timeline Right */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left Column: Complaint Details & Management Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Issue Description Box */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--primary)" />
              <span>Issue Description</span>
            </h3>
            <p style={{
              color: 'var(--text-secondary)',
              lineHeight: '1.7',
              fontSize: '0.925rem',
              whiteSpace: 'pre-wrap',
              marginBottom: '20px'
            }}>
              {complaint.description}
            </p>

            {/* Attached Photo */}
            {complaint.image_url && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  ATTACHED EVIDENCE PHOTO:
                </div>
                <div style={{
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: '1px solid var(--border-glass)',
                  maxHeight: '320px'
                }}>
                  <img
                    src={complaint.image_url.startsWith('http') ? complaint.image_url : `${API_BASE}${complaint.image_url}`}
                    alt="Complaint Evidence"
                    style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
                  />
                </div>
              </div>
            )}

            {/* Resolution Notes If Resolved */}
            {complaint.resolution_notes && (
              <div style={{
                marginTop: '20px',
                padding: '16px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-sm)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)', fontWeight: '700', fontSize: '0.85rem', marginBottom: '6px' }}>
                  <CheckCircle2 size={16} />
                  <span>Department Resolution Notes</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                  {complaint.resolution_notes}
                </p>
              </div>
            )}
          </div>

          {/* Location & Personnel Meta Cards */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '16px' }}>
              Incident Location & Personnel
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <MapPin size={18} color="var(--primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{complaint.location}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Building: {complaint.building || 'Campus'} | Room: {complaint.room || 'General Area'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <User size={18} color="var(--secondary)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                    Reported by: {complaint.student_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Roll: {complaint.student_roll || 'N/A'} | Email: {complaint.student_email}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <Building size={18} color="var(--accent-emerald)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                    Department: {complaint.department || 'Unassigned Queue'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Assigned Staff: {complaint.assigned_name ? `${complaint.assigned_name} (${complaint.assigned_email})` : 'Awaiting Assignment'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.775rem', marginTop: '6px' }}>
                <Calendar size={14} />
                <span>Submitted on {new Date(complaint.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Feedback Section (if completed) */}
          {complaint.feedback_rating && (
            <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #fbbf24' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>Student Resolution Rating</span>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      size={16}
                      fill={s <= complaint.feedback_rating ? '#fbbf24' : 'none'}
                      color={s <= complaint.feedback_rating ? '#fbbf24' : 'var(--text-muted)'}
                    />
                  ))}
                </div>
              </div>
              {complaint.feedback_comments && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  "{complaint.feedback_comments}"
                </p>
              )}
            </div>
          )}

          {/* Quick Action Management Bar */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '16px' }}>
              Ticket Actions
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Student Closure / Feedback Button */}
              {isOwner && complaint.status === 'Resolved' && (
                <button
                  className="btn btn-success btn-lg"
                  onClick={() => setIsFeedbackOpen(true)}
                  style={{ width: '100%' }}
                >
                  <Star size={18} />
                  <span>Rate Resolution & Confirm Closure</span>
                </button>
              )}

              {/* Admin Department Assign Button */}
              {isAdmin && (
                <button
                  className="btn btn-primary"
                  onClick={() => setIsAssignOpen(true)}
                  style={{ width: '100%' }}
                >
                  <UserCheck size={18} />
                  <span>Assign Department & Staff</span>
                </button>
              )}

              {/* Admin / Staff Status Progression Controls */}
              {canManage && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    MOVE STATUS:
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {complaint.status !== 'Under Review' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleUpdateStatus('Under Review')}
                      >
                        Under Review
                      </button>
                    )}

                    {complaint.status !== 'In Progress' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleUpdateStatus('In Progress')}
                      >
                        In Progress
                      </button>
                    )}

                    {complaint.status !== 'Resolved' && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => setShowStatusPrompt('Resolved')}
                      >
                        Mark Resolved
                      </button>
                    )}

                    {complaint.status !== 'Closed' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleUpdateStatus('Closed')}
                      >
                        Mark Closed
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Priority Selector for Admin */}
              {canManage && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    CHANGE PRIORITY:
                  </div>
                  <select
                    className="form-select"
                    value={complaint.priority}
                    onChange={(e) => handleUpdatePriority(e.target.value)}
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Critical">Critical Priority</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Discussion & Status Updates Thread */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', minHeight: '560px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Timeline & Discussion ({comments.length})</h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Live updates</span>
          </div>

          {/* Comments List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            paddingRight: '6px',
            marginBottom: '16px',
            maxHeight: '460px'
          }}>
            {comments.map((cm) => {
              const isMine = cm.user_id === user?.id;
              const isStatusEvent = !!cm.status_update;
              const isInternal = !!cm.is_internal;

              if (isStatusEvent) {
                return (
                  <div
                    key={cm.id}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <Clock size={14} color="var(--primary)" />
                    <span style={{ flex: 1 }}>{cm.message}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {new Date(cm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={cm.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: isMine ? 'flex-end' : 'flex-start',
                    maxWidth: '85%'
                  }}
                >
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    marginBottom: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    justifyContent: isMine ? 'flex-end' : 'flex-start'
                  }}>
                    <span style={{ fontWeight: '700', color: isMine ? 'var(--primary)' : 'var(--text-primary)' }}>
                      {cm.user_name}
                    </span>
                    <span>•</span>
                    <span style={{ textTransform: 'capitalize' }}>{cm.user_role}</span>
                    {isInternal && (
                      <span style={{
                        backgroundColor: 'rgba(244, 63, 94, 0.15)',
                        color: 'var(--accent-rose)',
                        fontSize: '0.65rem',
                        fontWeight: '700',
                        padding: '1px 5px',
                        borderRadius: '4px'
                      }}>
                        Internal Note
                      </span>
                    )}
                  </div>

                  <div style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isInternal 
                      ? 'rgba(244, 63, 94, 0.08)' 
                      : (isMine ? 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)' : 'var(--bg-tertiary)'),
                    background: isMine && !isInternal ? 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)' : undefined,
                    color: isMine && !isInternal ? '#ffffff' : 'var(--text-primary)',
                    border: isInternal ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-color)',
                    fontSize: '0.875rem',
                    lineHeight: '1.5'
                  }}>
                    {cm.message}
                  </div>

                  <span style={{
                    fontSize: '0.675rem',
                    color: 'var(--text-muted)',
                    marginTop: '2px',
                    alignSelf: isMine ? 'flex-end' : 'flex-start'
                  }}>
                    {new Date(cm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Comment Input Box */}
          <form onSubmit={handleSendComment} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            {canManage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <input
                  type="checkbox"
                  id="internalNoteCheck"
                  checked={isInternalComment}
                  onChange={(e) => setIsInternalComment(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--accent-rose)', cursor: 'pointer' }}
                />
                <label htmlFor="internalNoteCheck" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Lock size={12} /> Post as Internal Staff/Admin Note (hidden from student)
                </label>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="form-input"
                placeholder={isInternalComment ? 'Add internal staff note...' : 'Type an update or question...'}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={sendingComment}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={sendingComment || !newComment.trim()}
                style={{ padding: '0 18px', flexShrink: 0 }}
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Resolution Note Prompt Modal */}
      {showStatusPrompt === 'Resolved' && (
        <div className="modal-overlay" onClick={() => setShowStatusPrompt(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '12px' }}>
              Mark Complaint as Resolved
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Add a brief summary of what work was completed:
            </p>

            <textarea
              className="form-textarea"
              placeholder="e.g. Replaced faulty AP power module, verified signal speed at 150 Mbps..."
              value={statusUpdateNote}
              onChange={(e) => setStatusUpdateNote(e.target.value)}
              rows={3}
              required
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button className="btn btn-secondary" onClick={() => setShowStatusPrompt(null)}>
                Cancel
              </button>
              <button
                className="btn btn-success"
                onClick={() => handleUpdateStatus('Resolved', statusUpdateNote)}
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        complaint={complaint}
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        onSubmitFeedback={handleSubmitFeedback}
      />

      {/* Assign Modal */}
      <AssignModal
        complaint={complaint}
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        onAssignSuccess={fetchDetails}
      />
    </div>
  );
}
