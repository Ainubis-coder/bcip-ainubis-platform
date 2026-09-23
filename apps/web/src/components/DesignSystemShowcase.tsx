import React, { useState } from 'react';
import {
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
  ErrorState,
  AinubisBadge,
  AinubisCard,
  AinubisBanner,
  DataTablePattern,
  MetricCardPattern,
  FormSectionPattern,
  Icon,
  darkSemanticColors,
  lightSemanticColors,
  typographyScale,
  spacingScale,
  radiusTokens,
  elevationTokens,
  motionDurations,
  Column,
} from '@bcip/ui';

interface MockSchemeRecord extends Record<string, unknown> {
  id: string;
  code: string;
  name: string;
  units: number;
  arrearsRate: number;
  collectionTotal: number;
  status: 'nominal' | 'warning' | 'alert';
}

const MOCK_SCHEMES: MockSchemeRecord[] = [
  { id: '1', code: 'SCH-0142', name: 'Sandton Grand Terraces', units: 148, arrearsRate: 2.4, collectionTotal: 485200, status: 'nominal' },
  { id: '2', code: 'SCH-0143', name: 'Cape Point Heights', units: 84, arrearsRate: 5.8, collectionTotal: 294100, status: 'warning' },
  { id: '3', code: 'SCH-0144', name: 'Durban Marina Villas', units: 210, arrearsRate: 1.1, collectionTotal: 720500, status: 'nominal' },
  { id: '4', code: 'SCH-0145', name: 'Pretoria Ridge Estates', units: 62, arrearsRate: 8.9, collectionTotal: 180400, status: 'alert' },
  { id: '5', code: 'SCH-0146', name: 'Rosebank Central Towers', units: 195, arrearsRate: 3.2, collectionTotal: 640000, status: 'nominal' },
  { id: '6', code: 'SCH-0147', name: 'Umhlanga Rocks Oasis', units: 112, arrearsRate: 4.0, collectionTotal: 395000, status: 'nominal' },
  { id: '7', code: 'SCH-0148', name: 'Stellenbosch Oaks', units: 45, arrearsRate: 11.2, collectionTotal: 125000, status: 'alert' },
];

export function DesignSystemShowcase() {
  const [activeTab, setActiveTab] = useState('overview');
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>('dark');

  // Interactive component states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [demoSwitch, setDemoSwitch] = useState(true);
  const [demoCheckbox, setDemoCheckbox] = useState(true);
  const [demoRadio, setDemoRadio] = useState('option1');
  const [demoLoading, setDemoLoading] = useState(false);
  const [showToast, setShowToast] = useState(true);
  const [approvalOutcome, setApprovalOutcome] = useState<string | null>(null);

  const showcaseTabs = [
    { id: 'overview', label: 'Design Tokens' },
    { id: 'buttons', label: 'Buttons & Icons' },
    { id: 'forms', label: 'Form Controls' },
    { id: 'data', label: 'Data Display & Tables' },
    { id: 'feedback', label: 'Feedback & Overlays' },
    { id: 'ainubis', label: 'Ainubis Intelligence Foundation' },
  ];

  const tableColumns: Column<MockSchemeRecord>[] = [
    { key: 'code', header: 'Scheme Code', sortable: true },
    { key: 'name', header: 'Scheme Name', sortable: true },
    {
      key: 'units',
      header: 'Total Units',
      isNumeric: true,
      sortable: true,
      render: (r) => <span>{r.units} units</span>,
    },
    {
      key: 'arrearsRate',
      header: 'Arrears %',
      isNumeric: true,
      sortable: true,
      render: (r) => (
        <span className={r.arrearsRate > 6 ? 'text-rose-400 font-semibold' : 'text-slate-300'}>
          {r.arrearsRate.toFixed(1)}%
        </span>
      ),
    },
    {
      key: 'collectionTotal',
      header: 'Monthly Levies (ZAR)',
      isNumeric: true,
      sortable: true,
      render: (r) => <span>R {r.collectionTotal.toLocaleString()}</span>,
    },
    {
      key: 'status',
      header: 'State',
      render: (r) => (
        <StatusIndicator
          status={r.status === 'nominal' ? 'healthy' : r.status === 'warning' ? 'warning' : 'alert'}
          label={r.status === 'nominal' ? 'Compliant' : r.status === 'warning' ? 'Review Due' : 'Deficit Alert'}
          size="sm"
        />
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">
                Phase 2A — Architecture
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400 font-mono">@bcip/ui v0.1.0</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              BCIP Enterprise Design System & Token Catalog
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Centralized semantic token foundation, high-density data patterns, accessible form controls,
              and restrained Ainubis intelligence layer styling for property & body corporate management.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-xs text-slate-400 flex items-center gap-2 bg-slate-950 p-1.5 rounded border border-slate-800">
              <span className="text-[11px] font-medium text-slate-400">Theme Preview:</span>
              <button
                onClick={() => setPreviewTheme('dark')}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  previewTheme === 'dark' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Dark (Default)
              </button>
              <button
                onClick={() => setPreviewTheme('light')}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  previewTheme === 'light' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Light Tokens
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 pt-2">
          <Tabs tabs={showcaseTabs} activeTab={activeTab} onChange={setActiveTab} variant="underline" />
        </div>
      </div>

      {/* TAB 1: DESIGN TOKENS & SCALES */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Colors */}
          <Card
            title="Semantic Color Token Architecture"
            subtitle="Strict 60-30-10 distribution: neutral slate surfaces, structural borders, and restrained accents"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Brand Swatches */}
              <div className="space-y-2 bg-slate-950/40 p-3 rounded border border-slate-800/80">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Brand Tokens
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-300">brand.primary</span>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded" style={{ backgroundColor: darkSemanticColors.brand.primary }} />
                      <code className="text-[11px] text-slate-400 font-mono">{darkSemanticColors.brand.primary}</code>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-300">brand.secondary</span>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded" style={{ backgroundColor: darkSemanticColors.brand.secondary }} />
                      <code className="text-[11px] text-slate-400 font-mono">{darkSemanticColors.brand.secondary}</code>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-300">brand.accent</span>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded" style={{ backgroundColor: darkSemanticColors.brand.accent }} />
                      <code className="text-[11px] text-slate-400 font-mono">{darkSemanticColors.brand.accent}</code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Surface Swatches */}
              <div className="space-y-2 bg-slate-950/40 p-3 rounded border border-slate-800/80">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Surface & Canvas
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-300">surface.canvas</span>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded border border-slate-700" style={{ backgroundColor: darkSemanticColors.surface.canvas }} />
                      <code className="text-[11px] text-slate-400 font-mono">{darkSemanticColors.surface.canvas}</code>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-300">surface.default</span>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded border border-slate-700" style={{ backgroundColor: darkSemanticColors.surface.default }} />
                      <code className="text-[11px] text-slate-400 font-mono">{darkSemanticColors.surface.default}</code>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-300">surface.raised</span>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded border border-slate-700" style={{ backgroundColor: darkSemanticColors.surface.raised }} />
                      <code className="text-[11px] text-slate-400 font-mono">{darkSemanticColors.surface.raised}</code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Swatches */}
              <div className="space-y-2 bg-slate-950/40 p-3 rounded border border-slate-800/80">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Data Status Tokens
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-emerald-400 font-medium">status.success</span>
                    <code className="text-[11px] text-slate-400 font-mono">{darkSemanticColors.status.success}</code>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-amber-400 font-medium">status.warning</span>
                    <code className="text-[11px] text-slate-400 font-mono">{darkSemanticColors.status.warning}</code>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-rose-400 font-medium">status.error</span>
                    <code className="text-[11px] text-slate-400 font-mono">{darkSemanticColors.status.error}</code>
                  </div>
                </div>
              </div>

              {/* Ainubis Tokens */}
              <div className="space-y-2 bg-slate-950/40 p-3 rounded border border-slate-800/80">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Ainubis Layer Tokens
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">observation</span>
                    <span className="w-4 h-4 rounded" style={{ backgroundColor: darkSemanticColors.ainubis.observation }} />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-sky-400">insight</span>
                    <span className="w-4 h-4 rounded" style={{ backgroundColor: darkSemanticColors.ainubis.insight }} />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-indigo-400">recommendation</span>
                    <span className="w-4 h-4 rounded" style={{ backgroundColor: darkSemanticColors.ainubis.recommendation }} />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-pink-400 font-medium">approvalRequired</span>
                    <span className="w-4 h-4 rounded" style={{ backgroundColor: darkSemanticColors.ainubis.approvalRequired }} />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Typography Scale */}
          <Card
            title="Typography Scale"
            subtitle="Pairing Plus Jakarta Sans for UI headers and body with JetBrains Mono tabular figures for metrics"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Font / Specs</th>
                    <th className="py-2.5 px-3">Example Output</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-300">Display</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{typographyScale.display.fontSize} / {typographyScale.display.lineHeight}</td>
                    <td className="py-3 px-3 text-slate-100 font-bold text-2xl tracking-tight">Executive Portfolio</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-300">Heading 1</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{typographyScale.heading1.fontSize} / {typographyScale.heading1.lineHeight}</td>
                    <td className="py-3 px-3 text-slate-100 font-semibold text-xl tracking-tight">Sectional Scheme Register</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-300">Heading 2</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{typographyScale.heading2.fontSize} / {typographyScale.heading2.lineHeight}</td>
                    <td className="py-3 px-3 text-slate-100 font-semibold text-lg tracking-tight">Financial Reconciliations</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-300">Body Regular</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{typographyScale.body.fontSize} / {typographyScale.body.lineHeight}</td>
                    <td className="py-3 px-3 text-slate-300">Enterprise operational intelligence for managing agents and trustees.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-300">Monospace / Tabular</td>
                    <td className="py-3 px-3 font-mono text-slate-400">JetBrains Mono / tabular-nums</td>
                    <td className="py-3 px-3 font-mono tabular-nums text-emerald-400 font-semibold">R 4,892,150.00 (+14.2%)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Spacing, Radius, Motion */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="Border Radii">
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">radius.sm ({radiusTokens.sm})</span>
                  <div className="w-16 h-8 bg-slate-800 border border-slate-700 rounded-sm flex items-center justify-center text-[10px] text-slate-400">4px</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">radius.md ({radiusTokens.md})</span>
                  <div className="w-16 h-8 bg-slate-800 border border-slate-700 rounded-md flex items-center justify-center text-[10px] text-slate-400">6px</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">radius.lg ({radiusTokens.lg})</span>
                  <div className="w-16 h-8 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center text-[10px] text-slate-400">8px</div>
                </div>
              </div>
            </Card>

            <Card title="Elevation & Shadows">
              <div className="space-y-3 text-xs">
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-center">
                  Flat Surface (Default 1px Border)
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-700 shadow-md text-slate-300 text-center">
                  Elevated Surface (Dropdown / Popover)
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-700 shadow-2xl text-slate-300 text-center">
                  Modal Overlay Depth
                </div>
              </div>
            </Card>

            <Card title="Latency Budget (Motion)">
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-300">Fast (Micro-interact)</span>
                  <span className="font-mono text-emerald-400">{motionDurations.fast}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-300">Normal (Modal Reveal)</span>
                  <span className="font-mono text-sky-400">{motionDurations.normal}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-300">Slow (Drawer Slide)</span>
                  <span className="font-mono text-indigo-400">{motionDurations.slow}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: BUTTONS & ICONS */}
      {activeTab === 'buttons' && (
        <div className="space-y-6">
          <Card
            title="Button Variants & Semantic Actions"
            subtitle="Spatial mathematical padding: horizontal padding ~ 2x vertical padding, touch target >= 40px"
          >
            <div className="space-y-6">
              {/* Variants */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Variants</h4>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary">Primary Action</Button>
                  <Button variant="secondary">Secondary Action</Button>
                  <Button variant="outline">Outline Action</Button>
                  <Button variant="ghost">Ghost Action</Button>
                  <Button variant="danger">Destructive Action</Button>
                  <Button variant="ainubis">Ainubis Intelligence</Button>
                </div>
              </div>

              {/* Sizes */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Sizes</h4>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="secondary" size="sm">Small (32px)</Button>
                  <Button variant="secondary" size="md">Medium (40px)</Button>
                  <Button variant="secondary" size="lg">Large (44px)</Button>
                </div>
              </div>

              {/* States: Loading & Disabled */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Component States</h4>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="primary"
                    isLoading={demoLoading}
                    onClick={() => {
                      setDemoLoading(true);
                      setTimeout(() => setDemoLoading(false), 2000);
                    }}
                  >
                    {demoLoading ? 'Processing Request' : 'Click For Loading State'}
                  </Button>
                  <Button variant="secondary" disabled>Disabled State</Button>
                  <Button
                    variant="secondary"
                    leftIcon={<Icon name="download" size="xs" />}
                    rightIcon={<Icon name="arrow-up-right" size="xs" />}
                  >
                    Icons Attached
                  </Button>
                </div>
              </div>

              {/* Icon Buttons */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Icon Buttons</h4>
                <div className="flex items-center gap-3">
                  <IconButton icon={<Icon name="refresh" size="sm" />} aria-label="Refresh data" variant="secondary" />
                  <IconButton icon={<Icon name="search" size="sm" />} aria-label="Search records" variant="outline" />
                  <IconButton icon={<Icon name="sliders" size="sm" />} aria-label="Filter records" variant="ghost" />
                  <IconButton icon={<Icon name="shield" size="sm" />} aria-label="Security settings" variant="primary" />
                  <IconButton icon={<Icon name="x" size="sm" />} aria-label="Delete entry" variant="danger" />
                </div>
              </div>
            </div>
          </Card>

          {/* SVG Icon Matrix */}
          <Card title="Standardized Enterprise Icon Library" subtitle="Clean stroke-based 24x24 icons with accessible labels">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {[
                { name: 'check' as const, label: 'check' },
                { name: 'check-circle' as const, label: 'check-circle' },
                { name: 'alert-triangle' as const, label: 'alert-triangle' },
                { name: 'alert-circle' as const, label: 'alert-circle' },
                { name: 'info' as const, label: 'info' },
                { name: 'search' as const, label: 'search' },
                { name: 'filter' as const, label: 'filter' },
                { name: 'refresh' as const, label: 'refresh' },
                { name: 'building' as const, label: 'building' },
                { name: 'database' as const, label: 'database' },
                { name: 'cpu' as const, label: 'cpu' },
                { name: 'zap' as const, label: 'zap' },
                { name: 'shield' as const, label: 'shield' },
                { name: 'clock' as const, label: 'clock' },
                { name: 'file-text' as const, label: 'file-text' },
                { name: 'copy' as const, label: 'copy' },
              ].map((ic) => (
                <div
                  key={ic.name}
                  className="flex flex-col items-center justify-center p-3 rounded bg-slate-950/60 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
                >
                  <Icon name={ic.name} size="md" className="mb-2" />
                  <span className="text-[10px] font-mono text-slate-400">{ic.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: FORM CONTROLS */}
      {activeTab === 'forms' && (
        <div className="space-y-6">
          <FormSectionPattern
            title="Form Architecture & Validation States"
            description="High-contrast form fields with aria-invalid descriptions, helper copy, and accessible focus rings"
            actions={
              <>
                <Button variant="ghost" size="sm">Cancel Changes</Button>
                <Button variant="primary" size="sm">Save Sectional Record</Button>
              </>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Scheme Name"
                placeholder="e.g. Cape Point Heights"
                defaultValue="Cape Point Heights"
                helperText="Official registered sectional title scheme name"
                required
              />

              <Input
                label="Scheme Registration Number"
                placeholder="SS-XXXX/YYYY"
                defaultValue="SS-9921/2019"
                leftIcon={<Icon name="building" size="xs" />}
              />

              <Input
                label="Managing Agency Contact Email"
                type="email"
                defaultValue="invalid-email-format"
                error="Please enter a verified corporate email domain"
                required
              />

              <Select
                label="Portfolio Governance Model"
                options={[
                  { value: 'two-tier', label: 'Two-Tier Trustees (Standard)' },
                  { value: 'executive', label: 'Executive Managing Agent' },
                  { value: 'direct', label: 'Direct Member Council' },
                ]}
                helperText="Dictates approval quorum and Ainubis autonomous execution gates"
              />

              <div className="md:col-span-2">
                <Textarea
                  label="Levy Resolution Notes"
                  placeholder="Enter notes on annual general meeting approval..."
                  defaultValue="2026 Reserve fund contribution adjusted by +6.5% pursuant to section 3(1)(b) of the STSMA."
                  rows={3}
                />
              </div>

              {/* Toggles, Checkboxes, Radios */}
              <div className="space-y-3 bg-slate-950/40 p-4 rounded border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Interactive Selection Controls
                </span>
                <Switch
                  checked={demoSwitch}
                  onChange={setDemoSwitch}
                  label="Automate Late Levy Interest Calculation"
                  description="Apply prescribed prime + 2% interest on arrears exceeding 30 days"
                />
                <Checkbox
                  checked={demoCheckbox}
                  onChange={(e) => setDemoCheckbox(e.target.checked)}
                  label="Enforce dual-signoff on payments over R50,000"
                  description="Requires both chairman and portfolio manager cryptographic confirmation"
                />
              </div>

              <div className="space-y-3 bg-slate-950/40 p-4 rounded border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Radio Group
                </span>
                <div className="space-y-2">
                  <Radio
                    name="billing-cadence"
                    value="option1"
                    checked={demoRadio === 'option1'}
                    onChange={() => setDemoRadio('option1')}
                    label="Monthly Levy Invoicing (1st of month)"
                  />
                  <Radio
                    name="billing-cadence"
                    value="option2"
                    checked={demoRadio === 'option2'}
                    onChange={() => setDemoRadio('option2')}
                    label="Quarterly Advance Billing"
                  />
                </div>
              </div>
            </div>
          </FormSectionPattern>
        </div>
      )}

      {/* TAB 4: DATA DISPLAY & TABLES */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCardPattern
              label="Active Schemes"
              value="142"
              change={{ value: '+8.4%', trend: 'up', period: 'last month' }}
              actionIcon={<Icon name="building" size="sm" />}
            />
            <MetricCardPattern
              label="Total Units Indexed"
              value="8,419"
              change={{ value: '+124', trend: 'up', period: 'last week' }}
              actionIcon={<Icon name="layers" size="sm" />}
            />
            <MetricCardPattern
              label="Portfolio Arrears Ratio"
              value="3.2%"
              change={{ value: '-0.6%', trend: 'down', period: 'last cycle' }}
              actionIcon={<Icon name="activity" size="sm" />}
            />
            <MetricCardPattern
              label="Ainubis Invariant Health"
              value="99.8%"
              status="nominal"
              subtext="Zero compliance drift detected"
              actionIcon={<Icon name="shield" size="sm" />}
            />
          </div>

          {/* High Density Table Pattern */}
          <DataTablePattern
            title="Sectional Schemes Directory"
            subtitle="High-density data grid enforcing tabular numerals, status pips, and client-side sorting"
            columns={tableColumns}
            data={MOCK_SCHEMES}
            searchKey="name"
            searchPlaceholder="Search scheme name or code..."
            pageSize={5}
            primaryAction={{
              label: 'Add Scheme',
              onClick: () => setIsModalOpen(true),
            }}
          />

          {/* Badges & Status Indicators */}
          <Card title="Badges & Metadata Separation (Zero-Pill Discipline)" subtitle="Contrast between status indicators and clean typographic metadata">
            <div className="space-y-4">
              <div>
                <h5 className="text-xs font-medium text-slate-400 mb-2">Semantic Badges (Used strictly for state)</h5>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="neutral">Draft Record</Badge>
                  <Badge variant="success" dot>Nominal / Reconciled</Badge>
                  <Badge variant="warning" dot>Audit Warning</Badge>
                  <Badge variant="error" dot>Arrears Deficit</Badge>
                  <Badge variant="info">Automated Rule</Badge>
                  <Badge variant="ainubis">Ainubis Monitored</Badge>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <h5 className="text-xs font-medium text-slate-400 mb-2">
                  Zero-Pill Metadata Example (Typographic separation via · and /)
                </h5>
                <div className="p-3 bg-slate-950/60 rounded border border-slate-800 text-xs text-slate-300 flex items-center gap-2 flex-wrap font-mono tabular-nums">
                  <span className="font-semibold text-slate-100">Sandton Grand Terraces</span>
                  <span className="text-slate-600">/</span>
                  <span className="text-slate-400">148 Units</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400">PQ Total: 10,000</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-emerald-400">97.6% Collection Rate</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-500">Updated 14 mins ago</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <h5 className="text-xs font-medium text-slate-400 mb-2">Avatars</h5>
                <div className="flex items-center gap-3">
                  <Avatar name="David Malan" size="lg" status="online" />
                  <Avatar name="Sarah Connor" size="md" status="busy" />
                  <Avatar name="Thabo Mokoena" size="sm" status="offline" />
                  <Avatar name="Ainubis Agent" size="xs" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 5: FEEDBACK & OVERLAYS */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          {/* Alerts */}
          <div className="space-y-3">
            <Alert severity="info" title="System Synchronization In Progress">
              Nightly sectional title roll reconciliation is scheduled to run at 02:00 SAST.
            </Alert>
            <Alert severity="success" title="Reserve Fund Target Attained">
              Scheme SS-0142 has satisfied the 10-year maintenance reserve requirement under Section 3(1)(c).
            </Alert>
            <Alert severity="warning" title="Insurance Policy Renewal Required">
              Building replacement policy with Hollard expires in 18 days. Trustee signoff pending.
            </Alert>
            <Alert severity="error" title="Critical Levy Variance Detected">
              Section 42 recorded an unexplained -R18,400 debit discrepancy against the bank feed.
            </Alert>
          </div>

          {/* Interactive Modal & Dialog Controls */}
          <Card title="Interactive Overlays & Dialogs" subtitle="Accessible keyboard trapping (Escape key) and high-contrast backdrop">
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
                Open Standard Modal
              </Button>
              <Button variant="danger" onClick={() => setIsDialogOpen(true)}>
                Open Destructive Dialog
              </Button>

              <Dropdown
                trigger={
                  <Button variant="outline" rightIcon={<Icon name="chevron-down" size="xs" />}>
                    Context Menu
                  </Button>
                }
                items={[
                  { id: '1', label: 'Export Scheme CSV', icon: <Icon name="download" size="xs" />, onClick: () => {} },
                  { id: '2', label: 'Inspect Audit Log', icon: <Icon name="clock" size="xs" />, onClick: () => {} },
                  { id: '3', label: 'Purge Stale Cache', icon: <Icon name="refresh" size="xs" />, destructive: true, onClick: () => {} },
                ]}
              />

              <Tooltip content="Tooltip explains technical metric">
                <Button variant="ghost" leftIcon={<Icon name="info" size="xs" />}>
                  Hover For Tooltip
                </Button>
              </Tooltip>

              <Popover
                trigger={
                  <Button variant="ghost" leftIcon={<Icon name="sliders" size="xs" />}>
                    Popover Filter
                  </Button>
                }
                content={
                  <div className="space-y-3">
                    <p className="font-semibold text-slate-100 text-xs">Filter Scheme Parameters</p>
                    <Select
                      label="Arrears Bracket"
                      options={[
                        { value: 'all', label: 'All Brackets' },
                        { value: 'over5', label: 'Greater than 5%' },
                        { value: 'over10', label: 'Greater than 10%' },
                      ]}
                    />
                    <Button variant="primary" size="sm" className="w-full">
                      Apply Filter
                    </Button>
                  </div>
                }
              />
            </div>
          </Card>

          {/* Skeletons & States */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Loading Skeleton Placeholders">
              <div className="space-y-3">
                <Skeleton height="1.5rem" width="60%" />
                <Skeleton height="0.875rem" width="100%" />
                <Skeleton height="0.875rem" width="85%" />
                <div className="flex items-center gap-3 pt-2">
                  <Skeleton height="2rem" width="5rem" />
                  <Skeleton height="2rem" width="7rem" />
                </div>
              </div>
            </Card>

            <Card title="Empty State Component">
              <EmptyState
                title="No Open Work Orders"
                description="All contractor maintenance tasks have been verified and signed off by the building manager."
                actionText="Create Work Ticket"
                onAction={() => {}}
              />
            </Card>
          </div>
        </div>
      )}

      {/* TAB 6: AINUBIS INTELLIGENCE FOUNDATION */}
      {activeTab === 'ainubis' && (
        <div className="space-y-6">
          {/* Ainubis Design System Banner */}
          <AinubisBanner
            title="Ainubis Enterprise Intelligence Layer — Visual Constitution"
            message="Ainubis is not a casual chatbot theme. It maintains strict visual boundaries between passive observation, inferred insight, strategic recommendation, urgent alert, and human-in-the-loop approval gates."
            state="insight"
          />

          {approvalOutcome && (
            <Alert
              severity="success"
              title="Execution Dispatched"
              onDismiss={() => setApprovalOutcome(null)}
            >
              {approvalOutcome}
            </Alert>
          )}

          {/* Visual State Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Observation */}
            <AinubisCard
              state="observation"
              title="Telemetry Observation: Water Utility Consumption Spike"
              summary="Bulk water meter telemetry for Sandton Grand Terraces indicates nighttime flow of 420 L/h between 01:00 and 04:00 over 3 consecutive nights."
              schemeContext="Sandton Grand Terraces (SCH-0142)"
              confidenceScore={0.96}
              timestamp="4 mins ago"
              evidence={[
                'Baseline nighttime consumption is 45 L/h (variance: +833%)',
                'No recorded municipal supply maintenance notifications in Region E',
              ]}
              onInspectDetails={() => {}}
            />

            {/* 2. Insight */}
            <AinubisCard
              state="insight"
              title="Pattern Insight: Seasonal Levy Arrears Clustering"
              summary="Arrears spikes across holiday let sections correlate directly with off-peak occupancy months (May - July) with 89% historical repetition."
              schemeContext="Cape Point Heights (SCH-0143)"
              confidenceScore={0.89}
              timestamp="2 hours ago"
              evidence={[
                'Short-term rental units represent 78% of the 90-day arrears balance',
                'Standard debit orders bounce 3.2x more frequently on the 1st vs 25th',
              ]}
              onInspectDetails={() => {}}
            />

            {/* 3. Recommendation */}
            <AinubisCard
              state="recommendation"
              title="Advisory Recommendation: Pre-Fund Lift Modernization"
              summary="Reallocating 12% of the Q3 surplus into the 10-year maintenance capital sinking fund will prevent a R180,000 special levy in FY2027."
              schemeContext="Rosebank Central Towers (SCH-0146)"
              confidenceScore={0.94}
              timestamp="1 day ago"
              evidence={[
                'Lift motor operating hours have reached 92% of manufacturer MTBF',
                'Special levy risk mitigated from high (74%) to nominal (12%)',
              ]}
              onApprove={() => setApprovalOutcome('Recommendation acknowledged and archived in trustee minutes.')}
            />

            {/* 4. Alert */}
            <AinubisCard
              state="alert"
              title="Operational Alert: Sectional Plan Boundary Drift"
              summary="Draft municipal rezoning submission conflicts with common property servitudes registered under Sectional Plan SG-9921/2019."
              schemeContext="Pretoria Ridge Estates (SCH-0145)"
              confidenceScore={0.98}
              timestamp="35 mins ago"
              evidence={[
                'Servitude servitude clause 4(b) encroached by proposed road servitude',
                'Trustee objection window expires in 14 days under municipal notice 410',
              ]}
              onInspectDetails={() => {}}
            />
          </div>

          {/* 5. HUMAN APPROVAL REQUIRED GATE */}
          <div className="bg-slate-900 border-2 border-rose-900/80 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AinubisBadge state="approval_required" />
                <span className="text-xs text-rose-400 font-semibold uppercase tracking-wider font-mono">
                  Autonomous Action Blocked — Human Gate Enforced
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">STSMA Section 39 Compliance</span>
            </div>

            <AinubisCard
              state="approval_required"
              title="Action Proposal: Issue Formal Section 38(1) Notice of Breach to Unit 42"
              summary="Ainubis has identified repeated, documented unauthorized architectural alterations to the exclusive use garden area of Unit 42 (swimming pool excavation without trustee consent). Action requires verified trustee confirmation before dispatch to owner and managing agent."
              schemeContext="Durban Marina Villas (SCH-0144)"
              confidenceScore={0.99}
              timestamp="Just now"
              evidence={[
                'CCTV boundary image confirmation of structural ground excavation',
                'No prior architectural committee application lodged on record',
                'Prescribed management rule 30(1) violation documented',
              ]}
              onApprove={() => {
                setApprovalOutcome('Formal Section 38(1) Breach Notice approved by Trustee and queued for cryptographic signature.');
              }}
              onReject={() => {
                setApprovalOutcome('Proposal declined. Reason logged to immutable trustee audit record.');
              }}
              onInspectDetails={() => {}}
            />
          </div>
        </div>
      )}

      {/* Live Demo Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Sectional Title Scheme"
        description="Configure scheme parameters, managing agency, and Ainubis monitoring tier"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>
              Save & Initialize
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Scheme Name" placeholder="e.g. Umhlanga Ridge Sands" required />
          <Input label="CSOS Registration Number" placeholder="CSOS/REG/YYYY/..." required />
          <Select
            label="Ainubis Intelligence Tier"
            options={[
              { value: 'standard', label: 'Tier 1: Continuous Invariant Observation' },
              { value: 'advanced', label: 'Tier 2: Advisory Recommendations & Telemetry' },
              { value: 'autonomous', label: 'Tier 3: Trustee Supervised Action Quorum' },
            ]}
          />
        </div>
      </Modal>

      {/* Live Demo Dialog */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={() => {
          setIsDialogOpen(false);
          setShowToast(true);
        }}
        variant="danger"
        title="Confirm Irreversible Ledger Archive"
        message="Are you certain you wish to archive this financial ledger cycle? Archived records cannot be modified without formal CSOS audit authorization."
        confirmText="Archive Cycle"
        cancelText="Keep Open"
      />
    </div>
  );
}
