import React from 'react';

export const AttendanceProgress = ({
  percentage = 0,
  threshold = 75,
  showLabel = true,
  height = 'h-2.5',
}) => {
  const pct = Math.min(100, Math.max(0, Number(percentage) || 0));

  let barColor = 'bg-status-success';
  if (pct < 70) {
    barColor = 'bg-status-danger';
  } else if (pct < threshold) {
    barColor = 'bg-status-warning';
  }

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-brandText-secondary mb-1">
          <span>Attendance: <strong className="text-brandText-main tabular-nums">{pct.toFixed(1)}%</strong></span>
          <span className="text-[11px]">Threshold: {threshold}%</span>
        </div>
      )}
      <div className={`relative w-full bg-surface-subtle rounded-full overflow-hidden ${height} border border-border/50`}>
        <div
          className={`${height} rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
        {/* Subtle vertical marker for minimum threshold */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-navy/40 z-10 pointer-events-none"
          style={{ left: `${threshold}%` }}
          title={`Minimum required: ${threshold}%`}
        />
      </div>
    </div>
  );
};
