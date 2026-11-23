import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { FormField } from '../../components/FormField';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';
import { Plus, UserCheck, BookOpen, Users, Edit3 } from 'lucide-react';

export const CourseManagement = () => {
  const { showToast } = useToast();

  const [courses, setCourses] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Course Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({
    code: '',
    name: '',
    semester: '5',
    type: 'theory',
    division: 'A',
    batch: '',
    credits: '3',
    facultyId: '',
  });
  const [creating, setCreating] = useState(false);

  // Assign Faculty Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [assignedFacultyId, setAssignedFacultyId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchCoursesAndFaculty = async () => {
    try {
      setLoading(true);
      const [cRes, fRes] = await Promise.all([
        api.get('/courses'),
        api.get('/hod/faculty'),
      ]);
      setCourses(cRes.data.courses || []);
      setFacultyList(fRes.data.faculty || []);
    } catch (err) {
      console.error('Failed to load courses & faculty:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoursesAndFaculty();
  }, []);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newCourse.code || !newCourse.name) {
      showToast('Course code and name are required.', 'error');
      return;
    }

    try {
      setCreating(true);
      await api.post('/courses', {
        ...newCourse,
        semester: Number(newCourse.semester),
        credits: Number(newCourse.credits),
        batch: newCourse.batch || null,
        facultyId: newCourse.facultyId || null,
      });

      showToast(`Course offering ${newCourse.code} created successfully.`, 'success');
      setCreateModalOpen(false);
      setNewCourse({
        code: '',
        name: '',
        semester: '5',
        type: 'theory',
        division: 'A',
        batch: '',
        credits: '3',
        facultyId: '',
      });
      fetchCoursesAndFaculty();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create course.';
      showToast(msg, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenAssign = (course) => {
    setSelectedCourse(course);
    setAssignedFacultyId(course.facultyId?._id || '');
    setAssignModalOpen(true);
  };

  const handleConfirmAssign = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return;

    try {
      setAssigning(true);
      await api.patch(`/courses/${selectedCourse._id}/assign-faculty`, {
        facultyId: assignedFacultyId || null,
      });

      showToast(`Faculty assignment updated for ${selectedCourse.code}.`, 'success');
      setAssignModalOpen(false);
      fetchCoursesAndFaculty();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to assign faculty.';
      showToast(msg, 'error');
    } finally {
      setAssigning(false);
    }
  };

  const columns = [
    {
      header: 'Code',
      accessor: 'code',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-academic bg-academic-soft px-1.5 py-0.5 rounded border border-academic/20">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Course Name',
      accessor: 'name',
      sortable: true,
      render: (row) => <span className="font-semibold text-navy">{row.name}</span>,
    },
    {
      header: 'Component',
      accessor: 'type',
      sortable: true,
      render: (row) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
            row.type === 'theory'
              ? 'bg-blue-50 text-academic border-academic/30'
              : 'bg-emerald-50 text-status-success border-status-success/30'
          }`}
        >
          {row.type === 'theory' ? 'Theory' : `Practical ${row.batch ? `(${row.batch})` : ''}`}
        </span>
      ),
    },
    {
      header: 'Division',
      accessor: 'division',
      render: (row) => (
        <span className="text-xs text-brandText-secondary">
          Sem {row.semester} • Div {row.division}
        </span>
      ),
    },
    {
      header: 'Assigned Faculty',
      accessor: 'facultyId',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.facultyId ? (
            <span className="text-xs font-semibold text-navy">{row.facultyId.name}</span>
          ) : (
            <span className="text-xs text-status-warning font-semibold italic">Unassigned</span>
          )}
          <button
            onClick={() => handleOpenAssign(row)}
            className="p-1 text-brandText-muted hover:text-academic rounded transition"
            title="Change Assigned Faculty"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
    {
      header: 'Credits',
      accessor: 'credits',
      sortable: true,
      render: (row) => <span className="text-xs tabular-nums text-brandText-secondary">{row.credits} Cr</span>,
    },
  ];

  if (loading && courses.length === 0) {
    return (
      <div>
        <div className="h-8 bg-surface-subtle rounded w-1/4 mb-6 animate-pulse" />
        <LoadingSkeleton type="table" count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Course Offerings & Faculty Assignment"
        subtitle="Provision curriculum subjects, assign instructors, and configure theory/practical components."
        actions={
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-academic hover:bg-academic-dark rounded-md shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Course Offering</span>
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={courses}
        searchPlaceholder="Search by course code, name, faculty..."
        searchKey="name"
        emptyMessage="No course offerings found."
      />

      {/* Create Course Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add New Course Offering"
        subtitle="Department curriculum configuration"
      >
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Course Code"
              id="code"
              value={newCourse.code}
              onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value.toUpperCase() })}
              placeholder="e.g. CS505"
              required
            />
            <FormField
              label="Course Name"
              id="name"
              value={newCourse.name}
              onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
              placeholder="e.g. Software Engineering"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              label="Course Component"
              id="type"
              type="select"
              value={newCourse.type}
              onChange={(e) =>
                setNewCourse({
                  ...newCourse,
                  type: e.target.value,
                  credits: e.target.value === 'theory' ? '3' : '1',
                })
              }
              options={[
                { label: 'Theory Lecture', value: 'theory' },
                { label: 'Practical Lab', value: 'practical' },
              ]}
              required
            />

            <FormField
              label="Semester"
              id="semester"
              type="select"
              value={newCourse.semester}
              onChange={(e) => setNewCourse({ ...newCourse, semester: e.target.value })}
              options={[1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({ label: `Semester ${s}`, value: s.toString() }))}
              required
            />

            <FormField
              label="Division"
              id="division"
              type="select"
              value={newCourse.division}
              onChange={(e) => setNewCourse({ ...newCourse, division: e.target.value })}
              options={['A', 'B', 'C', 'D'].map((d) => ({ label: `Division ${d}`, value: d }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Lab Batch (Optional for Practical)"
              id="batch"
              value={newCourse.batch}
              onChange={(e) => setNewCourse({ ...newCourse, batch: e.target.value.toUpperCase() })}
              placeholder="e.g. A1, A2 (Leave blank for Theory)"
            />

            <FormField
              label="Credits"
              id="credits"
              type="number"
              value={newCourse.credits}
              onChange={(e) => setNewCourse({ ...newCourse, credits: e.target.value })}
              required
            />
          </div>

          <FormField
            label="Assign Faculty Instructor"
            id="facultyId"
            type="select"
            value={newCourse.facultyId}
            onChange={(e) => setNewCourse({ ...newCourse, facultyId: e.target.value })}
            placeholder="— Select Faculty Instructor (or assign later) —"
            options={facultyList.map((f) => ({
              label: `${f.name} (${f.facultyId})`,
              value: f._id,
            }))}
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-brandText-secondary bg-surface border border-border rounded hover:bg-surface-subtle"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 text-xs font-semibold text-white bg-academic hover:bg-academic-dark rounded transition shadow-xs disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Course Offering'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Faculty Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Faculty Instructor"
        subtitle={`Course: ${selectedCourse?.code} — ${selectedCourse?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmAssign} className="space-y-4">
          <FormField
            label="Select Instructor"
            id="assignFaculty"
            type="select"
            value={assignedFacultyId}
            onChange={(e) => setAssignedFacultyId(e.target.value)}
            placeholder="— Select Faculty Member —"
            options={facultyList.map((f) => ({
              label: `${f.name} (${f.facultyId})`,
              value: f._id,
            }))}
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setAssignModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-brandText-secondary bg-surface border border-border rounded hover:bg-surface-subtle"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assigning}
              className="px-4 py-2 text-xs font-semibold text-white bg-academic hover:bg-academic-dark rounded transition shadow-xs disabled:opacity-50"
            >
              {assigning ? 'Saving...' : 'Update Assignment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
