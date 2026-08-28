import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, API_BASE, getMediaUrl } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import SlaCountdownBadge from '../components/SlaCountdownBadge';
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
  Trash2,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  ExternalLink,
  Image as ImageIcon,
  X,
  RefreshCw,
  ThumbsUp,
  GitMerge
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

  // Upvote state
  const [upvotesCount, setUpvotesCount] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [upvoting, setUpvoting] = useState(false);

  // Modals
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [statusUpdateNote, setStatusUpdateNote] = useState('');
  const [showStatusPrompt, setShowStatusPrompt] = useState(null);

  // Lightbox & Image States
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxRotation, setLightboxRotation] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [resImageError, setResImageError] = useState(false);

  const openLightbox = (src, title) => {
    setActiveLightboxImage({ src, title });
    setLightboxZoom(1);
    setLightboxRotation(0);
  };

  const closeLightbox = () => {
    setActiveLightboxImage(null);
    setLightboxZoom(1);
    setLightboxRotation(0);
  };

  // Keyboard shortcut: ESC to close lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeLightboxImage) {
        closeLightbox();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxImage]);

  const fetchDetails = useCallback(async (silent = false) => {
    try {
      const res = await authFetch(`/api/complaints/${complaintId}`);
      if (!res.ok) {
        throw new Error('Complaint not found or access denied.');
      }
      const data = await res.json();
      setComplaint(data.complaint);
      setComments(data.comments || []);
      setUpvotesCount(data.complaint.upvotes_count || 0);
      setHasUpvoted(data.complaint.has_upvoted || false);
    } catch (err) {
      if (!silent) {
        showToast(err.message, 'error');
        onNavigateBack();
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [complaintId, authFetch, showToast, onNavigateBack]);

  // Initial fetch and Real-Time Live Sync Polling (Enterprise Feature 4)
  useEffect(() => {
    fetchDetails(false);
    const syncInterval = setInterval(() => {
      fetchDetails(true);
    }, 6000); // Live sync every 6 seconds

    return () => clearInterval(syncInterval);
  }, [fetchDetails]);

  // Handle Upvote
  const handleUpvote = async () => {
    if (upvoting) return;
    setUpvoting(true);

    const prevCount = upvotesCount;
    const prevStatus = hasUpvoted;
    setUpvotesCount(prevStatus ? prevCount - 1 : prevCount + 1);
    setHasUpvoted(!prevStatus);

    try {
      const res = await authFetch(`/api/complaints/${complaintId}/upvote`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setUpvotesCount(data.upvotes_count);
        setHasUpvoted(data.has_upvoted);
        showToast(data.message, 'success');
      } else {
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
      <div className="responsive-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
          <button 
            onClick={onNavigateBack} 
            className="btn btn-secondary btn-sm"
            style={{ width: '38px', height: '38px', padding: 0, borderRadius: '50%' }}
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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

              {/* SLA Target Badge */}
              <SlaCountdownBadge
                deadline={complaint.sla_deadline}
                status={complaint.status}
                isEscalated={complaint.is_escalated}
                slaHours={complaint.sla_hours}
                size="md"
              />

              {complaint.duplicate_count > 0 && (
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(99, 102, 241, 0.15)',
                  color: 'var(--primary)'
                }}>
                  <GitMerge size={13} />
                  <span>+{complaint.duplicate_count} duplicate tickets linked</span>
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '1.6rem', fontWeight: '800', marginTop: '4px' }}>
              {complaint.title}
            </h1>
          </div>
        </div>

        {/* Status, Upvote & Priority Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Community Upvote Button */}
          <button
            type="button"
            className="btn btn-sm"
            onClick={handleUpvote}
            style={{
              padding: '6px 14px',
              fontSize: '0.825rem',
              fontWeight: '700',
              borderRadius: 'var(--radius-full)',
              backgroundColor: hasUpvoted ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-card)',
              color: hasUpvoted ? 'var(--primary)' : 'var(--text-primary)',
              border: hasUpvoted ? '1px solid var(--primary)' : '1px solid var(--border-color)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
            title="Click to support/upvote this issue (+1)"
          >
            <ThumbsUp size={14} fill={hasUpvoted ? 'currentColor' : 'none'} />
            <span>Me Too ({upvotesCount})</span>
          </button>

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
      <div className="responsive-details-grid">
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
              <div style={{ marginTop: '20px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    fontWeight: '700', 
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <ImageIcon size={14} color="var(--primary)" />
                    <span>ATTACHED EVIDENCE PHOTO:</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => openLightbox(getMediaUrl(complaint.image_url), `Evidence Photo - #${complaint.ticket_number}`)}
                    className="btn btn-secondary btn-sm"
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Maximize2 size={13} />
                    <span>View Fullscreen</span>
                  </button>
                </div>

                {!imageError ? (
                  <div 
                    style={{
                      position: 'relative',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      border: '1px solid var(--border-glass)',
                      backgroundColor: 'var(--bg-tertiary)',
                      cursor: 'zoom-in',
                      maxHeight: '360px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onClick={() => openLightbox(getMediaUrl(complaint.image_url), `Evidence Photo - #${complaint.ticket_number}`)}
                  >
                    <img
                      src={getMediaUrl(complaint.image_url)}
                      alt="Complaint Evidence"
                      onError={() => setImageError(true)}
                      style={{ 
                        width: '100%', 
                        maxHeight: '360px', 
                        objectFit: 'contain', 
                        display: 'block',
                        backgroundColor: '#0a0d14'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      background: 'rgba(0, 0, 0, 0.75)',
                      color: '#ffffff',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backdropFilter: 'blur(4px)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <Maximize2 size={12} />
                      <span>Click to zoom & download</span>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: '20px',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    border: '1px dashed rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center'
                  }}>
                    <AlertTriangle size={24} color="#ef4444" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                      Evidence image cannot be previewed directly
                    </div>
                    <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => setImageError(false)}
                      >
                        <RefreshCw size={12} /> Retry Loading
                      </button>
                      <a 
                        href={getMediaUrl(complaint.image_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        <ExternalLink size={12} /> Open Image Link
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Resolution Notes & Proof If Resolved */}
            {(complaint.resolution_notes || complaint.resolution_image) && (
              <div style={{
                marginTop: '20px',
                padding: '18px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)', fontWeight: '700', fontSize: '0.9rem', marginBottom: '8px' }}>
                  <CheckCircle2 size={18} />
                  <span>Department Resolution Notes & Verification</span>
                </div>
                {complaint.resolution_notes && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: '1.6', marginBottom: complaint.resolution_image ? '14px' : '0' }}>
                    {complaint.resolution_notes}
                  </p>
                )}

                {/* Resolution Photo Attachment */}
                {complaint.resolution_image && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.775rem', fontWeight: '700', color: 'var(--accent-emerald)' }}>
                        📸 RESOLUTION PROOF PHOTO:
                      </span>
                      <button
                        type="button"
                        onClick={() => openLightbox(getMediaUrl(complaint.resolution_image), `Resolution Proof - #${complaint.ticket_number}`)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 8px', fontSize: '0.725rem' }}
                      >
                        <Maximize2 size={12} style={{ marginRight: '4px' }} />
                        Fullscreen
                      </button>
                    </div>

                    {!resImageError ? (
                      <div 
                        style={{
                          borderRadius: 'var(--radius-sm)',
                          overflow: 'hidden',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          cursor: 'zoom-in',
                          maxHeight: '220px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#0a0d14'
                        }}
                        onClick={() => openLightbox(getMediaUrl(complaint.resolution_image), `Resolution Proof - #${complaint.ticket_number}`)}
                      >
                        <img
                          src={getMediaUrl(complaint.resolution_image)}
                          alt="Resolution Proof"
                          onError={() => setResImageError(true)}
                          style={{ width: '100%', maxHeight: '220px', objectFit: 'contain', display: 'block' }}
                        />
                      </div>
                    ) : (
                      <a 
                        href={getMediaUrl(complaint.resolution_image)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        <ExternalLink size={12} /> View Resolution Photo
                      </a>
                    )}
                  </div>
                )}
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

      {/* Interactive Fullscreen Image Lightbox Modal */}
      {activeLightboxImage && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(12px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={closeLightbox}
        >
          {/* Lightbox Toolbar */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px',
              backgroundColor: 'rgba(20, 20, 25, 0.8)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#ffffff'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ImageIcon size={20} color="var(--primary)" />
              <span style={{ fontSize: '0.95rem', fontWeight: '700' }}>
                {activeLightboxImage.title}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Zoom Out */}
              <button
                type="button"
                onClick={() => setLightboxZoom(prev => Math.max(0.5, prev - 0.25))}
                className="btn btn-secondary btn-sm"
                title="Zoom Out"
                style={{ width: '36px', height: '36px', padding: 0 }}
              >
                <ZoomOut size={16} />
              </button>

              <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', minWidth: '45px', textAlign: 'center' }}>
                {Math.round(lightboxZoom * 100)}%
              </span>

              {/* Zoom In */}
              <button
                type="button"
                onClick={() => setLightboxZoom(prev => Math.min(3, prev + 0.25))}
                className="btn btn-secondary btn-sm"
                title="Zoom In"
                style={{ width: '36px', height: '36px', padding: 0 }}
              >
                <ZoomIn size={16} />
              </button>

              {/* Rotate */}
              <button
                type="button"
                onClick={() => setLightboxRotation(prev => (prev + 90) % 360)}
                className="btn btn-secondary btn-sm"
                title="Rotate Clockwise"
                style={{ width: '36px', height: '36px', padding: 0 }}
              >
                <RotateCw size={16} />
              </button>

              {/* Open in new tab */}
              <a
                href={activeLightboxImage.src}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                title="Open Original in New Tab"
                style={{ width: '36px', height: '36px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ExternalLink size={16} />
              </a>

              {/* Download */}
              <a
                href={activeLightboxImage.src}
                download
                className="btn btn-secondary btn-sm"
                title="Download Image"
                style={{ width: '36px', height: '36px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Download size={16} />
              </a>

              {/* Close */}
              <button
                type="button"
                onClick={closeLightbox}
                className="btn btn-danger btn-sm"
                title="Close (Esc)"
                style={{ width: '36px', height: '36px', padding: 0, marginLeft: '6px' }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Lightbox Image Stage */}
          <div 
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'auto',
              padding: '24px'
            }}
          >
            <img
              src={activeLightboxImage.src}
              alt={activeLightboxImage.title}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '90vw',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                transform: `scale(${lightboxZoom}) rotate(${lightboxRotation}deg)`,
                transition: 'transform 0.2s ease',
                userSelect: 'none'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
