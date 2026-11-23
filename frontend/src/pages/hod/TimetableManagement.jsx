import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { TimetableGrid } from '../../components/TimetableGrid';
import { Modal } from '../../components/Modal';
import { FormField } from '../../components/FormField';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';
import { Plus, Trash2, Calendar, MapPin, AlertCircle } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const TimetableManagement = () => {
  const { showToast } = useToast();

  const [timetable, setTimetable] = useState([]);
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Slot Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [newSlot, setNewSlot] = useState({
    courseId: '',
    facultyId: '',
    day: 'Monday',
    startTime: '09:15',
    endTime: '10:15',
    room: 'Room 304',
    division: 'A',
    batch: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchTimetableData = async () => {
    try {
      setLoading(true);
      const [tRes, cRes, fRes] = await Promise.all([
        api.get('/timetable'),
        api.get('/courses'),
        api.get('/hod/faculty'),
      ]);
      setTimetable(tRes.data.slots || []);
      setCourses(cRes.data.courses || []);
      setFaculty(fRes.data.faculty || []);

      if (cRes.data.courses?.length > 0 && !newSlot.courseId) {
        setNewSlot((prev) => ({
          ...prev,
          courseId: cRes.data.courses[0]._id,
          facultyId: cRes.data.courses[0].facultyId?._id || '',
        }));
      }
    } catch (err) {
      console.error('Failed to load timetable data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetableData();
  }, []);

  const handleCourseChange = (e) => {
    const cId = e.target.value;
    const selected = courses.find((c) => c._id === cId);
    setNewSlot((prev) => ({
      ...prev,
      courseId: cId,
      division: selected?.division || 'A',
      batch: selected?.batch || '',
      facultyId: selected?.facultyId?._id || prev.facultyId,
    }));
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!newSlot.courseId || !newSlot.facultyId || !newSlot.room) {
      showToast('Course, faculty, and room are required.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/timetable', newSlot);
      showToast('Timetable slot added successfully.', 'success');
      setModalOpen(false);
      fetchTimetableData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Conflict detected or invalid slot.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this timetable slot?')) return;

    try {
      await api.delete(`/timetable/${slotId}`);
      showToast('Slot removed from timetable.', 'success');
      fetchTimetableData();
    } catch (err) {
      showToast('Failed to delete slot.', 'error');
    }
  };

  if (loading && timetable.length === 0) {
    return (
      <div>
        <div className="h-8 bg-surface-subtle rounded w-1/4 mb-6 animate-pulse" />
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  const daysArr = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = daysArr[new Date().getDay()];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Timetable & Schedule Governance"
        subtitle="Manage master class scheduling with automated room, faculty, and division conflict rejection."
        actions={
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-academic hover:bg-academic-dark rounded-md shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class Slot</span>
          </button>
        }
      />

      <div className="p-4 bg-surface rounded-card border border-border text-xs text-brandText-secondary flex items-start gap-2.5 shadow-xs">
        <AlertCircle className="w-4 h-4 text-academic shrink-0 mt-0.5" />
        <span>
          <strong>Conflict Detection Active:</strong> The system automatically prevents scheduling overlapping slots for the same classroom/lab, the same faculty instructor, or the same student division/batch group.
        </span>
      </div>

      {/* Weekly Grid */}
      <TimetableGrid slots={timetable} currentDay={currentDay} />

      {/* Slot Listing & Deletion Table */}
      <div className="bg-surface rounded-card border border-border shadow-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy">All Scheduled Slots ({timetable.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-surface-subtle/70 border-b border-border text-brandText-secondary uppercase">
              <tr>
                <th className="py-2.5 px-4">Day & Time</th>
                <th className="py-2.5 px-4">Course</th>
                <th className="py-2.5 px-4">Instructor</th>
                <th className="py-2.5 px-4">Room</th>
                <th className="py-2.5 px-4">Group</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {timetable.map((slot) => (
                <tr key={slot._id} className="hover:bg-surface-muted/40 transition">
                  <td className="py-2.5 px-4 font-semibold text-navy font-mono">
                    {slot.day} {slot.startTime} - {slot.endTime}
                  </td>
                  <td className="py-2.5 px-4 font-medium text-navy">
                    {slot.courseId?.code}: {slot.courseId?.name} ({slot.courseId?.type})
                  </td>
                  <td className="py-2.5 px-4 text-brandText-secondary">
                    {slot.facultyId?.name}
                  </td>
                  <td className="py-2.5 px-4 text-brandText-main font-mono">
                    {slot.room}
                  </td>
                  <td className="py-2.5 px-4 text-brandText-secondary">
                    Div {slot.division} {slot.batch ? `(Batch ${slot.batch})` : ''}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => handleDeleteSlot(slot._id)}
                      className="p-1 text-brandText-muted hover:text-status-danger rounded transition"
                      title="Delete Slot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Slot Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Schedule New Timetable Slot"
        subtitle="Automated conflict detection will validate room, faculty, and student availability"
      >
        <form onSubmit={handleCreateSlot} className="space-y-4">
          <FormField
            label="Course Offering"
            id="courseId"
            type="select"
            value={newSlot.courseId}
            onChange={handleCourseChange}
            options={courses.map((c) => ({
              label: `${c.code} — ${c.name} (${c.type === 'theory' ? 'Theory' : `Lab ${c.batch || ''}`} • Div ${c.division})`,
              value: c._id,
            }))}
            required
          />

          <FormField
            label="Faculty Instructor"
            id="facultyId"
            type="select"
            value={newSlot.facultyId}
            onChange={(e) => setNewSlot({ ...newSlot, facultyId: e.target.value })}
            options={faculty.map((f) => ({
              label: `${f.name} (${f.facultyId})`,
              value: f._id,
            }))}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField
              label="Day of Week"
              id="day"
              type="select"
              value={newSlot.day}
              onChange={(e) => setNewSlot({ ...newSlot, day: e.target.value })}
              options={DAYS.map((d) => ({ label: d, value: d }))}
              required
            />

            <FormField
              label="Start Time"
              id="startTime"
              type="time"
              value={newSlot.startTime}
              onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
              required
            />

            <FormField
              label="End Time"
              id="endTime"
              type="time"
              value={newSlot.endTime}
              onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField
              label="Classroom / Lab Location"
              id="room"
              value={newSlot.room}
              onChange={(e) => setNewSlot({ ...newSlot, room: e.target.value })}
              placeholder="e.g. Room 304, Lab 2B"
              required
            />

            <FormField
              label="Division"
              id="division"
              type="select"
              value={newSlot.division}
              onChange={(e) => setNewSlot({ ...newSlot, division: e.target.value })}
              options={['A', 'B', 'C', 'D'].map((d) => ({ label: `Division ${d}`, value: d }))}
              required
            />

            <FormField
              label="Batch (Optional for Lab)"
              id="batch"
              value={newSlot.batch}
              onChange={(e) => setNewSlot({ ...newSlot, batch: e.target.value })}
              placeholder="e.g. A1, B1"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-brandText-secondary bg-surface border border-border rounded hover:bg-surface-subtle"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-academic hover:bg-academic-dark rounded transition shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Validating Conflicts...' : 'Save Schedule Slot'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
