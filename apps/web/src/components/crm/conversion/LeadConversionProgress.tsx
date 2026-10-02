/**
 * BCIP Lead Conversion Wizard Progress Indicator
 * Phase 2D — Prompt 002D-003: CRM Lead Conversion Wizard
 * Clean step tracker adhering to Phase 2A Design Tokens and Zero-Pill discipline.
 */

import React from 'react';
import { Icon } from '@bcip/ui';

export type ConversionStep = 1 | 2 | 3 | 4;

interface LeadConversionProgressProps {
  currentStep: ConversionStep;
  onStepClick?: (step: ConversionStep) => void;
  isSubmitting?: boolean;
}

interface StepMeta {
  step: ConversionStep;
  label: string;
  description: string;
}

const STEPS: StepMeta[] = [
  { step: 1, label: 'Review Lead', description: 'Inspect prospect scope' },
  { step: 2, label: 'Conversion Data', description: 'Configure entity records' },
  { step: 3, label: 'Confirm', description: 'Verify atomic transaction' },
  { step: 4, label: 'Result', description: 'Conversion summary' },
];

export function LeadConversionProgress({
  currentStep,
  onStepClick,
  isSubmitting = false,
}: LeadConversionProgressProps) {
  return (
    <nav aria-label="Conversion Wizard Progress" className="w-full border-b border-slate-800 bg-slate-950/60 px-6 py-3">
      <ol className="flex items-center justify-between gap-2 sm:gap-4">
        {STEPS.map((s, idx) => {
          const isCurrent = s.step === currentStep;
          const isCompleted = s.step < currentStep;
          const isPending = s.step > currentStep;
          const isClickable = !isSubmitting && onStepClick && (isCompleted || (s.step === 2 && currentStep === 3));

          return (
            <li key={s.step} className="flex-1 flex items-center">
              <div className="flex items-center gap-2 sm:gap-3 w-full">
                {/* Step indicator circle / icon */}
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick(s.step)}
                  className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-mono font-medium transition-colors shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-pointer'
                      : isCurrent
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/60 ring-2 ring-sky-500/20'
                      : 'bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Icon name="check" size="xs" />
                  ) : (
                    <span>{s.step}</span>
                  )}
                </button>

                {/* Step text */}
                <div className="flex flex-col min-w-0">
                  <span
                    className={`text-xs font-medium truncate ${
                      isCurrent
                        ? 'text-slate-100 font-semibold'
                        : isCompleted
                        ? 'text-slate-300'
                        : 'text-slate-500'
                    }`}
                  >
                    {s.label}
                  </span>
                  <span className="hidden md:inline text-[10px] text-slate-500 truncate">
                    {s.description}
                  </span>
                </div>

                {/* Connector line between steps */}
                {idx < STEPS.length - 1 && (
                  <div
                    className={`hidden sm:block flex-1 h-px mx-2 ${
                      s.step < currentStep ? 'bg-emerald-500/40' : 'bg-slate-800'
                    }`}
                    aria-hidden="true"
                  />
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
