import React, { useState } from 'react';
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
  Image as ImageIcon
} from 'lucide-react';

const buildings = [
  'Main Academic Block',
  'CS & IT Block C',
  'Electronics Block D',
  'Hostel Block A (Boys)',
  'Hostel Block B (Boys)',
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
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Provide details below so the campus maintenance squad can take immediate action.
          </p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '32px' }}>
        <form onSubmit={handleSubmit}>
          {/* Complaint Title */}
          <div className="form-group">
            <label className="form-label">
              <FilePlus size={16} color="var(--primary)" />
              <span>Complaint Title *</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Wi-Fi Router blinking amber and dropping packets"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Category & Priority Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
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
                <AlertTriangle size={15} color="var(--accent-amber)" />
                <span>Urgency Priority</span>
              </label>
              <select
                className="form-select"
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  setAiPriorityReason('');
                }}
              >
                <option value="Low">🟢 Low (Routine / Minor)</option>
                <option value="Medium">🟡 Medium (Normal Priority)</option>
                <option value="High">🟠 High (Impacting Classes/Study)</option>
                <option value="Critical">🔴 Critical (Emergency / Safety Risk)</option>
              </select>
            </div>
          </div>

          {/* AI Urgency Suggestion Banner */}
          {aiPriorityReason && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent-amber)',
              fontSize: '0.825rem',
              fontWeight: '600',
              marginBottom: '18px'
            }}>
              <Sparkles size={16} />
              <span>{aiPriorityReason}</span>
            </div>
          )}

          {/* Location Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
            <div className="form-group">
              <label className="form-label">
                <Building size={15} />
                <span>Campus Building / Area *</span>
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

            <div className="form-group">
              <label className="form-label">
                <MapPin size={15} />
                <span>Floor / Room / Landmark *</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 3rd Floor, Room 304 (Near Elevator)"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                required
              />
            </div>
          </div>

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
                  PNG, JPG, WEBP, or PDF up to 10MB
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
            ) : (
              <div style={{
                position: 'relative',
                display: 'inline-block',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                maxHeight: '220px'
              }}>
                <img
                  src={filePreview}
                  alt="Complaint Preview"
                  style={{ maxWidth: '100%', height: 'auto', display: 'block', maxHeight: '200px', objectFit: 'cover' }}
                />
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
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
