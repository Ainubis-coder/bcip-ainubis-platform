/**
 * BCIP CRM Activity Domain Service
 */

import { activityRepository, ActivityRepository } from '../repositories/activity.repository.ts';
import type { QueryOptions } from '../repositories/base.repository.ts';
import { crmAuditService, CRMAuditService } from '../audit/crm-audit.ts';
import { crmEventBus, CRMEventBus } from '../events/crm-events.ts';
import type { Activity, CreateActivityDto, UpdateActivityDto } from '../types.ts';
import { CRMEventType } from '../enums.ts';

export class ActivityService {
  private actRepo: ActivityRepository;
  private audit: CRMAuditService;
  private eventBus: CRMEventBus;

  constructor(
    actRepo: ActivityRepository = activityRepository,
    audit: CRMAuditService = crmAuditService,
    eventBus: CRMEventBus = crmEventBus
  ) {
    this.actRepo = actRepo;
    this.audit = audit;
    this.eventBus = eventBus;
  }

  public async logActivity(tenantId: string, dto: CreateActivityDto, actorUserId: string): Promise<Activity> {
    if (!dto.subject) {
      throw new Error('Activity subject is required');
    }

    const activity = await this.actRepo.createActivity(tenantId, dto);

    await this.audit.record(
      tenantId,
      'activity',
      activity.id,
      'ACTIVITY_CREATED',
      actorUserId,
      undefined,
      activity as unknown as Record<string, unknown>
    );

    await this.eventBus.publish(
      CRMEventType.ACTIVITY_CREATED,
      tenantId,
      {
        activityId: activity.id,
        activityType: activity.activityType,
        subject: activity.subject,
        leadId: activity.leadId,
        opportunityId: activity.opportunityId,
      },
      actorUserId
    );

    return activity;
  }

  public async getById(tenantId: string, id: string): Promise<Activity | null> {
    return this.actRepo.findById(tenantId, id);
  }

  public async update(
    tenantId: string,
    id: string,
    dto: UpdateActivityDto,
    actorUserId: string
  ): Promise<Activity> {
    const before = await this.actRepo.findById(tenantId, id);
    if (!before) {
      throw new Error(`Activity not found: ${id}`);
    }

    const updated = await this.actRepo.update(tenantId, id, dto);
    if (!updated) {
      throw new Error(`Failed to update activity: ${id}`);
    }

    await this.audit.record(
      tenantId,
      'activity',
      id,
      'ACTIVITY_UPDATED',
      actorUserId,
      before as unknown as Record<string, unknown>,
      updated as unknown as Record<string, unknown>
    );

    return updated;
  }

  public async softDelete(tenantId: string, id: string, actorUserId: string): Promise<boolean> {
    const before = await this.actRepo.findById(tenantId, id);
    if (!before) return false;

    const ok = await this.actRepo.softDelete(tenantId, id);
    if (ok) {
      await this.audit.record(
        tenantId,
        'activity',
        id,
        'ACTIVITY_SOFT_DELETED',
        actorUserId,
        before as unknown as Record<string, unknown>
      );
    }
    return ok;
  }

  public async listForEntity(
    tenantId: string,
    filters: {
      leadId?: string;
      contactId?: string;
      organisationId?: string;
      opportunityId?: string;
    }
  ): Promise<Activity[]> {
    return this.actRepo.findByEntity(tenantId, filters);
  }

  public async list(tenantId: string, options?: QueryOptions): Promise<Activity[]> {
    return this.actRepo.findAll(tenantId, options);
  }

  public count(tenantId: string, options?: QueryOptions): number {
    return this.actRepo.count(tenantId, options);
  }

  public async listAll(tenantId: string): Promise<Activity[]> {
    return this.actRepo.findAll(tenantId);
  }
}

export const activityService = new ActivityService();
