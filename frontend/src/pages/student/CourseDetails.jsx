import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { AttendanceBadge } from '../../components/AttendanceBadge';
import { AttendanceProgress } from '../../components/AttendanceProgress';
import { Modal } from '../../components/Modal';
import { FormField } from '../../components/FormField';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileQuestion,
  TrendingUp,
} from 'lucide-react';

export const CourseDetails = () => {
  const { courseId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [reason, setReason] = useState('Medical Leave');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useToast();

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/students/me/courses/${courseId}/attendance`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load course details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [courseId]);

  const handleOpenCorrection = (session) => {
    setSelectedSession(session);
    setReason('Medical Leave');
    setDescription('');
    setCorrectionModalOpen(true);
  };

  const handleSubmitCorrection = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast('Please provide a detailed description.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/corrections', {
        sessionId: selectedSession.sessionId,
        reason,
        description,
      });
      showToast('Correction request submitted to course faculty for review.', 'success');
      setCorrectionModalOpen(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit request.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
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

  const course = data?.course || {};
  const summary = data?.summary || {};
  const sessions = data?.sessions || [];
  const threshold = data?.threshold || 75;

  // Chart data
  const chartData = sessions.map((s, idx) => ({
    name: `L${idx + 1}`,
    date: formatDate(s.sessionDate),
    percentage: s.cumulativePercentage,
    status: s.status,
    topic: s.topic,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          to="/student/attendance"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brandText-secondary hover:text-navy transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Courses</span>
        </Link>
      </div>

      <PageHeader
        title={`${course.code} — ${course.name}`}
        subtitle={`${course.type === 'theory' ? 'Theory Course' : `Practical Lab ${course.batch ? `(${course.batch})` : ''}`} • Instructor: ${course.facultyId?.name || 'Assigned Faculty'}`}
        badge={<AttendanceBadge percentage={summary.percentage} status={summary.status} size="lg" />}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Course Attendance"
          value={summary.formattedPercentage || '0%'}
          subtitle={`Threshold target: ${threshold}%`}
          variant={summary.isShortage ? 'danger' : 'success'}
        />
        <StatCard
          title="Sessions Conducted"
          value={summary.conducted}
          subtitle="Official valid class records"
        />
        <StatCard
          title="Sessions Attended"
          value={summary.attended}
          subtitle={`${summary.conducted - summary.attended} sessions missed`}
        />
        <StatCard
          title="Forecasting Status"
          value={
            summary.isShortage
              ? `Need ${summary.classesNeeded} classes`
              : `Can miss ${summary.canMiss} classes`
          }
          subtitle={
            summary.isShortage
              ? `To achieve minimum ${threshold}%`
              : `While maintaining ${threshold}%`
          }
          variant={summary.isShortage ? 'warning' : 'info'}
        />
      </div>

      {/* Attendance Trend Chart */}
      {sessions.length > 1 && (
        <div className="bg-surface rounded-card border border-border shadow-card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-academic" />
              <h3 className="text-sm font-bold text-navy">Cumulative Attendance Trend Over Time</h3>
            </div>
            <div className="flex items-center gap-3 text-xs text-brandText-secondary">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-academic" />
                <span>Attendance %</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-status-danger" />
                <span>{threshold}% Threshold</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E8EE" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667586' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#667586' }} unit="%" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const dataPoint = payload[0].payload;
                      return (
                        <div className="bg-surface p-3 border border-border rounded shadow-dropdown text-xs space-y-1">
                          <p className="font-semibold text-navy">{dataPoint.topic}</p>
                          <p className="text-brandText-secondary">Date: {dataPoint.date}</p>
                          <p className="font-bold text-academic">
                            Trend: {dataPoint.percentage}% ({dataPoint.status.toUpperCase()})
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={threshold} stroke="#C45454" strokeDasharray="4 4" />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="#315E86"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#315E86' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Session History Table */}
      <div className="bg-surface rounded-card border border-border shadow-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-academic" />
            <h3 className="text-sm font-bold text-navy">Conducted Sessions History</h3>
          </div>
          <span className="text-xs text-brandText-secondary">
            Total {sessions.length} sessions conducted
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-surface-subtle/70 border-b border-border text-xs uppercase font-semibold text-brandText-secondary tracking-wider">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Topic Covered</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Cumulative %</th>
                <th className="py-3 px-4 text-right">Correction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sessions.map((s, idx) => {
                const isPresent = s.status === 'present';
                return (
                  <tr key={s.sessionId} className="hover:bg-surface-muted/50 transition">
                    <td className="py-3 px-4 text-xs font-mono text-brandText-muted">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <div className="font-semibold text-navy">{formatDate(s.sessionDate)}</div>
                      <div className="text-[11px] text-brandText-secondary font-mono">
                        {s.startTime} - {s.endTime}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-brandText-main max-w-xs">
                      {s.topic}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                          isPresent
                            ? 'bg-status-success-bg text-status-success border-status-success/30'
                            : 'bg-status-danger-bg text-status-danger border-status-danger/30'
                        }`}
                      >
                        {isPresent ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Present</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Absent</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-bold text-navy tabular-nums">
                      {s.cumulativePercentage}%
                    </td>
                    <td className="py-3 px-4 text-xs text-right">
                      {!isPresent && (
                        <button
                          onClick={() => handleOpenCorrection(s)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-brandText-secondary hover:text-navy hover:bg-surface-subtle border border-border rounded transition"
                        >
                          <FileQuestion className="w-3.5 h-3.5 text-academic" />
                          <span>Request Review</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Correction Request Modal */}
      <Modal
        isOpen={correctionModalOpen}
        onClose={() => setCorrectionModalOpen(false)}
        title="Submit Attendance Correction Request"
        subtitle={`Course: ${course.code} • Date: ${selectedSession ? formatDate(selectedSession.sessionDate) : ''}`}
      >
        <form onSubmit={handleSubmitCorrection} className="space-y-4">
          <div className="p-3 bg-surface-subtle rounded-md text-xs text-brandText-secondary border border-border">
            <strong>Note:</strong> Submitting a correction request initiates an official academic review by course faculty. Please provide truthful and verifiable reasons.
          </div>

          <FormField
            label="Reason Category"
            id="reason"
            type="select"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            options={[
              { label: 'Medical Leave (Clinic visit / Prescription)', value: 'Medical Leave' },
              { label: 'On-Duty College Activity (Hackathon / Sports / Event)', value: 'On-Duty College Activity' },
              { label: 'Technical / System Error (Biometric / Network glitch)', value: 'Technical / System Error' },
              { label: 'Biometric / Proxy Discrepancy', value: 'Biometric / Proxy Discrepancy' },
              { label: 'Other Official Reason', value: 'Other Official Reason' },
            ]}
            required
          />

          <FormField
            label="Detailed Explanation / Remarks"
            id="description"
            type="textarea"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain why you were marked absent and reference any physical application or proof submitted..."
            required
            helperText="Minimum 5 characters. Will be logged in the permanent audit trail."
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setCorrectionModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-brandText-secondary bg-surface border border-border rounded-md hover:bg-surface-subtle transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-academic hover:bg-academic-dark rounded-md transition disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
