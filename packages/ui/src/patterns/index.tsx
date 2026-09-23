import React, { useState } from 'react';
import { Table, Column, Pagination, Card } from '../components/DataDisplay';
import { Input } from '../components/Input';
import { Icon } from '../icons/Icon';
import { Button } from '../components/Button';

export interface DataTablePatternProps<T extends Record<string, unknown>> {
  title: string;
  subtitle?: string;
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchKey?: keyof T;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  pageSize?: number;
  onRowClick?: (row: T) => void;
}

export function DataTablePattern<T extends Record<string, unknown>>({
  title,
  subtitle,
  columns,
  data,
  searchPlaceholder = 'Search records...',
  searchKey,
  primaryAction,
  pageSize = 10,
  onRowClick,
}: DataTablePatternProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter
  const filteredData = React.useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((item) => {
      if (searchKey) {
        return String(item[searchKey] || '')
          .toLowerCase()
          .includes(term);
      }
      return Object.values(item).some((val) =>
        String(val || '')
          .toLowerCase()
          .includes(term)
      );
    });
  }, [data, searchTerm, searchKey]);

  // Sort
  const sortedData = React.useMemo(() => {
    if (!sortColumn) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDirection === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginate
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortColumn === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(key);
      setSortDirection('asc');
    }
  };

  return (
    <Card
      title={title}
      subtitle={subtitle}
      padding="none"
      headerAction={
        <div className="flex items-center gap-2">
          {primaryAction && (
            <Button
              variant="primary"
              size="sm"
              onClick={primaryAction.onClick}
              leftIcon={primaryAction.icon || <Icon name="plus" size="xs" />}
            >
              {primaryAction.label}
            </Button>
          )}
        </div>
      }
    >
      <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap bg-slate-950/40">
        <div className="w-full sm:w-72">
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            leftIcon={<Icon name="search" size="xs" />}
          />
        </div>
        <div className="text-xs text-slate-400 font-mono tabular-nums">
          {sortedData.length} records indexed
        </div>
      </div>

      <Table
        columns={columns}
        data={paginatedData}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
        onRowClick={onRowClick}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalRecords={sortedData.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </Card>
  );
}

export interface MetricCardPatternProps {
  label: string;
  value: string | number;
  change?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
    period: string;
  };
  status?: 'nominal' | 'warning' | 'alert';
  actionIcon?: React.ReactNode;
  subtext?: string;
  className?: string;
}

export function MetricCardPattern({
  label,
  value,
  change,
  status = 'nominal',
  actionIcon,
  subtext,
  className = '',
}: MetricCardPatternProps) {
  const statusColors = {
    nominal: 'text-slate-100',
    warning: 'text-amber-400',
    alert: 'text-rose-400',
  };

  const trendColors = {
    up: 'text-emerald-400',
    down: 'text-rose-400',
    neutral: 'text-slate-400',
  };

  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</span>
        {actionIcon && <div className="text-slate-500">{actionIcon}</div>}
      </div>

      <div className="my-1">
        <div className={`text-2xl sm:text-3xl font-mono tabular-nums font-bold ${statusColors[status]}`}>
          {value}
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        {change ? (
          <div className="flex items-center gap-1 font-mono tabular-nums">
            <span className={trendColors[change.trend]}>
              {change.trend === 'up' ? '↑' : change.trend === 'down' ? '↓' : '→'} {change.value}
            </span>
            <span className="text-slate-500">vs {change.period}</span>
          </div>
        ) : (
          <span className="text-slate-500">{subtext || 'Nominal operational state'}</span>
        )}
      </div>
    </div>
  );
}

export interface FormSectionPatternProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function FormSectionPattern({
  title,
  description,
  children,
  actions,
  className = '',
}: FormSectionPatternProps) {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-lg overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/20">
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <div className="p-6 space-y-4">{children}</div>
      {actions && (
        <div className="px-6 py-3.5 bg-slate-950/40 border-t border-slate-800 flex items-center justify-end gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
