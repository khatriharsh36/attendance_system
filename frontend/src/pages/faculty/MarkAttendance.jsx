import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { FormField } from '../../components/FormField';
import { Modal } from '../../components/Modal';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';
import {
  CheckSquare,
  Search,
  CheckCircle,
  XCircle,
  Plus,
  Save,
  Users,
  Calendar,
  Clock,
  Sparkles,
} from 'lucide-react';

export const MarkAttendance = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(searchParams.get('courseId') || '');
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); // { [studentId]: 'present' | 'absent' }
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New Session Modal State
  const [newSessionModalOpen, setNewSessionModalOpen] = useState(false);
  const [newSessionDate, setNewSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [newStartTime, setNewStartTime] = useState('09:15');
  const [newEndTime, setNewEndTime] = useState('10:15');
  const [newTopic, setNewTopic] = useState('');
  const [creatingSession, setCreatingSession] = useState(false);

  // 1. Fetch assigned courses on boot
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

  // 2. Fetch sessions & students whenever selected course changes
  useEffect(() => {
    if (!selectedCourseId) return;

    const loadCourseData = async () => {
      try {
        setLoading(true);
        const [sessRes, rosterRes] = await Promise.all([
          api.get(`/sessions/course/${selectedCourseId}`),
          api.get(`/faculty/courses/${selectedCourseId}/students`),
        ]);

        const sessList = sessRes.data.sessions || [];
        const studentList = rosterRes.data.students || [];

        setSessions(sessList);
        setStudents(studentList);

        if (sessList.length > 0) {
          const firstId = sessList[0]._id;
          setSelectedSessionId(firstId);
          // Preload existing attendance for this session
          await loadSessionAttendance(firstId, studentList);
        } else {
          setSelectedSessionId('');
          // Initialize roster as all present by default for convenience
          const initialMap = {};
          studentList.forEach((s) => (initialMap[s._id] = 'present'));
          setAttendanceMap(initialMap);
        }
      } catch (err) {
        console.error('Failed to load course details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
  }, [selectedCourseId]);

  // Load existing records for a session if already marked
  const loadSessionAttendance = async (sessionId, currentStudents = students) => {
    try {
      const res = await api.get(`/attendance/session/${sessionId}`);
      const records = res.data.records || [];
      const map = {};

      if (records.length > 0) {
        records.forEach((r) => {
          map[r.studentId._id] = r.status;
        });
      } else {
        // Not marked yet: initialize all as present
        currentStudents.forEach((s) => {
          map[s._id] = 'present';
        });
      }

      setAttendanceMap(map);
    } catch (err) {
      console.error('Failed to load session attendance:', err);
    }
  };

  const handleSessionChange = async (e) => {
    const sId = e.target.value;
    setSelectedSessionId(sId);
    if (sId) {
      await loadSessionAttendance(sId);
    }
  };

  // Toggle single student
  const handleToggleStatus = (studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  // Bulk actions
  const handleMarkAll = (status) => {
    const newMap = {};
    students.forEach((s) => {
      newMap[s._id] = status;
    });
    setAttendanceMap(newMap);
    showToast(`Marked all students as ${status}.`, 'info');
  };

  // Create new session
  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!newSessionDate || !newStartTime || !newEndTime) {
      showToast('Date, start time, and end time are required.', 'error');
      return;
    }

    try {
      setCreatingSession(true);
      const res = await api.post('/sessions', {
        courseId: selectedCourseId,
        sessionDate: newSessionDate,
        startTime: newStartTime,
        endTime: newEndTime,
        topic: newTopic || 'Regular Class Session',
      });

      showToast('New session created.', 'success');
      setNewSessionModalOpen(false);

      // Refresh sessions
      const sessRes = await api.get(`/sessions/course/${selectedCourseId}`);
      const sessList = sessRes.data.sessions || [];
      setSessions(sessList);
      if (res.data.session) {
        setSelectedSessionId(res.data.session._id);
        const map = {};
        students.forEach((s) => (map[s._id] = 'present'));
        setAttendanceMap(map);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create session.';
      showToast(msg, 'error');
    } finally {
      setCreatingSession(false);
    }
  };

  // Save Attendance to Backend
  const handleSaveAttendance = async () => {
    if (!selectedSessionId) {
      showToast('Please select or create a session first.', 'error');
      return;
    }

    // Build records array
    const records = students.map((s) => ({
      studentId: s._id,
      status: attendanceMap[s._id] || 'absent',
    }));

    try {
      setSaving(true);
      const res = await api.post('/attendance', {
        sessionId: selectedSessionId,
        records,
      });

      showToast(
        `Attendance recorded: ${res.data.presentCount} Present, ${res.data.absentCount} Absent.`,
        'success'
      );
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to record attendance.';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Filtered roster by search
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const term = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        (s.studentId && s.studentId.toLowerCase().includes(term))
    );
  }, [students, searchQuery]);

  // Live counts
  const presentCount = useMemo(() => {
    return Object.values(attendanceMap).filter((st) => st === 'present').length;
  }, [attendanceMap]);

  const absentCount = students.length - presentCount;
  const selectedCourse = courses.find((c) => c._id === selectedCourseId);
  const selectedSession = sessions.find((s) => s._id === selectedSessionId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mark Class Attendance"
        subtitle="Take, review, or edit attendance for your assigned theory lectures and practical lab sessions."
        actions={
          <button
            onClick={() => setNewSessionModalOpen(true)}
            disabled={!selectedCourseId}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-academic hover:bg-academic-dark rounded-md shadow-xs transition disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Session</span>
          </button>
        }
      />

      {/* Course & Session Selector Bar */}
      <div className="bg-surface rounded-card border border-border shadow-card p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
            Select Assigned Course
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-surface-muted rounded-md border border-border text-navy font-medium focus:border-academic focus:bg-surface transition"
          >
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.code} — {c.name} ({c.type === 'theory' ? 'Theory' : `Lab ${c.batch ? `(${c.batch})` : ''}`} • Div {c.division})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
            Class Session
          </label>
          <select
            value={selectedSessionId}
            onChange={handleSessionChange}
            disabled={sessions.length === 0}
            className="w-full px-3 py-2 text-sm bg-surface-muted rounded-md border border-border text-navy font-medium focus:border-academic focus:bg-surface transition disabled:opacity-50"
          >
            {sessions.length > 0 ? (
              sessions.map((s) => (
                <option key={s._id} value={s._id}>
                  {formatDate(s.sessionDate)} ({s.startTime} - {s.endTime}) — {s.topic}
                </option>
              ))
            ) : (
              <option value="">No sessions conducted yet. Click 'Create New Session'</option>
            )}
          </select>
        </div>
      </div>

      {/* Attendance Workspace Toolbar */}
      {selectedCourse && (
        <div className="bg-surface rounded-card border border-border shadow-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-16 z-20">
          {/* Left: Quick search & counts */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brandText-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search PRN or Name..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-muted border border-border rounded-md text-navy focus:bg-surface focus:border-academic"
              />
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="px-2.5 py-1 rounded bg-status-success-bg border border-status-success/30 font-bold text-status-success tabular-nums">
                {presentCount} Present
              </div>
              <div className="px-2.5 py-1 rounded bg-status-danger-bg border border-status-danger/30 font-bold text-status-danger tabular-nums">
                {absentCount} Absent
              </div>
              <span className="text-brandText-secondary text-[11px]">
                Total: {students.length}
              </span>
            </div>
          </div>

          {/* Right: Bulk controls & Submit */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleMarkAll('present')}
              className="px-2.5 py-1.5 text-xs font-semibold text-brandText-secondary bg-surface border border-border rounded hover:bg-surface-subtle transition"
            >
              All Present
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll('absent')}
              className="px-2.5 py-1.5 text-xs font-semibold text-brandText-secondary bg-surface border border-border rounded hover:bg-surface-subtle transition"
            >
              All Absent
            </button>
            <button
              type="button"
              onClick={handleSaveAttendance}
              disabled={saving || !selectedSessionId}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-academic hover:bg-academic-dark rounded shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Student Roster Table */}
      <div className="bg-surface rounded-card border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-surface-subtle/70 border-b border-border text-xs uppercase font-semibold text-brandText-secondary tracking-wider">
                <th className="py-3 px-4 w-12">#</th>
                <th className="py-3 px-4">Student PRN</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Division / Batch</th>
                <th className="py-3 px-4 text-center">Attendance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => {
                  const currentStatus = attendanceMap[student._id] || 'present';
                  const isPresent = currentStatus === 'present';

                  return (
                    <tr
                      key={student._id}
                      className={`transition ${
                        isPresent ? 'hover:bg-surface-muted/40' : 'bg-status-danger-bg/20 hover:bg-status-danger-bg/40'
                      }`}
                    >
                      <td className="py-3 px-4 text-xs font-mono text-brandText-muted">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono font-bold text-navy">
                        {student.studentId}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-brandText-main">
                        {student.name}
                      </td>
                      <td className="py-3 px-4 text-xs text-brandText-secondary">
                        Div {student.division} {student.batch ? `• Batch ${student.batch}` : ''}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(student._id, 'present')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold border transition ${
                              isPresent
                                ? 'bg-status-success text-white border-status-success shadow-xs'
                                : 'bg-surface text-brandText-secondary border-border hover:bg-surface-subtle'
                            }`}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Present</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(student._id, 'absent')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold border transition ${
                              !isPresent
                                ? 'bg-status-danger text-white border-status-danger shadow-xs'
                                : 'bg-surface text-brandText-secondary border-border hover:bg-surface-subtle'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Absent</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-brandText-secondary">
                    {students.length === 0
                      ? 'No students enrolled in this course.'
                      : 'No students matching the search query.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create New Session Modal */}
      <Modal
        isOpen={newSessionModalOpen}
        onClose={() => setNewSessionModalOpen(false)}
        title="Schedule / Record New Class Session"
        subtitle={`Course: ${selectedCourse?.code} — ${selectedCourse?.name}`}
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
                Session Date <span className="text-status-danger">*</span>
              </label>
              <input
                type="date"
                required
                max={new Date().toISOString().split('T')[0]} // Constraint: Cannot record future dates
                value={newSessionDate}
                onChange={(e) => setNewSessionDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-surface rounded-md border border-border text-navy focus:border-academic"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
                Start Time <span className="text-status-danger">*</span>
              </label>
              <input
                type="time"
                required
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-surface rounded-md border border-border text-navy focus:border-academic"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
                End Time <span className="text-status-danger">*</span>
              </label>
              <input
                type="time"
                required
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-surface rounded-md border border-border text-navy focus:border-academic"
              />
            </div>
          </div>

          <FormField
            label="Lecture Topic / Lab Assignment"
            id="topic"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            placeholder="e.g. Synchronization with Mutex and Semaphores"
            required
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setNewSessionModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-brandText-secondary bg-surface border border-border rounded-md hover:bg-surface-subtle transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingSession}
              className="px-4 py-2 text-xs font-semibold text-white bg-academic hover:bg-academic-dark rounded-md transition disabled:opacity-50"
            >
              {creatingSession ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
