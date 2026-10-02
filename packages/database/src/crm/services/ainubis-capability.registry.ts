/**
 * BCIP Ainubis Central Capability Registry
 * Phase 2E — Prompt 002E-003: Ainubis Continuous CRM Intelligence & Automated Monitoring
 * Central catalogue of registered Ainubis intelligence and monitoring capabilities.
 */

import { AICapability } from '../ai-types.ts';
import type { AIMonitoringCapabilityMetadata } from '../ai-types.ts';
import { SYSTEM_PERMISSIONS } from '@bcip/auth';

export class AinubisCapabilityRegistry {
  private capabilities: Map<AICapability, AIMonitoringCapabilityMetadata> = new Map();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    // 1. Pipeline Hygiene
    this.register({
      capability: AICapability.CRM_PIPELINE_HYGIENE,
      name: 'CRM Sales Pipeline Hygiene',
      description: 'Continuous deterministic audit of active deals for stale activity (>14 days), missing valuations, overdue follow-ups, and stage velocity.',
      category: 'pipeline',
      mode: 'DETERMINISTIC',
      requiredPermissions: [SYSTEM_PERMISSIONS.CRM_AI_VIEW],
      supportedEntityTypes: ['opportunity', 'task', 'activity'],
      monitoringAvailable: true,
      version: '1.2.0',
    });

    // 2. Lead Hygiene & Qualification
    this.register({
      capability: AICapability.CRM_LEAD_HYGIENE,
      name: 'CRM Lead Hygiene & Engagement',
      description: 'Monitors inbound leads for contact completeness (phone/email), uncontacted staleness (>14 days), and overdue qualification follow-ups.',
      category: 'leads',
      mode: 'DETERMINISTIC',
      requiredPermissions: [SYSTEM_PERMISSIONS.CRM_AI_VIEW],
      supportedEntityTypes: ['lead', 'contact', 'task'],
      monitoringAvailable: true,
      version: '1.1.0',
    });

    // 3. Organisation Hygiene & Client Retention
    this.register({
      capability: AICapability.CRM_ORGANISATION_HYGIENE,
      name: 'CRM Organisation Hygiene & Account Health',
      description: 'Audits corporate and managing agent accounts for statutory registration details, linked key contacts, and dormant relationship gaps (>30 days).',
      category: 'organisations',
      mode: 'DETERMINISTIC',
      requiredPermissions: [SYSTEM_PERMISSIONS.CRM_AI_VIEW],
      supportedEntityTypes: ['organisation', 'contact', 'activity'],
      monitoringAvailable: true,
      version: '1.0.0',
    });

    // 4. Scheme Prospect Hygiene
    this.register({
      capability: AICapability.CRM_SCHEME_PROSPECT_HYGIENE,
      name: 'CRM Scheme Prospect Hygiene & Readiness',
      description: 'Validates sectional title schemes for estimated residential/commercial unit count completeness and commercial opportunity linkage.',
      category: 'schemes',
      mode: 'DETERMINISTIC',
      requiredPermissions: [SYSTEM_PERMISSIONS.CRM_AI_VIEW],
      supportedEntityTypes: ['scheme_prospect', 'opportunity'],
      monitoringAvailable: true,
      version: '1.0.0',
    });

    // 5. Task & Operational Hygiene
    this.register({
      capability: AICapability.CRM_TASK_HYGIENE,
      name: 'CRM Task & Operational Hygiene',
      description: 'Monitors operational deadlines, detects overdue follow-ups across CRM entities, and surfaces stale open commitments requiring human review.',
      category: 'tasks',
      mode: 'DETERMINISTIC',
      requiredPermissions: [SYSTEM_PERMISSIONS.CRM_AI_VIEW],
      supportedEntityTypes: ['task'],
      monitoringAvailable: true,
      version: '1.1.0',
    });

    // 6. Data Quality Guardrails
    this.register({
      capability: AICapability.CRM_DATA_QUALITY,
      name: 'CRM Data Quality & POPIA Guardrails',
      description: 'Validates completeness and integrity across all CRM schemas without assuming unverified records are factual.',
      category: 'leads',
      mode: 'DETERMINISTIC',
      requiredPermissions: [SYSTEM_PERMISSIONS.CRM_AI_VIEW],
      supportedEntityTypes: ['lead', 'organisation', 'contact', 'opportunity'],
      monitoringAvailable: true,
      version: '1.0.0',
    });
  }

  public register(metadata: AIMonitoringCapabilityMetadata): void {
    this.capabilities.set(metadata.capability, { ...metadata });
  }

  public getCapability(capability: AICapability): AIMonitoringCapabilityMetadata | undefined {
    const item = this.capabilities.get(capability);
    return item ? { ...item } : undefined;
  }

  public listCapabilities(): AIMonitoringCapabilityMetadata[] {
    return Array.from(this.capabilities.values()).map((c) => ({ ...c }));
  }

  public getCapabilitiesByCategory(category: string): AIMonitoringCapabilityMetadata[] {
    return this.listCapabilities().filter((c) => c.category === category);
  }

  public getMonitoringAvailableCapabilities(): AIMonitoringCapabilityMetadata[] {
    return this.listCapabilities().filter((c) => c.monitoringAvailable);
  }
}

export const ainubisCapabilityRegistry = new AinubisCapabilityRegistry();
