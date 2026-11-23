import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { AttendanceBadge } from '../../components/AttendanceBadge';
import { Modal } from '../../components/Modal';
import { FormField } from '../../components/FormField';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  FileQuestion,
  Settings,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export const HODDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [thresholdModalOpen, setThresholdModalOpen] = useState(false);
  const [newThreshold, setNewThreshold] = useState(75);
  const [updatingThreshold, setUpdatingThreshold] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hod/dashboard');
      setData(res.data);
      if (res.data?.threshold) {
        setNewThreshold(res.data.threshold);
      }
    } catch (err) {
      console.error('Failed to load HOD dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleUpdateThreshold = async (e) => {
    e.preventDefault();
    try {
      setUpdatingThreshold(true);
      await api.patch('/hod/threshold', { threshold: Number(newThreshold) });
      showToast(`Department minimum attendance threshold updated to ${newThreshold}%.`, 'success');
      setThresholdModalOpen(false);
      fetchDashboard();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update threshold.';
      showToast(msg, 'error');
    } finally {
      setUpdatingThreshold(false);
    }
  };

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
  const comparison = data?.comparison || {};
  const courseStats = data?.courseStats || [];
  const threshold = data?.threshold || 75;

  // Chart data: Theory vs Practical
  const barData = [
    { name: 'Theory Average', percentage: comparison.theoryAverage || 0, fill: '#315E86' },
    { name: 'Practical Average', percentage: comparison.practicalAverage || 0, fill: '#32846C' },
    { name: 'Overall Department', percentage: metrics.deptAverageAttendance || 0, fill: '#172B4D' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Department Administration — ${data?.department || user?.department}`}
        subtitle={`Official Head of Department Governance Dashboard • Configured Attendance Threshold: ${threshold}%`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setThresholdModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brandText-secondary bg-surface border border-border rounded-md hover:bg-surface-subtle transition shadow-xs"
            >
              <Settings className="w-3.5 h-3.5 text-academic" />
              <span>Configure Threshold ({threshold}%)</span>
            </button>
            <Link
              to="/hod/courses"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-academic hover:bg-academic-dark rounded-md shadow-xs transition"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Manage Courses</span>
            </Link>
          </div>
        }
      />

      {/* Top 6 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Students"
          value={metrics.totalStudents || 0}
          subtitle="Registered in Department"
          icon={Users}
        />
        <StatCard
          title="Total Faculty"
          value={metrics.totalFaculty || 0}
          subtitle="Department Instructors"
          icon={GraduationCap}
        />
        <StatCard
          title="Course Offerings"
          value={metrics.totalCourses || 0}
          subtitle="Theory & Practicals"
          icon={BookOpen}
        />
        <StatCard
          title="Dept Attendance"
          value={`${metrics.deptAverageAttendance || 0}%`}
          subtitle="Aggregate Average"
          icon={TrendingUp}
          variant={metrics.deptAverageAttendance >= threshold ? 'success' : 'warning'}
        />
        <StatCard
          title="Shortage Count"
          value={metrics.studentsBelowThreshold || 0}
          subtitle={`Students below ${threshold}%`}
          icon={AlertTriangle}
          variant={metrics.studentsBelowThreshold > 0 ? 'danger' : 'success'}
        />
        <StatCard
          title="Pending Requests"
          value={metrics.pendingCorrections || 0}
          subtitle="Correction submissions"
          icon={FileQuestion}
          variant={metrics.pendingCorrections > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Middle Row: Theory vs Practical Chart + Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Component Attendance Comparison */}
        <div className="lg:col-span-6 bg-surface rounded-card border border-border shadow-card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-academic" />
              <h3 className="text-sm font-bold text-navy">Theory vs. Practical Attendance Comparison</h3>
            </div>
            <span className="text-xs text-brandText-secondary">Departmental Metrics</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E8EE" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667586' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#667586' }} unit="%" />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Attendance Average']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E3E8EE', fontSize: '12px' }}
                />
                <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Quick Action Admin Hub */}
        <div className="lg:col-span-6 bg-surface rounded-card border border-border shadow-card p-5 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-border mb-3">
              <h3 className="text-sm font-bold text-navy">Administrative Workflows</h3>
              <p className="text-xs text-brandText-secondary">Quick shortcuts to department operations</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                to="/hod/students"
                className="p-3 rounded-md border border-border hover:border-academic/50 hover:bg-surface-subtle transition flex items-start gap-3"
              >
                <div className="p-2 rounded bg-academic-soft text-academic shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-navy">Student Directory</div>
                  <div className="text-[11px] text-brandText-secondary mt-0.5">
                    Filter by division and view student attendance logs.
                  </div>
                </div>
              </Link>

              <Link
                to="/hod/faculty"
                className="p-3 rounded-md border border-border hover:border-academic/50 hover:bg-surface-subtle transition flex items-start gap-3"
              >
                <div className="p-2 rounded bg-academic-soft text-academic shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-navy">Faculty Workload</div>
                  <div className="text-[11px] text-brandText-secondary mt-0.5">
                    Course teaching assignments and session counts.
                  </div>
                </div>
              </Link>

              <Link
                to="/hod/timetable"
                className="p-3 rounded-md border border-border hover:border-academic/50 hover:bg-surface-subtle transition flex items-start gap-3"
              >
                <div className="p-2 rounded bg-academic-soft text-academic shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-navy">Timetable Manager</div>
                  <div className="text-[11px] text-brandText-secondary mt-0.5">
                    Schedule slots with automatic room/faculty conflict check.
                  </div>
                </div>
              </Link>

              <Link
                to="/hod/shortages"
                className="p-3 rounded-md border border-border hover:border-status-danger/40 hover:bg-status-danger-bg/20 transition flex items-start gap-3"
              >
                <div className="p-2 rounded bg-status-danger-bg text-status-danger shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-navy">Shortage Report</div>
                  <div className="text-[11px] text-brandText-secondary mt-0.5">
                    Official lists of students below {threshold}% threshold.
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <div className="pt-3 border-t border-border mt-4 flex items-center justify-between text-xs">
            <span className="text-brandText-secondary">Audit Trail & Governance Logs:</span>
            <Link to="/hod/audit-logs" className="font-semibold text-academic hover:underline flex items-center gap-1">
              View Audit Logs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Course-wise Overview Table */}
      <div className="bg-surface rounded-card border border-border shadow-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-navy">Department Course Offerings & Attendance Averages</h3>
            <p className="text-xs text-brandText-secondary">Monitored against {threshold}% threshold</p>
          </div>
          <Link to="/hod/courses" className="text-xs font-semibold text-academic hover:underline">
            Manage Offerings →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-surface-subtle/70 border-b border-border text-xs uppercase font-semibold text-brandText-secondary tracking-wider">
                <th className="py-3 px-4">Code & Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Division / Batch</th>
                <th className="py-3 px-4">Assigned Faculty</th>
                <th className="py-3 px-4">Enrolled</th>
                <th className="py-3 px-4">Sessions</th>
                <th className="py-3 px-4">Average %</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {courseStats.map((c) => (
                <tr key={c.courseId} className="hover:bg-surface-muted/40 transition">
                  <td className="py-3 px-4 text-xs">
                    <span className="font-mono font-bold text-academic">{c.code}</span> —{' '}
                    <span className="font-semibold text-navy">{c.name}</span>
                  </td>
                  <td className="py-3 px-4 text-xs capitalize">{c.type}</td>
                  <td className="py-3 px-4 text-xs text-brandText-secondary">
                    Div {c.division} {c.batch ? `• Batch ${c.batch}` : ''}
                  </td>
                  <td className="py-3 px-4 text-xs font-medium text-navy">
                    {c.facultyName}
                  </td>
                  <td className="py-3 px-4 text-xs tabular-nums">{c.enrolledCount}</td>
                  <td className="py-3 px-4 text-xs tabular-nums">{c.conductedCount}</td>
                  <td className="py-3 px-4 text-xs font-bold text-navy tabular-nums">
                    {c.avgAttendance}%
                  </td>
                  <td className="py-3 px-4 text-xs">
                    {c.isBelowThreshold ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-status-danger-bg text-status-danger border border-status-danger/30">
                        Below {threshold}%
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-status-success-bg text-status-success border border-status-success/30">
                        Satisfactory
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Threshold Modal */}
      <Modal
        isOpen={thresholdModalOpen}
        onClose={() => setThresholdModalOpen(false)}
        title="Configure Minimum Attendance Threshold"
        subtitle={`Department: ${data?.department || user?.department}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleUpdateThreshold} className="space-y-4">
          <p className="text-xs text-brandText-secondary leading-relaxed">
            Specify the required minimum percentage of sessions a student must attend to remain academically eligible for examinations. Standard institutional default is 75%.
          </p>

          <FormField
            label="Minimum Percentage Threshold (50 - 100)"
            id="threshold"
            type="number"
            min="50"
            max="100"
            value={newThreshold}
            onChange={(e) => setNewThreshold(e.target.value)}
            required
            helperText="Updating this immediately updates shortage recalculations for all students in the department."
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setThresholdModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-brandText-secondary bg-surface border border-border rounded-md hover:bg-surface-subtle"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updatingThreshold}
              className="px-4 py-2 text-xs font-semibold text-white bg-academic hover:bg-academic-dark rounded-md transition disabled:opacity-50"
            >
              {updatingThreshold ? 'Saving...' : 'Update & Apply'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
