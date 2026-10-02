/**
 * BCIP Ainubis Confidence Indicator Component
 * Phase 2E — Prompt 002E-001: Ainubis CRM Intelligence Foundation & Governance
 */

import React from 'react';
import { ConfidenceLevel } from '../crm/shared/crm-types';

interface AinubisConfidenceIndicatorProps {
  score: number; // 0 to 100
  level: ConfidenceLevel | string;
  showScore?: boolean;
}

export function AinubisConfidenceIndicator({
  score,
  level,
  showScore = true,
}: AinubisConfidenceIndicatorProps) {
  const getLevelConfig = (lvl: string) => {
    switch (lvl) {
      case 'VERY_HIGH':
        return { label: 'Very High Confidence', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
      case 'HIGH':
        return { label: 'High Confidence', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
      case 'MODERATE':
        return { label: 'Moderate Confidence', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
      case 'LOW':
        return { label: 'Low Confidence', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' };
      case 'VERY_LOW':
      default:
        return { label: 'Very Low Confidence', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
    }
  };

  const cfg = getLevelConfig(level);

  return (
    <div className="inline-flex items-center gap-1.5">
      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${cfg.color}`}>
        {cfg.label} {showScore && `(${score}%)`}
      </span>
    </div>
  );
}
