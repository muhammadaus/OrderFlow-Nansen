import React from 'react';

/**
 * DataTable - Professional table component
 * @param {Array} columns - Array of { key, label, align?, format?, width? }
 * @param {Array} data - Array of row objects
 * @param {string} variant - 'default' | 'compact' | 'striped'
 * @param {boolean} hoverable - Enable row hover effects
 */
export function DataTable({
  columns = [],
  data = [],
  variant = 'default',
  hoverable = true,
  className = '',
  emptyMessage = 'No data available',
  onRowClick,
}) {
  const variants = {
    default: {
      table: 'w-full text-sm border-collapse',
      thead: 'bg-bg-secondary border-b border-border-default',
      th: 'px-3 py-2.5 text-left text-xxs font-semibold text-text-muted uppercase tracking-wider',
      td: 'px-3 py-2.5 border-b border-border-subtle font-mono text-xs',
      tr: 'hover:bg-bg-elevated transition-colors duration-100',
    },
    compact: {
      table: 'w-full text-xs border-collapse',
      thead: 'bg-bg-secondary border-b border-border-default',
      th: 'px-2 py-2 text-left text-xxs font-semibold text-text-muted uppercase tracking-wider',
      td: 'px-2 py-2 border-b border-border-subtle font-mono text-xxs',
      tr: 'hover:bg-bg-elevated transition-colors duration-100',
    },
    striped: {
      table: 'w-full text-sm border-collapse',
      thead: 'bg-bg-secondary border-b border-border-default',
      th: 'px-3 py-2.5 text-left text-xxs font-semibold text-text-muted uppercase tracking-wider',
      td: 'px-3 py-2.5 font-mono text-xs',
      tr: 'odd:bg-bg-secondary/50 hover:bg-bg-elevated transition-colors duration-100',
    },
  };

  const styles = variants[variant];
  const alignments = { left: 'text-left', center: 'text-center', right: 'text-right' };

  const formatValue = (value, column) => {
    if (value === null || value === undefined) return '-';
    if (column.format) return column.format(value);
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return value;
  };

  const getCellColor = (value, column) => {
    if (column.colorize && typeof value === 'number') {
      if (value > 0) return 'text-bull';
      if (value < 0) return 'text-bear';
    }
    return 'text-text-primary';
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`${styles.th} ${alignments[col.align] || 'text-left'}`}
                style={col.width ? { width: col.width } : {}}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className={`${styles.td} text-center text-text-muted py-8`}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                className={`${styles.tr} ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(row, rowIndex)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`${styles.td} ${alignments[col.align] || 'text-left'} ${getCellColor(row[col.key], col)}`}
                  >
                    {col.render
                      ? col.render(row[col.key], row, rowIndex)
                      : formatValue(row[col.key], col)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/**
 * DataGrid - Grid layout for key-value pairs
 */
export function DataGrid({ items = [], cols = 3, className = '' }) {
  const colClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  return (
    <div className={`grid ${colClasses[cols] || 'grid-cols-3'} gap-px bg-border-subtle rounded-lg overflow-hidden ${className}`}>
      {items.map((item, index) => (
        <div key={item.key || index} className="bg-bg-card px-3 py-2.5">
          <p className="text-xxs text-text-muted uppercase tracking-wide font-medium">{item.label}</p>
          <p className={`text-sm font-semibold font-mono tabular-nums ${item.color || 'text-text-primary'}`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export default DataTable;
