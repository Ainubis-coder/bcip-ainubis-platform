/**
 * BCIP CRM Event Dispatcher & Workflow Integration
 * Connects CRM lifecycle transitions to the BCIP workflow engine.
 */

import { CRMEventType } from '../enums.ts';
import type { CRMEvent } from '../types.ts';
import { workflowEngine } from '../../../../workflows/src/index.ts';

export type CRMEventListener = (event: CRMEvent) => void | Promise<void>;

export class CRMEventBus {
  private listeners: Map<CRMEventType | '*', Set<CRMEventListener>> = new Map();
  private eventHistory: CRMEvent[] = [];

  public subscribe(eventType: CRMEventType | '*', listener: CRMEventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);

    return () => {
      this.listeners.get(eventType)?.delete(listener);
    };
  }

  public async publish<T = Record<string, unknown>>(
    eventType: CRMEventType,
    tenantId: string,
    payload: T,
    actorUserId?: string
  ): Promise<CRMEvent<T>> {
    const event: CRMEvent<T> = {
      id: `evt_crm_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      eventType,
      tenantId,
      timestamp: new Date().toISOString(),
      actorUserId,
      payload,
      version: 1,
    };

    this.eventHistory.push(event as CRMEvent);

    // 1. Notify specific listeners
    const specific = this.listeners.get(eventType);
    if (specific) {
      for (const listener of specific) {
        try {
          await listener(event as CRMEvent);
        } catch (err) {
          console.error(`[CRMEventBus] Error in listener for ${eventType}:`, err);
        }
      }
    }

    // 2. Notify wildcard listeners
    const wildcard = this.listeners.get('*');
    if (wildcard) {
      for (const listener of wildcard) {
        try {
          await listener(event as CRMEvent);
        } catch (err) {
          console.error(`[CRMEventBus] Error in wildcard listener for ${eventType}:`, err);
        }
      }
    }

    // 3. Forward to BCIP Workflow Engine if registered
    try {
      const activeWorkflow = workflowEngine.getWorkflow(eventType);
      if (activeWorkflow) {
        await workflowEngine.triggerWorkflow(activeWorkflow.id, payload as Record<string, unknown>);
      }
    } catch {
      // Non-blocking workflow trigger
    }

    return event;
  }

  public getRecentEvents(tenantId?: string): CRMEvent[] {
    if (!tenantId) return [...this.eventHistory];
    return this.eventHistory.filter((e) => e.tenantId === tenantId);
  }

  public clearHistory(): void {
    this.eventHistory = [];
  }
}

export const crmEventBus = new CRMEventBus();
