/**
 * BCIP CRM Activity Repository
 * Handles polymorphic activities across leads, contacts, organisations, and opportunities.
 * Phase 2 — Prompt 002B & 002C: CRM API Layer
 */

import { BaseCrmRepository, type QueryOptions } from './base.repository.ts';
import type { Activity, CreateActivityDto } from '../types.ts';
import { ActivityType } from '../enums.ts';

export class ActivityRepository extends BaseCrmRepository<Activity> {
  constructor() {
    super('crm_activities');
  }

  public async createActivity(tenantId: string, dto: CreateActivityDto): Promise<Activity> {
    const id = this.generateId('act');
    const now = new Date().toISOString();

    const activity: Activity = {
      id,
      tenantId,
      activityType: dto.activityType || ActivityType.NOTE,
      subject: dto.subject,
      description: dto.description,
      activityAt: dto.activityAt || now,
      completedAt: dto.completedAt,
      ownerUserId: dto.ownerUserId,
      createdBy: dto.createdBy,
      leadId: dto.leadId,
      contactId: dto.contactId,
      organisationId: dto.organisationId,
      opportunityId: dto.opportunityId,
      metadata: dto.metadata,
      createdAt: now,
      updatedAt: now,
    };

    return this.create(activity);
  }

  public async findByEntity(
    tenantId: string,
    filters: {
      leadId?: string;
      contactId?: string;
      organisationId?: string;
      opportunityId?: string;
    },
    options?: QueryOptions
  ): Promise<Activity[]> {
    const all = await this.findAll(tenantId, options);
    const results: Activity[] = [];
    for (const act of all) {
      if (filters.leadId && act.leadId === filters.leadId) {
        results.push(act);
      } else if (filters.contactId && act.contactId === filters.contactId) {
        results.push(act);
      } else if (filters.organisationId && act.organisationId === filters.organisationId) {
        results.push(act);
      } else if (filters.opportunityId && act.opportunityId === filters.opportunityId) {
        results.push(act);
      }
    }
    return results;
  }
}

export const activityRepository = new ActivityRepository();
