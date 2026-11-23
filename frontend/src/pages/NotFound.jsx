import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const NotFound = () => {
  const { user } = useAuth();
  const homePath =
    user?.role === 'student'
      ? '/student/dashboard'
      : user?.role === 'faculty'
      ? '/faculty/dashboard'
      : user?.role === 'hod'
      ? '/hod/dashboard'
      : '/login';

  return (
    <div className="min-h-screen bg-surface-muted flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-surface p-8 rounded-card border border-border shadow-dropdown">
        <div className="w-12 h-12 rounded-full bg-status-danger-bg text-status-danger flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-navy mb-2">Page Not Found</h1>
        <p className="text-xs text-brandText-secondary mb-6 leading-relaxed">
          The requested institutional page or workflow resource does not exist or has been moved.
        </p>
        <Link
          to={homePath}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-academic hover:bg-academic-dark rounded-md shadow-xs transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};
