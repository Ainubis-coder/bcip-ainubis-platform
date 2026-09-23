import React from 'react';
import { focusVisibleClasses } from '../../accessibility';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'ainubis';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Spatial math: horizontal padding ~ 2x vertical padding
    const sizeClasses = {
      sm: 'px-2.5 py-1 text-xs gap-1.5 min-h-[32px]',
      md: 'px-3.5 py-2 text-xs sm:text-sm gap-2 min-h-[40px]',
      lg: 'px-5 py-2.5 text-sm font-medium gap-2.5 min-h-[44px]',
    };

    const variantClasses = {
      primary:
        'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium border border-emerald-500/30 shadow-xs',
      secondary:
        'bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-100 font-medium border border-slate-700/80 shadow-xs',
      outline:
        'bg-transparent hover:bg-slate-800/60 active:bg-slate-800 text-slate-300 hover:text-slate-100 font-medium border border-slate-700',
      ghost:
        'bg-transparent hover:bg-slate-800/50 active:bg-slate-800 text-slate-400 hover:text-slate-100 font-medium border border-transparent',
      danger:
        'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-medium border border-rose-500/30 shadow-xs',
      ainubis:
        'bg-indigo-600/90 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium border border-indigo-400/40 shadow-xs',
    };

    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center rounded-md font-sans transition-colors duration-150 whitespace-nowrap shrink-0 ${focusVisibleClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${
          isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
        } ${className}`}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          leftIcon
        )}
        <span className="truncate">{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);
Button.displayName = 'Button';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  'aria-label': string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      'aria-label': ariaLabel,
      variant = 'ghost',
      size = 'md',
      isLoading = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-11 h-11 text-base',
    };

    const variantClasses = {
      primary: 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/30',
      secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700',
      outline: 'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white border border-slate-700',
      ghost: 'bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-white border border-transparent',
      danger: 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-500/30',
      ainubis: 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/40',
    };

    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center rounded-md transition-colors duration-150 shrink-0 ${focusVisibleClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${
          isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
        } ${className}`}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          icon
        )}
      </button>
    );
  }
);
IconButton.displayName = 'IconButton';
