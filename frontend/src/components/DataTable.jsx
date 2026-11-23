import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';

export const DataTable = ({
  columns = [],
  data = [],
  searchPlaceholder = 'Search records...',
  searchKey = '',
  rowsPerPage = 10,
  emptyMessage = 'No records found.',
  actions = null,
}) => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Filtering
  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const term = search.toLowerCase();

    return data.filter((row) => {
      if (searchKey && row[searchKey]) {
        return String(row[searchKey]).toLowerCase().includes(term);
      }
      return Object.values(row).some((val) => {
        if (typeof val === 'string' || typeof val === 'number') {
          return String(val).toLowerCase().includes(term);
        }
        return false;
      });
    });
  }, [data, search, searchKey]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / rowsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);

  const handleSort = (key) => {
    if (!key) return;
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  return (
    <div className="bg-surface rounded-card border border-border shadow-card overflow-hidden">
      {/* Top Filter & Actions Bar */}
      <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brandText-secondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-surface-muted border border-border rounded-md text-brandText-main placeholder:text-brandText-muted focus:bg-surface focus:border-academic transition"
          />
        </div>
        {actions && <div className="flex items-center gap-2 w-full sm:w-auto">{actions}</div>}
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-surface-subtle/70 border-b border-border text-xs uppercase font-semibold text-brandText-secondary tracking-wider">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => col.sortable && col.accessor && handleSort(col.accessor)}
                  className={`py-3 px-4 ${col.className || ''} ${
                    col.sortable ? 'cursor-pointer hover:bg-surface-subtle select-none' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.sortable && <ChevronsUpDown className="w-3.5 h-3.5 text-brandText-muted" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rIdx) => (
                <tr key={row._id || rIdx} className="hover:bg-surface-muted/60 transition-colors">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`py-3 px-4 text-brandText-main ${col.cellClassName || ''}`}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-brandText-secondary">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-brandText-secondary bg-surface-muted/30">
          <span>
            Showing <strong className="font-semibold text-brandText-main">{(currentPage - 1) * rowsPerPage + 1}</strong> to{' '}
            <strong className="font-semibold text-brandText-main">
              {Math.min(currentPage * rowsPerPage, sortedData.length)}
            </strong>{' '}
            of <strong className="font-semibold text-brandText-main">{sortedData.length}</strong> results
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-border bg-surface disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-subtle transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-brandText-main">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-border bg-surface disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-subtle transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
