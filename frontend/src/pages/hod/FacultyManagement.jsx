import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { GraduationCap, BookOpen, CheckSquare, Mail } from 'lucide-react';

export const FacultyManagement = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const res = await api.get('/hod/faculty');
        setFaculty(res.data.faculty || []);
      } catch (err) {
        console.error('Failed to load faculty:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFaculty();
  }, []);

  const columns = [
    {
      header: 'Employee ID & Name',
      accessor: 'name',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-semibold text-navy">{row.name}</span>
          <div className="font-mono text-[11px] text-academic">
            EMP ID: {row.facultyId}
          </div>
        </div>
      ),
    },
    {
      header: 'College Email',
      accessor: 'email',
      render: (row) => (
        <span className="text-xs text-brandText-secondary">{row.email}</span>
      ),
    },
    {
      header: 'Assigned Courses',
      accessor: 'courseCount',
      sortable: true,
      render: (row) => (
        <div className="space-y-1">
          <div className="font-bold text-navy tabular-nums text-xs">
            {row.courseCount} Courses Assigned
          </div>
          <div className="flex flex-wrap gap-1 max-w-xs">
            {row.assignedCourses.map((c) => (
              <span
                key={c._id}
                className="px-1.5 py-0.2 rounded bg-surface-subtle border border-border text-[10px] font-mono text-academic"
              >
                {c.code} ({c.type === 'theory' ? 'Th' : 'Lab'})
              </span>
            ))}
          </div>
        </div>
      ),
    },
    {
      header: 'Sessions Conducted',
      accessor: 'sessionsConducted',
      sortable: true,
      render: (row) => (
        <span className="tabular-nums font-bold text-navy text-xs">
          {row.sessionsConducted} Sessions
        </span>
      ),
    },
    {
      header: 'Action',
      accessor: 'actions',
      render: (row) => (
        <Link
          to="/hod/courses"
          className="text-xs font-semibold text-academic hover:underline"
        >
          Manage Assignments →
        </Link>
      ),
    },
  ];

  if (loading) {
    return (
      <div>
        <div className="h-8 bg-surface-subtle rounded w-1/4 mb-6 animate-pulse" />
        <LoadingSkeleton type="table" count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Faculty & Teaching Workload"
        subtitle="Overview of department instructors, teaching workloads, and conducted lecture statistics."
      />

      <DataTable
        columns={columns}
        data={faculty}
        searchPlaceholder="Search faculty by name or employee ID..."
        searchKey="name"
        emptyMessage="No faculty registered in this department."
      />
    </div>
  );
};
