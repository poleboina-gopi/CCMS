import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { 
  Building2, 
  User, 
  Lock, 
  Mail, 
  Phone, 
  GraduationCap, 
  ShieldCheck, 
  Wrench, 
  Sparkles,
  CheckCircle2,
  Bell,
  BarChart3,
  Flame
} from 'lucide-react';

export default function AuthPage() {
  const { login, register } = useAuth();
  const { showToast } = useNotification();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isRegister && !isPasswordValid) {
      showToast('Password must be at least 8 characters and include uppercase, lowercase, numbers, and special symbols.', 'error');
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        await register({
          name,
          email,
          password,
          role: 'student',
          student_id: studentId,
          department: null,
          phone
        });
        showToast('Registration successful! Welcome to CampusResolve.', 'success');
      } else {
        await login(email, password);
        showToast('Logged in successfully.', 'success');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(20px, 4vw, 40px) 16px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background ambient lighting */}
      <div className="bg-ambient">
        <div className="bg-ambient-orb-1" />
        <div className="bg-ambient-orb-2" />
      </div>

      <div style={{
        maxWidth: '1080px',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
        gap: 'clamp(24px, 4vw, 40px)',
        alignItems: 'center'
      }}>
        {/* Left Side: Brand Overview & Campus Ecosystem Pillars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              color: 'var(--primary)',
              fontSize: '0.8rem',
              fontWeight: '700',
              marginBottom: '16px'
            }}>
              <Sparkles size={14} />
              <span>Campus Complaint Management System</span>
            </div>

            <h1 style={{
              fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
              lineHeight: '1.15',
              fontWeight: '800',
              marginBottom: '14px',
              background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 60%, var(--secondary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Resolve campus issues faster with full transparency.
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
              A centralized digital platform connecting students, college administrators, and department maintenance staff for automated ticket routing and real-time resolution tracking.
            </p>
          </div>

          {/* Platform Capability Badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '14px 16px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                flexShrink: 0
              }}>
                <GraduationCap size={18} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 3px', fontSize: '0.9rem', fontWeight: '700' }}>Student Grievance Portal</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Lodge complaints with photos, AI urgency detection, live 6-stage lifecycle tracking, and 5-star resolution feedback.
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '14px 16px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(244, 63, 94, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-rose)',
                flexShrink: 0
              }}>
                <ShieldCheck size={18} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 3px', fontSize: '0.9rem', fontWeight: '700' }}>Campus Administration Command Center</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Real-time analytics, SLA tracking, staff assignment dispatch, CSV exports, and security audit logs.
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '14px 16px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-emerald)',
                flexShrink: 0
              }}>
                <Wrench size={18} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 3px', fontSize: '0.9rem', fontWeight: '700' }}>Department Squad & Automated Email Alerts</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Targeted work queues for IT, Hostel, Maintenance, and Electrical. Automatic email dispatch to students upon resolution.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Clean Secure Authentication Portal */}
        <div className="glass-panel" style={{ padding: 'clamp(20px, 5vw, 36px)' }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--bg-input)',
            padding: '4px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            marginBottom: '24px'
          }}>
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '0.9rem',
                backgroundColor: !isRegister ? 'var(--primary)' : 'transparent',
                color: !isRegister ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all 0.2s ease'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '0.9rem',
                backgroundColor: isRegister ? 'var(--primary)' : 'transparent',
                color: isRegister ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all 0.2s ease'
              }}
            >
              Register New Account
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '6px' }}>
              {isRegister ? 'Create Campus Account' : 'Welcome Back'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              {isRegister 
                ? 'Join CampusResolve to lodge tickets or manage campus operations.' 
                : 'Sign in with your registered college email and password.'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <div className="form-group">
                  <label className="form-label">
                    <User size={14} /> Full Name
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px'
                }}>
                  <ShieldCheck size={16} />
                  <span>Student Registration Portal. Faculty & Administrative accounts are provisioned by the Dean's Office.</span>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <GraduationCap size={14} /> Student Roll Number / College ID
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. CS2024-042 or 22CS089"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Phone size={14} /> Contact Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">
                <Mail size={14} /> Campus Email Address
              </label>
              <input
                type="email"
                className="form-input"
                placeholder="you@campus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Lock size={14} /> Password
              </label>
              <input
                type="password"
                className="form-input"
                placeholder={isRegister ? "Create a secure password (e.g. Campus@2026)" : "••••••••"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {isRegister && (
                <div style={{
                  marginTop: '10px',
                  padding: '12px',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.78rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Password Security Requirements:
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasMinLength ? '#10b981' : 'var(--text-muted)' }}>
                    <span>{hasMinLength ? '✓' : '○'}</span>
                    <span>At least 8 characters</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasUppercase ? '#10b981' : 'var(--text-muted)' }}>
                    <span>{hasUppercase ? '✓' : '○'}</span>
                    <span>At least one uppercase letter (A-Z)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasLowercase ? '#10b981' : 'var(--text-muted)' }}>
                    <span>{hasLowercase ? '✓' : '○'}</span>
                    <span>At least one lowercase letter (a-z)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasNumber ? '#10b981' : 'var(--text-muted)' }}>
                    <span>{hasNumber ? '✓' : '○'}</span>
                    <span>At least one number (0-9)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasSpecial ? '#10b981' : 'var(--text-muted)' }}>
                    <span>{hasSpecial ? '✓' : '○'}</span>
                    <span>At least one special symbol (!@#$%...)</span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '16px' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : (isRegister ? 'Create Account' : 'Sign In to CampusResolve')}
            </button>
          </form>

          {/* Admin / Staff Login Helper */}
          {!isRegister && (
            <div style={{
              marginTop: '20px',
              padding: '12px 14px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <ShieldCheck size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Administrator & Staff Login:</strong> Enter your designated college email (e.g. <code style={{ color: 'var(--primary)', fontWeight: '700' }}>admin@campus.edu</code>) to access the administrative command center.
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Protected with role-based JWT access & bcrypt salted encryption.
          </div>
        </div>
      </div>
    </div>
  );
}
