import React from 'react';
import { Menu, Bell, Shield, BookMarked } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Header = ({ onOpenSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-surface border-b border-border px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-md text-brandText-secondary hover:text-brandText-main hover:bg-surface-subtle transition"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <div className="text-xs font-semibold text-navy">
            MIT Academy of Engineering, Pune
          </div>
          <div className="text-[11px] text-brandText-secondary">
            Autonomous Institute Affiliated to SPPU • Alandi (D), Pune
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Department Badge */}
        {user?.department && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-subtle border border-border text-xs font-medium text-navy">
            <BookMarked className="w-3.5 h-3.5 text-academic" />
            <span>{user.department}</span>
          </div>
        )}

        {/* Student Semester / Division Pill */}
        {user?.role === 'student' && user?.division && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-academic-soft border border-academic/20 text-xs font-semibold text-academic tabular-nums">
            <span>Sem {user.semester} • Div {user.division}</span>
          </div>
        )}

        {/* Role Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-navy/5 border border-navy/15 text-xs font-semibold text-navy uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5 text-academic" />
          <span>{user?.role}</span>
        </div>
      </div>
    </header>
  );
};
