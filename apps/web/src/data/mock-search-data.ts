import { GlobalSearchResult } from '../types/tenant';

export const MOCK_SEARCH_INDEX: GlobalSearchResult[] = [
  // Schemes
  { id: 'sch-1', title: 'Sandton Grand Terraces', subtitle: 'SCH-0142 · 148 Units · Gauteng', category: 'schemes', moduleId: 'schemes', badge: 'Active' },
  { id: 'sch-2', title: 'Cape Point Heights', subtitle: 'SCH-0143 · 84 Units · Western Cape', category: 'schemes', moduleId: 'schemes', badge: 'Active' },
  { id: 'sch-3', title: 'Durban Marina Villas', subtitle: 'SCH-0144 · 210 Units · KwaZulu-Natal', category: 'schemes', moduleId: 'schemes', badge: 'Active' },
  { id: 'sch-4', title: 'Pretoria Ridge Estates', subtitle: 'SCH-0145 · 62 Units · Gauteng', category: 'schemes', moduleId: 'schemes', badge: 'Review Due' },
  { id: 'sch-5', title: 'Rosebank Central Towers', subtitle: 'SCH-0146 · 195 Units · Gauteng', category: 'schemes', moduleId: 'schemes', badge: 'Active' },
  { id: 'sch-6', title: 'Umhlanga Rocks Oasis', subtitle: 'SCH-0147 · 112 Units · KwaZulu-Natal', category: 'schemes', moduleId: 'schemes', badge: 'Active' },

  // Properties / Units
  { id: 'prop-1', title: 'Section 42 — Penthouse Suite', subtitle: 'Sandton Grand Terraces · PQ: 0.0245 · Owner: Malan Trust', category: 'properties', moduleId: 'properties' },
  { id: 'prop-2', title: 'Section 12 — Ground Floor Garden', subtitle: 'Cape Point Heights · PQ: 0.0118 · Owner: S. Connor', category: 'properties', moduleId: 'properties' },
  { id: 'prop-3', title: 'Section 104 — Tower B', subtitle: 'Rosebank Central Towers · PQ: 0.0089 · Owner: Highveld Inv.', category: 'properties', moduleId: 'properties' },

  // Contacts
  { id: 'cont-1', title: 'David Malan', subtitle: 'Trustee Chairman · Sandton Grand Terraces · +27 82 555 0192', category: 'contacts', moduleId: 'crm' },
  { id: 'cont-2', title: 'Sarah Connor', subtitle: 'Portfolio Manager · Apex Portfolios · +27 71 555 0834', category: 'contacts', moduleId: 'crm' },
  { id: 'cont-3', title: 'Thabo Mokoena', subtitle: 'Lead Managing Agent · Apex HQ · +27 83 555 0100', category: 'contacts', moduleId: 'crm' },

  // Finance / Invoices
  { id: 'fin-1', title: 'INV-2026-0891 — October Standard Levy Roll', subtitle: 'Sandton Grand Terraces · R 485,200.00 · Reconciled', category: 'finance', moduleId: 'invoices', badge: 'Paid' },
  { id: 'fin-2', title: 'INV-2026-0892 — Emergency Lift Cable Replacement', subtitle: 'Rosebank Central Towers · R 84,500.00 · Special Levy', category: 'finance', moduleId: 'invoices', badge: 'Pending' },

  // Documents
  { id: 'doc-1', title: 'Sectional Plan SG-9921/2019 Sheets 1-8', subtitle: 'Cape Point Heights · Surveyor General Certified PDF', category: 'documents', moduleId: 'documents' },
  { id: 'doc-2', title: 'Prescribed Management Rules & Conduct Rules 2026', subtitle: 'Sandton Grand Terraces · CSOS Endorsed', category: 'documents', moduleId: 'documents' },

  // Ainubis Alerts
  { id: 'ain-1', title: 'Ainubis Alert: Nighttime Bulk Water Leak Discrepancy', subtitle: 'Sandton Grand Terraces · Flow variance +833% over baseline', category: 'ainubis', moduleId: 'alerts', badge: 'Alert' },
  { id: 'ain-2', title: 'Ainubis Recommendation: Pre-Fund Lift Modernization', subtitle: 'Rosebank Central Towers · Prevent special levy in FY2027', category: 'ainubis', moduleId: 'recommendations', badge: 'Insight' },

  // Navigation Quick Jumps
  { id: 'nav-1', title: 'Go to Financial Overview & Levies', subtitle: 'Navigation · Finance Module', category: 'navigation', moduleId: 'finance' },
  { id: 'nav-2', title: 'Go to Schemes & Sectional Registers', subtitle: 'Navigation · Property Module', category: 'navigation', moduleId: 'schemes' },
  { id: 'nav-3', title: 'Go to Maintenance Tickets & Work Orders', subtitle: 'Navigation · Operations Module', category: 'navigation', moduleId: 'maintenance' },
  { id: 'nav-4', title: 'Go to Ainubis Cognitive Intelligence Engine', subtitle: 'Navigation · Ainubis Layer', category: 'navigation', moduleId: 'ainubis' },
  { id: 'nav-5', title: 'Go to Design System & Token Catalog', subtitle: 'Navigation · System Module', category: 'navigation', moduleId: 'design_system' },
];
