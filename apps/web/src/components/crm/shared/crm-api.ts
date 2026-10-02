/**
 * BCIP CRM API Client Layer
 * Phase 2D — Prompt 002D-001: CRM Frontend Foundation & Pipeline Kanban
 * Reusable, authenticated query layer respecting tenant context and correlation tracking.
 */

import { UserAccount } from '../../../types/tenant';
import {
  Opportunity,
  OpportunityStage,
  PipelineSummary,
  CreateOpportunityDto,
  UpdateOpportunityDto,
  StageTransitionResponse,
  OpportunityStageHistory,
  ApiEnvelope,
  Lead,
  CreateLeadDto,
  UpdateLeadDto,
  LeadsListResponse,
  LeadStatus,
  QualificationStatus,
  ConvertLeadDto,
  ConvertLeadResult,
  Organisation,
  CreateOrganisationDto,
  UpdateOrganisationDto,
  OrganisationType,
  OrganisationStatus,
  Contact,
  SchemeProspect,
  CreateSchemeProspectDto,
  UpdateSchemeProspectDto,
} from './crm-types';
import { normalizeUserRole } from './crm-permissions';

export class CrmApiError extends Error {
  public code: string;
  public status: number;
  public requestId?: string;
  public details?: unknown;

  constructor(code: string, message: string, status: number, requestId?: string, details?: unknown) {
    super(message);
    this.name = 'CrmApiError';
    this.code = code;
    this.status = status;
    this.requestId = requestId;
    this.details = details;
  }
}

/**
 * Creates client JWT token matching backend tokenService format
 */
export function createClientAuthToken(user: UserAccount, tenantId: string): string {
  const role = normalizeUserRole(user.userRole || user.role);
  const now = Math.floor(Date.now() / 1000);

  const headerObj = { alg: 'HS256', typ: 'JWT' };
  const payloadObj = {
    sub: user.id,
    email: user.email,
    role,
    tenantId,
    schemeIds: [],
    iss: 'bcip.ainubis.platform',
    aud: 'bcip-api',
    iat: now,
    exp: now + 86400,
  };

  const toBase64Url = (obj: unknown) => {
    try {
      const json = JSON.stringify(obj);
      if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
        const bin = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) =>
          String.fromCharCode(parseInt(p1, 16))
        );
        return window.btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      }
      return Buffer.from(json).toString('base64url');
    } catch {
      return '';
    }
  };

  const header = toBase64Url(headerObj);
  const payload = toBase64Url(payloadObj);
  const signature = 'client_token_sig';

  return `${header}.${payload}.${signature}`;
}

export interface CrmApiClientOptions {
  baseUrl?: string;
  tenantId: string;
  user: UserAccount;
}

export class CrmApiClient {
  private baseUrl: string;
  private tenantId: string;
  private user: UserAccount;

  constructor(options: CrmApiClientOptions) {
    this.baseUrl = options.baseUrl || '/api/v1';
    this.tenantId = options.tenantId;
    this.user = options.user;
  }

  private getHeaders(idempotencyKey?: string): HeadersInit {
    const token = createClientAuthToken(this.user, this.tenantId);
    const role = normalizeUserRole(this.user.userRole || this.user.role);
    const reqId = `bcip_req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Request-Id': reqId,
      'X-Test-Tenant-Id': this.tenantId,
      'X-Test-User-Role': role,
      'X-Test-User-Id': this.user.id,
      'X-Test-User-Email': this.user.email,
    };

    if (idempotencyKey) {
      headers['X-Idempotency-Key'] = idempotencyKey;
    }

    return headers;
  }

  private async requestEnvelope<T>(path: string, options: RequestInit = {}): Promise<ApiEnvelope<T>> {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      ...this.getHeaders(),
      ...(options.headers as Record<string, string> || {}),
    };

    let res: Response;
    try {
      res = await fetch(url, { ...options, headers });
    } catch (netErr) {
      throw new CrmApiError(
        'NETWORK_ERROR',
        `Network error connecting to API: ${(netErr as Error).message}`,
        0
      );
    }

    let body: ApiEnvelope<T>;
    try {
      body = await res.json();
    } catch {
      throw new CrmApiError(
        'INVALID_RESPONSE',
        `API returned non-JSON response with HTTP status ${res.status}`,
        res.status
      );
    }

    if (!res.ok || body.success === false) {
      const err = body.error || {
        code: `HTTP_${res.status}`,
        message: `HTTP error ${res.status}: ${res.statusText}`,
      };
      throw new CrmApiError(
        err.code,
        err.message,
        res.status,
        body.meta?.requestId || err.requestId,
        err.details
      );
    }

    return body;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const body = await this.requestEnvelope<T>(path, options);
    return body.data;
  }

  /**
   * Retrieves aggregated pipeline summary with stage metrics
   */
  public async getPipelineSummary(params?: {
    stage?: OpportunityStage;
    owner?: string;
  }): Promise<PipelineSummary> {
    const query = new URLSearchParams();
    if (params?.stage) query.set('stage', params.stage);
    if (params?.owner) query.set('owner', params.owner);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request<PipelineSummary>(`/opportunities/pipeline${queryString}`);
  }

  /**
   * Lists opportunities with optional filters and pagination
   */
  public async listOpportunities(params?: {
    stage?: OpportunityStage;
    search?: string;
    organisationId?: string;
    ownerUserId?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ opportunities: Opportunity[]; total: number; page: number; pageSize: number }> {
    const query = new URLSearchParams();
    if (params?.stage) query.set('stage', params.stage);
    if (params?.search) query.set('search', params.search);
    if (params?.organisationId) query.set('organisationId', params.organisationId);
    if (params?.ownerUserId) query.set('ownerUserId', params.ownerUserId);
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.sortOrder) query.set('sortOrder', params.sortOrder);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await this.request<Opportunity[]>(`/opportunities${queryString}`);

    return {
      opportunities: Array.isArray(res) ? res : [],
      total: Array.isArray(res) ? res.length : 0,
      page: params?.page || 1,
      pageSize: params?.pageSize || 20,
    };
  }

  /**
   * Gets single opportunity by ID
   */
  public async getOpportunity(id: string): Promise<Opportunity> {
    return this.request<Opportunity>(`/opportunities/${encodeURIComponent(id)}`);
  }

  /**
   * Creates a new opportunity
   */
  public async createOpportunity(dto: CreateOpportunityDto): Promise<Opportunity> {
    const idempotencyKey = `opp_create_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return this.request<Opportunity>('/opportunities', {
      method: 'POST',
      body: JSON.stringify(dto),
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  /**
   * Updates opportunity details
   */
  public async updateOpportunity(id: string, dto: UpdateOpportunityDto): Promise<Opportunity> {
    return this.request<Opportunity>(`/opportunities/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  /**
   * Transitions an opportunity through the lifecycle stages
   */
  public async transitionOpportunityStage(
    id: string,
    newStage: OpportunityStage,
    reason?: string
  ): Promise<StageTransitionResponse> {
    const idempotencyKey = `stage_trans_${id}_${newStage}_${Date.now()}`;
    return this.request<StageTransitionResponse>(
      `/opportunities/${encodeURIComponent(id)}/stage`,
      {
        method: 'POST',
        body: JSON.stringify({ stage: newStage, reason }),
        headers: { 'X-Idempotency-Key': idempotencyKey },
      }
    );
  }

  /**
   * Soft deletes an opportunity
   */
  public async deleteOpportunity(id: string): Promise<{ id: string; deleted: boolean }> {
    return this.request<{ id: string; deleted: boolean }>(
      `/opportunities/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * Retrieves stage transition history audit records for an opportunity
   */
  public async getOpportunityHistory(id: string): Promise<OpportunityStageHistory[]> {
    return this.request<OpportunityStageHistory[]>(
      `/opportunities/${encodeURIComponent(id)}/history`
    );
  }

  // ==========================================================================
  // LEADS API METHODS (Phase 2D-002)
  // ==========================================================================

  /**
   * Lists leads with filtering, search, pagination, and sorting
   */
  public async listLeads(params?: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    status?: LeadStatus;
    qualificationStatus?: QualificationStatus;
    campaignId?: string;
    leadOwnerId?: string;
  }): Promise<LeadsListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.qualificationStatus) query.set('qualificationStatus', params.qualificationStatus);
    if (params?.campaignId) query.set('campaignId', params.campaignId);
    if (params?.leadOwnerId) query.set('leadOwnerId', params.leadOwnerId);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await this.requestEnvelope<Lead[]>(`/leads${queryString}`);

    return {
      leads: Array.isArray(res.data) ? res.data : [],
      pagination: res.pagination || {
        page: params?.page || 1,
        pageSize: params?.pageSize || 20,
        total: Array.isArray(res.data) ? res.data.length : 0,
        totalPages: 1,
      },
    };
  }

  /**
   * Retrieves a single lead by ID
   */
  public async getLead(id: string): Promise<Lead> {
    return this.request<Lead>(`/leads/${encodeURIComponent(id)}`);
  }

  /**
   * Creates a new lead
   */
  public async createLead(dto: CreateLeadDto): Promise<Lead> {
    const idempotencyKey = `lead_create_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return this.request<Lead>('/leads', {
      method: 'POST',
      body: JSON.stringify(dto),
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  /**
   * Updates an existing lead
   */
  public async updateLead(id: string, dto: UpdateLeadDto): Promise<Lead> {
    const idempotencyKey = `lead_update_${id}_${Date.now()}`;
    return this.request<Lead>(`/leads/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  /**
   * Soft-deletes a lead
   */
  public async deleteLead(id: string): Promise<{ id: string; deleted: boolean }> {
    return this.request<{ id: string; deleted: boolean }>(`/leads/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  /**
   * Converts a lead atomically into Organisation, Contact, Scheme Prospect, Opportunity, and Activity
   */
  public async convertLead(id: string, dto: ConvertLeadDto = {}): Promise<ConvertLeadResult> {
    const idempotencyKey = `lead_convert_${id}_${Date.now()}`;
    return this.request<ConvertLeadResult>(`/leads/${encodeURIComponent(id)}/convert`, {
      method: 'POST',
      body: JSON.stringify(dto),
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  // ==========================================================================
  // ORGANISATIONS
  // ==========================================================================

  /**
   * Lists organisations with server-side pagination, search, and filtering
   */
  public async listOrganisations(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: OrganisationStatus;
    organisationType?: OrganisationType;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ organisations: Organisation[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.organisationType) query.set('organisationType', params.organisationType);
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.sortOrder) query.set('sortOrder', params.sortOrder);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await this.requestEnvelope<Organisation[]>(`/organisations${queryString}`);

    return {
      organisations: Array.isArray(res.data) ? res.data : [],
      pagination: res.pagination || {
        page: params?.page || 1,
        pageSize: params?.pageSize || 20,
        total: Array.isArray(res.data) ? res.data.length : 0,
        totalPages: 1,
      },
    };
  }

  /**
   * Retrieves single organisation by ID
   */
  public async getOrganisation(id: string): Promise<Organisation> {
    return this.request<Organisation>(`/organisations/${encodeURIComponent(id)}`);
  }

  /**
   * Creates a new organisation
   */
  public async createOrganisation(dto: CreateOrganisationDto): Promise<Organisation> {
    const idempotencyKey = `org_create_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return this.request<Organisation>('/organisations', {
      method: 'POST',
      body: JSON.stringify(dto),
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  /**
   * Updates an existing organisation
   */
  public async updateOrganisation(id: string, dto: UpdateOrganisationDto): Promise<Organisation> {
    const idempotencyKey = `org_update_${id}_${Date.now()}`;
    return this.request<Organisation>(`/organisations/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  /**
   * Soft-deletes an organisation
   */
  public async deleteOrganisation(id: string): Promise<{ id: string; deleted: boolean }> {
    return this.request<{ id: string; deleted: boolean }>(`/organisations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  /**
   * Retrieves related contacts for an organisation
   */
  public async getOrganisationContacts(id: string): Promise<Contact[]> {
    return this.request<Contact[]>(`/organisations/${encodeURIComponent(id)}/contacts`);
  }

  /**
   * Retrieves related opportunities for an organisation
   */
  public async getOrganisationOpportunities(id: string): Promise<Opportunity[]> {
    return this.request<Opportunity[]>(`/organisations/${encodeURIComponent(id)}/opportunities`);
  }

  /**
   * Retrieves related scheme prospects for an organisation
   */
  public async getOrganisationSchemeProspects(id: string): Promise<SchemeProspect[]> {
    return this.request<SchemeProspect[]>(`/organisations/${encodeURIComponent(id)}/scheme-prospects`);
  }

  // ==========================================================================
  // SCHEME PROSPECTS
  // ==========================================================================

  /**
   * Lists scheme prospects with server-side pagination, search, and filtering
   */
  public async listSchemeProspects(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    organisationId?: string;
    leadId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ schemeProspects: SchemeProspect[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.search) query.set('search', params.search);
    if (params?.organisationId) query.set('organisationId', params.organisationId);
    if (params?.leadId) query.set('leadId', params.leadId);
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.sortOrder) query.set('sortOrder', params.sortOrder);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await this.requestEnvelope<SchemeProspect[]>(`/scheme-prospects${queryString}`);

    return {
      schemeProspects: Array.isArray(res.data) ? res.data : [],
      pagination: res.pagination || {
        page: params?.page || 1,
        pageSize: params?.pageSize || 20,
        total: Array.isArray(res.data) ? res.data.length : 0,
        totalPages: 1,
      },
    };
  }

  /**
   * Retrieves single scheme prospect by ID
   */
  public async getSchemeProspect(id: string): Promise<SchemeProspect> {
    return this.request<SchemeProspect>(`/scheme-prospects/${encodeURIComponent(id)}`);
  }

  /**
   * Creates a new scheme prospect
   */
  public async createSchemeProspect(dto: CreateSchemeProspectDto): Promise<SchemeProspect> {
    const idempotencyKey = `sp_create_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return this.request<SchemeProspect>('/scheme-prospects', {
      method: 'POST',
      body: JSON.stringify(dto),
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  /**
   * Updates an existing scheme prospect
   */
  public async updateSchemeProspect(id: string, dto: UpdateSchemeProspectDto): Promise<SchemeProspect> {
    const idempotencyKey = `sp_update_${id}_${Date.now()}`;
    return this.request<SchemeProspect>(`/scheme-prospects/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  /**
   * Soft-deletes a scheme prospect
   */
  public async deleteSchemeProspect(id: string): Promise<{ id: string; deleted: boolean }> {
    return this.request<{ id: string; deleted: boolean }>(`/scheme-prospects/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }
}

/**
 * Factory to instantiate client for active context
 */
export function getCrmApiClient(tenantId: string, user: UserAccount): CrmApiClient {
  return new CrmApiClient({ tenantId, user });
}
