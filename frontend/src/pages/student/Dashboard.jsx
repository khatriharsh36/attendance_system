import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { AttendanceBadge } from '../../components/AttendanceBadge';
import { AttendanceProgress } from '../../components/AttendanceProgress';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import {
  CheckSquare,
  AlertTriangle,
  BookOpen,
  Calendar,
  Calculator,
  ArrowRight,
  Clock,
  MapPin,
  TrendingUp,
} from 'lucide-react';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [timetableData, setTimetableData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [attRes, ttRes] = await Promise.all([
          api.get('/students/me/attendance'),
          api.get('/students/me/timetable'),
        ]);
        setData(attRes.data);
        setTimetableData(ttRes.data);
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div>
        <div className="h-8 bg-surface-subtle rounded w-1/3 mb-6 animate-pulse" />
        <LoadingSkeleton type="stat" />
        <LoadingSkeleton count={2} />
      </div>
    );
  }

  const overall = data?.overall || {};
  const courses = data?.courses || [];
  const shortages = data?.shortageAlerts || [];
  const todayClasses = timetableData?.todaySlots || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.name}`}
        subtitle={`PRN: ${user?.studentId} • ${user?.department} • Sem ${user?.semester} (Div ${user?.division})`}
        actions={
          <Link
            to="/student/calculator"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-academic hover:bg-academic-dark rounded-md shadow-xs transition"
          >
            <Calculator className="w-4 h-4" />
            <span>Attendance Forecast</span>
          </Link>
        }
      />

      {/* Attendance Shortage Warnings (if any) */}
      {shortages.length > 0 && (
        <div className="bg-status-danger-bg border border-status-danger/30 rounded-card p-4 space-y-2">
          <div className="flex items-center gap-2 text-status-danger font-semibold text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Attendance Shortage Alert ({shortages.length} Course{shortages.length > 1 ? 's' : ''} Below {data?.threshold}%)</span>
          </div>
          <div className="space-y-2 text-xs text-brandText-main">
            {shortages.map((alert, idx) => (
              <div key={idx} className="p-2.5 bg-surface rounded border border-status-danger/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span>{alert.message}</span>
                <Link
                  to="/student/calculator"
                  className="font-semibold text-status-danger hover:underline shrink-0 text-xs"
                >
                  Calculate Recovery →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Attendance"
          value={overall.formattedPercentage || '0%'}
          subtitle={`${overall.totalAttended || 0} of ${overall.totalConducted || 0} sessions`}
          icon={CheckSquare}
          variant={
            overall.percentage >= 75 ? 'success' : overall.percentage >= 70 ? 'warning' : 'danger'
          }
          badge={<AttendanceBadge percentage={overall.percentage} status={overall.status} size="sm" />}
        />

        <StatCard
          title="Enrolled Courses"
          value={overall.totalCourses || courses.length}
          subtitle="Theory & Practical offerings"
          icon={BookOpen}
          variant="default"
        />

        <StatCard
          title="Shortage Risk"
          value={overall.coursesBelowThreshold || 0}
          subtitle={
            overall.coursesBelowThreshold > 0
              ? 'Courses below minimum 75%'
              : 'All courses eligible'
          }
          icon={AlertTriangle}
          variant={overall.coursesBelowThreshold > 0 ? 'danger' : 'success'}
        />

        <StatCard
          title="Classes Today"
          value={todayClasses.length}
          subtitle={timetableData?.currentDay ? `${timetableData.currentDay}'s Schedule` : 'Schedule'}
          icon={Calendar}
          variant="info"
        />
      </div>

      {/* Main Grid: Course-wise Attendance + Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Course-wise Attendance Progress Table */}
        <div className="lg:col-span-8 bg-surface rounded-card border border-border shadow-card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <div>
              <h2 className="text-base font-bold text-navy">Course-wise Attendance</h2>
              <p className="text-xs text-brandText-secondary">Threshold requirement: {data?.threshold || 75}%</p>
            </div>
            <Link
              to="/student/attendance"
              className="text-xs font-semibold text-academic hover:underline flex items-center gap-1"
            >
              View Full Table <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {courses.length > 0 ? (
              courses.map((course) => (
                <div
                  key={course.courseId}
                  className="p-3.5 rounded-lg border border-border hover:border-academic/40 transition bg-surface-muted/30"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-academic bg-academic-soft px-1.5 py-0.5 rounded">
                          {course.courseCode}
                        </span>
                        <h3 className="text-sm font-semibold text-navy">{course.courseName}</h3>
                      </div>
                      <div className="text-xs text-brandText-secondary mt-0.5">
                        {course.type === 'theory' ? 'Theory Component' : `Practical Lab ${course.batch ? `(Batch ${course.batch})` : ''}`} • {course.facultyName}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right text-xs">
                        <div className="font-semibold text-navy tabular-nums">
                          {course.attendedSessions} / {course.conductedSessions}
                        </div>
                        <div className="text-[11px] text-brandText-secondary">Attended</div>
                      </div>
                      <AttendanceBadge percentage={course.percentage} status={course.status} />
                    </div>
                  </div>

                  <AttendanceProgress percentage={course.percentage} threshold={data?.threshold || 75} showLabel={false} />

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40 text-[11px] text-brandText-secondary">
                    <span>
                      {course.isShortage ? (
                        <span className="text-status-danger font-medium">
                          ⚠️ Attend {course.classesNeeded} more consecutive classes to reach {data?.threshold}%
                        </span>
                      ) : (
                        <span className="text-status-success font-medium">
                          ✓ Can miss up to {course.canMiss} upcoming classes safely
                        </span>
                      )}
                    </span>
                    <Link
                      to={`/student/courses/${course.courseId}`}
                      className="font-semibold text-academic hover:underline"
                    >
                      Session History →
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-brandText-secondary py-4 text-center">No active enrolled courses.</p>
            )}
          </div>
        </div>

        {/* Right: Today's Schedule & Quick Tools */}
        <div className="lg:col-span-4 space-y-6">
          {/* Today's Schedule Card */}
          <div className="bg-surface rounded-card border border-border shadow-card p-5">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <div className="flex items-center gap-2 text-navy font-bold text-sm">
                <Clock className="w-4 h-4 text-academic" />
                <span>Today's Classes</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-surface-subtle font-medium text-brandText-secondary">
                {timetableData?.currentDay}
              </span>
            </div>

            <div className="space-y-2.5">
              {todayClasses.length > 0 ? (
                todayClasses.map((slot) => (
                  <div
                    key={slot._id}
                    className="p-3 rounded-md border border-border bg-surface-muted/40 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] font-semibold text-academic">
                      <span>{slot.startTime} - {slot.endTime}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface border border-border uppercase">
                        {slot.courseId?.type === 'practical' ? 'Lab' : 'Th'}
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
                      <span>{slot.facultyId?.name}</span>
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
              to="/student/timetable"
              className="mt-4 block text-center py-2 text-xs font-semibold text-academic hover:bg-academic-soft rounded border border-academic/20 transition"
            >
              View Full Week Schedule →
            </Link>
          </div>

          {/* Attendance Forecasting Callout Banner */}
          <div className="bg-navy text-surface rounded-card p-5 border border-navy-light shadow-card">
            <div className="flex items-center gap-2 text-academic-light text-xs font-bold uppercase tracking-wider mb-2">
              <Calculator className="w-4 h-4" />
              <span>Forecasting Engine</span>
            </div>
            <h4 className="text-sm font-bold text-white mb-1.5">
              Target Attendance Planner
            </h4>
            <p className="text-xs text-brandText-muted leading-relaxed mb-4">
              Simulate future lecture attendances and determine exactly how many classes you can afford to miss or need to recover.
            </p>
            <Link
              to="/student/calculator"
              className="inline-flex items-center justify-center w-full py-2 px-3 rounded text-xs font-semibold text-navy bg-white hover:bg-surface-muted transition shadow-xs"
            >
              Launch Calculator
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
