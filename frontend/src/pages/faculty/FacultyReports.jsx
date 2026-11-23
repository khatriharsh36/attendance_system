import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { DataTable } from '../../components/DataTable';
import { AttendanceBadge } from '../../components/AttendanceBadge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';
import { Download, FileText, AlertTriangle, Users, BookOpen, CheckCircle } from 'lucide-react';

export const FacultyReports = () => {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(searchParams.get('courseId') || '');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const fetchReport = async (courseId) => {
    if (!courseId) return;
    try {
      setLoading(true);
      const res = await api.get(`/faculty/courses/${courseId}/report`);
      setReportData(res.data);
    } catch (err) {
      console.error('Failed to load course report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      fetchReport(selectedCourseId);
    }
  }, [selectedCourseId]);

  const handleExportCSV = () => {
    if (!selectedCourseId) return;
    window.open(`/api/faculty/courses/${selectedCourseId}/report?format=csv`, '_blank');
    showToast('Downloading CSV report...', 'info');
  };

  const columns = [
    {
      header: 'PRN',
      accessor: 'prn',
      sortable: true,
      render: (row) => <span className="font-mono font-bold text-navy">{row.prn}</span>,
    },
    {
      header: 'Student Name',
      accessor: 'name',
      sortable: true,
      render: (row) => <span className="font-semibold text-brandText-main">{row.name}</span>,
    },
    {
      header: 'Division',
      accessor: 'division',
      render: (row) => <span className="text-brandText-secondary">Div {row.division}</span>,
    },
    {
      header: 'Attended / Conducted',
      accessor: 'attendedSessions',
      sortable: true,
      render: (row) => (
        <span className="tabular-nums font-semibold text-navy">
          {row.attendedSessions} / {row.totalSessions}
        </span>
      ),
    },
    {
      header: 'Attendance %',
      accessor: 'percentage',
      sortable: true,
      render: (row) => <AttendanceBadge percentage={row.percentage} status={row.status} />,
    },
    {
      header: 'Eligibility Status',
      accessor: 'isShortage',
      render: (row) =>
        row.isShortage ? (
          <span className="inline-flex items-center gap-1 text-status-danger font-semibold text-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Shortage ({row.classesNeeded} classes needed)</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-status-success font-semibold text-xs">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Eligible</span>
          </span>
        ),
    },
  ];

  const course = reportData?.course || {};
  const students = reportData?.students || [];
  const belowThresholdList = reportData?.belowThresholdList || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Course Attendance Reports & Analytics"
        subtitle="Comprehensive course-level attendance roster, shortage eligibility, and official CSV records."
        actions={
          <button
            onClick={handleExportCSV}
            disabled={!selectedCourseId || students.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-academic hover:bg-academic-dark rounded-md shadow-xs transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Report</span>
          </button>
        }
      />

      {/* Course Selector */}
      <div className="bg-surface rounded-card border border-border shadow-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-navy shrink-0">
          Select Course for Report:
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

      {/* Report Summary Cards */}
      {reportData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Enrolled"
            value={reportData.totalEnrolled || 0}
            subtitle="Registered students in roster"
            icon={Users}
          />
          <StatCard
            title="Conducted Sessions"
            value={reportData.totalSessions || 0}
            subtitle="Total verified lecture sessions"
            icon={BookOpen}
          />
          <StatCard
            title="Below 75% Threshold"
            value={reportData.belowThresholdCount || 0}
            subtitle="Students with shortage warning"
            icon={AlertTriangle}
            variant={reportData.belowThresholdCount > 0 ? 'danger' : 'success'}
          />
        </div>
      )}

      {/* Roster Table */}
      <DataTable
        columns={columns}
        data={students}
        searchPlaceholder="Search student by PRN or Name..."
        searchKey="name"
        emptyMessage="No enrolled students found for this course."
      />
    </div>
  );
};
