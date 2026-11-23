import React from 'react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  badge,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-l-4 border-l-status-success';
      case 'warning':
        return 'border-l-4 border-l-status-warning';
      case 'danger':
        return 'border-l-4 border-l-status-danger';
      case 'info':
        return 'border-l-4 border-l-status-info';
      default:
        return 'border-l-4 border-l-academic';
    }
  };

  return (
    <div
      className={`bg-surface p-5 rounded-card border border-border shadow-card flex flex-col justify-between ${getVariantStyles()}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-brandText-secondary">
          {title}
        </span>
        {Icon && (
          <div className="p-1.5 rounded-md bg-surface-subtle text-academic">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between mt-1">
        <div className="text-2xl font-bold tracking-tight text-navy tabular-nums">
          {value}
        </div>
        {badge && <div>{badge}</div>}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 text-xs text-brandText-secondary flex items-center justify-between">
          <span>{subtitle}</span>
          {trend && <span className="font-medium text-brandText-main">{trend}</span>}
        </div>
      )}
    </div>
  );
};
