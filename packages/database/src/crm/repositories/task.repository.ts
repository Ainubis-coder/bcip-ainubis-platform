/**
 * BCIP CRM Task Repository
 * Phase 2 — Prompt 002B & 002C: CRM API Layer
 */

import { BaseCrmRepository, type QueryOptions } from './base.repository.ts';
import type { CRMTask, CreateCRMTaskDto, UpdateCRMTaskDto } from '../types.ts';
import { TaskStatus, TaskPriority } from '../enums.ts';

export class TaskRepository extends BaseCrmRepository<CRMTask> {
  constructor() {
    super('crm_tasks');
  }

  public async createTask(tenantId: string, dto: CreateCRMTaskDto): Promise<CRMTask> {
    const id = this.generateId('tsk');
    const now = new Date().toISOString();

    const task: CRMTask = {
      id,
      tenantId,
      title: dto.title,
      description: dto.description,
      status: dto.status || TaskStatus.OPEN,
      priority: dto.priority || TaskPriority.MEDIUM,
      assignedTo: dto.assignedTo,
      createdBy: dto.createdBy,
      dueAt: dto.dueAt,
      completedAt: dto.completedAt,
      leadId: dto.leadId,
      contactId: dto.contactId,
      organisationId: dto.organisationId,
      opportunityId: dto.opportunityId,
      createdAt: now,
      updatedAt: now,
    };

    return this.create(task);
  }

  public async updateTask(tenantId: string, id: string, patch: UpdateCRMTaskDto): Promise<CRMTask | null> {
    const existing = await this.findById(tenantId, id);
    if (!existing) return null;

    const toUpdate: Partial<CRMTask> = {
      ...patch,
    };

    if (patch.status === TaskStatus.COMPLETED && !existing.completedAt) {
      toUpdate.completedAt = new Date().toISOString();
    }

    return this.update(tenantId, id, toUpdate);
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
  ): Promise<CRMTask[]> {
    const all = await this.findAll(tenantId, options);
    const results: CRMTask[] = [];
    for (const tsk of all) {
      if (filters.leadId && tsk.leadId === filters.leadId) {
        results.push(tsk);
      } else if (filters.contactId && tsk.contactId === filters.contactId) {
        results.push(tsk);
      } else if (filters.organisationId && tsk.organisationId === filters.organisationId) {
        results.push(tsk);
      } else if (filters.opportunityId && tsk.opportunityId === filters.opportunityId) {
        results.push(tsk);
      }
    }
    return results;
  }
}

export const taskRepository = new TaskRepository();
