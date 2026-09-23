import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  headerAction?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  title,
  description,
  headerAction,
  children,
  padding = 'md',
  className = '',
  ...props
}: CardProps) {
  const paddingMap = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`bg-slate-900/80 border border-slate-800 rounded-lg text-slate-100 ${className}`}
      {...props}
    >
      {(title || headerAction || description) && (
        <div className="px-6 pt-5 pb-4 border-b border-slate-800 flex items-start justify-between gap-4">
          <div>
            {title && (
              <h3 className="text-sm font-semibold tracking-tight text-slate-100">{title}</h3>
            )}
            {description && (
              <p className="text-xs text-slate-400 mt-1">{description}</p>
            )}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      <div className={paddingMap[padding]}>{children}</div>
    </div>
  );
}
