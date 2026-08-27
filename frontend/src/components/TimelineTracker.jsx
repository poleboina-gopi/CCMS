import React from 'react';
import { 
  FileCheck, 
  Search, 
  UserCheck, 
  Wrench, 
  CheckCircle2, 
  Lock 
} from 'lucide-react';

const stages = [
  { id: 'Submitted', label: 'Submitted', icon: FileCheck, desc: 'Logged into system' },
  { id: 'Under Review', label: 'Under Review', icon: Search, desc: 'Admin evaluation' },
  { id: 'Assigned', label: 'Assigned', icon: UserCheck, desc: 'Routed to dept' },
  { id: 'In Progress', label: 'In Progress', icon: Wrench, desc: 'Work underway' },
  { id: 'Resolved', label: 'Resolved', icon: CheckCircle2, desc: 'Issue fixed' },
  { id: 'Closed', label: 'Closed', icon: Lock, desc: 'Confirmed & closed' }
];

export default function TimelineTracker({ currentStatus, resolvedAt, closedAt, createdAt }) {
  const currentIndex = stages.findIndex(s => s.id === currentStatus);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div style={{ padding: '20px 10px', width: '100%', overflowX: 'auto' }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        position: 'relative',
        minWidth: '600px',
        padding: '0 20px'
      }}>
        {/* Background Connecting Track */}
        <div style={{
          position: 'absolute',
          top: '24px',
          left: '50px',
          right: '50px',
          height: '4px',
          background: 'var(--border-color)',
          zIndex: 1,
          borderRadius: '2px'
        }}>
          {/* Active Colored Progress Bar */}
          <div style={{
            height: '100%',
            width: `${(activeIndex / (stages.length - 1)) * 100}%`,
            background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent-emerald) 100%)',
            transition: 'width 0.4s ease',
            borderRadius: '2px',
            boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)'
          }} />
        </div>

        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isCompleted = index < activeIndex;
          const isCurrent = index === activeIndex;
          const isUpcoming = index > activeIndex;

          let circleBg = 'var(--bg-tertiary)';
          let circleBorder = 'var(--border-color)';
          let iconColor = 'var(--text-muted)';
          let labelColor = 'var(--text-muted)';

          if (isCompleted) {
            circleBg = 'var(--accent-emerald)';
            circleBorder = 'var(--accent-emerald)';
            iconColor = '#ffffff';
            labelColor = 'var(--text-primary)';
          } else if (isCurrent) {
            circleBg = 'var(--primary)';
            circleBorder = 'rgba(99, 102, 241, 0.4)';
            iconColor = '#ffffff';
            labelColor = 'var(--primary)';
          }

          return (
            <div 
              key={stage.id} 
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                zIndex: 2,
                width: '100px'
              }}
            >
              <div 
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: circleBg,
                  border: `3px solid ${circleBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isCurrent ? '0 0 16px var(--primary-glow)' : 'var(--shadow-sm)',
                  transition: 'all 0.3s ease'
                }}
              >
                <Icon size={20} color={iconColor} />
              </div>

              <div style={{ marginTop: '10px' }}>
                <div style={{
                  fontSize: '0.825rem',
                  fontWeight: isCurrent ? '700' : '600',
                  color: labelColor,
                  whiteSpace: 'nowrap'
                }}>
                  {stage.label}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  marginTop: '2px'
                }}>
                  {stage.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
