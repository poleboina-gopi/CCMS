import React from 'react';
import { 
  FileText, 
  Search, 
  UserCheck, 
  Clock, 
  CheckCircle, 
  Lock 
} from 'lucide-react';

const statusConfig = {
  'Submitted': {
    className: 'badge-submitted',
    icon: FileText,
    label: 'Submitted'
  },
  'Under Review': {
    className: 'badge-review',
    icon: Search,
    label: 'Under Review'
  },
  'Assigned': {
    className: 'badge-assigned',
    icon: UserCheck,
    label: 'Assigned'
  },
  'In Progress': {
    className: 'badge-progress',
    icon: Clock,
    label: 'In Progress'
  },
  'Resolved': {
    className: 'badge-resolved',
    icon: CheckCircle,
    label: 'Resolved'
  },
  'Closed': {
    className: 'badge-closed',
    icon: Lock,
    label: 'Closed'
  }
};

export default function StatusBadge({ status, size = 'md' }) {
  const config = statusConfig[status] || statusConfig['Submitted'];
  const Icon = config.icon;
  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <span className={`badge ${config.className}`} style={{ fontSize: size === 'sm' ? '0.7rem' : '0.75rem' }}>
      <Icon size={iconSize} />
      <span>{config.label}</span>
    </span>
  );
}
