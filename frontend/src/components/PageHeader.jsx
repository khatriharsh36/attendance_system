import React from 'react';

export const PageHeader = ({
  title,
  subtitle,
  actions = null,
  badge = null,
}) => {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-navy">{title}</h1>
          {badge}
        </div>
        {subtitle && (
          <p className="mt-1 text-sm text-brandText-secondary leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
};
