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
  Activity,
  ActivityType,
  CreateActivityDto,
  UpdateActivityDto,
  CRMTask,
  TaskStatus,
  TaskPriority,
  CreateCRMTaskDto,
  UpdateCRMTaskDto,
  AIObservationRecord,
  AICapability,
  IntelligenceType,
  IntelligenceStatus,
  AinubisDashboardSummary,
  ContextualIntelligenceResponse,
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

  // ==========================================================================
  // ACTIVITIES
  // ==========================================================================

  /**
   * Lists activities with server-side pagination, search, and filtering
   */
  public async listActivities(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    activityType?: ActivityType;
    leadId?: string;
    contactId?: string;
    organisationId?: string;
    opportunityId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ activities: Activity[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.search) query.set('search', params.search);
    if (params?.activityType) query.set('activityType', params.activityType);
    if (params?.leadId) query.set('leadId', params.leadId);
    if (params?.contactId) query.set('contactId', params.contactId);
    if (params?.organisationId) query.set('organisationId', params.organisationId);
    if (params?.opportunityId) query.set('opportunityId', params.opportunityId);
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.sortOrder) query.set('sortOrder', params.sortOrder);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await this.requestEnvelope<Activity[]>(`/activities${queryString}`);

    return {
      activities: Array.isArray(res.data) ? res.data : [],
      pagination: res.pagination || {
        page: params?.page || 1,
        pageSize: params?.pageSize || 20,
        total: Array.isArray(res.data) ? res.data.length : 0,
        totalPages: 1,
      },
    };
  }

  /**
   * Retrieves single activity by ID
   */
  public async getActivity(id: string): Promise<Activity> {
    return this.request<Activity>(`/activities/${encodeURIComponent(id)}`);
  }

  /**
   * Creates a new activity
   */
  public async createActivity(dto: CreateActivityDto): Promise<Activity> {
    const idempotencyKey = `act_create_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return this.request<Activity>('/activities', {
      method: 'POST',
      body: JSON.stringify(dto),
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  /**
   * Updates an existing activity
   */
  public async updateActivity(id: string, dto: UpdateActivityDto): Promise<Activity> {
    const idempotencyKey = `act_update_${id}_${Date.now()}`;
    return this.request<Activity>(`/activities/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  /**
   * Soft-deletes an activity
   */
  public async deleteActivity(id: string): Promise<{ id: string; deleted: boolean }> {
    return this.request<{ id: string; deleted: boolean }>(`/activities/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // ==========================================================================
  // TASKS
  // ==========================================================================

  /**
   * Lists tasks with server-side pagination, search, and filtering
   */
  public async listTasks(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignedTo?: string;
    leadId?: string;
    opportunityId?: string;
    organisationId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ tasks: CRMTask[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.assignedTo) query.set('assignedTo', params.assignedTo);
    if (params?.leadId) query.set('leadId', params.leadId);
    if (params?.opportunityId) query.set('opportunityId', params.opportunityId);
    if (params?.organisationId) query.set('organisationId', params.organisationId);
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.sortOrder) query.set('sortOrder', params.sortOrder);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await this.requestEnvelope<CRMTask[]>(`/tasks${queryString}`);

    return {
      tasks: Array.isArray(res.data) ? res.data : [],
      pagination: res.pagination || {
        page: params?.page || 1,
        pageSize: params?.pageSize || 20,
        total: Array.isArray(res.data) ? res.data.length : 0,
        totalPages: 1,
      },
    };
  }

  /**
   * Retrieves single task by ID
   */
  public async getTask(id: string): Promise<CRMTask> {
    return this.request<CRMTask>(`/tasks/${encodeURIComponent(id)}`);
  }

  /**
   * Creates a new task
   */
  public async createTask(dto: CreateCRMTaskDto): Promise<CRMTask> {
    const idempotencyKey = `tsk_create_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return this.request<CRMTask>('/tasks', {
      method: 'POST',
      body: JSON.stringify(dto),
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  /**
   * Updates an existing task
   */
  public async updateTask(id: string, dto: UpdateCRMTaskDto): Promise<CRMTask> {
    const idempotencyKey = `tsk_update_${id}_${Date.now()}`;
    return this.request<CRMTask>(`/tasks/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  /**
   * Soft-deletes a task
   */
  public async deleteTask(id: string): Promise<{ id: string; deleted: boolean }> {
    return this.request<{ id: string; deleted: boolean }>(`/tasks/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  /**
   * Marks a task as COMPLETED
   */
  public async completeTask(id: string): Promise<CRMTask> {
    const idempotencyKey = `tsk_complete_${id}_${Date.now()}`;
    return this.request<CRMTask>(`/tasks/${encodeURIComponent(id)}/complete`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  // ==========================================================================
  // AINUBIS CRM INTELLIGENCE
  // ==========================================================================

  /**
   * Lists AI observations & recommendations with search and capability filters
   */
  public async listAIObservations(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    capability?: AICapability;
    intelligenceType?: IntelligenceType;
    status?: IntelligenceStatus;
    targetEntityType?: string;
    targetEntityId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ observations: AIObservationRecord[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.search) query.set('search', params.search);
    if (params?.capability) query.set('capability', params.capability);
    if (params?.intelligenceType) query.set('intelligenceType', params.intelligenceType);
    if (params?.status) query.set('status', params.status);
    if (params?.targetEntityType) query.set('targetEntityType', params.targetEntityType);
    if (params?.targetEntityId) query.set('targetEntityId', params.targetEntityId);
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.sortOrder) query.set('sortOrder', params.sortOrder);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await this.requestEnvelope<AIObservationRecord[]>(`/ai/observations${queryString}`);

    return {
      observations: Array.isArray(res.data) ? res.data : [],
      pagination: res.pagination || {
        page: params?.page || 1,
        pageSize: params?.pageSize || 20,
        total: Array.isArray(res.data) ? res.data.length : 0,
        totalPages: 1,
      },
    };
  }

  /**
   * Fetches the executive dashboard summary and category health metrics
   */
  public async getAiSummary(): Promise<AinubisDashboardSummary> {
    return this.request<AinubisDashboardSummary>('/ai/summary');
  }

  /**
   * Fetches contextual intelligence observations for a specific CRM entity
   */
  public async getAiContext(entityType: string, entityId: string): Promise<ContextualIntelligenceResponse> {
    return this.request<ContextualIntelligenceResponse>(
      `/ai/context/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`
    );
  }

  /**
   * Fetches single AI observation by ID
   */
  public async getAIObservation(id: string): Promise<AIObservationRecord> {
    return this.request<AIObservationRecord>(`/ai/observations/${encodeURIComponent(id)}`);
  }

  /**
   * Triggers an AI capability analysis
   */
  public async analyzeAIObservation(capability: AICapability | string = 'CRM_PIPELINE_HYGIENE', targetEntityId?: string): Promise<any> {
    const idempotencyKey = `ai_analyze_${capability}_${targetEntityId || 'portfolio'}_${Date.now()}`;
    return this.request<any>('/ai/observations/analyze', {
      method: 'POST',
      body: JSON.stringify({ capability, targetEntityId }),
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  /**
   * Marks AI observation as REVIEWED
   */
  public async reviewAIObservation(id: string): Promise<AIObservationRecord> {
    const idempotencyKey = `ai_review_${id}_${Date.now()}`;
    return this.request<AIObservationRecord>(`/ai/observations/${encodeURIComponent(id)}/review`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  /**
   * Approves an AI recommendation
   */
  public async approveAIObservation(id: string): Promise<AIObservationRecord> {
    const idempotencyKey = `ai_approve_${id}_${Date.now()}`;
    return this.request<AIObservationRecord>(`/ai/observations/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  /**
   * Rejects an AI recommendation
   */
  public async rejectAIObservation(id: string, reason?: string): Promise<AIObservationRecord> {
    const idempotencyKey = `ai_reject_${id}_${Date.now()}`;
    return this.request<AIObservationRecord>(`/ai/observations/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  /**
   * Dismisses an AI observation
   */
  public async dismissAIObservation(id: string): Promise<AIObservationRecord> {
    const idempotencyKey = `ai_dismiss_${id}_${Date.now()}`;
    return this.request<AIObservationRecord>(`/ai/observations/${encodeURIComponent(id)}/dismiss`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  // ==========================================================================
  // AI ACTIONS API METHODS (Phase 2E-004)
  // ==========================================================================

  /**
   * Fetches a paginated list of AI actions
   */
  public async listAiActions(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    actionType?: string;
    targetEntityType?: string;
    targetEntityId?: string;
  }): Promise<{ actions: any[]; pagination: any }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('limit', String(params.pageSize));
    if (params?.status) query.set('status', params.status);
    if (params?.actionType) query.set('actionType', params.actionType);
    if (params?.targetEntityType) query.set('targetEntityType', params.targetEntityType);
    if (params?.targetEntityId) query.set('targetEntityId', params.targetEntityId);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await this.requestEnvelope<any[]>(`/ai/actions${queryString}`);

    return {
      actions: Array.isArray(res.data) ? res.data : [],
      pagination: res.pagination || {
        page: params?.page || 1,
        pageSize: params?.pageSize || 20,
        total: Array.isArray(res.data) ? res.data.length : 0,
        totalPages: 1,
      },
    };
  }

  /**
   * Fetches single AI Action by ID
   */
  public async getAiAction(id: string): Promise<any> {
    return this.request<any>(`/ai/actions/${encodeURIComponent(id)}`);
  }

  /**
   * Proposes a new AI Action
   */
  public async proposeAiAction(dto: any): Promise<any> {
    const idempotencyKey = `ai_action_propose_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return this.request<any>('/ai/actions', {
      method: 'POST',
      body: JSON.stringify(dto),
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  /**
   * Requests review on an AI Action
   */
  public async reviewAiAction(id: string): Promise<any> {
    const idempotencyKey = `ai_action_review_${id}_${Date.now()}`;
    return this.request<any>(`/ai/actions/${encodeURIComponent(id)}/review`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  /**
   * Approves an AI Action
   */
  public async approveAiAction(id: string, reason?: string): Promise<any> {
    const idempotencyKey = `ai_action_approve_${id}_${Date.now()}`;
    return this.request<any>(`/ai/actions/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  /**
   * Rejects an AI Action
   */
  public async rejectAiAction(id: string, reason: string): Promise<any> {
    const idempotencyKey = `ai_action_reject_${id}_${Date.now()}`;
    return this.request<any>(`/ai/actions/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  /**
   * Cancels an AI Action
   */
  public async cancelAiAction(id: string): Promise<any> {
    const idempotencyKey = `ai_action_cancel_${id}_${Date.now()}`;
    return this.request<any>(`/ai/actions/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  /**
   * Executes an approved AI Action
   */
  public async executeAiAction(id: string): Promise<any> {
    const idempotencyKey = `ai_action_execute_${id}_${Date.now()}`;
    return this.request<any>(`/ai/actions/${encodeURIComponent(id)}/execute`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  /**
   * Fetches evidence for an AI Action
   */
  public async getAiActionEvidence(id: string): Promise<any[]> {
    return this.request<any[]>(`/ai/actions/${encodeURIComponent(id)}/evidence`);
  }

  /**
   * Fetches executions logs for an AI Action
   */
  public async getAiActionExecution(id: string): Promise<any[]> {
    return this.request<any[]>(`/ai/actions/${encodeURIComponent(id)}/execution`);
  }

  /**
   * Fetches verification logs for an AI Action
   */
  public async getAiActionVerification(id: string): Promise<any[]> {
    return this.request<any[]>(`/ai/actions/${encodeURIComponent(id)}/verification`);
  }

  // ==========================================================================
  // WORKFLOW INTELLIGENCE & ORCHESTRATION METHODS (Phase 2E-005)
  // ==========================================================================

  public async listWorkflows(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    workflowKey?: string;
  }): Promise<{ workflows: any[]; pagination: any }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('limit', String(params.pageSize));
    if (params?.status) query.set('status', params.status);
    if (params?.workflowKey) query.set('workflowKey', params.workflowKey);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await this.requestEnvelope<any[]>(`/ai/workflows${queryString}`);

    return {
      workflows: Array.isArray(res.data) ? res.data : [],
      pagination: res.pagination || {
        page: params?.page || 1,
        pageSize: params?.pageSize || 20,
        total: Array.isArray(res.data) ? res.data.length : 0,
        totalPages: 1,
      },
    };
  }

  public async getWorkflow(id: string): Promise<any> {
    return this.request<any>(`/ai/workflows/${encodeURIComponent(id)}`);
  }

  public async createWorkflow(dto: any): Promise<any> {
    const idempotencyKey = `wf_create_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return this.request<any>('/ai/workflows', {
      method: 'POST',
      body: JSON.stringify(dto),
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  public async updateWorkflow(id: string, dto: any): Promise<any> {
    const idempotencyKey = `wf_update_${id}_${Date.now()}`;
    return this.request<any>(`/ai/workflows/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  public async activateWorkflow(id: string): Promise<any> {
    const idempotencyKey = `wf_act_${id}_${Date.now()}`;
    return this.request<any>(`/ai/workflows/${encodeURIComponent(id)}/activate`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  public async pauseWorkflow(id: string): Promise<any> {
    const idempotencyKey = `wf_pause_${id}_${Date.now()}`;
    return this.request<any>(`/ai/workflows/${encodeURIComponent(id)}/pause`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  public async disableWorkflow(id: string): Promise<any> {
    const idempotencyKey = `wf_disable_${id}_${Date.now()}`;
    return this.request<any>(`/ai/workflows/${encodeURIComponent(id)}/disable`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  public async archiveWorkflow(id: string): Promise<any> {
    const idempotencyKey = `wf_archive_${id}_${Date.now()}`;
    return this.request<any>(`/ai/workflows/${encodeURIComponent(id)}/archive`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  public async listWorkflowRuns(workflowId: string, params?: { page?: number; pageSize?: number; status?: string }): Promise<{ runs: any[]; pagination: any }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('limit', String(params.pageSize));
    if (params?.status) query.set('status', params.status);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await this.requestEnvelope<any[]>(`/ai/workflows/${encodeURIComponent(workflowId)}/runs${queryString}`);

    return {
      runs: Array.isArray(res.data) ? res.data : [],
      pagination: res.pagination || {
        page: params?.page || 1,
        pageSize: params?.pageSize || 20,
        total: Array.isArray(res.data) ? res.data.length : 0,
        totalPages: 1,
      },
    };
  }

  public async triggerWorkflowRun(workflowId: string, context?: Record<string, any>): Promise<any> {
    const idempotencyKey = `wf_run_trig_${workflowId}_${Date.now()}`;
    return this.request<any>(`/ai/workflows/${encodeURIComponent(workflowId)}/run`, {
      method: 'POST',
      body: JSON.stringify({ context }),
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  public async getWorkflowRun(id: string): Promise<any> {
    return this.request<any>(`/ai/workflow-runs/${encodeURIComponent(id)}`);
  }

  public async cancelWorkflowRun(id: string): Promise<any> {
    const idempotencyKey = `wf_run_cancel_${id}_${Date.now()}`;
    return this.request<any>(`/ai/workflow-runs/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  public async retryWorkflowRun(id: string): Promise<any> {
    const idempotencyKey = `wf_run_retry_${id}_${Date.now()}`;
    return this.request<any>(`/ai/workflow-runs/${encodeURIComponent(id)}/retry`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  public async getWorkflowRunTimeline(id: string): Promise<any[]> {
    return this.request<any[]>(`/ai/workflow-runs/${encodeURIComponent(id)}/timeline`);
  }

  public async getWorkflowRunOutcome(id: string): Promise<any> {
    return this.request<any>(`/ai/workflow-runs/${encodeURIComponent(id)}/outcome`);
  }

  public async getWorkflowRunApprovals(id: string): Promise<any[]> {
    return this.request<any[]>(`/ai/workflow-runs/${encodeURIComponent(id)}/approvals`);
  }

  public async getWorkflowRunEvidence(id: string): Promise<any[]> {
    return this.request<any[]>(`/ai/workflow-runs/${encodeURIComponent(id)}/evidence`);
  }

  // ============================================================================
  // WORKFLOW TEMPLATES (Phase 2E — Prompt 002E-006 & 4A)
  // ============================================================================
  public async listWorkflowTemplates(params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    templateKey?: string;
    scope?: 'SYSTEM' | 'TENANT' | 'ALL';
  }): Promise<{ templates: any[]; pagination: any }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.status) query.set('status', params.status);
    if (params?.category) query.set('category', params.category);
    if (params?.templateKey) query.set('templateKey', params.templateKey);
    if (params?.scope) query.set('scope', params.scope);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await this.request<any>(`/ai/workflow-templates${qs}`);
    return {
      templates: res?.data || (Array.isArray(res) ? res : []),
      pagination: res?.meta || { total: (res?.data || []).length, page: params?.page || 1, pageSize: params?.limit || 20 },
    };
  }

  public async getWorkflowTemplate(id: string): Promise<any> {
    return this.request<any>(`/ai/workflow-templates/${encodeURIComponent(id)}`);
  }

  public async createWorkflowTemplate(dto: any): Promise<any> {
    const idempotencyKey = `wf_tpl_create_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return this.request<any>('/ai/workflow-templates', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: dto,
    });
  }

  public async updateWorkflowTemplate(id: string, dto: any): Promise<any> {
    const idempotencyKey = `wf_tpl_update_${id}_${Date.now()}`;
    return this.request<any>(`/ai/workflow-templates/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: dto,
    });
  }

  public async validateWorkflowTemplate(id: string): Promise<any> {
    return this.request<any>(`/ai/workflow-templates/${encodeURIComponent(id)}/validate`, {
      method: 'POST',
    });
  }

  public async publishWorkflowTemplate(id: string): Promise<any> {
    const idempotencyKey = `wf_tpl_pub_${id}_${Date.now()}`;
    return this.request<any>(`/ai/workflow-templates/${encodeURIComponent(id)}/publish`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  public async deprecateWorkflowTemplate(id: string): Promise<any> {
    const idempotencyKey = `wf_tpl_dep_${id}_${Date.now()}`;
    return this.request<any>(`/ai/workflow-templates/${encodeURIComponent(id)}/deprecate`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  public async archiveWorkflowTemplate(id: string): Promise<any> {
    const idempotencyKey = `wf_tpl_arc_${id}_${Date.now()}`;
    return this.request<any>(`/ai/workflow-templates/${encodeURIComponent(id)}/archive`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  public async deleteWorkflowTemplate(id: string): Promise<any> {
    const idempotencyKey = `wf_tpl_del_${id}_${Date.now()}`;
    return this.request<any>(`/ai/workflow-templates/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  public async cloneWorkflowTemplate(id: string): Promise<any> {
    const idempotencyKey = `wf_tpl_clone_${id}_${Date.now()}`;
    return this.request<any>(`/ai/workflow-templates/${encodeURIComponent(id)}/clone`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  public async instantiateWorkflowTemplate(id: string): Promise<any> {
    const idempotencyKey = `wf_tpl_inst_${id}_${Date.now()}`;
    return this.request<any>(`/ai/workflow-templates/${encodeURIComponent(id)}/instantiate`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  public async getWorkflowTemplateVersions(id: string): Promise<any[]> {
    const res = await this.request<any>(`/ai/workflow-templates/${encodeURIComponent(id)}/versions`);
    return Array.isArray(res) ? res : res?.data || [];
  }

  // ============================================================================
  // PORTFOLIO INTELLIGENCE (Phase 2E — Prompt 002E-007)
  // ============================================================================
  public async getPortfolioSnapshot(): Promise<any> {
    const res = await this.request<any>('/ai/portfolio/snapshot');
    return res?.data || res;
  }

  public async getPortfolioMetrics(): Promise<any> {
    const res = await this.request<any>('/ai/portfolio/metrics');
    return res?.data || res;
  }

  public async getPortfolioSignals(): Promise<any[]> {
    const res = await this.request<any>('/ai/portfolio/signals');
    return res?.data || (Array.isArray(res) ? res : []);
  }

  public async getPortfolioRisks(): Promise<any[]> {
    const res = await this.request<any>('/ai/portfolio/risks');
    return res?.data || (Array.isArray(res) ? res : []);
  }

  public async getPortfolioTrends(): Promise<any[]> {
    const res = await this.request<any>('/ai/portfolio/trends');
    return res?.data || (Array.isArray(res) ? res : []);
  }

  public async getPortfolioInsights(): Promise<any[]> {
    const res = await this.request<any>('/ai/portfolio/insights');
    return res?.data || (Array.isArray(res) ? res : []);
  }

  public async getPortfolioPriorities(): Promise<any[]> {
    const res = await this.request<any>('/ai/portfolio/priorities');
    return res?.data || (Array.isArray(res) ? res : []);
  }

  public async getPortfolioHealth(): Promise<any> {
    const res = await this.request<any>('/ai/portfolio/health');
    return res?.data || res;
  }

  public async analyzePortfolio(): Promise<any> {
    const idempotencyKey = `pf_analyze_${Date.now()}`;
    return this.request<any>('/ai/portfolio/analyze', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  // ============================================================================
  // EXECUTIVE REPORTING (Phase 2E — Prompt 002E-008)
  // ============================================================================
  public async listExecutiveReports(): Promise<any[]> {
    const res = await this.request<any>('/ai/reports');
    return Array.isArray(res) ? res : res?.data || [];
  }

  public async getExecutiveReport(id: string): Promise<any> {
    const res = await this.request<any>(`/ai/reports/${encodeURIComponent(id)}`);
    return res?.data || res;
  }

  public async getExecutiveReportVersions(id: string): Promise<any[]> {
    const res = await this.request<any>(`/ai/reports/${encodeURIComponent(id)}/versions`);
    return Array.isArray(res) ? res : res?.data || [];
  }

  public async generateExecutiveReport(dto: {
    reportType: string;
    reportingPeriod: string;
    periodStart: string;
    periodEnd: string;
    title?: string;
  }): Promise<any> {
    const idempotencyKey = `rep_gen_${Date.now()}`;
    return this.request<any>('/ai/reports/generate', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify(dto),
    });
  }

  public async reviewExecutiveReport(id: string): Promise<any> {
    const idempotencyKey = `rep_rev_${id}_${Date.now()}`;
    return this.request<any>(`/ai/reports/${encodeURIComponent(id)}/review`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  public async approveExecutiveReport(id: string, reason?: string): Promise<any> {
    const idempotencyKey = `rep_appr_${id}_${Date.now()}`;
    return this.request<any>(`/ai/reports/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ reason }),
    });
  }

  public async rejectExecutiveReport(id: string, reason?: string): Promise<any> {
    const idempotencyKey = `rep_rej_${id}_${Date.now()}`;
    return this.request<any>(`/ai/reports/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ reason }),
    });
  }

  public async publishExecutiveReport(id: string): Promise<any> {
    const idempotencyKey = `rep_pub_${id}_${Date.now()}`;
    return this.request<any>(`/ai/reports/${encodeURIComponent(id)}/publish`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  public async archiveExecutiveReport(id: string): Promise<any> {
    const idempotencyKey = `rep_arch_${id}_${Date.now()}`;
    return this.request<any>(`/ai/reports/${encodeURIComponent(id)}/archive`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  public async getExecutiveReportEvidence(id: string): Promise<any[]> {
    const res = await this.request<any>(`/ai/reports/${encodeURIComponent(id)}/evidence`);
    return Array.isArray(res) ? res : res?.data || [];
  }

  public async exportExecutiveReport(id: string): Promise<string> {
    const url = `${this.baseUrl}/ai/reports/${encodeURIComponent(id)}/export`;
    const token = createClientAuthToken(this.user, this.tenantId);
    const role = normalizeUserRole(this.user.userRole || this.user.role);
    const headers = {
      Authorization: `Bearer ${token}`,
      'X-Test-Tenant-Id': this.tenantId,
      'X-Test-User-Role': role,
      'X-Test-User-Id': this.user.id,
      'X-Test-User-Email': this.user.email,
    };
    const res = await fetch(url, { method: 'POST', headers });
    if (!res.ok) {
      throw new Error(`Export failed with HTTP status ${res.status}`);
    }
    return res.text();
  }

  // ============================================================================
  // COMMERCIAL OPERATIONS & BILLING (Phase 3 — Prompt 003-001 / 003-002)
  // ============================================================================
  public async listBillingCustomers(): Promise<any[]> {
    const res = await this.request<any>('/billing/customers');
    return Array.isArray(res) ? res : res?.data || [];
  }

  public async createBillingCustomer(dto: any): Promise<any> {
    const idempotencyKey = `cust_create_${Date.now()}`;
    return this.request<any>('/billing/customers', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify(dto),
    });
  }

  public async getBillingCustomer(id: string): Promise<any> {
    const res = await this.request<any>(`/billing/customers/${encodeURIComponent(id)}`);
    return res?.data || res;
  }

  public async updateBillingCustomer(id: string, patch: any): Promise<any> {
    return this.request<any>(`/billing/customers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    });
  }

  public async deleteBillingCustomer(id: string): Promise<any> {
    return this.request<any>(`/billing/customers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  public async listBillingProfiles(): Promise<any[]> {
    const res = await this.request<any>('/billing/profiles');
    return Array.isArray(res) ? res : res?.data || [];
  }

  public async createBillingProfile(dto: any): Promise<any> {
    const idempotencyKey = `prof_create_${Date.now()}`;
    return this.request<any>('/billing/profiles', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify(dto),
    });
  }

  public async getBillingProfile(id: string): Promise<any> {
    const res = await this.request<any>(`/billing/profiles/${encodeURIComponent(id)}`);
    return res?.data || res;
  }

  public async updateBillingProfile(id: string, patch: any): Promise<any> {
    return this.request<any>(`/billing/profiles/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    });
  }

  public async listInvoices(): Promise<any[]> {
    const res = await this.request<any>('/billing/invoices');
    return Array.isArray(res) ? res : res?.data || [];
  }

  public async createInvoice(dto: any): Promise<any> {
    const idempotencyKey = `inv_create_${Date.now()}`;
    return this.request<any>('/billing/invoices', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify(dto),
    });
  }

  public async getInvoice(id: string): Promise<any> {
    const res = await this.request<any>(`/billing/invoices/${encodeURIComponent(id)}`);
    return res?.data || res;
  }

  public async updateInvoice(id: string, patch: any): Promise<any> {
    return this.request<any>(`/billing/invoices/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    });
  }

  public async submitInvoiceReview(id: string): Promise<any> {
    const idempotencyKey = `inv_rev_${id}_${Date.now()}`;
    return this.request<any>(`/billing/invoices/${encodeURIComponent(id)}/submit-review`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  public async approveInvoice(id: string, reason?: string): Promise<any> {
    const idempotencyKey = `inv_appr_${id}_${Date.now()}`;
    return this.request<any>(`/billing/invoices/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ reason }),
    });
  }

  public async issueInvoice(id: string): Promise<any> {
    const idempotencyKey = `inv_issue_${id}_${Date.now()}`;
    return this.request<any>(`/billing/invoices/${encodeURIComponent(id)}/issue`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  public async voidInvoice(id: string, reason: string): Promise<any> {
    const idempotencyKey = `inv_void_${id}_${Date.now()}`;
    return this.request<any>(`/billing/invoices/${encodeURIComponent(id)}/void`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ reason }),
    });
  }

  public async listInvoiceLines(id: string): Promise<any[]> {
    const res = await this.request<any>(`/billing/invoices/${encodeURIComponent(id)}/lines`);
    return Array.isArray(res) ? res : res?.data || [];
  }

  public async addInvoiceLine(id: string, dto: any): Promise<any> {
    const idempotencyKey = `line_add_${id}_${Date.now()}`;
    return this.request<any>(`/billing/invoices/${encodeURIComponent(id)}/lines`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify(dto),
    });
  }

  public async updateInvoiceLine(id: string, lineId: string, patch: any): Promise<any> {
    return this.request<any>(`/billing/invoices/${encodeURIComponent(id)}/lines/${encodeURIComponent(lineId)}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    });
  }

  public async deleteInvoiceLine(id: string, lineId: string): Promise<any> {
    return this.request<any>(`/billing/invoices/${encodeURIComponent(id)}/lines/${encodeURIComponent(lineId)}`, {
      method: 'DELETE',
    });
  }

  public async generateInvoiceDocument(invoiceId: string): Promise<any> {
    const idempotencyKey = `doc_gen_${invoiceId}_${Date.now()}`;
    return this.request<any>(`/billing/invoices/${encodeURIComponent(invoiceId)}/documents`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  public async listInvoiceDocuments(invoiceId: string): Promise<any[]> {
    const res = await this.request<any>(`/billing/invoices/${encodeURIComponent(invoiceId)}/documents`);
    return Array.isArray(res) ? res : res?.data || [];
  }

  public async getInvoiceDocument(documentId: string): Promise<any> {
    const res = await this.request<any>(`/billing/invoice-documents/${encodeURIComponent(documentId)}`);
    return res?.data || res;
  }

  public async listDeliveryTemplates(): Promise<any[]> {
    const res = await this.request<any>('/billing/delivery-templates');
    return Array.isArray(res) ? res : res?.data || [];
  }

  public async initiateInvoiceDelivery(invoiceId: string, dto: { documentId: string; recipientEmail: string; templateId: string }): Promise<any> {
    const idempotencyKey = `del_init_${invoiceId}_${Date.now()}`;
    return this.request<any>(`/billing/invoices/${encodeURIComponent(invoiceId)}/deliveries`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify(dto),
    });
  }

  public async listInvoiceDeliveries(invoiceId: string): Promise<any[]> {
    const res = await this.request<any>(`/billing/invoices/${encodeURIComponent(invoiceId)}/deliveries`);
    return Array.isArray(res) ? res : res?.data || [];
  }

  public async retryInvoiceDelivery(deliveryId: string): Promise<any> {
    const idempotencyKey = `del_retry_${deliveryId}_${Date.now()}`;
    return this.request<any>(`/billing/invoice-deliveries/${encodeURIComponent(deliveryId)}/retry`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  public async listDeliveryAttempts(deliveryId: string): Promise<any[]> {
    const res = await this.request<any>(`/billing/invoice-deliveries/${encodeURIComponent(deliveryId)}/attempts`);
    return Array.isArray(res) ? res : res?.data || [];
  }

  // ============================================================================
  // RECEIVABLES
  // ============================================================================
  public async listReceivables(filters?: { customerId?: string; status?: string }): Promise<any[]> {
    let url = '/billing/receivables';
    const params = new URLSearchParams();
    if (filters?.customerId) params.append('customerId', filters.customerId);
    if (filters?.status) params.append('status', filters.status);
    const query = params.toString();
    if (query) url += `?${query}`;
    const res = await this.request<any>(url);
    return Array.isArray(res) ? res : res?.data || [];
  }

  public async getReceivable(id: string): Promise<any> {
    const res = await this.request<any>(`/billing/receivables/${encodeURIComponent(id)}`);
    return res?.data || res;
  }

  public async recalculateReceivable(id: string): Promise<any> {
    return this.request<any>(`/billing/receivables/${encodeURIComponent(id)}/recalculate`, {
      method: 'POST',
    });
  }

  // ============================================================================
  // PAYMENTS
  // ============================================================================
  public async listPayments(filters?: { customerId?: string; status?: string }): Promise<any[]> {
    let url = '/billing/payments';
    const params = new URLSearchParams();
    if (filters?.customerId) params.append('customerId', filters.customerId);
    if (filters?.status) params.append('status', filters.status);
    const query = params.toString();
    if (query) url += `?${query}`;
    const res = await this.request<any>(url);
    return Array.isArray(res) ? res : res?.data || [];
  }

  public async getPayment(id: string): Promise<any> {
    const res = await this.request<any>(`/billing/payments/${encodeURIComponent(id)}`);
    return res?.data || res;
  }

  public async recordPayment(dto: { customerId: string; amount: number; currency: string; paymentDate: string; paymentMethod: string; externalReference?: string; notes?: string }): Promise<any> {
    const idempotencyKey = `pmt_rec_${Date.now()}`;
    return this.request<any>('/billing/payments', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify(dto),
    });
  }

  public async reversePayment(id: string, reason: string): Promise<any> {
    const idempotencyKey = `pmt_rev_${id}_${Date.now()}`;
    return this.request<any>(`/billing/payments/${encodeURIComponent(id)}/reverse`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ reason }),
    });
  }

  // ============================================================================
  // ALLOCATIONS
  // ============================================================================
  public async listAllocations(filters?: { paymentId?: string; receivableId?: string }): Promise<any[]> {
    let url = '/billing/payment-allocations';
    const params = new URLSearchParams();
    if (filters?.paymentId) params.append('paymentId', filters.paymentId);
    if (filters?.receivableId) params.append('receivableId', filters.receivableId);
    const query = params.toString();
    if (query) url += `?${query}`;
    const res = await this.request<any>(url);
    return Array.isArray(res) ? res : res?.data || [];
  }

  public async allocatePayment(dto: { paymentId: string; receivableId: string; allocatedAmount: number }): Promise<any> {
    const idempotencyKey = `alloc_create_${Date.now()}`;
    return this.request<any>('/billing/payment-allocations', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify(dto),
    });
  }

  public async reverseAllocation(id: string, reason: string): Promise<any> {
    const idempotencyKey = `alloc_rev_${id}_${Date.now()}`;
    return this.request<any>(`/billing/payment-allocations/${encodeURIComponent(id)}/reverse`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ reason }),
    });
  }

  // ============================================================================
  // AR AGING, STATEMENTS & RECONCILIATION (PHASE 3 — PROMPT 003-006)
  // ============================================================================
  public async getReceivablesAging(filters?: { customerId?: string; asOfDate?: string }): Promise<any> {
    let url = '/billing/receivables/aging';
    const params = new URLSearchParams();
    if (filters?.customerId) params.append('customerId', filters.customerId);
    if (filters?.asOfDate) params.append('asOfDate', filters.asOfDate);
    const query = params.toString();
    if (query) url += `?${query}`;
    const res = await this.request<any>(url);
    return res?.data || res;
  }

  public async getOverdueReceivables(filters?: { customerId?: string; asOfDate?: string }): Promise<any[]> {
    let url = '/billing/receivables/overdue';
    const params = new URLSearchParams();
    if (filters?.customerId) params.append('customerId', filters.customerId);
    if (filters?.asOfDate) params.append('asOfDate', filters.asOfDate);
    const query = params.toString();
    if (query) url += `?${query}`;
    const res = await this.request<any>(url);
    return Array.isArray(res) ? res : res?.data || [];
  }

  public async getCustomerStatement(customerId: string, filters?: { startDate?: string; endDate?: string; asOfDate?: string }): Promise<any> {
    let url = `/billing/customers/${encodeURIComponent(customerId)}/statement`;
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.asOfDate) params.append('asOfDate', filters.asOfDate);
    const query = params.toString();
    if (query) url += `?${query}`;
    const res = await this.request<any>(url);
    return res?.data || res;
  }

  public async getCollectionPriority(filters?: { asOfDate?: string }): Promise<any[]> {
    let url = '/billing/receivables/collection-priority';
    const params = new URLSearchParams();
    if (filters?.asOfDate) params.append('asOfDate', filters.asOfDate);
    const query = params.toString();
    if (query) url += `?${query}`;
    const res = await this.request<any>(url);
    return Array.isArray(res) ? res : res?.data || [];
  }

  public async getReceivablesSummary(filters?: { asOfDate?: string }): Promise<any> {
    let url = '/billing/receivables/summary';
    const params = new URLSearchParams();
    if (filters?.asOfDate) params.append('asOfDate', filters.asOfDate);
    const query = params.toString();
    if (query) url += `?${query}`;
    const res = await this.request<any>(url);
    return res?.data || res;
  }

  public async getCustomerBalance(customerId: string, filters?: { asOfDate?: string }): Promise<any> {
    let url = `/billing/customers/${encodeURIComponent(customerId)}/balance`;
    const params = new URLSearchParams();
    if (filters?.asOfDate) params.append('asOfDate', filters.asOfDate);
    const query = params.toString();
    if (query) url += `?${query}`;
    const res = await this.request<any>(url);
    return res?.data || res;
  }

  public async getReconciliationReport(filters?: { asOfDate?: string }): Promise<any> {

    let url = '/billing/reconciliation';
    const params = new URLSearchParams();
    if (filters?.asOfDate) params.append('asOfDate', filters.asOfDate);
    const query = params.toString();
    if (query) url += `?${query}`;
    const res = await this.request<any>(url);
    return res?.data || res;
  }
}


/**
 * Factory to instantiate client for active context
 */
export function getCrmApiClient(tenantId: string, user: UserAccount): CrmApiClient {
  return new CrmApiClient({ tenantId, user });
}
