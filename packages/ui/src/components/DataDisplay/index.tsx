import React from 'react';
import { focusVisibleClasses } from '../../accessibility';

/**
 * Badge Component
 * Enterprise status badge. Avoids candy pill enclosures.
 */
export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'ainubis';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
}

export function Badge({ variant = 'neutral', children, dot = false, className = '', ...props }: BadgeProps) {
  const variantStyles = {
    neutral: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
    success: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40',
    warning: 'bg-amber-950/60 text-amber-300 border-amber-800/40',
    error: 'bg-rose-950/60 text-rose-300 border-rose-800/40',
    info: 'bg-sky-950/60 text-sky-300 border-sky-800/40',
    ainubis: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/40',
  };

  const dotColors = {
    neutral: 'bg-slate-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    error: 'bg-rose-400',
    info: 'bg-sky-400',
    ainubis: 'bg-indigo-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border tracking-wide whitespace-nowrap ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} aria-hidden="true" />}
      {children}
    </span>
  );
}

/**
 * Avatar Component
 */
export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline' | 'busy';
}

export function Avatar({ name, src, size = 'md', status, className = '', ...props }: AvatarProps) {
  const sizeMap = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const statusMap = {
    online: 'bg-emerald-500 ring-slate-950',
    offline: 'bg-slate-500 ring-slate-950',
    busy: 'bg-amber-500 ring-slate-950',
  };

  const getInitials = (str: string) => {
    return str
      .split(' ')
      .map((part) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className={`relative inline-block ${className}`} {...props}>
      <div
        className={`${sizeMap[size]} rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-medium text-slate-200 overflow-hidden select-none`}
      >
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>
      {status && (
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ${statusMap[status]}`}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

/**
 * Card Component
 * Enforces single-elevation depth rule: 1px hairline border, subtle background contrast.
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  description?: string;
  headerAction?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  bordered?: boolean;
}

export function Card({
  title,
  subtitle,
  description,
  headerAction,
  padding = 'md',
  bordered = true,
  className = '',
  children,
  ...props
}: CardProps) {
  const paddingMap = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const effectiveSubtitle = subtitle || description;

  return (
    <div
      className={`bg-slate-900 rounded-lg text-slate-100 ${
        bordered ? 'border border-slate-800' : ''
      } ${className}`}
      {...props}
    >
      {(title || headerAction || effectiveSubtitle) && (
        <div className="px-6 py-4 border-b border-slate-800 flex items-start justify-between gap-4">
          <div>
            {title && <h3 className="text-sm font-semibold tracking-tight text-slate-100">{title}</h3>}
            {effectiveSubtitle && <p className="text-xs text-slate-400 mt-0.5">{effectiveSubtitle}</p>}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      <div className={paddingMap[padding]}>{children}</div>
    </div>
  );
}

/**
 * Panel Component for sidebars and toolbars
 */
export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Panel({ children, className = '', ...props }: PanelProps) {
  return (
    <div className={`bg-slate-950/60 border border-slate-800/80 rounded-md p-4 text-xs text-slate-300 ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * Status Indicator Component
 */
export type StatusType = 'healthy' | 'active' | 'warning' | 'alert' | 'neutral' | 'offline';

export interface StatusIndicatorProps {
  status: StatusType;
  label: string;
  subtext?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusIndicator({
  status,
  label,
  subtext,
  size = 'md',
  className = '',
}: StatusIndicatorProps) {
  const dotColor = {
    healthy: 'bg-emerald-500 ring-emerald-500/20',
    active: 'bg-emerald-500 ring-emerald-500/20',
    warning: 'bg-amber-500 ring-amber-500/20',
    alert: 'bg-rose-500 ring-rose-500/20',
    neutral: 'bg-slate-400 ring-slate-400/20',
    offline: 'bg-slate-600 ring-slate-600/20',
  };

  const textColor = {
    healthy: 'text-emerald-400',
    active: 'text-emerald-400',
    warning: 'text-amber-400',
    alert: 'text-rose-400',
    neutral: 'text-slate-300',
    offline: 'text-slate-500',
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`inline-block rounded-full ring-4 ${dotColor[status]} ${
          size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'
        }`}
        aria-hidden="true"
      />
      <span className={`font-medium ${textColor[status]} ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
        {label}
      </span>
      {subtext && (
        <span className="text-xs text-slate-500 font-mono tabular-nums">
          <span className="mx-1 text-slate-600" aria-hidden="true">
            ·
          </span>
          {subtext}
        </span>
      )}
    </div>
  );
}

/**
 * Table Column Definition
 */
export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  isNumeric?: boolean;
  sortable?: boolean;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  className?: string;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = 'No records located',
  isLoading = false,
  onRowClick,
  sortColumn,
  sortDirection,
  onSort,
  className = '',
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full py-12 flex flex-col items-center justify-center text-slate-400">
        <svg className="animate-spin h-6 w-6 text-emerald-500 mb-3" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="text-xs">Loading operational records...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full py-12 text-center text-slate-500 text-xs">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] bg-slate-950/40">
            {columns.map((col) => {
              const isSorted = sortColumn === col.key;
              return (
                <th
                  key={col.key}
                  onClick={() => col.sortable && onSort?.(col.key)}
                  className={`py-3 px-4 font-semibold select-none ${
                    col.sortable ? 'cursor-pointer hover:text-slate-200' : ''
                  } ${
                    col.align === 'right' || col.isNumeric
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  }`}
                >
                  <div
                    className={`inline-flex items-center gap-1.5 ${
                      col.align === 'right' || col.isNumeric ? 'justify-end' : ''
                    }`}
                  >
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-slate-500 text-[10px]">
                        {isSorted ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {data.map((row, idx) => (
            <tr
              key={idx}
              onClick={() => onRowClick?.(row)}
              className={`hover:bg-slate-800/40 transition-colors ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`py-3 px-4 text-slate-300 ${
                    col.isNumeric
                      ? 'font-mono tabular-nums text-right text-slate-200'
                      : col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  }`}
                >
                  {col.render ? col.render(row) : (row[col.key] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Pagination Component
 */
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  onPageChange,
  className = '',
}: PaginationProps) {
  const startRecord = Math.min((currentPage - 1) * pageSize + 1, totalRecords);
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  return (
    <div
      className={`px-4 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-950/20 ${className}`}
    >
      <div>
        Showing <span className="font-mono tabular-nums text-slate-200">{startRecord}</span> to{' '}
        <span className="font-mono tabular-nums text-slate-200">{endRecord}</span> of{' '}
        <span className="font-mono tabular-nums text-slate-200">{totalRecords}</span> entries
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`px-2.5 py-1 rounded border border-slate-800 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed ${focusVisibleClasses}`}
        >
          Previous
        </button>
        <span className="px-2 font-mono tabular-nums text-slate-300">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`px-2.5 py-1 rounded border border-slate-800 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed ${focusVisibleClasses}`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
