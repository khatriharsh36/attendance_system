import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';

export const AppLayout = ({ allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-muted">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-academic border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-brandText-secondary font-medium">Loading portal...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to user's own home dashboard if trying to access wrong role page
    const redirectPath =
      user.role === 'student'
        ? '/student/dashboard'
        : user.role === 'faculty'
        ? '/faculty/dashboard'
        : '/hod/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return (
    <div className="min-h-screen bg-surface-muted flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
