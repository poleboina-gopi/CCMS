import React, { useState } from 'react';
import { QrCode, Download, Printer, Copy, Check, Sparkles, Building, MapPin, Layers } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export default function QrGeneratorPage() {
  const { showToast } = useNotification();
  const [building, setBuilding] = useState('Hostel Block A');
  const [room, setRoom] = useState('Room 204');
  const [category, setCategory] = useState('Hostel Affairs');
  const [copied, setCopied] = useState(false);

  const buildings = [
    'Hostel Block A',
    'Hostel Block B',
    'Hostel Block C',
    'Main Academic Wing',
    'Science & Engineering Lab',
    'Central Library',
    'Campus Cafeteria & Mess',
    'Sports Complex & Gym',
    'Administrative Building'
  ];

  const categories = [
    'Hostel Affairs',
    'Wi-Fi & IT',
    'Maintenance & Infrastructure',
    'Electrical & Plumbing',
    'Canteen & Mess',
    'Library',
    'Academics',
    'Sports & Gymnasium',
    'Security & Discipline'
  ];

  // Base URL of the deployed web application
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://campusresolve.edu';
  const qrUrl = `${origin}/?tab=submit-complaint&building=${encodeURIComponent(building)}&room=${encodeURIComponent(room)}&category=${encodeURIComponent(category)}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(qrUrl)}&bgcolor=ffffff&color=111827&margin=10`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    showToast('Direct QR Complaint URL copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div className="glass-panel responsive-banner">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <QrCode size={24} color="var(--primary)" />
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>
              Campus Room & Asset QR Code Generator
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
            Generate instant QR stickers for classrooms, labs, and hostel rooms. When students scan with their mobile camera, location details auto-fill instantly!
          </p>
        </div>

        <button className="btn btn-primary" onClick={handlePrint}>
          <Printer size={16} />
          <span>Print Sticker Sheet</span>
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left Form: Location & Preset Selector */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={18} color="var(--primary)" />
            <span>Select Campus Facility</span>
          </h3>

          <div className="form-group">
            <label className="form-label">Campus Building / Complex</label>
            <select
              className="form-select"
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
            >
              {buildings.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              <MapPin size={14} /> Room / Lab / Floor Number
            </label>
            <input
              type="text"
              className="form-input"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="e.g., Room 304, Lab B-12"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Default Department Category</label>
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Quick Presets */}
          <div style={{ marginTop: '20px' }}>
            <label className="form-label" style={{ marginBottom: '8px' }}>
              <Sparkles size={14} color="var(--accent-amber)" /> Quick Campus Presets
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {[
                { b: 'Hostel Block A', r: 'Room 101', c: 'Hostel Affairs' },
                { b: 'Hostel Block B', r: 'Room 204', c: 'Hostel Affairs' },
                { b: 'Central Library', r: '2nd Floor Reading Hall', c: 'Library' },
                { b: 'Science & Engineering Lab', r: 'Computer Lab 3', c: 'Wi-Fi & IT' },
                { b: 'Campus Cafeteria & Mess', r: 'Dining Hall A', c: 'Canteen & Mess' }
              ].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setBuilding(p.b);
                    setRoom(p.r);
                    setCategory(p.c);
                  }}
                  style={{ fontSize: '0.78rem' }}
                >
                  {p.b} ({p.r})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Preview: Printable Sticker Card */}
        <div className="glass-panel" style={{ padding: '28px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>
            Live Printable Asset Sticker
          </h3>

          <div style={{
            backgroundColor: '#ffffff',
            color: '#0f172a',
            padding: '24px',
            borderRadius: 'var(--radius-md)',
            border: '2px dashed #cbd5e1',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '320px',
            width: '100%',
            margin: '0 auto'
          }}>
            {/* Header Badge */}
            <div style={{
              fontSize: '0.75rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#4f46e5',
              backgroundColor: '#eef2ff',
              padding: '4px 10px',
              borderRadius: '9999px'
            }}>
              CampusResolve QR Portal
            </div>

            {/* QR Code Image */}
            <img
              src={qrImageUrl}
              alt="Campus Room QR"
              style={{
                width: '190px',
                height: '190px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}
            />

            {/* Facility Details on Sticker */}
            <div style={{ textAlign: 'center', lineHeight: '1.3' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>
                {building}
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>
                {room} • {category}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '6px' }}>
                Scan with phone camera to lodge repair ticket
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleCopyLink}>
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy Direct Link'}</span>
            </button>
            <a
              href={qrImageUrl}
              download={`${building.replace(/\s+/g, '_')}_${room.replace(/\s+/g, '_')}_QR.png`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary btn-sm"
            >
              <Download size={14} />
              <span>Download Image</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
