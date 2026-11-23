import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { formatDateTime } from '../../utils/formatters';
import { ShieldCheck, ChevronLeft, ChevronRight, Lock } from 'lucide-react';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async (p = 1, action = '') => {
    try {
      setLoading(true);
      const params = { page: p, limit: 15 };
      if (action) params.action = action;

      const res = await api.get('/hod/audit-logs', { params });
      setLogs(res.data.logs || []);
      setPage(res.data.page || 1);
      setTotalPages(res.data.totalPages || 1);
      setTotalLogs(res.data.totalLogs || 0);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page, actionFilter);
  }, [page, actionFilter]);

  const getActionBadge = (action) => {
    switch (action) {
      case 'ATTENDANCE_MARKED':
        return 'bg-blue-50 text-academic border-academic/30';
      case 'ATTENDANCE_MODIFIED':
        return 'bg-amber-50 text-status-warning border-status-warning/30';
      case 'CORRECTION_APPROVED':
        return 'bg-emerald-50 text-status-success border-status-success/30';
      case 'CORRECTION_REJECTED':
        return 'bg-red-50 text-status-danger border-status-danger/30';
      case 'COURSE_CREATED':
      case 'FACULTY_ASSIGNED':
      case 'TIMETABLE_CREATED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Attendance & Administrative Audit Trail"
        subtitle="Cryptographically immutable records of all session recordings, faculty adjustments, and administrative operations."
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface border border-border text-xs text-brandText-secondary">
            <Lock className="w-3.5 h-3.5 text-academic" />
            <span>Read-Only Compliance Log</span>
          </div>
        }
      />

      {/* Filter Header */}
      <div className="p-4 bg-surface rounded-card border border-border shadow-card flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-navy">
            Filter Action:
          </label>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-surface-muted border border-border rounded-md text-navy focus:border-academic"
          >
            <option value="">All Institutional Actions</option>
            <option value="ATTENDANCE_MARKED">Attendance Marked</option>
            <option value="ATTENDANCE_MODIFIED">Attendance Modified</option>
            <option value="CORRECTION_APPROVED">Correction Approved</option>
            <option value="CORRECTION_REJECTED">Correction Rejected</option>
            <option value="COURSE_CREATED">Course Created</option>
            <option value="FACULTY_ASSIGNED">Faculty Assigned</option>
            <option value="TIMETABLE_CREATED">Timetable Created</option>
            <option value="THRESHOLD_UPDATED">Threshold Updated</option>
          </select>
        </div>

        <span className="text-xs text-brandText-secondary tabular-nums">
          Total <strong>{totalLogs}</strong> audit entries recorded
        </span>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-card border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-surface-subtle/70 border-b border-border text-brandText-secondary uppercase">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Audit Details</th>
                <th className="py-3 px-4">Previous Value</th>
                <th className="py-3 px-4">New Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-surface-muted/40 transition">
                    <td className="py-3 px-4 text-brandText-secondary tabular-nums font-mono whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-navy">{log.actorId?.name || 'System'}</div>
                      <div className="text-[10px] text-brandText-muted uppercase">
                        {log.actorId?.role || 'Service'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-brandText-main max-w-sm">
                      {log.details}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-brandText-secondary">
                      {log.oldValue !== null && log.oldValue !== undefined ? String(log.oldValue) : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] font-bold text-navy">
                      {log.newValue !== null && log.newValue !== undefined ? String(log.newValue) : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-brandText-secondary">
                    No audit records matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-brandText-secondary bg-surface-muted/20">
            <span>
              Page <strong className="font-semibold text-navy">{page}</strong> of{' '}
              <strong className="font-semibold text-navy">{totalPages}</strong>
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded border border-border bg-surface disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1 rounded border border-border bg-surface disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
