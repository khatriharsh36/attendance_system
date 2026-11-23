import React from 'react';

export const LoadingSkeleton = ({ count = 3, type = 'card' }) => {
  if (type === 'table') {
    return (
      <div className="bg-surface rounded-card border border-border p-4 animate-pulse">
        <div className="h-8 bg-surface-subtle rounded mb-4 w-1/4" />
        <div className="space-y-3">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="h-10 bg-surface-muted rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (type === 'stat') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface p-5 rounded-card border border-border shadow-card animate-pulse">
            <div className="h-4 bg-surface-subtle rounded w-1/2 mb-3" />
            <div className="h-8 bg-surface-subtle rounded w-3/4 mb-2" />
            <div className="h-3 bg-surface-muted rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface p-6 rounded-card border border-border animate-pulse">
          <div className="h-5 bg-surface-subtle rounded w-1/3 mb-3" />
          <div className="h-4 bg-surface-muted rounded w-2/3" />
        </div>
      ))}
    </div>
  );
};
