import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { FileQuestion, AlertCircle, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export const CorrectionRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await api.get('/corrections/student');
        setRequests(res.data.requests || []);
      } catch (err) {
        console.error('Failed to load correction requests:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const columns = [
    {
      header: 'Course & Session Date',
      accessor: 'courseId',
      render: (row) => (
        <div>
          <div className="font-semibold text-navy">
            {row.courseId?.code} — {row.courseId?.name}
          </div>
          <div className="text-[11px] text-brandText-secondary font-mono mt-0.5">
            Session Date: {formatDate(row.sessionId?.sessionDate)} ({row.sessionId?.startTime} - {row.sessionId?.endTime})
          </div>
        </div>
      ),
    },
    {
      header: 'Reason Category',
      accessor: 'reason',
      sortable: true,
      render: (row) => (
        <span className="font-medium text-navy text-xs">{row.reason}</span>
      ),
    },
    {
      header: 'My Explanation',
      accessor: 'description',
      render: (row) => (
        <p className="text-xs text-brandText-secondary line-clamp-2 max-w-xs">
          {row.description}
        </p>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Faculty Remarks',
      accessor: 'facultyResponse',
      render: (row) => (
        <div className="text-xs">
          {row.facultyResponse ? (
            <div>
              <p className="text-brandText-main font-medium">{row.facultyResponse}</p>
              <p className="text-[10px] text-brandText-muted mt-0.5">
                Reviewed by {row.reviewedBy?.name || 'Faculty'} on {formatDate(row.reviewedAt)}
              </p>
            </div>
          ) : (
            <span className="text-brandText-muted italic">Awaiting faculty review</span>
          )}
        </div>
      ),
    },
    {
      header: 'Submitted At',
      accessor: 'createdAt',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-brandText-secondary tabular-nums">
          {formatDateTime(row.createdAt)}
        </span>
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
        title="Attendance Correction Requests"
        subtitle="Track submitted requests for review of missed or disputed session attendance records."
        actions={
          <Link
            to="/student/attendance"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-academic hover:bg-academic-dark rounded-md transition"
          >
            <span>Browse Courses to Request</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        }
      />

      <div className="p-4 bg-surface rounded-card border border-border shadow-xs text-xs text-brandText-secondary flex items-start gap-3">
        <FileQuestion className="w-5 h-5 text-academic shrink-0 mt-0.5" />
        <div>
          <strong className="text-navy">Correction Policy:</strong> If you were physically present, on official college duty, or on certified medical leave, navigate to your course session history and click "Request Review". The assigned faculty will inspect the record and decide on approving the correction.
        </div>
      </div>

      <DataTable
        columns={columns}
        data={requests}
        searchPlaceholder="Search by course code, reason..."
        searchKey="reason"
        emptyMessage="No correction requests submitted yet. You can submit a request from any past course session."
      />
    </div>
  );
};
