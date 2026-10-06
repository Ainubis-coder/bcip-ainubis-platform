/**
 * BCIP Commercial Operations Base Repository
 * Enforces tenant scope, soft delete isolation, and deterministic entity tracking.
 */

import { BaseBillingEntity } from '../types.ts';

export interface BillingQueryOptions {
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filter?: Record<string, unknown>;
}

export abstract class BaseBillingRepository<T extends BaseBillingEntity> {
  protected items: Map<string, T> = new Map();
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  protected generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  public async findById(tenantId: string | null, id: string): Promise<T | null> {
    const item = this.items.get(id);
    if (!item || item.tenantId !== tenantId || item.deletedAt) {
      return null;
    }
    return JSON.parse(JSON.stringify(item));
  }

  public async findAll(tenantId: string | null, options?: BillingQueryOptions): Promise<T[]> {
    let results: T[] = [];
    for (const item of this.items.values()) {
      if (item.tenantId !== tenantId) continue;
      if (!options?.includeDeleted && item.deletedAt) continue;

      if (options?.filter) {
        let match = true;
        for (const [k, v] of Object.entries(options.filter)) {
          if (v !== undefined && (item as any)[k] !== v) {
            match = false;
            break;
          }
        }
        if (!match) continue;
      }

      results.push(JSON.parse(JSON.stringify(item)));
    }

    if (options?.sortBy) {
      const field = options.sortBy;
      const order = options.sortOrder === 'asc' ? 1 : -1;
      results.sort((a, b) => {
        const aVal = (a as any)[field];
        const bVal = (b as any)[field];
        if (aVal < bVal) return -1 * order;
        if (aVal > bVal) return 1 * order;
        return 0;
      });
    }

    return results;
  }

  public async create(data: Omit<T, 'createdAt' | 'updatedAt'> & { createdAt?: string; updatedAt?: string }): Promise<T> {
    const now = new Date().toISOString();
    const newItem = {
      ...data,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    } as unknown as T;

    this.items.set(newItem.id, newItem);
    return JSON.parse(JSON.stringify(newItem));
  }

  public async update(tenantId: string | null, id: string, patch: Partial<T>): Promise<T | null> {
    const existing = await this.findById(tenantId, id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...patch,
      id: existing.id,
      tenantId: existing.tenantId,
      updatedAt: new Date().toISOString(),
    } as unknown as T;

    this.items.set(id, updated);
    return JSON.parse(JSON.stringify(updated));
  }

  public async delete(tenantId: string | null, id: string, soft: boolean = true): Promise<boolean> {
    const existing = await this.findById(tenantId, id);
    if (!existing) return false;

    if (soft) {
      (existing as any).deletedAt = new Date().toISOString();
      (existing as any).updatedAt = new Date().toISOString();
      this.items.set(id, existing);
    } else {
      this.items.delete(id);
    }
    return true;
  }

  public clear(): void {
    this.items.clear();
  }
}
