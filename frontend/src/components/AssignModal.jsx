import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCheck, Building, MessageSquare, X } from 'lucide-react';

const departments = [
  'Wi-Fi & IT',
  'Hostel Affairs',
  'Maintenance & Infrastructure',
  'Electrical & Plumbing',
  'Academics',
  'Canteen & Mess',
  'Transport',
  'Library',
  'Administration'
];

export default function AssignModal({ complaint, isOpen, onClose, onAssignSuccess }) {
  const { authFetch } = useAuth();
  const [department, setDepartment] = useState(complaint?.department || '');
  const [assignedTo, setAssignedTo] = useState(complaint?.assigned_to || '');
  const [note, setNote] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDepartment(complaint?.department || '');
      setAssignedTo(complaint?.assigned_to || '');
      fetchStaff();
    }
  }, [isOpen, complaint]);

  const fetchStaff = async () => {
    try {
      const res = await authFetch('/api/auth/staff');
      if (res.ok) {
        const data = await res.json();
        setStaffList(data.staff || []);
      }
    } catch (err) {
      console.error('Failed to fetch staff list:', err);
    }
  };

  if (!isOpen || !complaint) return null;

  const filteredStaff = department 
    ? staffList.filter(s => !s.department || s.department === department || s.role === 'admin')
    : staffList;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await authFetch(`/api/complaints/${complaint.id}/assign`, {
        method: 'PUT',
        body: JSON.stringify({
          department,
          assigned_to: assignedTo ? Number(assignedTo) : null,
          note
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to assign complaint.');
      }

      onAssignSuccess();
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserCheck size={20} color="var(--primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Assign Complaint</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ticket #{complaint.ticket_number}</p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{
          padding: '12px',
          backgroundColor: 'var(--bg-input)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          marginBottom: '20px',
          fontSize: '0.85rem'
        }}>
          <strong style={{ color: 'var(--text-primary)' }}>{complaint.title}</strong>
          <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Category: {complaint.category} | Location: {complaint.location}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Department Select */}
          <div className="form-group">
            <label className="form-label">
              <Building size={15} />
              <span>Target Department</span>
            </label>
            <select
              className="form-select"
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setAssignedTo(''); // Reset staff selection when dept changes
              }}
              required
            >
              <option value="">-- Select Department --</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Assigned Staff Member Select */}
          <div className="form-group">
            <label className="form-label">
              <UserCheck size={15} />
              <span>Assigned Personnel / Staff Officer</span>
            </label>
            <select
              className="form-select"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            >
              <option value="">-- Assign to General Department Queue (Unassigned Person) --</option>
              {filteredStaff.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.department || s.role.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Assignment Note */}
          <div className="form-group">
            <label className="form-label">
              <MessageSquare size={15} />
              <span>Assignment Instructions / Dispatch Note</span>
            </label>
            <textarea
              className="form-textarea"
              placeholder="e.g. Please inspect the 3rd floor switchboard before noon..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
