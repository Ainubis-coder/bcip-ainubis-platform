/**
 * BCIP CRM Formatting Utilities
 * Phase 2D — Prompt 002D-001: CRM Frontend Foundation & Pipeline Kanban
 * Centralized currency and date display with strict South African Rand (ZAR) conventions.
 */

/**
 * Format currency amount as South African Rand (ZAR)
 * Examples: 144000 -> "R 144,000.00"
 */
export function formatZAR(amount: number | string | null | undefined): string {
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (numeric === null || numeric === undefined || isNaN(numeric)) {
    return 'R 0.00';
  }

  const parts = Math.abs(numeric).toFixed(2).split('.');
  const wholeWithCommas = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formatted = `R ${wholeWithCommas}.${parts[1]}`;

  return numeric < 0 ? `-${formatted}` : formatted;
}

/**
 * Compact currency formatting for high-density metric cards
 * Examples: 144000 -> "R 144k", 1200000 -> "R 1.2M"
 */
export function formatCompactZAR(amount: number | string | null | undefined): string {
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (numeric === null || numeric === undefined || isNaN(numeric)) {
    return 'R 0';
  }

  const abs = Math.abs(numeric);
  let valueStr = '';

  if (abs >= 1_000_000) {
    valueStr = `${(abs / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  } else if (abs >= 1_000) {
    valueStr = `${(abs / 1_000).toFixed(0)}k`;
  } else {
    valueStr = abs.toFixed(0);
  }

  const result = `R ${valueStr}`;
  return numeric < 0 ? `-${result}` : result;
}

/**
 * Format an ISO date string into readable South African date format
 * Examples: "2026-03-31T00:00:00.000Z" -> "31 Mar 2026"
 */
export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Format date relative to now or target
 */
export function formatTargetDays(dateStr?: string | null): { text: string; isPast: boolean } {
  if (!dateStr) return { text: 'No date', isPast: false };
  try {
    const target = new Date(dateStr);
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d overdue`, isPast: true };
    } else if (diffDays === 0) {
      return { text: 'Closing today', isPast: false };
    } else {
      return { text: `in ${diffDays}d`, isPast: false };
    }
  } catch {
    return { text: dateStr, isPast: false };
  }
}

/**
 * Format probability percentage
 */
export function formatProbability(prob?: number | null): string {
  if (prob === null || prob === undefined || isNaN(prob)) {
    return '0%';
  }
  return `${Math.min(100, Math.max(0, Math.round(prob)))}%`;
}
