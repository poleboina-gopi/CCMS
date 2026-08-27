import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotification } from '../context/NotificationContext';
import NotificationDropdown from './NotificationDropdown';
import { 
  Building2, 
  PlusCircle, 
  LayoutDashboard, 
  ClipboardList, 
  Wrench, 
  Sun, 
  Moon, 
  Bell, 
  LogOut, 
  User, 
  ShieldCheck,
  GraduationCap
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onSelectComplaint }) {
  const { user, logout, isStudent, isAdmin, isStaff } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      backgroundColor: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-glass)',
      transition: 'all 0.2s ease'
    }}>
      <div style={{
        maxWidth: '1360px',
        margin: '0 auto',
        padding: '0 20px',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px'
      }}>
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab(isAdmin ? 'admin-dashboard' : (isStaff ? 'staff-dashboard' : 'student-dashboard'))}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
            color: '#ffffff'
          }}>
            <Building2 size={24} />
          </div>

          <div>
            <div style={{
              fontSize: '1.2rem',
              fontWeight: '800',
              fontFamily: 'var(--font-heading)',
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              CampusResolve
            </div>
            <div style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.06em'
            }}>
              College Complaint System
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isStudent && (
            <>
              <button
                className={`btn ${activeTab === 'student-dashboard' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setActiveTab('student-dashboard')}
              >
                <LayoutDashboard size={16} />
                <span>My Dashboard</span>
              </button>
              <button
                className={`btn ${activeTab === 'submit-complaint' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setActiveTab('submit-complaint')}
              >
                <PlusCircle size={16} />
                <span>Submit Complaint</span>
              </button>
            </>
          )}

          {isAdmin && (
            <>
              <button
                className={`btn ${activeTab === 'admin-dashboard' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setActiveTab('admin-dashboard')}
              >
                <LayoutDashboard size={16} />
                <span>Analytics & Overview</span>
              </button>
              <button
                className={`btn ${activeTab === 'admin-management' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setActiveTab('admin-management')}
              >
                <ClipboardList size={16} />
                <span>Complaint Manager</span>
              </button>
              <button
                className={`btn ${activeTab === 'submit-complaint' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setActiveTab('submit-complaint')}
              >
                <PlusCircle size={16} />
                <span>Log Complaint</span>
              </button>
            </>
          )}

          {isStaff && (
            <>
              <button
                className={`btn ${activeTab === 'staff-dashboard' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setActiveTab('staff-dashboard')}
              >
                <Wrench size={16} />
                <span>Department Tasks</span>
              </button>
              <button
                className={`btn ${activeTab === 'submit-complaint' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setActiveTab('submit-complaint')}
              >
                <PlusCircle size={16} />
                <span>Report Issue</span>
              </button>
            </>
          )}
        </nav>

        {/* Right Side Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Dark / Light Mode Switch */}
          <button
            onClick={toggleTheme}
            className="btn btn-secondary btn-sm"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            style={{ width: '38px', height: '38px', padding: 0, borderRadius: '50%' }}
          >
            {theme === 'dark' ? <Sun size={17} color="#fbbf24" /> : <Moon size={17} color="#6366f1" />}
          </button>

          {/* Notification Bell */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="btn btn-secondary btn-sm"
              title="Notifications"
              style={{ width: '38px', height: '38px', padding: 0, borderRadius: '50%', position: 'relative' }}
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-rose)',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--bg-primary)'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <NotificationDropdown
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
              onSelectComplaint={onSelectComplaint}
            />
          </div>

          {/* User Profile Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '4px 12px 4px 6px',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: isAdmin ? 'var(--accent-rose)' : (isStaff ? 'var(--accent-amber)' : 'var(--primary)'),
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '0.8rem'
            }}>
              {isAdmin ? <ShieldCheck size={16} /> : (isStaff ? <Wrench size={15} /> : <GraduationCap size={16} />)}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {user?.name}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                {user?.role === 'admin' ? 'Administrator' : (user?.role === 'staff' ? `${user?.department || 'Staff'}` : 'Student')}
              </span>
            </div>
          </div>

          {/* Prominent Log Out Button for All Users */}
          <button
            onClick={logout}
            className="btn btn-sm"
            title="Log out of your account"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--accent-rose)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontWeight: '700',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.color = 'var(--accent-rose)';
            }}
          >
            <LogOut size={15} />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
