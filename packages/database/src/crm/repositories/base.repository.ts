/**
 * BCIP CRM Base Repository
 * Enforces tenant scope, soft delete isolation, and deterministic entity tracking.
 */

export interface BaseEntity {
  id: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface QueryOptions {
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  searchFields?: string[];
  filter?: Record<string, unknown>;
}

export abstract class BaseCrmRepository<T extends BaseEntity> {
  protected items: Map<string, T> = new Map();
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  protected generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  protected matchesQuery(item: T, tenantId: string, options?: QueryOptions): boolean {
    if (item.tenantId !== tenantId) return false;
    if (!options?.includeDeleted && item.deletedAt) return false;

    // Apply exact filter matches
    if (options?.filter) {
      for (const [key, val] of Object.entries(options.filter)) {
        if (val !== undefined && val !== null && val !== '') {
          const itemVal = (item as unknown as Record<string, unknown>)[key];
          if (itemVal !== val) {
            return false;
          }
        }
      }
    }

    // Apply search across specified or default text fields
    if (options?.search && options.search.trim().length > 0) {
      const q = options.search.trim().toLowerCase();
      const fields = options.searchFields || Object.keys(item);
      let match = false;
      for (const field of fields) {
        const val = (item as unknown as Record<string, unknown>)[field];
        if (typeof val === 'string' && val.toLowerCase().includes(q)) {
          match = true;
          break;
        }
      }
      if (!match) return false;
    }

    return true;
  }

  public async findById(tenantId: string, id: string, options?: QueryOptions): Promise<T | null> {
    const item = this.items.get(id);
    if (!item) return null;

    // Strict Tenant Isolation
    if (item.tenantId !== tenantId) {
      return null;
    }

    // Soft Deletion Filter
    if (!options?.includeDeleted && item.deletedAt) {
      return null;
    }

    return JSON.parse(JSON.stringify(item));
  }

  public async findAll(tenantId: string, options?: QueryOptions): Promise<T[]> {
    let results: T[] = [];
    for (const item of this.items.values()) {
      if (!this.matchesQuery(item, tenantId, options)) continue;
      results.push(JSON.parse(JSON.stringify(item)));
    }

    // Apply sorting if requested
    if (options?.sortBy) {
      const field = options.sortBy;
      const order = options.sortOrder === 'asc' ? 1 : -1;
      results.sort((a, b) => {
        const aVal = (a as unknown as Record<string, unknown>)[field];
        const bVal = (b as unknown as Record<string, unknown>)[field];
        if (aVal === bVal) return 0;
        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;
        return aVal < bVal ? -1 * order : 1 * order;
      });
    }

    // Apply offset and limit if specified
    const offset = options?.offset || 0;
    const limit = options?.limit !== undefined ? options.limit : results.length;
    return results.slice(offset, offset + limit);
  }

  public findAllUnscoped(): T[] {
    const results: T[] = [];
    for (const item of this.items.values()) {
      if (!item.deletedAt) {
        results.push(JSON.parse(JSON.stringify(item)));
      }
    }
    return results;
  }

  public async create(entity: T): Promise<T> {
    const now = new Date().toISOString();
    const toSave: T = {
      ...entity,
      createdAt: entity.createdAt || now,
      updatedAt: entity.updatedAt || now,
    };

    this.items.set(toSave.id, JSON.parse(JSON.stringify(toSave)));
    return JSON.parse(JSON.stringify(toSave));
  }

  public async update(tenantId: string, id: string, patch: Partial<T>): Promise<T | null> {
    const existing = await this.findById(tenantId, id);
    if (!existing) {
      return null;
    }

    const updated: T = {
      ...existing,
      ...patch,
      tenantId, // Prevent tenant hijacking
      id, // Prevent ID mutation
      updatedAt: new Date().toISOString(),
    };

    this.items.set(id, JSON.parse(JSON.stringify(updated)));
    return JSON.parse(JSON.stringify(updated));
  }

  public async softDelete(tenantId: string, id: string): Promise<boolean> {
    const existing = await this.findById(tenantId, id);
    if (!existing) {
      return false;
    }

    const deleted: T = {
      ...existing,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.items.set(id, JSON.parse(JSON.stringify(deleted)));
    return true;
  }

  public async restore(tenantId: string, id: string): Promise<T | null> {
    const existing = await this.findById(tenantId, id, { includeDeleted: true });
    if (!existing || !existing.deletedAt) {
      return null;
    }

    const restored: T = {
      ...existing,
      deletedAt: undefined,
      updatedAt: new Date().toISOString(),
    };

    this.items.set(id, JSON.parse(JSON.stringify(restored)));
    return JSON.parse(JSON.stringify(restored));
  }

  public count(tenantId: string, options?: QueryOptions): number {
    let count = 0;
    for (const item of this.items.values()) {
      if (!this.matchesQuery(item, tenantId, options)) continue;
      count++;
    }
    return count;
  }

  public clear(): void {
    this.items.clear();
  }
}
