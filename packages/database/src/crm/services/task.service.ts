/**
 * BCIP CRM Task Domain Service
 */

import { taskRepository, TaskRepository } from '../repositories/task.repository.ts';
import type { QueryOptions } from '../repositories/base.repository.ts';
import { crmAuditService, CRMAuditService } from '../audit/crm-audit.ts';
import { crmEventBus, CRMEventBus } from '../events/crm-events.ts';
import type { CRMTask, CreateCRMTaskDto, UpdateCRMTaskDto } from '../types.ts';
import { TaskStatus, CRMEventType } from '../enums.ts';

export class TaskService {
  private taskRepo: TaskRepository;
  private audit: CRMAuditService;
  private eventBus: CRMEventBus;

  constructor(
    taskRepo: TaskRepository = taskRepository,
    audit: CRMAuditService = crmAuditService,
    eventBus: CRMEventBus = crmEventBus
  ) {
    this.taskRepo = taskRepo;
    this.audit = audit;
    this.eventBus = eventBus;
  }

  public async createTask(tenantId: string, dto: CreateCRMTaskDto, actorUserId: string): Promise<CRMTask> {
    if (!dto.title) {
      throw new Error('Task title is required');
    }

    const task = await this.taskRepo.createTask(tenantId, dto);

    await this.audit.record(
      tenantId,
      'task',
      task.id,
      'TASK_CREATED',
      actorUserId,
      undefined,
      task as unknown as Record<string, unknown>
    );

    await this.eventBus.publish(
      CRMEventType.TASK_CREATED,
      tenantId,
      {
        taskId: task.id,
        title: task.title,
        priority: task.priority,
        assignedTo: task.assignedTo,
        opportunityId: task.opportunityId,
      },
      actorUserId
    );

    return task;
  }

  public async getById(tenantId: string, id: string): Promise<CRMTask | null> {
    return this.taskRepo.findById(tenantId, id);
  }

  public async update(
    tenantId: string,
    id: string,
    dto: UpdateCRMTaskDto,
    actorUserId: string
  ): Promise<CRMTask> {
    const before = await this.taskRepo.findById(tenantId, id);
    if (!before) {
      throw new Error(`Task not found: ${id}`);
    }

    const updated = await this.taskRepo.updateTask(tenantId, id, dto);
    if (!updated) {
      throw new Error(`Failed to update task: ${id}`);
    }

    await this.audit.record(
      tenantId,
      'task',
      id,
      'TASK_UPDATED',
      actorUserId,
      before as unknown as Record<string, unknown>,
      updated as unknown as Record<string, unknown>
    );

    if (dto.status === TaskStatus.COMPLETED && before.status !== TaskStatus.COMPLETED) {
      await this.eventBus.publish(
        CRMEventType.TASK_COMPLETED,
        tenantId,
        { taskId: id, title: updated.title, completedAt: updated.completedAt },
        actorUserId
      );
    }

    return updated;
  }

  public async completeTask(tenantId: string, id: string, actorUserId: string): Promise<CRMTask> {
    return this.update(tenantId, id, { status: TaskStatus.COMPLETED }, actorUserId);
  }

  public async softDelete(tenantId: string, id: string, actorUserId: string): Promise<boolean> {
    const before = await this.taskRepo.findById(tenantId, id);
    if (!before) return false;

    const ok = await this.taskRepo.softDelete(tenantId, id);
    if (ok) {
      await this.audit.record(
        tenantId,
        'task',
        id,
        'TASK_SOFT_DELETED',
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
  ): Promise<CRMTask[]> {
    return this.taskRepo.findByEntity(tenantId, filters);
  }

  public async list(tenantId: string, options?: QueryOptions): Promise<CRMTask[]> {
    return this.taskRepo.findAll(tenantId, options);
  }

  public count(tenantId: string, options?: QueryOptions): number {
    return this.taskRepo.count(tenantId, options);
  }

  public async listAll(tenantId: string): Promise<CRMTask[]> {
    return this.taskRepo.findAll(tenantId);
  }
}

export const taskService = new TaskService();
