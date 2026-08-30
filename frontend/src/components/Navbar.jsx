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
  GraduationCap,
  Menu,
  X,
  QrCode
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onSelectComplaint }) {
  const { user, logout, isStudent, isAdmin, isStaff } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

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
        padding: '0 16px',
        height: '66px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        {/* Brand Logo */}
        <div 
          onClick={() => handleTabChange(isAdmin ? 'admin-dashboard' : (isStaff ? 'staff-dashboard' : 'student-dashboard'))}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            userSelect: 'none',
            flexShrink: 0
          }}
        >
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
            color: '#ffffff',
            flexShrink: 0
          }}>
            <Building2 size={20} />
          </div>

          <div>
            <div style={{
              fontSize: '1.1rem',
              fontWeight: '800',
              fontFamily: 'var(--font-heading)',
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.2
            }}>
              CampusResolve
            </div>
            <div style={{
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              College System
            </div>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="desktop-only" style={{ alignItems: 'center', gap: '8px' }}>
          {isStudent && (
            <>
              <button
                className={`btn ${activeTab === 'student-dashboard' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => handleTabChange('student-dashboard')}
              >
                <LayoutDashboard size={16} />
                <span>My Dashboard</span>
              </button>
              <button
                className={`btn ${activeTab === 'submit-complaint' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => handleTabChange('submit-complaint')}
              >
                <PlusCircle size={16} />
                <span>Submit Complaint</span>
              </button>
              <button
                className={`btn ${activeTab === 'qr-generator' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => handleTabChange('qr-generator')}
              >
                <QrCode size={16} />
                <span>Room QR</span>
              </button>
            </>
          )}

          {isAdmin && (
            <>
              <button
                className={`btn ${activeTab === 'admin-dashboard' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => handleTabChange('admin-dashboard')}
              >
                <LayoutDashboard size={16} />
                <span>Analytics & Overview</span>
              </button>
              <button
                className={`btn ${activeTab === 'admin-management' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => handleTabChange('admin-management')}
              >
                <ClipboardList size={16} />
                <span>Complaint Manager</span>
              </button>
              <button
                className={`btn ${activeTab === 'qr-generator' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => handleTabChange('qr-generator')}
              >
                <QrCode size={16} />
                <span>Asset QR Stickers</span>
              </button>
              <button
                className={`btn ${activeTab === 'submit-complaint' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => handleTabChange('submit-complaint')}
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
                onClick={() => handleTabChange('staff-dashboard')}
              >
                <Wrench size={16} />
                <span>Department Tasks</span>
              </button>
              <button
                className={`btn ${activeTab === 'qr-generator' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => handleTabChange('qr-generator')}
              >
                <QrCode size={16} />
                <span>Room QR</span>
              </button>
              <button
                className={`btn ${activeTab === 'submit-complaint' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => handleTabChange('submit-complaint')}
              >
                <PlusCircle size={16} />
                <span>Report Issue</span>
              </button>
            </>
          )}
        </nav>

        {/* Right Side Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Dark / Light Mode Switch */}
          <button
            onClick={toggleTheme}
            className="btn btn-secondary btn-sm"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            style={{ width: '36px', height: '36px', padding: 0, borderRadius: '50%' }}
          >
            {theme === 'dark' ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} color="#6366f1" />}
          </button>

          {/* Notification Bell */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="btn btn-secondary btn-sm"
              title="Notifications"
              style={{ width: '36px', height: '36px', padding: 0, borderRadius: '50%', position: 'relative' }}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '17px',
                  height: '17px',
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
              onSelectComplaint={(id) => {
                setShowNotifications(false);
                onSelectComplaint(id);
              }}
            />
          </div>

          {/* Desktop User Profile Pill */}
          <div className="desktop-only" style={{
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px 4px 6px',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: isAdmin ? 'var(--accent-rose)' : (isStaff ? 'var(--accent-amber)' : 'var(--primary)'),
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '0.75rem'
            }}>
              {isAdmin ? <ShieldCheck size={15} /> : (isStaff ? <Wrench size={14} /> : <GraduationCap size={15} />)}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </span>
              <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                {user?.role === 'admin' ? 'Admin' : (user?.role === 'staff' ? `${user?.department || 'Staff'}` : 'Student')}
              </span>
            </div>
          </div>

          {/* Desktop Log Out Button */}
          <button
            onClick={logout}
            className="btn btn-sm desktop-only"
            title="Log out of your account"
            style={{
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--accent-rose)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontWeight: '700',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <LogOut size={14} />
            <span>Log Out</span>
          </button>

          {/* Mobile Menu Hamburger Button */}
          <button
            className="btn btn-secondary btn-sm mobile-only"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            style={{
              width: '36px',
              height: '36px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          {/* User Info Card in Mobile Menu */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 14px',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            marginBottom: '4px'
          }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: isAdmin ? 'var(--accent-rose)' : (isStaff ? 'var(--accent-amber)' : 'var(--primary)'),
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '0.9rem',
              flexShrink: 0
            }}>
              {isAdmin ? <ShieldCheck size={18} /> : (isStaff ? <Wrench size={17} /> : <GraduationCap size={18} />)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {user?.role === 'admin' ? 'Campus Administrator' : (user?.role === 'staff' ? `${user?.department || 'Staff'}` : `Student ID: ${user?.student_id || 'Campus'}`)}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          {isStudent && (
            <>
              <button
                className={`btn ${activeTab === 'student-dashboard' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleTabChange('student-dashboard')}
              >
                <LayoutDashboard size={18} />
                <span>My Dashboard</span>
              </button>
              <button
                className={`btn ${activeTab === 'submit-complaint' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleTabChange('submit-complaint')}
              >
                <PlusCircle size={18} />
                <span>Submit Complaint</span>
              </button>
              <button
                className={`btn ${activeTab === 'qr-generator' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleTabChange('qr-generator')}
              >
                <QrCode size={18} />
                <span>Room QR Generator</span>
              </button>
            </>
          )}

          {isAdmin && (
            <>
              <button
                className={`btn ${activeTab === 'admin-dashboard' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleTabChange('admin-dashboard')}
              >
                <LayoutDashboard size={18} />
                <span>Analytics & Overview</span>
              </button>
              <button
                className={`btn ${activeTab === 'admin-management' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleTabChange('admin-management')}
              >
                <ClipboardList size={18} />
                <span>Complaint Manager</span>
              </button>
              <button
                className={`btn ${activeTab === 'qr-generator' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleTabChange('qr-generator')}
              >
                <QrCode size={18} />
                <span>Asset QR Stickers</span>
              </button>
              <button
                className={`btn ${activeTab === 'submit-complaint' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleTabChange('submit-complaint')}
              >
                <PlusCircle size={18} />
                <span>Log Complaint</span>
              </button>
            </>
          )}

          {isStaff && (
            <>
              <button
                className={`btn ${activeTab === 'staff-dashboard' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleTabChange('staff-dashboard')}
              >
                <Wrench size={18} />
                <span>Department Tasks</span>
              </button>
              <button
                className={`btn ${activeTab === 'qr-generator' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleTabChange('qr-generator')}
              >
                <QrCode size={18} />
                <span>Room QR Generator</span>
              </button>
              <button
                className={`btn ${activeTab === 'submit-complaint' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleTabChange('submit-complaint')}
              >
                <PlusCircle size={18} />
                <span>Report Issue</span>
              </button>
            </>
          )}

          {/* Mobile Log Out Button */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              logout();
            }}
            className="btn btn-danger"
            style={{
              marginTop: '4px',
              padding: '12px 16px',
              fontWeight: '700'
            }}
          >
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>
      )}
    </header>
  );
}
