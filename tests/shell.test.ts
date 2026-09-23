import { ENTERPRISE_NAV_GROUPS, ModuleId } from '../apps/web/src/types/navigation';
import { MOCK_SEARCH_INDEX } from '../apps/web/src/data/mock-search-data';
import { INITIAL_NOTIFICATIONS, AVAILABLE_TENANTS, CURRENT_USER } from '../apps/web/src/data/mock-notifications-data';

export async function runShellTests() {
  console.log('\n--- Testing BCIP Enterprise Application Shell ---');

  // 1. Navigation Architecture & 9 Groups
  console.log('1. Checking Enterprise Navigation Architecture & 9 Groups...');
  const expectedGroups = [
    'overview',
    'relationships',
    'property',
    'finance',
    'operations',
    'governance',
    'platform',
    'ainubis',
    'system',
  ];

  const actualGroupIds = ENTERPRISE_NAV_GROUPS.map((g) => g.id);
  for (const expected of expectedGroups) {
    if (!actualGroupIds.includes(expected)) {
      throw new Error(`Missing expected enterprise navigation group: ${expected}`);
    }
  }

  // Verify all 21 core modules exist in the navigation hierarchy
  const expectedModules: ModuleId[] = [
    'dashboard',
    'crm',
    'leads',
    'organisations',
    'schemes',
    'properties',
    'finance',
    'invoices',
    'payments',
    'maintenance',
    'contractors',
    'governance',
    'documents',
    'integrations',
    'analytics',
    'ainubis',
    'alerts',
    'recommendations',
    'tasks',
    'notifications',
    'administration',
  ];

  const allNavItems = ENTERPRISE_NAV_GROUPS.flatMap((g) => g.items);
  const registeredModuleIds = allNavItems.map((item) => item.id);

  for (const mod of expectedModules) {
    if (!registeredModuleIds.includes(mod)) {
      throw new Error(`Missing expected module in navigation groups: ${mod}`);
    }
  }
  console.log(`   ✓ All 9 navigation groups and ${registeredModuleIds.length} items verified.`);

  // 2. Search Index Foundation
  console.log('2. Checking Global Search Foundation (Cmd+K)...');
  if (!Array.isArray(MOCK_SEARCH_INDEX) || MOCK_SEARCH_INDEX.length < 5) {
    throw new Error('Search index foundation missing or incomplete');
  }

  const searchCategories = new Set(MOCK_SEARCH_INDEX.map((i) => i.category));
  const expectedCategories = ['schemes', 'properties', 'contacts', 'finance', 'ainubis', 'navigation'];
  for (const cat of expectedCategories) {
    if (!searchCategories.has(cat as any)) {
      throw new Error(`Missing search index category: ${cat}`);
    }
  }

  // Test query search filtering logic
  const query = 'Sandton';
  const matched = MOCK_SEARCH_INDEX.filter(
    (item) => item.title.includes(query) || item.subtitle.includes(query)
  );
  if (matched.length === 0) {
    throw new Error(`Search filter failed for query "${query}"`);
  }
  console.log(`   ✓ Search index contains ${MOCK_SEARCH_INDEX.length} records across ${searchCategories.size} categories.`);

  // 3. Notification Foundation
  console.log('3. Checking Shell Notification System & Categories...');
  if (!Array.isArray(INITIAL_NOTIFICATIONS) || INITIAL_NOTIFICATIONS.length === 0) {
    throw new Error('Notifications foundation missing');
  }

  const notifCategories = new Set(INITIAL_NOTIFICATIONS.map((n) => n.category));
  const expectedNotifCats = ['ainubis', 'governance', 'financial', 'operational', 'maintenance'];
  for (const cat of expectedNotifCats) {
    if (!notifCategories.has(cat as any)) {
      throw new Error(`Missing notification category: ${cat}`);
    }
  }

  const unreadCount = INITIAL_NOTIFICATIONS.filter((n) => !n.read).length;
  if (unreadCount <= 0) {
    throw new Error('Unread notifications count should be > 0 for demo/testing');
  }
  console.log(`   ✓ Notification foundation verified with ${unreadCount} unread items.`);

  // 4. Organisation / Tenant Context Foundation
  console.log('4. Checking Organisation / Tenant Context Foundation...');
  if (!Array.isArray(AVAILABLE_TENANTS) || AVAILABLE_TENANTS.length < 2) {
    throw new Error('Multi-tenant configurations missing');
  }

  for (const tenant of AVAILABLE_TENANTS) {
    if (!tenant.id || !tenant.name || !tenant.registrationNumber || typeof tenant.schemeCount !== 'number') {
      throw new Error(`Tenant context record invalid: ${JSON.stringify(tenant)}`);
    }
  }

  if (!CURRENT_USER.fullName || !CURRENT_USER.email || !CURRENT_USER.role) {
    throw new Error('User account context invalid');
  }
  console.log(`   ✓ Multi-tenant context verified: active tenant "${CURRENT_USER.tenantName}" with ${AVAILABLE_TENANTS[0].schemeCount} schemes.`);

  // 5. Ainubis Visual Shell States
  console.log('5. Checking Ainubis Visual Shell Integration...');
  const ainubisGroup = ENTERPRISE_NAV_GROUPS.find((g) => g.id === 'ainubis');
  if (!ainubisGroup) {
    throw new Error('Ainubis navigation group missing');
  }
  const ainubisItems = ainubisGroup.items.map((i) => i.id);
  if (!ainubisItems.includes('alerts') || !ainubisItems.includes('recommendations') || !ainubisItems.includes('tasks')) {
    throw new Error('Ainubis sub-routes missing in navigation group');
  }
  console.log('   ✓ Ainubis intelligence access points verified.');

  console.log('✅ Enterprise Application Shell verified successfully.');
}
