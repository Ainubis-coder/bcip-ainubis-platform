import React from 'react';
import { focusVisibleClasses } from '../../accessibility';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  children: React.ReactNode;
}

export function Label({ required = false, children, className = '', ...props }: LabelProps) {
  return (
    <label
      className={`block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-rose-400 ml-1" aria-hidden="true">*</span>}
    </label>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, leftIcon, rightIcon, className = '', id, required, disabled, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    const hasError = Boolean(error);

    return (
      <div className="w-full">
        {label && (
          <Label htmlFor={inputId} required={required}>
            {label}
          </Label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            required={required}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={hasError && inputId ? `${inputId}-error` : helperText && inputId ? `${inputId}-help` : undefined}
            className={`w-full rounded-md bg-slate-900 border text-slate-100 text-xs sm:text-sm transition-colors py-2 px-3 ${
              leftIcon ? 'pl-9' : ''
            } ${rightIcon ? 'pr-9' : ''} ${
              hasError
                ? 'border-rose-500/80 focus:border-rose-500'
                : 'border-slate-800 hover:border-slate-700 focus:border-sky-400'
            } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-950' : ''} ${focusVisibleClasses} ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-slate-400 pointer-events-none flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {hasError && (
          <p id={inputId ? `${inputId}-error` : undefined} className="text-xs text-rose-400 mt-1 font-medium flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </p>
        )}
        {!hasError && helperText && (
          <p id={inputId ? `${inputId}-help` : undefined} className="text-xs text-slate-500 mt-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, className = '', id, required, disabled, rows = 3, ...props }, ref) => {
    const inputId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    const hasError = Boolean(error);

    return (
      <div className="w-full">
        {label && (
          <Label htmlFor={inputId} required={required}>
            {label}
          </Label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          rows={rows}
          required={required}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={hasError && inputId ? `${inputId}-error` : helperText && inputId ? `${inputId}-help` : undefined}
          className={`w-full rounded-md bg-slate-900 border text-slate-100 text-xs sm:text-sm transition-colors py-2 px-3 ${
            hasError
              ? 'border-rose-500/80 focus:border-rose-500'
              : 'border-slate-800 hover:border-slate-700 focus:border-sky-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-950' : ''} ${focusVisibleClasses} ${className}`}
          {...props}
        />
        {hasError && (
          <p id={inputId ? `${inputId}-error` : undefined} className="text-xs text-rose-400 mt-1 font-medium">
            {error}
          </p>
        )}
        {!hasError && helperText && (
          <p id={inputId ? `${inputId}-help` : undefined} className="text-xs text-slate-500 mt-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  helperText?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, helperText, error, className = '', id, required, disabled, ...props }, ref) => {
    const inputId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    const hasError = Boolean(error);

    return (
      <div className="w-full">
        {label && (
          <Label htmlFor={inputId} required={required}>
            {label}
          </Label>
        )}
        <div className="relative">
          <select
            id={inputId}
            ref={ref}
            required={required}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={hasError && inputId ? `${inputId}-error` : helperText && inputId ? `${inputId}-help` : undefined}
            className={`w-full appearance-none rounded-md bg-slate-900 border text-slate-100 text-xs sm:text-sm py-2 pl-3 pr-8 transition-colors ${
              hasError
                ? 'border-rose-500/80 focus:border-rose-500'
                : 'border-slate-800 hover:border-slate-700 focus:border-sky-400'
            } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-950' : ''} ${focusVisibleClasses} ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled} className="bg-slate-900 text-slate-100">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {hasError && (
          <p id={inputId ? `${inputId}-error` : undefined} className="text-xs text-rose-400 mt-1 font-medium">
            {error}
          </p>
        )}
        {!hasError && helperText && (
          <p id={inputId ? `${inputId}-help` : undefined} className="text-xs text-slate-500 mt-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className = '', disabled, id, ...props }, ref) => {
    const inputId = id || `chk-${Math.random().toString(36).substring(2, 7)}`;

    return (
      <div className={`flex items-start gap-2.5 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
        <div className="flex items-center h-5">
          <input
            id={inputId}
            ref={ref}
            type="checkbox"
            disabled={disabled}
            className={`w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-sky-400 focus:ring-offset-slate-950 ${
              disabled ? 'cursor-not-allowed' : 'cursor-pointer'
            }`}
            {...props}
          />
        </div>
        <div className="text-xs">
          <label htmlFor={inputId} className={`font-medium text-slate-200 select-none ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
            {label}
          </label>
          {description && <p className="text-slate-400 mt-0.5">{description}</p>}
        </div>
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
  description?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ label, description, className = '', disabled, id, ...props }, ref) => {
    const inputId = id || `radio-${Math.random().toString(36).substring(2, 7)}`;

    return (
      <div className={`flex items-start gap-2.5 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
        <div className="flex items-center h-5">
          <input
            id={inputId}
            ref={ref}
            type="radio"
            disabled={disabled}
            className={`w-4 h-4 border-slate-700 bg-slate-900 text-emerald-600 focus:ring-sky-400 focus:ring-offset-slate-950 ${
              disabled ? 'cursor-not-allowed' : 'cursor-pointer'
            }`}
            {...props}
          />
        </div>
        <div className="text-xs">
          <label htmlFor={inputId} className={`font-medium text-slate-200 select-none ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
            {label}
          </label>
          {description && <p className="text-slate-400 mt-0.5">{description}</p>}
        </div>
      </div>
    );
  }
);
Radio.displayName = 'Radio';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function Switch({ checked, onChange, label, description, disabled = false, className = '' }: SwitchProps) {
  return (
    <div className={`flex items-center justify-between gap-3 ${disabled ? 'opacity-50' : ''} ${className}`}>
      {label && (
        <div className="text-xs">
          <span className="font-medium text-slate-200 select-none">{label}</span>
          {description && <p className="text-slate-400 mt-0.5">{description}</p>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${focusVisibleClasses} ${
          checked ? 'bg-emerald-600' : 'bg-slate-800'
        } ${disabled ? 'cursor-not-allowed' : ''}`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
