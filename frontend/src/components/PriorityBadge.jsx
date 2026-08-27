import React from 'react';
import { AlertTriangle, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';

const priorityConfig = {
  'Low': {
    className: 'badge-p-low',
    icon: ArrowDown,
    label: 'Low'
  },
  'Medium': {
    className: 'badge-p-med',
    icon: ArrowUp,
    label: 'Medium'
  },
  'High': {
    className: 'badge-p-high',
    icon: AlertTriangle,
    label: 'High'
  },
  'Critical': {
    className: 'badge-p-crit',
    icon: AlertCircle,
    label: 'Critical'
  }
};

export default function PriorityBadge({ priority, size = 'md' }) {
  const config = priorityConfig[priority] || priorityConfig['Medium'];
  const Icon = config.icon;
  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <span className={`badge ${config.className}`} style={{ fontSize: size === 'sm' ? '0.7rem' : '0.75rem' }}>
      <Icon size={iconSize} />
      <span>{config.label}</span>
    </span>
  );
}
