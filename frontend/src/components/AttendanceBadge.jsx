import React from 'react';

export const AttendanceBadge = ({ percentage, status, size = 'md' }) => {
  let badgeStyle = 'bg-gray-100 text-gray-700 border-gray-200';
  let dotStyle = 'bg-gray-400';

  if (percentage === null || percentage === undefined) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-surface-subtle text-brandText-secondary border border-border">
        No Data
      </span>
    );
  }

  const num = Number(percentage);

  if (num >= 75) {
    badgeStyle = 'bg-status-success-bg text-status-success border-status-success/30';
    dotStyle = 'bg-status-success';
  } else if (num >= 70) {
    badgeStyle = 'bg-status-warning-bg text-status-warning border-status-warning/30';
    dotStyle = 'bg-status-warning';
  } else {
    badgeStyle = 'bg-status-danger-bg text-status-danger border-status-danger/30';
    dotStyle = 'bg-status-danger';
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs'
      : size === 'lg'
      ? 'px-3 py-1 text-sm font-semibold'
      : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium tabular-nums ${badgeStyle} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyle}`} />
      <span>{num.toFixed(1)}%</span>
      {status && <span className="opacity-80 font-normal">({status})</span>}
    </span>
  );
};
