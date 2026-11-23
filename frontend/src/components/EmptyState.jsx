import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There is currently no data available for this view.',
  action = null,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-surface rounded-card border border-border border-dashed my-4">
      <div className="p-3 bg-surface-muted rounded-full text-brandText-muted mb-3">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-semibold text-navy">{title}</h3>
      <p className="mt-1 text-sm text-brandText-secondary max-w-sm mb-4">
        {description}
      </p>
      {action}
    </div>
  );
};
