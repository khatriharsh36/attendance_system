import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { AttendanceBadge } from '../../components/AttendanceBadge';
import { AttendanceProgress } from '../../components/AttendanceProgress';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { ArrowRight, Filter, Calculator } from 'lucide-react';

export const MyAttendance = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await api.get('/students/me/attendance');
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch attendance:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  const courses = data?.courses || [];
  const threshold = data?.threshold || 75;

  const filteredCourses = useMemo(() => {
    if (filterType === 'all') return courses;
    return courses.filter((c) => c.type === filterType);
  }, [courses, filterType]);

  const columns = [
    {
      header: 'Course Code & Name',
      accessor: 'courseCode',
      sortable: true,
      render: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-academic bg-academic-soft px-1.5 py-0.5 rounded">
              {row.courseCode}
            </span>
            <span className="font-semibold text-navy">{row.courseName}</span>
          </div>
          <div className="text-[11px] text-brandText-secondary mt-0.5">
            Faculty: {row.facultyName}
          </div>
        </div>
      ),
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
      header: 'Attendance Ratio',
      accessor: 'attendedSessions',
      sortable: true,
      render: (row) => (
        <div className="text-xs">
          <div className="font-bold text-navy tabular-nums">
            {row.attendedSessions} / {row.conductedSessions}
          </div>
          <div className="w-24 mt-1">
            <AttendanceProgress percentage={row.percentage} threshold={threshold} showLabel={false} height="h-1.5" />
          </div>
        </div>
      ),
    },
    {
      header: 'Percentage & Status',
      accessor: 'percentage',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <AttendanceBadge percentage={row.percentage} status={row.status} />
        </div>
      ),
    },
    {
      header: 'Forecasting Advice',
      accessor: 'classesNeeded',
      render: (row) => (
        <div className="text-xs">
          {row.isShortage ? (
            <span className="text-status-danger font-medium">
              Need {row.classesNeeded} consecutive sessions
            </span>
          ) : (
            <span className="text-status-success font-medium">
              Can miss {row.canMiss} sessions safely
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Action',
      accessor: 'actions',
      render: (row) => (
        <Link
          to={`/student/courses/${row.courseId}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-academic hover:bg-academic-soft rounded border border-academic/20 transition"
        >
          <span>Sessions</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      ),
    },
  ];

  if (loading) {
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
        title="My Course Attendance"
        subtitle={`Real-time attendance tracking for Semester enrolled subjects. Minimum department eligibility threshold is ${threshold}%.`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/student/calculator"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-academic hover:bg-academic-dark rounded-md transition"
            >
              <Calculator className="w-4 h-4" />
              <span>Forecast Calculator</span>
            </Link>
          </div>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-surface rounded-lg border border-border shadow-xs text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 font-medium rounded-md transition ${
              filterType === 'all'
                ? 'bg-academic text-white font-semibold'
                : 'text-brandText-secondary hover:text-brandText-main'
            }`}
          >
            All Courses ({courses.length})
          </button>
          <button
            onClick={() => setFilterType('theory')}
            className={`px-3 py-1.5 font-medium rounded-md transition ${
              filterType === 'theory'
                ? 'bg-academic text-white font-semibold'
                : 'text-brandText-secondary hover:text-brandText-main'
            }`}
          >
            Theory ({courses.filter((c) => c.type === 'theory').length})
          </button>
          <button
            onClick={() => setFilterType('practical')}
            className={`px-3 py-1.5 font-medium rounded-md transition ${
              filterType === 'practical'
                ? 'bg-academic text-white font-semibold'
                : 'text-brandText-secondary hover:text-brandText-main'
            }`}
          >
            Practicals ({courses.filter((c) => c.type === 'practical').length})
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredCourses}
        searchPlaceholder="Search by code or course name..."
        searchKey="courseName"
        emptyMessage="No courses found matching the selected filter."
      />
    </div>
  );
};
