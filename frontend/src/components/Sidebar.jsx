import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CheckSquare,
  Calculator,
  Calendar,
  FileQuestion,
  BookOpen,
  History,
  FileText,
  Users,
  ShieldCheck,
  AlertTriangle,
  LogOut,
  User,
  GraduationCap,
  X,
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    if (!user) return [];

    if (user.role === 'student') {
      return [
        { label: 'Dashboard', to: '/student/dashboard', icon: LayoutDashboard },
        { label: 'My Attendance', to: '/student/attendance', icon: CheckSquare },
        { label: 'Forecast Calculator', to: '/student/calculator', icon: Calculator },
        { label: 'My Timetable', to: '/student/timetable', icon: Calendar },
        { label: 'Correction Requests', to: '/student/corrections', icon: FileQuestion },
        { label: 'Student Profile', to: '/student/profile', icon: User },
      ];
    }

    if (user.role === 'faculty') {
      return [
        { label: 'Dashboard', to: '/faculty/dashboard', icon: LayoutDashboard },
        { label: 'My Courses', to: '/faculty/courses', icon: BookOpen },
        { label: 'Mark Attendance', to: '/faculty/attendance/mark', icon: CheckSquare },
        { label: 'Attendance History', to: '/faculty/attendance/history', icon: History },
        { label: 'Schedule & Timetable', to: '/faculty/timetable', icon: Calendar },
        { label: 'Correction Requests', to: '/faculty/corrections', icon: FileQuestion },
        { label: 'Course Reports', to: '/faculty/reports', icon: FileText },
        { label: 'Faculty Profile', to: '/faculty/profile', icon: User },
      ];
    }

    if (user.role === 'hod') {
      return [
        { label: 'HOD Dashboard', to: '/hod/dashboard', icon: LayoutDashboard },
        { label: 'Student Directory', to: '/hod/students', icon: Users },
        { label: 'Faculty Workload', to: '/hod/faculty', icon: GraduationCap },
        { label: 'Course Offerings', to: '/hod/courses', icon: BookOpen },
        { label: 'Timetable Manager', to: '/hod/timetable', icon: Calendar },
        { label: 'Shortage Reports', to: '/hod/shortages', icon: AlertTriangle },
        { label: 'Audit Trail', to: '/hod/audit-logs', icon: ShieldCheck },
        { label: 'Department Profile', to: '/hod/profile', icon: User },
      ];
    }

    return [];
  };

  const links = getNavLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-navy/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-navy text-surface border-r border-navy-light flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-navy-light/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-surface flex items-center justify-center p-1 shadow-sm">
              <img src="/mitaoe-seal.svg" alt="MITAOE Seal" className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-wide">MITAOE</div>
              <div className="text-[10px] text-brandText-muted uppercase tracking-wider font-medium">
                Attendance System
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1 text-brandText-muted hover:text-white rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Pill Banner */}
        <div className="px-5 py-2.5 bg-navy-900/60 border-b border-navy-light/40 flex items-center justify-between text-xs">
          <span className="text-brandText-muted font-medium">PORTAL</span>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-academic/30 text-academic-soft border border-academic/40">
            {user?.role}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-all duration-150 relative ${
                    isActive
                      ? 'bg-academic text-white font-semibold shadow-sm'
                      : 'text-brandText-muted hover:text-white hover:bg-navy-light/50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-brandText-muted'}`} />
                    <span>{link.label}</span>
                    {isActive && (
                      <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-navy-light/60 bg-navy-900/40">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-academic text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {user?.name?.slice(0, 2) || 'US'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
              <div className="text-[11px] text-brandText-muted truncate">
                {user?.studentId || user?.facultyId || user?.email}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-brandText-muted hover:text-status-danger hover:bg-navy-light/40 rounded transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
