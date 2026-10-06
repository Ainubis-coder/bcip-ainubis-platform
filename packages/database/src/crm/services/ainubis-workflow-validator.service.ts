/**
 * BCIP Ainubis Workflow & Template Definition Validation Engine
 * Phase 2E — Prompt 002E-006: Ainubis Workflow Intelligence, Templates & Operational Control
 */

import { WorkflowTriggerType, WorkflowStepType } from '../workflow-types.ts';

export class AinubisWorkflowDefinitionValidator {
  /**
   * Deterministically validates a workflow definition schema, triggers, steps, transitions, and safety boundaries.
   */
  public static validate(definition: {
    name?: string;
    trigger: any;
    steps: any[];
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 1. Core Metadata & Structural Validity
    if (!definition) {
      return { valid: false, errors: ['Workflow definition payload is empty or null'] };
    }

    if (!definition.trigger) {
      errors.push('Workflow trigger configuration is required');
    }

    if (!Array.isArray(definition.steps) || definition.steps.length === 0) {
      errors.push('Workflow must contain at least one step');
    }

    // 2. Trigger Validity
    if (definition.trigger) {
      const { type, eventType, cronExpression, conditionKey } = definition.trigger;

      if (!Object.values(WorkflowTriggerType).includes(type)) {
        errors.push(`Unsupported trigger type: ${type}`);
      }

      if (type === WorkflowTriggerType.CRM_EVENT && !eventType) {
        errors.push('CRM_EVENT trigger requires an eventType definition');
      }

      if (type === WorkflowTriggerType.SCHEDULED_CONDITION && !cronExpression && !conditionKey) {
        errors.push('SCHEDULED_CONDITION trigger requires either a cronExpression or conditionKey');
      }
    }

    // 3. Step Validity, Reachability & Structural Transitions
    if (Array.isArray(definition.steps) && definition.steps.length > 0) {
      const stepIds = new Set<string>();
      const stepKeys = new Set<string>();

      // Check step definitions
      for (const step of definition.steps) {
        if (!step.id) {
          errors.push('Every step must have a unique "id"');
          continue;
        }
        if (!step.stepKey) {
          errors.push(`Step ${step.id} is missing a "stepKey"`);
        }
        if (!step.type || !Object.values(WorkflowStepType).includes(step.type)) {
          errors.push(`Step ${step.id} has an invalid or missing "type": ${step.type}`);
        }
        if (step.order === undefined || typeof step.order !== 'number') {
          errors.push(`Step ${step.id} must define a numeric "order"`);
        }

        if (stepIds.has(step.id)) {
          errors.push(`Duplicate step ID detected: ${step.id}`);
        }
        stepIds.add(step.id);

        if (step.stepKey) {
          if (stepKeys.has(step.stepKey)) {
            errors.push(`Duplicate stepKey detected: ${step.stepKey}`);
          }
          stepKeys.add(step.stepKey);
        }

        // 4. Action and Safety Boundaries Enforcement (PROHIBITED SCOPE)
        if (step.type === WorkflowStepType.PROPOSE_ACTION || step.type === WorkflowStepType.EXECUTE_ACTION) {
          const config = step.configuration || {};
          const actionType = config.actionType || '';
          const actionTemplateId = config.actionTemplateId || '';

          // Prohibited actions check
          const prohibitedTerms = [
            'INVOICE', 'PAYMENT', 'BANKING', 'ACCOUNTING', 'LEVY', 'TRANSACTION',
            'RESERVE_FUND', 'FINANCIAL', 'CONTRACT_RENEWAL_AUTO', 'PERMISSION_MUTATION',
            'ROLE_MUTATION', 'DELETE_RECORD', 'EVAL_CODE', 'EXEC_JS', 'RUN_SHELL'
          ];

          const combinedString = `${actionType}_${actionTemplateId}_${JSON.stringify(config)}`.toUpperCase();
          for (const term of prohibitedTerms) {
            if (combinedString.includes(term)) {
              errors.push(`Forbidden safety boundary violation on step "${step.id}": "${term}" capability is prohibited in automated workflows`);
            }
          }

          // Check if action relies on arbitrary code
          if (config.arbitraryCode || config.scriptText || config.evalCode) {
            errors.push(`Forbidden safety boundary violation on step "${step.id}": Arbitrary script execution is strictly prohibited`);
          }
        }
      }

      // Check transitions reachability (step ordering checks)
      const sortedSteps = [...definition.steps].sort((a, b) => a.order - b.order);
      if (sortedSteps[0] && sortedSteps[0].order !== 1) {
        errors.push('Workflow steps must start at order: 1');
      }

      // Verify no circular loops if next step pointers exist in configurations
      for (const step of definition.steps) {
        const config = step.configuration || {};
        if (config.nextStepId) {
          if (!stepIds.has(config.nextStepId)) {
            errors.push(`Step "${step.id}" points to a non-existent nextStepId: "${config.nextStepId}"`);
          }
          if (config.nextStepId === step.id) {
            errors.push(`Step "${step.id}" points to itself, causing a circular terminal lock`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
