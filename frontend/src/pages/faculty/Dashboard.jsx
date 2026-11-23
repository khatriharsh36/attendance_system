import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import {
  BookOpen,
  Users,
  CheckSquare,
  FileQuestion,
  Clock,
  ArrowRight,
  MapPin,
  TrendingUp,
} from 'lucide-react';

export const FacultyDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/faculty/me/dashboard');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load faculty dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div>
        <div className="h-8 bg-surface-subtle rounded w-1/4 mb-6 animate-pulse" />
        <LoadingSkeleton type="stat" />
        <LoadingSkeleton count={2} />
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const todaySchedule = data?.todaySchedule || [];
  const courseStats = data?.courseStats || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Faculty Portal — ${user?.name}`}
        subtitle={`Employee ID: ${user?.facultyId} • Department of ${user?.department}`}
        actions={
          <Link
            to="/faculty/attendance/mark"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-academic hover:bg-academic-dark rounded-md shadow-xs transition"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Mark Attendance</span>
          </Link>
        }
      />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Courses"
          value={metrics.totalCourses || 0}
          subtitle="Theory & Practical offerings"
          icon={BookOpen}
        />
        <StatCard
          title="Enrolled Students"
          value={metrics.totalStudents || 0}
          subtitle="Across assigned classes"
          icon={Users}
        />
        <StatCard
          title="Sessions Conducted"
          value={metrics.sessionsConducted || 0}
          subtitle="Lectures & Lab sessions"
          icon={CheckSquare}
          variant="success"
        />
        <StatCard
          title="Pending Corrections"
          value={metrics.pendingCorrections || 0}
          subtitle={
            metrics.pendingCorrections > 0
              ? 'Requests require your review'
              : 'All requests reviewed'
          }
          icon={FileQuestion}
          variant={metrics.pendingCorrections > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Main Grid: Course Stats & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Assigned Courses List */}
        <div className="lg:col-span-8 bg-surface rounded-card border border-border shadow-card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <div>
              <h3 className="text-base font-bold text-navy">Assigned Course Offerings</h3>
              <p className="text-xs text-brandText-secondary">Class attendance performance overview</p>
            </div>
            <Link
              to="/faculty/courses"
              className="text-xs font-semibold text-academic hover:underline flex items-center gap-1"
            >
              All Courses <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {courseStats.length > 0 ? (
              courseStats.map((c) => (
                <div
                  key={c.courseId}
                  className="p-3.5 rounded-lg border border-border bg-surface-muted/30 hover:border-academic/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-academic bg-academic-soft px-1.5 py-0.5 rounded">
                        {c.courseCode}
                      </span>
                      <h4 className="text-sm font-semibold text-navy">{c.courseName}</h4>
                      <span
                        className={`text-[10px] px-2 py-0.2 rounded-full font-medium border ${
                          c.type === 'theory'
                            ? 'bg-blue-50 text-academic border-academic/30'
                            : 'bg-emerald-50 text-status-success border-status-success/30'
                        }`}
                      >
                        {c.type === 'theory' ? 'Theory' : `Lab ${c.batch ? `(${c.batch})` : ''}`}
                      </span>
                    </div>
                    <div className="text-xs text-brandText-secondary mt-1">
                      Div {c.division} • {c.enrolledCount} enrolled students • {c.conductedCount} sessions conducted
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-bold text-navy tabular-nums">{c.avgAttendance}%</div>
                      <div className="text-[10px] text-brandText-secondary uppercase">Average</div>
                    </div>
                    <Link
                      to={`/faculty/attendance/mark?courseId=${c.courseId}`}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-academic hover:bg-academic-dark rounded transition shadow-xs"
                    >
                      Mark Session
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-brandText-secondary py-4 text-center">No assigned courses.</p>
            )}
          </div>
        </div>

        {/* Right: Today's Schedule & Pending Correction Alert */}
        <div className="lg:col-span-4 space-y-6">
          {/* Today's Schedule */}
          <div className="bg-surface rounded-card border border-border shadow-card p-5">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <div className="flex items-center gap-2 text-navy font-bold text-sm">
                <Clock className="w-4 h-4 text-academic" />
                <span>Today's Classes</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-surface-subtle font-medium text-brandText-secondary">
                Timetable
              </span>
            </div>

            <div className="space-y-2.5">
              {todaySchedule.length > 0 ? (
                todaySchedule.map((slot) => (
                  <div
                    key={slot._id}
                    className="p-3 rounded-md border border-border bg-surface-muted/40 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] font-semibold text-academic">
                      <span>{slot.startTime} - {slot.endTime}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface border border-border uppercase">
                        Div {slot.courseId?.division}
                      </span>
                    </div>
                    <div className="font-semibold text-navy">
                      {slot.courseId?.code} • {slot.courseId?.name}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-brandText-secondary pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-brandText-muted" />
                        {slot.room}
                      </span>
                      {slot.batch && <span>Batch {slot.batch}</span>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-brandText-muted">
                  No classes scheduled for today.
                </div>
              )}
            </div>

            <Link
              to="/faculty/timetable"
              className="mt-4 block text-center py-2 text-xs font-semibold text-academic hover:bg-academic-soft rounded border border-academic/20 transition"
            >
              View Full Week Schedule →
            </Link>
          </div>

          {/* Pending Requests Callout */}
          {metrics.pendingCorrections > 0 && (
            <div className="p-4 bg-status-warning-bg rounded-card border border-status-warning/30 space-y-2">
              <div className="flex items-center gap-2 text-status-warning font-bold text-xs uppercase tracking-wider">
                <FileQuestion className="w-4 h-4" />
                <span>Action Required</span>
              </div>
              <p className="text-xs text-brandText-main">
                You have <strong>{metrics.pendingCorrections}</strong> pending attendance correction request{metrics.pendingCorrections > 1 ? 's' : ''} from students.
              </p>
              <Link
                to="/faculty/corrections"
                className="inline-block text-xs font-semibold text-status-warning hover:underline pt-1"
              >
                Review Requests Now →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
