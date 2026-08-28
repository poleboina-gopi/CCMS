import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthPage from './pages/AuthPage';
import StudentDashboard from './pages/StudentDashboard';
import SubmitComplaintPage from './pages/SubmitComplaintPage';
import ComplaintDetailsPage from './pages/ComplaintDetailsPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminManagementPage from './pages/AdminManagementPage';
import StaffDashboard from './pages/StaffDashboard';
import QrGeneratorPage from './pages/QrGeneratorPage';
import { Building2, Sparkles } from 'lucide-react';

export default function App() {
  const { user, isAuthenticated, loading, isStudent, isAdmin, isStaff } = useAuth();
  
  // Tab state with QR fast-fill URL parameter detection
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'submit-complaint' || params.get('building') || params.get('room')) {
        return 'submit-complaint';
      }
    }
    return 'dashboard';
  });

  const [selectedComplaintId, setSelectedComplaintId] = useState(null);

  // Navigate to complaint details
  const handleSelectComplaint = (id) => {
    setSelectedComplaintId(id);
    setActiveTab('complaint-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate back to main dashboard
  const handleNavigateBack = () => {
    setSelectedComplaintId(null);
    if (isAdmin) {
      setActiveTab('admin-dashboard');
    } else if (isStaff) {
      setActiveTab('staff-dashboard');
    } else {
      setActiveTab('student-dashboard');
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-muted)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '3px solid var(--border-color)',
            borderTopColor: 'var(--primary)',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: '0.95rem', fontWeight: '600' }}>Initializing CampusResolve...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Resolve current active tab if set to generic 'dashboard'
  let currentView = activeTab;
  if (currentView === 'dashboard') {
    currentView = isAdmin ? 'admin-dashboard' : (isStaff ? 'staff-dashboard' : 'student-dashboard');
  }

  return (
    <div className="app-container">
      {/* Background ambient lighting */}
      <div className="bg-ambient">
        <div className="bg-ambient-orb-1" />
        <div className="bg-ambient-orb-2" />
      </div>

      {/* Navigation Header */}
      <Navbar
        activeTab={currentView}
        setActiveTab={setActiveTab}
        onSelectComplaint={handleSelectComplaint}
      />

      {/* Main Page Content */}
      <main className="main-content">
        {currentView === 'student-dashboard' && (
          <StudentDashboard
            onSelectComplaint={handleSelectComplaint}
            onNavigateSubmit={() => setActiveTab('submit-complaint')}
          />
        )}

        {currentView === 'submit-complaint' && (
          <SubmitComplaintPage
            onNavigateBack={handleNavigateBack}
            onComplaintCreated={handleSelectComplaint}
          />
        )}

        {currentView === 'complaint-details' && selectedComplaintId && (
          <ComplaintDetailsPage
            complaintId={selectedComplaintId}
            onNavigateBack={handleNavigateBack}
          />
        )}

        {currentView === 'admin-dashboard' && (
          <AdminDashboard
            onSelectComplaint={handleSelectComplaint}
            onNavigateManagement={() => setActiveTab('admin-management')}
            onNavigateSubmit={() => setActiveTab('submit-complaint')}
          />
        )}

        {currentView === 'admin-management' && (
          <AdminManagementPage
            onSelectComplaint={handleSelectComplaint}
          />
        )}

        {currentView === 'staff-dashboard' && (
          <StaffDashboard
            onSelectComplaint={handleSelectComplaint}
          />
        )}

        {currentView === 'qr-generator' && (
          <QrGeneratorPage />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '24px 20px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
        backgroundColor: 'var(--bg-secondary)',
        backdropFilter: 'blur(8px)'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={16} color="var(--primary)" />
            <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>CampusResolve CCMS</span>
            <span>• College Complaint Management System</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Built with Node.js 24 SQLite & React Vite</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
