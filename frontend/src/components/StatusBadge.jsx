import React from 'react';

export const StatusBadge = ({ status }) => {
  const normalized = (status || '').toLowerCase();

  let styles = 'bg-gray-100 text-gray-700 border-gray-200';
  let label = status;

  if (normalized === 'approved' || normalized === 'active') {
    styles = 'bg-status-success-bg text-status-success border-status-success/30';
    label = normalized === 'approved' ? 'Approved' : 'Active';
  } else if (normalized === 'pending') {
    styles = 'bg-status-warning-bg text-status-warning border-status-warning/30';
    label = 'Pending Review';
  } else if (normalized === 'rejected' || normalized === 'dropped' || normalized === 'cancelled') {
    styles = 'bg-status-danger-bg text-status-danger border-status-danger/30';
    label = normalized === 'rejected' ? 'Rejected' : normalized === 'cancelled' ? 'Cancelled' : 'Dropped';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles}`}>
      {label}
    </span>
  );
};
