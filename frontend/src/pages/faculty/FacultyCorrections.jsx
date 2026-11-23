import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { FormField } from '../../components/FormField';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { CheckCircle2, XCircle, FileQuestion, MessageSquare } from 'lucide-react';

export const FacultyCorrections = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewAction, setReviewAction] = useState('approved');
  const [remarks, setRemarks] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useToast();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/corrections/faculty');
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error('Failed to load faculty corrections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleOpenReview = (request, action) => {
    setSelectedRequest(request);
    setReviewAction(action);
    setRemarks(action === 'approved' ? 'Verified valid documentation. Attendance granted.' : 'Unverified reason.');
    setModalOpen(true);
  };

  const handleConfirmReview = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      setSubmitting(true);
      await api.patch(`/corrections/${selectedRequest._id}`, {
        status: reviewAction,
        remarks: remarks.trim(),
      });

      showToast(`Request has been ${reviewAction}. Attendance and audit records updated.`, 'success');
      setModalOpen(false);
      fetchRequests();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to review request.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Student Info',
      accessor: 'studentId',
      render: (row) => (
        <div>
          <div className="font-semibold text-navy">{row.studentId?.name}</div>
          <div className="text-[11px] font-mono text-academic">
            PRN: {row.studentId?.studentId} • Div {row.studentId?.division}
          </div>
        </div>
      ),
    },
    {
      header: 'Course & Session',
      accessor: 'courseId',
      render: (row) => (
        <div>
          <div className="font-semibold text-navy">
            {row.courseId?.code}: {row.courseId?.name}
          </div>
          <div className="text-[11px] text-brandText-secondary">
            Date: {formatDate(row.sessionId?.sessionDate)} ({row.sessionId?.startTime} - {row.sessionId?.endTime})
          </div>
        </div>
      ),
    },
    {
      header: 'Reason & Explanation',
      accessor: 'reason',
      render: (row) => (
        <div>
          <span className="font-medium text-navy text-xs">{row.reason}</span>
          <p className="text-xs text-brandText-secondary line-clamp-2 mt-0.5 max-w-xs">
            {row.description}
          </p>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Submitted',
      accessor: 'createdAt',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-brandText-secondary tabular-nums">
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => {
        if (row.status !== 'pending') {
          return (
            <div className="text-xs text-brandText-muted">
              {row.facultyResponse ? `"${row.facultyResponse}"` : 'Reviewed'}
            </div>
          );
        }
        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleOpenReview(row, 'approved')}
              className="px-2.5 py-1 text-xs font-semibold text-white bg-status-success hover:bg-emerald-700 rounded transition shadow-xs flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve</span>
            </button>
            <button
              onClick={() => handleOpenReview(row, 'rejected')}
              className="px-2.5 py-1 text-xs font-semibold text-status-danger bg-surface border border-status-danger/30 hover:bg-status-danger-bg rounded transition flex items-center gap-1"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject</span>
            </button>
          </div>
        );
      },
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

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Attendance Correction Requests"
        subtitle="Review, verify, and resolve attendance discrepancies reported by enrolled students."
        badge={
          pendingCount > 0 ? (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-status-warning-bg text-status-warning border border-status-warning/30">
              {pendingCount} Pending Review
            </span>
          ) : null
        }
      />

      <DataTable
        columns={columns}
        data={requests}
        searchPlaceholder="Search student name, PRN, course..."
        emptyMessage="No attendance correction requests for your courses."
      />

      {/* Review Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={reviewAction === 'approved' ? 'Approve Attendance Correction' : 'Reject Attendance Correction'}
        subtitle={`Student: ${selectedRequest?.studentId?.name} (${selectedRequest?.studentId?.studentId})`}
      >
        <form onSubmit={handleConfirmReview} className="space-y-4">
          <div
            className={`p-3 rounded-md text-xs border ${
              reviewAction === 'approved'
                ? 'bg-status-success-bg text-status-success border-status-success/30'
                : 'bg-status-danger-bg text-status-danger border-status-danger/30'
            }`}
          >
            {reviewAction === 'approved' ? (
              <span>
                <strong>Action:</strong> Approving will immediately change the student's attendance record from <strong>ABSENT</strong> to <strong>PRESENT</strong>, recalculate class statistics, and record an immutable entry in the system audit trail.
              </span>
            ) : (
              <span>
                <strong>Action:</strong> Rejecting will maintain the record as <strong>ABSENT</strong> and communicate your remarks to the student.
              </span>
            )}
          </div>

          <div className="p-3 bg-surface-muted rounded-md text-xs space-y-1">
            <div><strong>Reason:</strong> {selectedRequest?.reason}</div>
            <div><strong>Explanation:</strong> {selectedRequest?.description}</div>
          </div>

          <FormField
            label="Faculty Remarks / Justification"
            id="remarks"
            type="textarea"
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Enter reason for approval or rejection..."
            required
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-brandText-secondary bg-surface border border-border rounded-md hover:bg-surface-subtle"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-4 py-2 text-xs font-semibold text-white rounded-md transition shadow-xs ${
                reviewAction === 'approved'
                  ? 'bg-status-success hover:bg-emerald-700'
                  : 'bg-status-danger hover:bg-red-700'
              }`}
            >
              {submitting ? 'Processing...' : `Confirm ${reviewAction === 'approved' ? 'Approval' : 'Rejection'}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
