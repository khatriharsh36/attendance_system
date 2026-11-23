/**
 * Simple, robust CSV generator without heavy external dependencies.
 */
export const generateCSV = (headers, rows) => {
  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerRow = headers.map(escapeCell).join(',');
  const dataRows = rows.map((row) => row.map(escapeCell).join(',')).join('\n');

  return `${headerRow}\n${dataRows}`;
};
