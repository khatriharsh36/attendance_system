import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { AttendanceBadge } from '../../components/AttendanceBadge';
import { AttendanceProgress } from '../../components/AttendanceProgress';
import { calculateAttendanceStats, simulateFutureSessions } from '../../utils/attendanceCalc';
import { Calculator, Sparkles, TrendingUp, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

export const AttendanceCalculator = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [attended, setAttended] = useState(14);
  const [conducted, setConducted] = useState(16);
  const [targetPercentage, setTargetPercentage] = useState(75);
  const [futureAttend, setFutureAttend] = useState(4);
  const [futureMiss, setFutureMiss] = useState(1);
  const [loading, setLoading] = useState(true);

  // Pre-load student's actual attendance records
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/students/me/attendance');
        const list = res.data.courses || [];
        setCourses(list);
        if (list.length > 0) {
          setSelectedCourseId(list[0].courseId);
          setAttended(list[0].attendedSessions);
          setConducted(list[0].conductedSessions);
        }
      } catch (err) {
        console.error('Failed to pre-fill calculator:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const handleCourseChange = (e) => {
    const cId = e.target.value;
    setSelectedCourseId(cId);
    const found = courses.find((c) => c.courseId === cId);
    if (found) {
      setAttended(found.attendedSessions);
      setConducted(found.conductedSessions);
    }
  };

  // Real-time calculations
  const stats = useMemo(() => {
    return calculateAttendanceStats({
      attended,
      conducted,
      targetPercentage,
    });
  }, [attended, conducted, targetPercentage]);

  // Future simulation projection
  const simulation = useMemo(() => {
    return simulateFutureSessions({
      attended,
      conducted,
      futureAttend,
      futureMiss,
    });
  }, [attended, conducted, futureAttend, futureMiss]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Forecasting & Recovery Calculator"
        subtitle="Mathematically calculate classes needed to reach target threshold or classes you can safely miss without shortage."
      />

      {/* Preset Course Selector */}
      <div className="bg-surface p-4 rounded-card border border-border shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-navy">
          <Sparkles className="w-4 h-4 text-academic" />
          <span>Pre-fill from My Enrolled Courses:</span>
        </div>
        <div className="w-full sm:w-80">
          <select
            value={selectedCourseId}
            onChange={handleCourseChange}
            className="w-full px-3 py-1.5 text-xs bg-surface-muted border border-border rounded-md text-brandText-main focus:border-academic"
          >
            {courses.map((c) => (
              <option key={c.courseId} value={c.courseId}>
                {c.courseCode} - {c.courseName} ({c.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Two Column Calculator: Inputs Left, Reactive Outputs Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Inputs Card */}
        <div className="lg:col-span-6 bg-surface rounded-card border border-border shadow-card p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="text-sm font-bold text-navy flex items-center gap-2">
              <Calculator className="w-4 h-4 text-academic" />
              <span>Current Parameters</span>
            </h3>
            <span className="text-[11px] text-brandText-secondary">Adjust sliders or inputs</span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
              Sessions Attended
            </label>
            <input
              type="number"
              min="0"
              max={conducted}
              value={attended}
              onChange={(e) => setAttended(Math.min(conducted, Math.max(0, parseInt(e.target.value) || 0)))}
              className="w-full px-3 py-2 text-sm bg-surface rounded-md border border-border text-navy tabular-nums focus:border-academic focus:ring-1 focus:ring-academic"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
              Total Sessions Conducted
            </label>
            <input
              type="number"
              min="0"
              value={conducted}
              onChange={(e) => {
                const val = Math.max(0, parseInt(e.target.value) || 0);
                setConducted(val);
                if (attended > val) setAttended(val);
              }}
              className="w-full px-3 py-2 text-sm bg-surface rounded-md border border-border text-navy tabular-nums focus:border-academic focus:ring-1 focus:ring-academic"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-navy">
                Target Threshold Percentage
              </label>
              <span className="text-xs font-bold text-academic tabular-nums">{targetPercentage}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="1"
              value={targetPercentage}
              onChange={(e) => setTargetPercentage(parseInt(e.target.value))}
              className="w-full accent-academic cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-brandText-secondary mt-1">
              <span>50%</span>
              <span className="font-semibold text-navy">75% (MITAOE Minimum)</span>
              <span>95%</span>
            </div>
          </div>

          {/* Quick presets */}
          <div className="pt-3 border-t border-border flex items-center gap-2">
            <span className="text-xs text-brandText-secondary font-medium">Quick Targets:</span>
            {[75, 80, 85, 90].map((tgt) => (
              <button
                key={tgt}
                type="button"
                onClick={() => setTargetPercentage(tgt)}
                className={`px-2.5 py-1 text-xs rounded border transition font-medium ${
                  targetPercentage === tgt
                    ? 'bg-academic text-white border-academic'
                    : 'bg-surface-subtle text-brandText-main border-border hover:bg-surface-muted'
                }`}
              >
                {tgt}%
              </button>
            ))}
          </div>
        </div>

        {/* Right Output Results Card */}
        <div className="lg:col-span-6 bg-surface rounded-card border border-border shadow-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-academic" />
                <span>Forecasting Analysis</span>
              </h3>
              <AttendanceBadge percentage={stats.percentage} status={stats.status} size="md" />
            </div>

            {/* Current Percentage Display */}
            <div className="mb-6 p-4 rounded-lg bg-surface-muted border border-border text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-brandText-secondary">
                Current Attendance Rate
              </span>
              <div className="text-4xl font-extrabold text-navy my-1 tabular-nums">
                {stats.formattedPercentage}
              </div>
              <div className="text-xs text-brandText-secondary">
                {attended} attended out of {conducted} sessions conducted
              </div>
              <div className="mt-3 max-w-xs mx-auto">
                <AttendanceProgress percentage={stats.percentage} threshold={targetPercentage} showLabel={false} />
              </div>
            </div>

            {/* Dynamic Formula Output Message */}
            <div className="space-y-3">
              {stats.isShortage ? (
                <div className="p-4 rounded-md bg-status-danger-bg border border-status-danger/30 space-y-1.5">
                  <div className="flex items-center gap-2 text-status-danger font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Attendance Shortage Recovery</span>
                  </div>
                  <p className="text-sm text-navy font-semibold">
                    You must attend the next <span className="text-status-danger text-base font-extrabold tabular-nums">{stats.classesNeeded}</span> consecutive classes without missing.
                  </p>
                  <p className="text-xs text-brandText-secondary">
                    Formula applied: <code className="bg-surface px-1.5 py-0.5 rounded text-[11px] font-mono">ceil((r * total - attended) / (1 - r))</code>
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-md bg-status-success-bg border border-status-success/30 space-y-1.5">
                  <div className="flex items-center gap-2 text-status-success font-bold text-xs uppercase tracking-wider">
                    <CheckCircle className="w-4 h-4" />
                    <span>Attendance Safe Zone</span>
                  </div>
                  <p className="text-sm text-navy font-semibold">
                    You can miss up to <span className="text-status-success text-base font-extrabold tabular-nums">{stats.canMiss}</span> more sessions and still remain at or above {targetPercentage}%.
                  </p>
                  <p className="text-xs text-brandText-secondary">
                    Formula applied: <code className="bg-surface px-1.5 py-0.5 rounded text-[11px] font-mono">floor(attended / r - total)</code>
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-6 text-[11px] text-brandText-muted">
            All calculations use verified institutional mathematical models. Official condonation remains subject to department policies.
          </div>
        </div>
      </div>

      {/* Interactive Simulation Sandbox */}
      <div className="bg-surface rounded-card border border-border shadow-card p-6">
        <div className="pb-3 border-b border-border mb-4">
          <h3 className="text-sm font-bold text-navy flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-academic" />
            <span>Future Lecture Scenario Simulator</span>
          </h3>
          <p className="text-xs text-brandText-secondary mt-0.5">
            Test what your attendance percentage will become if you attend or miss upcoming classes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
              Future Classes I will Attend
            </label>
            <input
              type="number"
              min="0"
              value={futureAttend}
              onChange={(e) => setFutureAttend(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 text-sm bg-surface-muted rounded-md border border-border text-navy tabular-nums focus:border-academic"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
              Future Classes I will Miss
            </label>
            <input
              type="number"
              min="0"
              value={futureMiss}
              onChange={(e) => setFutureMiss(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 text-sm bg-surface-muted rounded-md border border-border text-navy tabular-nums focus:border-academic"
            />
          </div>

          <div className="p-4 rounded-lg bg-surface-subtle border border-border text-center">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-brandText-secondary">
              Projected Attendance
            </span>
            <div className="text-3xl font-bold text-academic tabular-nums my-1">
              {simulation.formattedPercentage}
            </div>
            <span className="text-xs text-brandText-secondary">
              ({simulation.newAttended} of {simulation.newConducted} sessions)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
