import * as React from 'react';
import { cn } from '../../lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
  width?: string;
  sortable?: boolean;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  rowClassName?: string | ((row: T, index: number) => string);
  onRowClick?: (row: T) => void;
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  compact?: boolean;
  emptyMessage?: string;
  loading?: boolean;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  selectionMode?: 'none' | 'single' | 'multiple';
  selectedRows?: Set<string>;
  onSelectionChange?: (selected: Set<string>) => void;
  className?: string;
}

function TableHeader<T>({
  columns,
  sortColumn,
  sortDirection,
  onSort,
  selectionMode,
  selectedRows,
  onSelectionChange,
}: {
  columns: Column<T>[];
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  selectionMode?: 'none' | 'single' | 'multiple';
  selectedRows?: Set<string>;
  onSelectionChange?: (selected: Set<string>) => void;
}) {
  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (selectedRows && selectedRows.size === columns.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(columns.map((_, i) => String(i))));
    }
  };

  return (
    <thead className={cn('[&_tr]:border-b', '[&_tr]:border-secondary-200', '[&_tr]:bg-secondary-50')}>
      <tr>
        {selectionMode !== 'none' && (
          <th
            className={cn(
              'h-12 px-4 text-left align-middle font-medium text-secondary-600',
              'w-12'
            )}
          >
            <input
              type="checkbox"
              className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              checked={selectedRows && selectedRows.size > 0}
              onChange={handleSelectAll}
              aria-label="Select all rows"
            />
          </th>
        )}
        {columns.map((column) => (
          <th
            key={column.key}
            className={cn(
              'h-12 px-4 text-left align-middle font-medium text-secondary-600',
              column.sortable && 'cursor-pointer select-none hover:bg-secondary-100',
              column.headerClassName
            )}
            style={{ width: column.width }}
            onClick={() => column.sortable && onSort?.(column.key)}
          >
            <div className="flex items-center gap-2">
              {column.header}
              {column.sortable && sortColumn === column.key && (
                <span className="inline-flex">
                  {sortDirection === 'asc' ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </span>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}

function TableBody<T>({
  columns,
  data,
  keyExtractor,
  rowClassName,
  onRowClick,
  striped,
  hoverable,
  bordered,
  compact,
  selectionMode,
  selectedRows,
  onSelectionChange,
  emptyMessage = 'No hay datos disponibles',
}: {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  rowClassName?: string | ((row: T, index: number) => string);
  onRowClick?: (row: T) => void;
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  compact?: boolean;
  selectionMode?: 'none' | 'single' | 'multiple';
  selectedRows?: Set<string>;
  onSelectionChange?: (selected: Set<string>) => void;
  emptyMessage?: string;
}) {
  if (data.length === 0) {
    return (
      <tbody>
        <tr>
          <td
            colSpan={columns.length + (selectionMode !== 'none' ? 1 : 0)}
            className="px-4 py-12 text-center text-secondary-500"
          >
            {emptyMessage}
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className="divide-y divide-secondary-100">
      {data.map((row, index) => {
        const rowKey = keyExtractor(row);
        const isSelected = selectedRows?.has(rowKey);
        const rowClasses = cn(
          'transition-colors',
          striped && index % 2 === 1 && 'bg-secondary-50',
          hoverable && 'hover:bg-secondary-50',
          bordered && 'border-b border-secondary-100',
          compact && 'h-10',
          onRowClick && 'cursor-pointer',
          isSelected && 'bg-primary-50',
          typeof rowClassName === 'function' ? rowClassName(row, index) : rowClassName
        );

        return (
          <tr
            key={rowKey}
            className={rowClasses}
            onClick={() => onRowClick?.(row)}
            style={{ cursor: onRowClick ? 'pointer' : 'default' }}
          >
            {selectionMode !== 'none' && (
              <td className={cn('px-4', compact && 'py-2', !compact && 'py-4')}>
                <input
                  type="checkbox"
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    if (!onSelectionChange) return;
                    const newSelected = new Set(selectedRows);
                    if (newSelected.has(rowKey)) {
                      newSelected.delete(rowKey);
                    } else if (selectionMode === 'single') {
                      newSelected.clear();
                      newSelected.add(rowKey);
                    } else {
                      newSelected.add(rowKey);
                    }
                    onSelectionChange(newSelected);
                  }}
                  aria-label={`Select row ${index + 1}`}
                />
              </td>
            )}
            {columns.map((column) => {
              const value = typeof column.accessor === 'function'
                ? column.accessor(row)
                : row[column.accessor as keyof T];

              return (
                <td
                  key={column.key}
                  className={cn(
                    'align-middle',
                    compact ? 'px-4 py-2' : 'px-4 py-4',
                    column.cellClassName
                  )}
                  style={{ width: column.width }}
                >
                  {column.render
                    ? column.render(value, row, index)
                    : typeof value === 'object' && value !== null
                    ? (value as React.ReactNode)
                    : String(value ?? '')}
                </td>
              );
            })}
          </tr>
        );
      })}
    </tbody>
  );
}

function TableFooter<T>({
  columns,
}: {
  columns: Column<T>[];
}) {
  return (
    <tfoot className="border-t border-secondary-200 bg-secondary-50">
      <tr>
        {columns.map((column) => (
          <th
            key={column.key}
            className="h-12 px-4 text-left align-middle font-medium text-secondary-600"
            style={{ width: column.width }}
          >
            {column.header}
          </th>
        ))}
      </tr>
    </tfoot>
  );
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  rowClassName,
  onRowClick,
  striped = true,
  hoverable = true,
  bordered = true,
  compact = false,
  emptyMessage,
  loading = false,
  sortColumn,
  sortDirection,
  onSort,
  selectionMode = 'none',
  selectedRows,
  onSelectionChange,
  className,
}: TableProps<T>) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full caption-bottom text-sm" role="grid">
        <TableHeader
          columns={columns}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={onSort}
          selectionMode={selectionMode}
          selectedRows={selectedRows}
          onSelectionChange={onSelectionChange}
        />
        {loading ? (
          <tbody>
            <tr>
              <td
                colSpan={columns.length + (selectionMode !== 'none' ? 1 : 0)}
                className="px-4 py-12 text-center"
              >
                <div className="flex items-center justify-center gap-2 text-secondary-500">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Cargando...</span>
                </div>
              </td>
            </tr>
          </tbody>
        ) : (
          <TableBody
            columns={columns}
            data={data}
            keyExtractor={keyExtractor}
            rowClassName={rowClassName}
            onRowClick={onRowClick}
            striped={striped}
            hoverable={hoverable}
            bordered={bordered}
            compact={compact}
            selectionMode={selectionMode}
            selectedRows={selectedRows}
            onSelectionChange={onSelectionChange}
            emptyMessage={emptyMessage}
          />
        )}
        <TableFooter columns={columns} />
      </table>
    </div>
  );
}

export interface TableContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const TableContainer = React.forwardRef<HTMLDivElement, TableContainerProps>(
  ({ children, className }, ref) => (
    <div
      ref={ref}
      className={cn('w-full overflow-x-auto', className)}
    >
      {children}
    </div>
  )
);

TableContainer.displayName = 'TableContainer';