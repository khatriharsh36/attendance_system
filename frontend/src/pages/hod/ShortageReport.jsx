import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';
import { Download, AlertTriangle, CheckCircle } from 'lucide-react';

export const ShortageReport = () => {
  const { showToast } = useToast();
  const [shortages, setShortages] = useState([]);
  const [threshold, setThreshold] = useState(75);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShortages = async () => {
      try {
        const res = await api.get('/hod/shortage-report');
        setShortages(res.data.shortageList || []);
        if (res.data?.threshold) setThreshold(res.data.threshold);
      } catch (err) {
        console.error('Failed to load shortage report:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchShortages();
  }, []);

  const handleExportCSV = () => {
    window.open('/api/hod/shortage-report?format=csv', '_blank');
    showToast('Downloading Department Shortage CSV Report...', 'info');
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
      accessor: 'studentName',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-semibold text-brandText-main">{row.studentName}</span>
          <div className="text-[11px] text-brandText-secondary">Div {row.division}</div>
        </div>
      ),
    },
    {
      header: 'Defaulter Course',
      accessor: 'courseCode',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-semibold text-navy">
            {row.courseCode}: {row.courseName}
          </div>
          <div className="text-[11px] text-brandText-secondary capitalize">
            {row.courseType} Component
          </div>
        </div>
      ),
    },
    {
      header: 'Attended / Conducted',
      accessor: 'attendedSessions',
      sortable: true,
      render: (row) => (
        <span className="tabular-nums font-semibold text-navy text-xs">
          {row.attendedSessions} / {row.conductedSessions}
        </span>
      ),
    },
    {
      header: 'Current Attendance',
      accessor: 'percentage',
      sortable: true,
      render: (row) => (
        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-status-danger-bg text-status-danger border border-status-danger/30 tabular-nums">
          {row.formattedPercentage}
        </span>
      ),
    },
    {
      header: 'Recovery Needed',
      accessor: 'classesNeeded',
      sortable: true,
      render: (row) => (
        <span className="text-xs font-semibold text-status-danger tabular-nums">
          Must attend {row.classesNeeded} consecutive sessions
        </span>
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
        title="Department Attendance Shortage Report"
        subtitle={`Official defaulter monitoring for students whose attendance is below the institutional ${threshold}% requirement.`}
        actions={
          <button
            onClick={handleExportCSV}
            disabled={shortages.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-status-danger hover:bg-red-700 rounded-md shadow-xs transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export Official Defaulter List (CSV)</span>
          </button>
        }
      />

      <div className="p-4 bg-status-danger-bg border border-status-danger/30 rounded-card flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-status-danger shrink-0 mt-0.5" />
        <div className="text-xs text-brandText-main">
          <strong className="text-status-danger">Institutional Governance Notice:</strong> Students appearing on this list are subject to academic detention or condonation proceedings unless attendance recovery targets are fulfilled prior to term end.
        </div>
      </div>

      <DataTable
        columns={columns}
        data={shortages}
        searchPlaceholder="Search defaulter by PRN, Name, or Course..."
        searchKey="studentName"
        emptyMessage="No students currently below attendance threshold in the department."
      />
    </div>
  );
};
