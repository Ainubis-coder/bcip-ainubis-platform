/**
 * BCIP Ainubis Workflow Templates Controller
 * Phase 2E — Prompt 002E-006 & 4A: Ainubis Workflow Intelligence, Templates & Operational Control
 */

import type { Request, Response } from 'express';
import {
  workflowTemplateRepository,
  automationWorkflowRepository,
  AinubisWorkflowDefinitionValidator,
  WorkflowTemplateStatus,
  WorkflowStatus,
  TemplateScope,
} from '@bcip/database';
import { ApiResponse } from '../serializers/response.serializer.ts';

export class AIWorkflowTemplatesController {
  // 1. List Templates
  public static async listTemplates(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    try {
      // Auto-seed canonical platform SYSTEM templates if not already present
      await workflowTemplateRepository.seedDefaultTemplates(req.user?.id || 'system');

      const { data, total } = await workflowTemplateRepository.findMany(tenantId, {
        offset,
        limit,
        status: req.query.status as string,
        category: req.query.category as string,
        templateKey: req.query.templateKey as string,
        scope: req.query.scope as 'SYSTEM' | 'TENANT' | 'ALL',
      });

      ApiResponse.paginated(res, data, { page, pageSize: limit, total });
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to list templates', 500);
    }
  }

  // 2. Create Template
  public static async createTemplate(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const dto = req.body;

    if (!dto.templateKey || !dto.name || !dto.trigger || !dto.steps) {
      ApiResponse.error(
        res,
        'VALIDATION_ERROR',
        'Missing required template fields (templateKey, name, trigger, steps)',
        422
      );
      return;
    }

    // Run structural validator
    const validation = AinubisWorkflowDefinitionValidator.validate(dto);
    if (!validation.valid) {
      ApiResponse.error(
        res,
        'VALIDATION_ERROR',
        `Invalid template structure: ${validation.errors.join('; ')}`,
        422
      );
      return;
    }

    try {
      const isPlatformAdmin =
        (req.user?.role as string) === 'PLATFORM_SUPER_ADMIN' ||
        (req as any).isPlatformAdmin === true;

      const template = await workflowTemplateRepository.createTemplate(
        tenantId,
        {
          ...dto,
          templateScope: isPlatformAdmin && dto.templateScope === TemplateScope.SYSTEM
            ? TemplateScope.SYSTEM
            : TemplateScope.TENANT,
          ownerTenantId: isPlatformAdmin && dto.templateScope === TemplateScope.SYSTEM
            ? null
            : tenantId,
        },
        req.user?.id || 'system',
        isPlatformAdmin
      );
      ApiResponse.success(res, template, 201);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to create template', 500);
    }
  }

  // 3. Get Template By ID
  public static async getTemplateById(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    try {
      const template = await workflowTemplateRepository.findById(tenantId, id);
      if (!template) {
        // Enforce tenant boundary: do not leak whether another tenant's template exists
        ApiResponse.error(res, 'NOT_FOUND', `Template with ID ${id} not found`, 404);
        return;
      }
      ApiResponse.success(res, template);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to retrieve template', 500);
    }
  }

  // 4. Update Template
  public static async updateTemplate(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const dto = req.body;

    try {
      const existing = await workflowTemplateRepository.findById(tenantId, id);
      if (!existing) {
        ApiResponse.error(res, 'NOT_FOUND', `Template with ID ${id} not found`, 404);
        return;
      }

      // SYSTEM Template Immutability (Prompt 4A.5 & 4A.13):
      // Tenant users are strictly prohibited from modifying platform SYSTEM templates.
      if (existing.templateScope === TemplateScope.SYSTEM) {
        ApiResponse.error(
          res,
          'FORBIDDEN',
          'Modifications to SYSTEM templates are prohibited. SYSTEM templates are immutable and platform-governed. You may clone this template into a tenant-owned template instead.',
          403
        );
        return;
      }

      // Check tenant ownership
      if (existing.templateScope === TemplateScope.TENANT && existing.ownerTenantId !== tenantId) {
        ApiResponse.error(res, 'NOT_FOUND', `Template with ID ${id} not found`, 404);
        return;
      }

      if (existing.status !== WorkflowTemplateStatus.DRAFT) {
        ApiResponse.error(res, 'BAD_REQUEST', 'Only templates in DRAFT status can be modified', 400);
        return;
      }

      // If updating trigger or steps, validate first
      const testMerge = { ...existing, ...dto };
      const validation = AinubisWorkflowDefinitionValidator.validate(testMerge);
      if (!validation.valid) {
        ApiResponse.error(
          res,
          'VALIDATION_ERROR',
          `Invalid template structure: ${validation.errors.join('; ')}`,
          422
        );
        return;
      }

      const updated = await workflowTemplateRepository.updateTemplate(tenantId, id, dto);
      ApiResponse.success(res, updated!);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to update template', 500);
    }
  }

  // 5. Validate Template
  public static async validateTemplate(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    try {
      const template = await workflowTemplateRepository.findById(tenantId, id);
      if (!template) {
        ApiResponse.error(res, 'NOT_FOUND', `Template with ID ${id} not found`, 404);
        return;
      }

      const validation = AinubisWorkflowDefinitionValidator.validate(template);
      ApiResponse.success(res, {
        valid: validation.valid,
        errors: validation.errors,
      });
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to validate template', 500);
    }
  }

  // 6. Publish Template
  public static async publishTemplate(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    try {
      const template = await workflowTemplateRepository.findById(tenantId, id);
      if (!template) {
        ApiResponse.error(res, 'NOT_FOUND', `Template with ID ${id} not found`, 404);
        return;
      }

      // Tenant users cannot publish SYSTEM templates (Prompt 4A.5 & 4A.13)
      if (template.templateScope === TemplateScope.SYSTEM) {
        ApiResponse.error(
          res,
          'FORBIDDEN',
          'Publishing SYSTEM templates is prohibited for tenant users. SYSTEM templates are governed by the platform.',
          403
        );
        return;
      }

      if (template.templateScope === TemplateScope.TENANT && template.ownerTenantId !== tenantId) {
        ApiResponse.error(res, 'NOT_FOUND', `Template with ID ${id} not found`, 404);
        return;
      }

      const validation = AinubisWorkflowDefinitionValidator.validate(template);
      if (!validation.valid) {
        ApiResponse.error(
          res,
          'VALIDATION_ERROR',
          `Cannot publish invalid template: ${validation.errors.join('; ')}`,
          422
        );
        return;
      }

      const now = new Date().toISOString();
      const updated = await workflowTemplateRepository.updateTemplate(tenantId, id, {
        status: WorkflowTemplateStatus.PUBLISHED,
        publishedAt: now,
      });

      // Create an immutable version entry
      await workflowTemplateRepository.createVersion(tenantId, {
        templateId: id,
        templateScope: template.templateScope,
        ownerTenantId: template.ownerTenantId,
        version: template.version,
        trigger: template.trigger,
        steps: template.steps,
        status: WorkflowTemplateStatus.PUBLISHED,
        publishedAt: now,
        createdBy: req.user?.id || 'system',
      });

      ApiResponse.success(res, updated!);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to publish template', 500);
    }
  }

  // 7. Deprecate Template
  public static async deprecateTemplate(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    try {
      const template = await workflowTemplateRepository.findById(tenantId, id);
      if (!template) {
        ApiResponse.error(res, 'NOT_FOUND', `Template with ID ${id} not found`, 404);
        return;
      }

      if (template.templateScope === TemplateScope.SYSTEM) {
        ApiResponse.error(
          res,
          'FORBIDDEN',
          'Deprecating SYSTEM templates is prohibited for tenant users. SYSTEM templates are governed by the platform.',
          403
        );
        return;
      }

      if (template.templateScope === TemplateScope.TENANT && template.ownerTenantId !== tenantId) {
        ApiResponse.error(res, 'NOT_FOUND', `Template with ID ${id} not found`, 404);
        return;
      }

      const updated = await workflowTemplateRepository.updateTemplate(tenantId, id, {
        status: WorkflowTemplateStatus.DEPRECATED,
      });

      ApiResponse.success(res, updated!);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to deprecate template', 500);
    }
  }

  // 8. Archive Template
  public static async archiveTemplate(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    try {
      const template = await workflowTemplateRepository.findById(tenantId, id);
      if (!template) {
        ApiResponse.error(res, 'NOT_FOUND', `Template with ID ${id} not found`, 404);
        return;
      }

      if (template.templateScope === TemplateScope.SYSTEM) {
        ApiResponse.error(
          res,
          'FORBIDDEN',
          'Archiving SYSTEM templates is prohibited for tenant users. SYSTEM templates are governed by the platform.',
          403
        );
        return;
      }

      if (template.templateScope === TemplateScope.TENANT && template.ownerTenantId !== tenantId) {
        ApiResponse.error(res, 'NOT_FOUND', `Template with ID ${id} not found`, 404);
        return;
      }

      const updated = await workflowTemplateRepository.updateTemplate(tenantId, id, {
        status: WorkflowTemplateStatus.ARCHIVED,
        archivedAt: new Date().toISOString(),
      });

      ApiResponse.success(res, updated!);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to archive template', 500);
    }
  }

  // 9. Soft-Delete Template
  public static async deleteTemplate(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    try {
      const template = await workflowTemplateRepository.findById(tenantId, id);
      if (!template) {
        ApiResponse.error(res, 'NOT_FOUND', `Template with ID ${id} not found`, 404);
        return;
      }

      if (template.templateScope === TemplateScope.SYSTEM) {
        ApiResponse.error(
          res,
          'FORBIDDEN',
          'Deleting SYSTEM templates is prohibited for tenant users. SYSTEM templates are governed by the platform.',
          403
        );
        return;
      }

      if (template.templateScope === TemplateScope.TENANT && template.ownerTenantId !== tenantId) {
        ApiResponse.error(res, 'NOT_FOUND', `Template with ID ${id} not found`, 404);
        return;
      }

      const deleted = await workflowTemplateRepository.softDelete(tenantId, id);
      if (!deleted) {
        ApiResponse.error(res, 'BAD_REQUEST', 'Failed to delete template', 400);
        return;
      }

      ApiResponse.success(res, { success: true, message: `Template ${id} deleted` });
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to delete template', 500);
    }
  }

  // 10. Clone Template (Prompt 4A.6: Cloning creates a TENANT-owned template)
  public static async cloneTemplate(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    try {
      const template = await workflowTemplateRepository.findById(tenantId, id);
      if (!template) {
        ApiResponse.error(res, 'NOT_FOUND', `Template with ID ${id} not found`, 404);
        return;
      }

      const versionId = `${template.id}_v${template.version}`;

      const cloned = await workflowTemplateRepository.createTemplate(
        tenantId,
        {
          templateKey: `${template.templateKey}_CUSTOM_${Date.now().toString().slice(-4)}`,
          name: `${template.name} (Custom)`,
          description: template.description,
          category: template.category,
          purpose: template.purpose,
          trigger: template.trigger,
          steps: template.steps,
          templateScope: TemplateScope.TENANT,
          ownerTenantId: tenantId,
          sourceTemplateId: template.id,
          sourceTemplateVersionId: versionId,
          sourceTemplateVersion: template.version,
        },
        req.user?.id || 'system'
      );

      ApiResponse.success(res, cloned, 201);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to clone template', 500);
    }
  }

  // 11. Instantiate Template into Active Workflow (Prompt 4A.3, 4A.4, 4A.11)
  public static async instantiateTemplate(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    try {
      const template = await workflowTemplateRepository.findById(tenantId, id);
      if (!template) {
        ApiResponse.error(res, 'NOT_FOUND', `Template with ID ${id} not found`, 404);
        return;
      }

      if (template.status !== WorkflowTemplateStatus.PUBLISHED) {
        ApiResponse.error(res, 'BAD_REQUEST', 'Only PUBLISHED templates can be instantiated', 400);
        return;
      }

      const actorUserId = req.user?.id || 'system';
      const versionId = `${template.id}_v${template.version}`;

      // Create a production-grade active AutomationWorkflow definition belonging to requesting tenant
      const wf = await automationWorkflowRepository.createWorkflow(tenantId, {
        name: template.name,
        description: template.description,
        workflowKey: template.templateKey,
        version: template.version,
        status: WorkflowStatus.ACTIVE,
        trigger: template.trigger,
        steps: template.steps,
        sourceTemplateId: template.id,
        sourceTemplateVersionId: versionId,
        sourceTemplateVersion: template.version,
        createdBy: actorUserId,
        updatedBy: actorUserId,
      });

      // Record Template Usage (Prompt 4A.12)
      await workflowTemplateRepository.createUsage(
        tenantId,
        id,
        wf.id,
        actorUserId,
        template.version,
        versionId
      );

      ApiResponse.success(
        res,
        {
          workflow: wf,
          message: `Workflow instantiated successfully from template "${template.name}"`,
        },
        201
      );
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to instantiate template', 500);
    }
  }

  // 12. List Template Versions
  public static async listVersions(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    try {
      const template = await workflowTemplateRepository.findById(tenantId, id);
      if (!template) {
        ApiResponse.error(res, 'NOT_FOUND', `Template with ID ${id} not found`, 404);
        return;
      }

      const versions = await workflowTemplateRepository.findVersions(tenantId, id);
      ApiResponse.success(res, versions);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to list template versions', 500);
    }
  }
}
