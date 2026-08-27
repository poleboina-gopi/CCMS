import React, { useRef, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import { Bell, Check, ExternalLink, Clock } from 'lucide-react';

export default function NotificationDropdown({ isOpen, onClose, onSelectComplaint }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="glass-panel"
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '12px',
        width: '360px',
        maxHeight: '460px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-secondary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={16} color="var(--primary)" />
          <span style={{ fontWeight: '700', fontSize: '0.925rem' }}>Notifications</span>
          {unreadCount > 0 && (
            <span style={{
              background: 'var(--accent-rose)',
              color: '#ffffff',
              fontSize: '0.7rem',
              fontWeight: '700',
              padding: '2px 7px',
              borderRadius: '10px'
            }}>
              {unreadCount} new
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '0.775rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Check size={13} /> Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div style={{ overflowY: 'auto', flex: 1, padding: '6px 0' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Bell size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
            <div style={{ fontSize: '0.875rem' }}>No notifications yet</div>
          </div>
        ) : (
          notifications.map(item => (
            <div
              key={item.id}
              onClick={() => {
                markAsRead(item.id);
                if (item.complaint_id && onSelectComplaint) {
                  onSelectComplaint(item.complaint_id);
                }
                onClose();
              }}
              style={{
                padding: '12px 18px',
                borderBottom: '1px solid var(--border-color)',
                cursor: 'pointer',
                backgroundColor: item.is_read ? 'transparent' : 'rgba(99, 102, 241, 0.08)',
                transition: 'background-color 0.15s ease',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = item.is_read ? 'transparent' : 'rgba(99, 102, 241, 0.08)'}
            >
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: item.is_read ? 'transparent' : 'var(--primary)',
                marginTop: '6px',
                flexShrink: 0
              }} />

              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: item.is_read ? '600' : '700',
                  color: 'var(--text-primary)',
                  marginBottom: '3px'
                }}>
                  {item.title}
                </div>
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: 'var(--text-secondary)', 
                  lineHeight: '1.4' 
                }}>
                  {item.message}
                </div>
                <div style={{ 
                  fontSize: '0.7rem', 
                  color: 'var(--text-muted)', 
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Clock size={11} />
                  <span>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {item.complaint_id && (
                <ExternalLink size={14} color="var(--text-muted)" style={{ marginTop: '4px' }} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
