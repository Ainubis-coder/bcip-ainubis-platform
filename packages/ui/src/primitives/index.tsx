import React from 'react';

export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  className?: string;
  children?: React.ReactNode;
}

export function Box({ as: Component = 'div', className = '', children, ...props }: BoxProps) {
  return (
    <Component className={className} {...props}>
      {children}
    </Component>
  );
}

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'vertical' | 'horizontal';
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between';
  wrap?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Stack({
  direction = 'vertical',
  gap = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  className = '',
  children,
  ...props
}: StackProps) {
  const gapMap = {
    none: 'gap-0',
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  const alignMap = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifyMap = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div
      className={`flex ${direction === 'vertical' ? 'flex-col' : 'flex-row'} ${gapMap[gap]} ${alignMap[align]} ${justifyMap[justify]} ${wrap ? 'flex-wrap' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export interface InlineProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
  align?: 'start' | 'center' | 'end' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between';
  wrap?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Inline({
  gap = 'sm',
  align = 'center',
  justify = 'start',
  wrap = true,
  className = '',
  children,
  ...props
}: InlineProps) {
  const gapMap = {
    none: 'gap-0',
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  const alignMap = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    baseline: 'items-baseline',
  };

  const justifyMap = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div
      className={`flex flex-row ${gapMap[gap]} ${alignMap[align]} ${justifyMap[justify]} ${wrap ? 'flex-wrap' : 'flex-nowrap'} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  children: React.ReactNode;
}

export function Grid({
  cols = 3,
  gap = 'md',
  className = '',
  children,
  ...props
}: GridProps) {
  const colsMap = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
    12: 'grid-cols-12',
  };

  const gapMap = {
    none: 'gap-0',
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  return (
    <div className={`grid ${colsMap[cols]} ${gapMap[gap]} ${className}`} {...props}>
      {children}
    </div>
  );
}

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  children: React.ReactNode;
}

export function Container({
  size = 'xl',
  className = '',
  children,
  ...props
}: ContainerProps) {
  const sizeMap = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div className={`w-full mx-auto px-4 sm:px-6 lg:px-8 ${sizeMap[size]} ${className}`} {...props}>
      {children}
    </div>
  );
}

export interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'subtle' | 'strong';
  className?: string;
}

export function Divider({
  orientation = 'horizontal',
  variant = 'default',
  className = '',
  ...props
}: DividerProps) {
  const variantMap = {
    default: 'border-slate-800',
    subtle: 'border-slate-800/40',
    strong: 'border-slate-700',
  };

  if (orientation === 'vertical') {
    return (
      <div
        className={`inline-block h-auto self-stretch border-r ${variantMap[variant]} ${className}`}
        role="separator"
        aria-orientation="vertical"
      />
    );
  }

  return (
    <hr
      className={`w-full border-t ${variantMap[variant]} my-4 ${className}`}
      role="separator"
      aria-orientation="horizontal"
      {...props}
    />
  );
}
