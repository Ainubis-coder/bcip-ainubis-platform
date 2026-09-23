import { runConfigTests } from './config.test';
import { runApiTests } from './api.test';
import { runWorkerTests } from './worker.test';
import { runInfrastructureTests } from './infrastructure.test';
import { runWebTests } from './web.test';
import { runDesignSystemTests } from './design-system.test';
import { runShellTests } from './shell.test';

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
