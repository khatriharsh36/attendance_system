import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { FormField } from '../../components/FormField';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';
import { History, Eye, Edit3, CheckCircle, XCircle, Clock } from 'lucide-react';

export const AttendanceHistory = () => {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(searchParams.get('courseId') || '');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Session Details & Edit Modal
  const [activeSession, setActiveSession] = useState(null);
  const [sessionRecords, setSessionRecords] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editStatus, setEditStatus] = useState('present');
  const [editRemark, setEditRemark] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/faculty/me/courses');
        const list = res.data.courses || [];
        setCourses(list);
        if (list.length > 0 && !selectedCourseId) {
          setSelectedCourseId(list[0]._id);
        }
      } catch (err) {
        showToast('Failed to load courses.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const fetchSessions = async (courseId) => {
    if (!courseId) return;
    try {
      setLoading(true);
      const res = await api.get(`/sessions/course/${courseId}`);
      setSessions(res.data.sessions || []);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      fetchSessions(selectedCourseId);
    }
  }, [selectedCourseId]);

  const handleOpenDetails = async (session) => {
    try {
      setActiveSession(session);
      const res = await api.get(`/attendance/session/${session._id}`);
      setSessionRecords(res.data.records || []);
      setModalOpen(true);
    } catch (err) {
      showToast('Failed to load session attendance records.', 'error');
    }
  };

  const handleStartEdit = (record) => {
    setEditingRecord(record);
    setEditStatus(record.status === 'present' ? 'absent' : 'present');
    setEditRemark('');
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    if (!editRemark.trim()) {
      showToast('Please provide a mandatory reason for manual attendance modification.', 'error');
      return;
    }

    try {
      setUpdating(true);
      await api.put(`/attendance/${editingRecord._id}`, {
        status: editStatus,
        remark: editRemark.trim(),
      });

      showToast('Attendance record updated and audit log recorded.', 'success');

      // Refresh records inside modal
      const res = await api.get(`/attendance/session/${activeSession._id}`);
      setSessionRecords(res.data.records || []);
      setEditingRecord(null);

      // Refresh sessions table to reflect updated counts
      fetchSessions(selectedCourseId);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update record.';
      showToast(msg, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const columns = [
    {
      header: 'Date & Time',
      accessor: 'sessionDate',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-semibold text-navy">{formatDate(row.sessionDate)}</div>
          <div className="text-[11px] text-brandText-secondary font-mono">
            {row.startTime} - {row.endTime}
          </div>
        </div>
      ),
    },
    {
      header: 'Topic Covered',
      accessor: 'topic',
      render: (row) => (
        <span className="font-medium text-navy text-xs">{row.topic}</span>
      ),
    },
    {
      header: 'Present / Absent',
      accessor: 'presentCount',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2 text-xs tabular-nums">
          <span className="px-2 py-0.5 rounded bg-status-success-bg text-status-success font-bold border border-status-success/30">
            {row.presentCount} Present
          </span>
          <span className="px-2 py-0.5 rounded bg-status-danger-bg text-status-danger font-bold border border-status-danger/30">
            {row.absentCount} Absent
          </span>
        </div>
      ),
    },
    {
      header: 'Attendance %',
      accessor: 'presentCount',
      render: (row) => {
        const total = row.presentCount + row.absentCount;
        const pct = total > 0 ? ((row.presentCount / total) * 100).toFixed(1) : 0;
        return (
          <span className="font-bold text-navy tabular-nums text-xs">
            {pct}%
          </span>
        );
      },
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <button
          onClick={() => handleOpenDetails(row)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-academic hover:bg-academic-soft rounded border border-academic/20 transition"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View / Audit</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Session History & Audit"
        subtitle="Review conducted class logs and execute audited individual attendance adjustments."
      />

      {/* Course Selector */}
      <div className="bg-surface rounded-card border border-border shadow-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-navy shrink-0">
          Select Course:
        </label>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="w-full sm:w-96 px-3 py-1.5 text-xs bg-surface-muted rounded-md border border-border text-navy focus:border-academic"
        >
          {courses.map((c) => (
            <option key={c._id} value={c._id}>
              {c.code} — {c.name} ({c.type === 'theory' ? 'Theory' : `Lab ${c.batch ? `(${c.batch})` : ''}`} • Div {c.division})
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={sessions}
        searchPlaceholder="Search by lecture topic or date..."
        searchKey="topic"
        emptyMessage="No conducted sessions recorded for this course."
      />

      {/* Session Details & Single Record Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingRecord(null);
        }}
        title={`Session Roster: ${activeSession ? formatDate(activeSession.sessionDate) : ''}`}
        subtitle={`Topic: ${activeSession?.topic} • ${activeSession?.startTime} - ${activeSession?.endTime}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {editingRecord ? (
            /* Edit Single Record Sub-Form */
            <div className="p-4 bg-surface-muted rounded-md border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-navy">
                  Modify Record for: {editingRecord.studentId?.name} ({editingRecord.studentId?.studentId})
                </span>
                <span className="text-xs text-brandText-muted">
                  Current: <strong className="uppercase">{editingRecord.status}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setEditStatus('present')}
                  className={`py-1.5 text-xs font-semibold rounded border transition ${
                    editStatus === 'present'
                      ? 'bg-status-success text-white border-status-success'
                      : 'bg-surface text-brandText-secondary border-border'
                  }`}
                >
                  Change to Present
                </button>
                <button
                  type="button"
                  onClick={() => setEditStatus('absent')}
                  className={`py-1.5 text-xs font-semibold rounded border transition ${
                    editStatus === 'absent'
                      ? 'bg-status-danger text-white border-status-danger'
                      : 'bg-surface text-brandText-secondary border-border'
                  }`}
                >
                  Change to Absent
                </button>
              </div>

              <FormField
                label="Reason / Audit Note (Required)"
                id="editRemark"
                value={editRemark}
                onChange={(e) => setEditRemark(e.target.value)}
                placeholder="e.g. Student provided physical attendance slip signed by faculty..."
                required
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-3 py-1.5 text-xs font-medium text-brandText-secondary bg-surface border border-border rounded hover:bg-surface-subtle"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={updating}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-academic hover:bg-academic-dark rounded shadow-xs transition"
                >
                  {updating ? 'Saving...' : 'Save & Log Audit'}
                </button>
              </div>
            </div>
          ) : null}

          {/* Records Table */}
          <div className="max-h-96 overflow-y-auto border border-border rounded-md">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface-subtle border-b border-border text-brandText-secondary uppercase sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">PRN</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessionRecords.map((rec) => {
                  const isPresent = rec.status === 'present';
                  return (
                    <tr key={rec._id} className="hover:bg-surface-muted/40 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-navy">
                        {rec.studentId?.studentId}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-brandText-main">
                        {rec.studentId?.name}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold border ${
                            isPresent
                              ? 'bg-status-success-bg text-status-success border-status-success/30'
                              : 'bg-status-danger-bg text-status-danger border-status-danger/30'
                          }`}
                        >
                          {isPresent ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span className="capitalize">{rec.status}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleStartEdit(rec)}
                          className="p-1 text-brandText-secondary hover:text-navy rounded transition"
                          title="Modify record"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
};
