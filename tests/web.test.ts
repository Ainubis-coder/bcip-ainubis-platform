import assert from 'assert';
import { DEMO_PORTFOLIO_METRICS, DEMO_SCHEMES_LIST } from '../apps/web/src/data/mock-dashboard-data';

export async function runWebTests(): Promise<void> {
  console.log('[TEST] Running Web Shell Data & Module Tests...');

  assert.ok(DEMO_PORTFOLIO_METRICS.length >= 4, 'Portfolio metrics must have at least 4 items');
  assert.ok(DEMO_SCHEMES_LIST.length >= 4, 'Schemes list must have sample schemes');

  console.log('  ✓ Web dashboard definitions and module metadata validated');
}
