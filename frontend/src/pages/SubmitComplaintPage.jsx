import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { 
  FilePlus, 
  Building, 
  MapPin, 
  UploadCloud, 
  X, 
  AlertTriangle, 
  Sparkles, 
  ArrowLeft,
  CheckCircle,
  Image as ImageIcon,
  QrCode,
  ThumbsUp,
  ExternalLink
} from 'lucide-react';

const buildings = [
  'Hostel Block A',
  'Hostel Block B',
  'Hostel Block C',
  'Main Academic Block',
  'CS & IT Block C',
  'Electronics Block D',
  'Hostel Block 4 (Girls)',
  'Central Campus Library',
  'Dining Hall 1 (North)',
  'Dining Hall 2 (South)',
  'Sports Complex & Gym',
  'Transport Hub & Bus Bay',
  'Administration Center'
];

const categories = [
  { id: 'Wi-Fi & IT', label: 'Wi-Fi & Network / IT Systems' },
  { id: 'Hostel Affairs', label: 'Hostel Rooms & Amenities' },
  { id: 'Maintenance & Infrastructure', label: 'Classroom & Campus Infrastructure' },
  { id: 'Electrical & Plumbing', label: 'Electrical, Power & Plumbing' },
  { id: 'Academics', label: 'Academics & Lecture Theatres' },
  { id: 'Canteen & Mess', label: 'Canteen, Mess & Food Quality' },
  { id: 'Transport', label: 'Campus Bus & Transportation' },
  { id: 'Library', label: 'Library & Study Zones' },
  { id: 'Sports & Gymnasium', label: 'Sports Grounds & Gym' },
  { id: 'Security & Discipline', label: 'Campus Security & Safety' },
  { id: 'Other', label: 'Other Grievance / Inquiries' }
];

export default function SubmitComplaintPage({ onNavigateBack, onComplaintCreated }) {
  const { authFetch } = useAuth();
  const { showToast } = useNotification();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Wi-Fi & IT');
  const [building, setBuilding] = useState(buildings[0]);
  const [room, setRoom] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [aiPriorityReason, setAiPriorityReason] = useState('');
  const [qrAutofilled, setQrAutofilled] = useState(false);
  const [potentialDuplicates, setPotentialDuplicates] = useState([]);

  // 1. QR Code Fast-Fill detection on mount (Enterprise Feature 3)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlBuilding = params.get('building');
      const urlRoom = params.get('room');
      const urlCategory = params.get('category');

      if (urlBuilding || urlRoom || urlCategory) {
        if (urlBuilding) setBuilding(urlBuilding);
        if (urlRoom) setRoom(urlRoom);
        if (urlCategory) setCategory(urlCategory);
        setQrAutofilled(true);
        showToast('📍 QR Code Fast-Fill Activated: Facility details pre-filled!', 'info');
      }
    }
  }, [showToast]);

  // 2. AI Duplicate Ticket Detection (Enterprise Feature 5)
  useEffect(() => {
    if (!room || room.length < 2) {
      setPotentialDuplicates([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const queryParams = new URLSearchParams({
          building,
          room: room.trim(),
          category
        });
        const res = await authFetch(`/api/complaints/check/duplicate?${queryParams}`);
        if (res.ok) {
          const data = await res.json();
          setPotentialDuplicates(data.duplicates || []);
        }
      } catch (err) {
        console.error('Duplicate check error:', err);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [building, room, category, authFetch]);

  // Smart priority detection based on complaint text
  const handleDescriptionChange = (text) => {
    setDescription(text);
    const lower = (text + ' ' + title).toLowerCase();

    if (lower.includes('spark') || lower.includes('fire') || lower.includes('smoke') || lower.includes('shock') || lower.includes('flooding')) {
      setPriority('Critical');
      setAiPriorityReason('⚡ Critical hazard keywords detected (electrical / safety risk). Priority set to Critical.');
    } else if (lower.includes('exam') || lower.includes('urgent') || lower.includes('leak') || lower.includes('down') || lower.includes('no water')) {
      if (priority !== 'Critical') {
        setPriority('High');
        setAiPriorityReason('⚠️ High urgency keywords detected. Priority elevated to High.');
      }
    } else {
      setAiPriorityReason('');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast('File size must be under 10MB.', 'error');
        return;
      }
      if (!file.type.startsWith('image/') && !/\.(jpg|jpeg|png|webp|gif|svg|bmp|avif)$/i.test(file.name)) {
        showToast('Please upload an image file (PNG, JPG, WEBP, GIF, SVG, BMP).', 'error');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !room.trim()) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const location = `${building}, ${room.trim()}`;
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('category', category);
      formData.append('building', building);
      formData.append('room', room.trim());
      formData.append('location', location);
      formData.append('description', description.trim());
      formData.append('priority', priority);

      if (selectedFile) {
        formData.append('image', selectedFile);
        if (filePreview && filePreview.startsWith('data:image/')) {
          formData.append('image_data', filePreview);
        }
      }

      const res = await authFetch('/api/complaints', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit complaint.');
      }

      const data = await res.json();
      showToast(`Complaint registered successfully! Ticket #${data.complaint.ticket_number}`, 'success');
      
      if (onComplaintCreated) {
        onComplaintCreated(data.complaint.id);
      } else {
        onNavigateBack();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* QR Autofill Banner */}
      {qrAutofilled && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          backgroundColor: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          color: 'var(--primary)'
        }}>
          <QrCode size={18} />
          <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
            QR Code Scanned: <strong>{building}</strong> ({room || 'Select Room'}) pre-selected!
          </span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
        <button 
          onClick={onNavigateBack} 
          className="btn btn-secondary btn-sm"
          style={{ width: '38px', height: '38px', padding: 0, borderRadius: '50%' }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Submit New Complaint</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Provide clear details and attach photos to help campus technicians resolve the issue swiftly.
          </p>
        </div>
      </div>

      {/* AI Duplicate Ticket Helper Alert */}
      {potentialDuplicates.length > 0 && (
        <div style={{
          padding: '16px 20px',
          backgroundColor: 'rgba(251, 191, 36, 0.12)',
          border: '1px solid rgba(251, 191, 36, 0.35)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-amber)', fontWeight: '700', fontSize: '0.925rem' }}>
            <Sparkles size={16} />
            <span>AI Duplicate Alert: Existing open ticket(s) found in {building} - {room}:</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {potentialDuplicates.map(dup => (
              <div
                key={dup.ticket_number}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'var(--bg-card)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem'
                }}
              >
                <div>
                  <span style={{ fontWeight: '700', color: 'var(--primary)', marginRight: '8px' }}>
                    #{dup.ticket_number}
                  </span>
                  <span>{dup.title}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Status: {dup.status} ({dup.upvotes_count || 1} upvotes)
                </span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Tip: You can upvote an existing ticket from your dashboard so technicians prioritize it, or proceed below to submit a new ticket.
          </p>
        </div>
      )}

      <div className="glass-panel" style={{ padding: 'clamp(18px, 4vw, 32px)' }}>
        <form onSubmit={handleSubmit}>
          {/* Complaint Title */}
          <div className="form-group">
            <label className="form-label">
              <span>Complaint Title *</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Wi-Fi router reboot loop in Hostel Block B"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                handleDescriptionChange(description);
              }}
              required
            />
          </div>

          {/* Category & Building Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">
                <span>Category *</span>
              </label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Building size={15} />
                <span>Building / Facility *</span>
              </label>
              <select
                className="form-select"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                required
              >
                {buildings.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Room & Priority Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">
                <MapPin size={15} />
                <span>Room / Floor / Area *</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Room 304, 3rd Floor or Server Rack A"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Priority Level *</span>
              </label>
              <select
                className="form-select"
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  setAiPriorityReason('');
                }}
              >
                <option value="Low">Low (Minor cosmetic issue)</option>
                <option value="Medium">Medium (Standard request)</option>
                <option value="High">High (Impacting classes/daily living)</option>
                <option value="Critical">Critical (Immediate safety or outage hazard)</option>
              </select>
            </div>
          </div>

          {/* AI Urgency Suggestion Banner */}
          {aiPriorityReason && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '20px',
              fontSize: '0.85rem',
              color: 'var(--accent-rose)'
            }}>
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <span>{aiPriorityReason}</span>
            </div>
          )}

          {/* Detailed Description */}
          <div className="form-group">
            <label className="form-label">
              <span>Detailed Issue Description *</span>
            </label>
            <textarea
              className="form-textarea"
              placeholder="Describe the issue in detail (when did it start, equipment model, symptoms, steps to reproduce)..."
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              rows={4}
              required
            />
          </div>

          {/* Photo / Evidence Upload */}
          <div className="form-group">
            <label className="form-label">
              <ImageIcon size={15} />
              <span>Attach Photo / Proof (Optional)</span>
            </label>

            {!filePreview ? (
              <label 
                style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-input)',
                  transition: 'border-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <UploadCloud size={32} color="var(--primary)" style={{ marginBottom: '8px' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Click to upload or drag & drop photo
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  PNG, JPG, WEBP, GIF, SVG, BMP up to 10MB
                </span>
                <input
                  type="file"
                  accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.svg,.bmp,.avif"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
            ) : (
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '12px',
                border: '1px solid var(--border-glass)',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden'
              }}>
                <img
                  src={filePreview}
                  alt="Complaint Preview"
                  style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedFile?.name || 'Evidence Photo'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {selectedFile?.size ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : ''} • Ready for upload
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  title="Remove image"
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', marginTop: '28px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onNavigateBack}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={submitting}
            >
              {submitting ? 'Registering Ticket...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
