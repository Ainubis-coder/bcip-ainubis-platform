import assert from 'assert';
import {
  darkSemanticColors,
  lightSemanticColors,
  darkTheme,
  lightTheme,
  typographyScale,
  spacingScale,
  radiusTokens,
  elevationTokens,
  motionDurations,
  zIndexTokens,
  breakpoints,
  Button,
  IconButton,
  Input,
  Textarea,
  Select,
  Checkbox,
  Radio,
  Switch,
  Badge,
  Avatar,
  Card,
  Panel,
  StatusIndicator,
  Modal,
  Dialog,
  Dropdown,
  Tooltip,
  Popover,
  Tabs,
  Breadcrumbs,
  Alert,
  Toast,
  Spinner,
  Skeleton,
  EmptyState,
  LoadingState,
  ErrorState,
  AinubisBadge,
  AinubisCard,
  AinubisBanner,
  DataTablePattern,
  MetricCardPattern,
  FormSectionPattern,
  Icon,
} from '../packages/ui/src/index';

export async function runDesignSystemTests() {
  console.log('--- Testing BCIP Enterprise Design System & Tokens ---');

  // Test 1: Color Token Integrity & Dual-Theme Architecture
  console.log('1. Checking Semantic Color Tokens & Theme Architecture...');
  assert.ok(darkSemanticColors.brand.primary, 'Dark theme brand primary color missing');
  assert.ok(lightSemanticColors.brand.primary, 'Light theme brand primary color missing');
  assert.strictEqual(darkSemanticColors.brand.primary, '#10B981', 'Dark brand primary must be Emerald 500');
  assert.strictEqual(lightSemanticColors.brand.primary, '#059669', 'Light brand primary must be Emerald 600');
  assert.ok(darkSemanticColors.surface.canvas, 'Dark surface canvas missing');
  assert.ok(darkSemanticColors.surface.default, 'Dark surface default missing');
  assert.ok(darkSemanticColors.status.success, 'Status success token missing');
  assert.ok(darkSemanticColors.status.warning, 'Status warning token missing');
  assert.ok(darkSemanticColors.status.error, 'Status error token missing');
  assert.ok(darkSemanticColors.status.info, 'Status info token missing');
  console.log('   ✓ Semantic color tokens verified for dark and light modes.');

  // Test 2: Ainubis State Taxonomy & Visual Tokens
  console.log('2. Checking Ainubis Visual Foundation Tokens...');
  assert.ok(darkSemanticColors.ainubis.observation, 'Ainubis observation color missing');
  assert.ok(darkSemanticColors.ainubis.insight, 'Ainubis insight color missing');
  assert.ok(darkSemanticColors.ainubis.recommendation, 'Ainubis recommendation color missing');
  assert.ok(darkSemanticColors.ainubis.alert, 'Ainubis alert color missing');
  assert.ok(darkSemanticColors.ainubis.approvalRequired, 'Ainubis human approvalRequired color missing');
  console.log('   ✓ Ainubis 5-state visual taxonomy verified.');

  // Test 3: Typography Scale & Tabular Numeric Rules
  console.log('3. Checking Typography Scale & Monospace/Tabular Rules...');
  assert.ok(typographyScale.display, 'Display typography scale missing');
  assert.ok(typographyScale.heading1, 'Heading1 typography scale missing');
  assert.ok(typographyScale.body, 'Body typography scale missing');
  assert.ok(typographyScale.code, 'Code monospace scale missing');
  assert.ok(typographyScale.metricLarge, 'MetricLarge scale missing');
  assert.ok(
    typographyScale.metricLarge.cssClass.includes('tabular-nums'),
    'MetricLarge typography token must enforce tabular-nums'
  );
  assert.ok(
    typographyScale.code.cssClass.includes('font-mono'),
    'Code typography token must enforce font-mono'
  );
  console.log('   ✓ Typography tokens and tabular figures verified.');

  // Test 4: Spacing, Radius, Motion & Z-Index Tokens
  console.log('4. Checking Spacing, Radius, Motion & Z-Index Tokens...');
  assert.strictEqual(spacingScale[0], '0rem');
  assert.strictEqual(spacingScale[4], '1rem');
  assert.strictEqual(spacingScale[8], '2rem');
  assert.strictEqual(radiusTokens.none, '0px');
  assert.strictEqual(radiusTokens.sm, '0.25rem');
  assert.strictEqual(radiusTokens.md, '0.375rem');
  assert.strictEqual(radiusTokens.lg, '0.5rem');
  assert.strictEqual(elevationTokens.none, 'none');
  assert.ok(elevationTokens.md, 'Elevation md missing');
  assert.strictEqual(motionDurations.fast, '150ms');
  assert.strictEqual(motionDurations.normal, '200ms');
  assert.strictEqual(zIndexTokens.modal, 60);
  assert.strictEqual(zIndexTokens.tooltip, 90);
  assert.ok(breakpoints.lg, 'Breakpoint lg missing');
  console.log('   ✓ Spacing, radius, motion, elevation and z-index scales verified.');

  // Test 5: Themes Object Completeness
  console.log('5. Checking Dark & Light Theme Objects...');
  assert.strictEqual(darkTheme.name, 'dark');
  assert.strictEqual(lightTheme.name, 'light');
  assert.ok(darkTheme.colors.brand.primary);
  assert.ok(lightTheme.colors.brand.primary);
  console.log('   ✓ Theme objects complete.');

  // Test 6: Core Component Definition Presence
  console.log('6. Checking Core Component Exports...');
  const components = [
    Button,
    IconButton,
    Input,
    Textarea,
    Select,
    Checkbox,
    Radio,
    Switch,
    Badge,
    Avatar,
    Card,
    Panel,
    StatusIndicator,
    Modal,
    Dialog,
    Dropdown,
    Tooltip,
    Popover,
    Tabs,
    Breadcrumbs,
    Alert,
    Toast,
    Spinner,
    Skeleton,
    EmptyState,
    LoadingState,
    ErrorState,
    AinubisBadge,
    AinubisCard,
    AinubisBanner,
    DataTablePattern,
    MetricCardPattern,
    FormSectionPattern,
    Icon,
  ];

  for (const comp of components) {
    assert.ok(comp !== undefined && comp !== null, `Component ${comp} is undefined`);
  }
  console.log(`   ✓ All ${components.length} design system components and patterns exported.`);

  console.log('✅ Design System & Token Foundation verified successfully.\n');
}

if (process.argv[1]?.endsWith('design-system.test.ts')) {
  runDesignSystemTests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
