import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { AttendanceBadge } from '../../components/AttendanceBadge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { Users, Filter, CheckCircle, AlertTriangle } from 'lucide-react';

export const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [divisionFilter, setDivisionFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (divisionFilter) params.division = divisionFilter;
      if (semesterFilter) params.semester = semesterFilter;

      const res = await api.get('/hod/students', { params });
      setStudents(res.data.students || []);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [divisionFilter, semesterFilter]);

  const columns = [
    {
      header: 'PRN',
      accessor: 'studentId',
      sortable: true,
      render: (row) => <span className="font-mono font-bold text-navy">{row.studentId}</span>,
    },
    {
      header: 'Student Name',
      accessor: 'name',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-semibold text-brandText-main">{row.name}</span>
          <div className="text-[11px] text-brandText-secondary">{row.email}</div>
        </div>
      ),
    },
    {
      header: 'Year & Class',
      accessor: 'division',
      render: (row) => (
        <span className="text-xs text-brandText-secondary">
          Sem {row.semester} • Div {row.division}
        </span>
      ),
    },
    {
      header: 'Enrolled Courses',
      accessor: 'enrolledCoursesCount',
      sortable: true,
      render: (row) => <span className="tabular-nums font-semibold text-navy">{row.enrolledCoursesCount}</span>,
    },
    {
      header: 'Attended / Conducted',
      accessor: 'attendedSessions',
      sortable: true,
      render: (row) => (
        <span className="tabular-nums font-semibold text-navy">
          {row.attendedSessions} / {row.conductedSessions}
        </span>
      ),
    },
    {
      header: 'Aggregate Attendance',
      accessor: 'attendancePercentage',
      sortable: true,
      render: (row) => <AttendanceBadge percentage={row.attendancePercentage} status={row.status} />,
    },
    {
      header: 'Status',
      accessor: 'isShortage',
      render: (row) =>
        row.isShortage ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-status-danger">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Shortage</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-status-success">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Eligible</span>
          </span>
        ),
    },
  ];

  if (loading && students.length === 0) {
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
        title="Department Student Directory"
        subtitle="Manage enrolled students, filter by division, and monitor institutional attendance compliance."
      />

      {/* Filters Bar */}
      <div className="p-4 bg-surface rounded-card border border-border shadow-card flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-brandText-secondary">
          <Filter className="w-4 h-4 text-academic" />
          <span>Filters:</span>
        </div>

        <div>
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-surface-muted border border-border rounded-md text-navy focus:border-academic"
          >
            <option value="">All Divisions</option>
            <option value="A">Division A</option>
            <option value="B">Division B</option>
            <option value="C">Division C</option>
          </select>
        </div>

        <div>
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-surface-muted border border-border rounded-md text-navy focus:border-academic"
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>
        </div>

        {(divisionFilter || semesterFilter) && (
          <button
            onClick={() => {
              setDivisionFilter('');
              setSemesterFilter('');
            }}
            className="text-xs text-academic hover:underline font-semibold"
          >
            Reset Filters
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={students}
        searchPlaceholder="Search student by PRN, Name, or Email..."
        searchKey="name"
        emptyMessage="No students found matching the selected criteria."
      />
    </div>
  );
};
