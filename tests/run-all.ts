import { runConfigTests } from './config.test';
import { runApiTests } from './api.test';
import { runWorkerTests } from './worker.test';
import { runInfrastructureTests } from './infrastructure.test';
import { runWebTests } from './web.test';
import { runDesignSystemTests } from './design-system.test';
import { runShellTests } from './shell.test';
import { runCrmTests } from './crm.test.ts';
import { runCrmApiTests } from './crm-api.test.ts';
import { runCrmFrontendTests } from './crm-frontend.test.ts';
import { runCrmLeadsTests } from './crm-leads.test.ts';
import { runCrmConversionTests } from './crm-conversion.test.ts';
import { runCrmOrganisationsTests } from './crm-organisations.test.ts';
import { runCrmActivitiesTasksTests } from './crm-activities-tasks.test.ts';
import { runAinubisFoundationTests } from './ainubis-foundation.test.ts';
import { runAinubisDashboardContextualTests } from './ainubis-dashboard-contextual.test.ts';
import { runAinubisContinuousMonitoringTests } from './ainubis-continuous-monitoring.test.ts';

async function main() {
  console.log('====================================================');
  console.log('BCIP — Phase 1 & 2 Automated Test Suite');
  console.log('====================================================\n');

  try {
    await runConfigTests();
    await runApiTests();
    await runInfrastructureTests();
    await runWorkerTests();
    await runWebTests();
    await runDesignSystemTests();
    await runShellTests();
    await runCrmTests();
    await runCrmApiTests();
    await runCrmFrontendTests();
    await runCrmLeadsTests();
    await runCrmConversionTests();
    await runCrmOrganisationsTests();
    await runCrmActivitiesTasksTests();
    await runAinubisFoundationTests();
    await runAinubisDashboardContextualTests();
    await runAinubisContinuousMonitoringTests();

    console.log('\n====================================================');
    console.log('✅ ALL TEST SUITES PASSED SUCCESSFULLY');
    console.log('====================================================');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILURE:', error);
    process.exit(1);
  }
}

main();
