/**
 * BCIP CRM Lead Domain Service
 * Handles lead lifecycle, qualification assessment, and multi-entity conversion workflows.
 */

import { leadRepository, LeadRepository } from '../repositories/lead.repository.ts';
import { organisationRepository, OrganisationRepository } from '../repositories/organisation.repository.ts';
import { contactRepository, ContactRepository } from '../repositories/contact.repository.ts';
import { schemeProspectRepository, SchemeProspectRepository } from '../repositories/scheme-prospect.repository.ts';
import { opportunityRepository, OpportunityRepository } from '../repositories/opportunity.repository.ts';
import { activityRepository, ActivityRepository } from '../repositories/activity.repository.ts';
import type { QueryOptions } from '../repositories/base.repository.ts';
import { crmAuditService, CRMAuditService } from '../audit/crm-audit.ts';
import { crmEventBus, CRMEventBus } from '../events/crm-events.ts';
import type { Lead, CreateLeadDto, UpdateLeadDto, Opportunity, Organisation, Contact, SchemeProspect } from '../types.ts';
import {
  LeadStatus,
  QualificationStatus,
  OrganisationType,
  OrganisationStatus,
  ContactStatus,
  PreferredContactMethod,
  OpportunityStage,
  ActivityType,
  CRMEventType,
  DataQualityState,
} from '../enums.ts';

export interface ConvertLeadDto {
  organisationName?: string;
  organisationType?: OrganisationType;
  existingOrganisationId?: string;
  contactFirstName?: string;
  contactLastName?: string;
  existingContactId?: string;
  opportunityName?: string;
  estimatedValue?: number;
  expectedCloseDate?: string;
  createSchemeProspect?: boolean;
}

export interface ConvertLeadResult {
  lead: Lead;
  organisation: Organisation;
  contact: Contact;
  schemeProspect?: SchemeProspect;
  opportunity: Opportunity;
}

export class LeadService {
  private leadRepo: LeadRepository;
  private orgRepo: OrganisationRepository;
  private contactRepo: ContactRepository;
  private prospectRepo: SchemeProspectRepository;
  private oppRepo: OpportunityRepository;
  private actRepo: ActivityRepository;
  private audit: CRMAuditService;
  private eventBus: CRMEventBus;

  constructor(
    leadRepo: LeadRepository = leadRepository,
    orgRepo: OrganisationRepository = organisationRepository,
    contactRepo: ContactRepository = contactRepository,
    prospectRepo: SchemeProspectRepository = schemeProspectRepository,
    oppRepo: OpportunityRepository = opportunityRepository,
    actRepo: ActivityRepository = activityRepository,
    audit: CRMAuditService = crmAuditService,
    eventBus: CRMEventBus = crmEventBus
  ) {
    this.leadRepo = leadRepo;
    this.orgRepo = orgRepo;
    this.contactRepo = contactRepo;
    this.prospectRepo = prospectRepo;
    this.oppRepo = oppRepo;
    this.actRepo = actRepo;
    this.audit = audit;
    this.eventBus = eventBus;
  }

  public async create(tenantId: string, dto: CreateLeadDto, actorUserId: string): Promise<Lead> {
    if (!dto.title) {
      throw new Error('Lead title is required');
    }

    const lead = await this.leadRepo.createLead(tenantId, dto);

    await this.audit.record(
      tenantId,
      'lead',
      lead.id,
      'LEAD_CREATED',
      actorUserId,
      undefined,
      lead as unknown as Record<string, unknown>
    );

    await this.eventBus.publish(
      CRMEventType.LEAD_CREATED,
      tenantId,
      { leadId: lead.id, title: lead.title, source: lead.source },
      actorUserId
    );

    return lead;
  }

  public async getById(tenantId: string, id: string): Promise<Lead | null> {
    return this.leadRepo.findById(tenantId, id);
  }

  public async list(tenantId: string, options?: QueryOptions | LeadStatus): Promise<Lead[]> {
    if (typeof options === 'string') {
      return this.leadRepo.findByStatus(tenantId, options);
    }
    return this.leadRepo.findAll(tenantId, options);
  }

  public count(tenantId: string, options?: QueryOptions): number {
    return this.leadRepo.count(tenantId, options);
  }

  public async update(tenantId: string, id: string, dto: UpdateLeadDto, actorUserId: string): Promise<Lead> {
    const before = await this.leadRepo.findById(tenantId, id);
    if (!before) {
      throw new Error(`Lead not found: ${id}`);
    }

    const updated = await this.leadRepo.update(tenantId, id, dto);
    if (!updated) {
      throw new Error(`Failed to update lead: ${id}`);
    }

    await this.audit.record(
      tenantId,
      'lead',
      id,
      'LEAD_UPDATED',
      actorUserId,
      before as unknown as Record<string, unknown>,
      updated as unknown as Record<string, unknown>
    );

    await this.eventBus.publish(
      CRMEventType.LEAD_UPDATED,
      tenantId,
      { leadId: id, changes: dto },
      actorUserId
    );

    return updated;
  }

  public async qualify(
    tenantId: string,
    id: string,
    qualificationStatus: QualificationStatus,
    actorUserId: string,
    notes?: string
  ): Promise<Lead> {
    const before = await this.leadRepo.findById(tenantId, id);
    if (!before) {
      throw new Error(`Lead not found: ${id}`);
    }

    const patch: Partial<Lead> = {
      qualificationStatus,
      status: qualificationStatus === QualificationStatus.QUALIFIED ? LeadStatus.QUALIFIED : before.status,
    };
    if (notes) {
      patch.description = before.description ? `${before.description}\n[Qualification Notes]: ${notes}` : notes;
    }

    const updated = await this.leadRepo.update(tenantId, id, patch);
    if (!updated) throw new Error('Failed to qualify lead');

    await this.audit.record(
      tenantId,
      'lead',
      id,
      'LEAD_QUALIFIED',
      actorUserId,
      { qualificationStatus: before.qualificationStatus },
      { qualificationStatus, notes }
    );

    await this.eventBus.publish(
      CRMEventType.LEAD_QUALIFIED,
      tenantId,
      { leadId: id, qualificationStatus },
      actorUserId
    );

    return updated;
  }

  public async updateStatus(
    tenantId: string,
    id: string,
    newStatus: LeadStatus,
    actorUserId: string,
    reason?: string
  ): Promise<Lead> {
    const before = await this.leadRepo.findById(tenantId, id);
    if (!before) {
      throw new Error(`Lead not found: ${id}`);
    }

    const updated = await this.leadRepo.update(tenantId, id, { status: newStatus });
    if (!updated) throw new Error('Failed to update lead status');

    await this.audit.record(
      tenantId,
      'lead',
      id,
      'LEAD_STATUS_CHANGED',
      actorUserId,
      { status: before.status },
      { status: newStatus, reason }
    );

    await this.eventBus.publish(
      CRMEventType.LEAD_STATUS_CHANGED,
      tenantId,
      { leadId: id, fromStatus: before.status, toStatus: newStatus, reason },
      actorUserId
    );

    return updated;
  }

  public async assign(tenantId: string, id: string, newOwnerId: string, actorUserId: string): Promise<Lead> {
    const before = await this.leadRepo.findById(tenantId, id);
    if (!before) throw new Error(`Lead not found: ${id}`);

    const updated = await this.leadRepo.update(tenantId, id, { leadOwnerId: newOwnerId });
    if (!updated) throw new Error('Failed to assign lead');

    await this.audit.record(
      tenantId,
      'lead',
      id,
      'LEAD_ASSIGNED',
      actorUserId,
      { ownerId: before.leadOwnerId },
      { ownerId: newOwnerId }
    );

    await this.eventBus.publish(
      CRMEventType.LEAD_ASSIGNED,
      tenantId,
      { leadId: id, newOwnerId },
      actorUserId
    );

    return updated;
  }

  /**
   * Lead Conversion Workflow
   * Atomically converts a qualified lead into:
   * 1. Organisation
   * 2. Contact
   * 3. Scheme Prospect (if scheme info present)
   * 4. Sales Opportunity
   * 5. Conversion Activity
   */
  public async convertLead(
    tenantId: string,
    leadId: string,
    options: ConvertLeadDto,
    actorUserId: string
  ): Promise<ConvertLeadResult> {
    const lead = await this.leadRepo.findById(tenantId, leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    if (lead.status === LeadStatus.CONVERTED) {
      throw new Error(`Lead ${leadId} has already been converted`);
    }

    // 1. Resolve or Create Organisation
    let organisation: Organisation;
    if (options.existingOrganisationId) {
      const existing = await this.orgRepo.findById(tenantId, options.existingOrganisationId);
      if (!existing) throw new Error(`Organisation not found: ${options.existingOrganisationId}`);
      organisation = existing;
    } else {
      const orgName = options.organisationName || lead.managingAgent || lead.schemeName || `${lead.title} Org`;
      organisation = await this.orgRepo.createOrganisation(tenantId, {
        name: orgName,
        organisationType: options.organisationType || (lead.schemeName ? OrganisationType.BODY_CORPORATE : OrganisationType.MANAGING_AGENT),
        email: lead.email,
        phone: lead.phone,
        website: lead.website,
        status: OrganisationStatus.PROSPECT,
        dataQualityState: DataQualityState.COMPLETE,
      });

      await this.audit.record(
        tenantId,
        'organisation',
        organisation.id,
        'ORGANISATION_CREATED_FROM_LEAD',
        actorUserId,
        undefined,
        organisation as unknown as Record<string, unknown>,
        { leadId }
      );
    }

    // 2. Resolve or Create Contact
    let contact: Contact;
    if (options.existingContactId) {
      const existing = await this.contactRepo.findById(tenantId, options.existingContactId);
      if (!existing) throw new Error(`Contact not found: ${options.existingContactId}`);
      contact = existing;
    } else {
      const firstName = options.contactFirstName || lead.title.split(' ')[0] || 'Primary';
      const lastName = options.contactLastName || lead.title.split(' ').slice(1).join(' ') || 'Contact';

      contact = await this.contactRepo.createContact(tenantId, {
        organisationId: organisation.id,
        firstName,
        lastName,
        email: lead.email,
        phone: lead.phone,
        preferredContactMethod: PreferredContactMethod.EMAIL,
        status: ContactStatus.ACTIVE,
        dataQualityState: DataQualityState.COMPLETE,
      });

      await this.audit.record(
        tenantId,
        'contact',
        contact.id,
        'CONTACT_CREATED_FROM_LEAD',
        actorUserId,
        undefined,
        contact as unknown as Record<string, unknown>,
        { leadId }
      );
    }

    // 3. Scheme Prospect (Optional/Conditional)
    let schemeProspect: SchemeProspect | undefined;
    if (options.createSchemeProspect !== false && (lead.schemeName || options.organisationType === OrganisationType.BODY_CORPORATE)) {
      schemeProspect = await this.prospectRepo.createProspect(tenantId, {
        organisationId: organisation.id,
        leadId: lead.id,
        name: lead.schemeName || `${organisation.name} Scheme`,
        estimatedUnitCount: lead.estimatedUnits || 0,
        managingAgentName: lead.managingAgent,
        currentPropertySystem: lead.currentSystem,
        painPoints: lead.painPoints,
        dataQualityState: DataQualityState.PARTIAL,
      });

      await this.audit.record(
        tenantId,
        'scheme_prospect',
        schemeProspect.id,
        'SCHEME_PROSPECT_CREATED_FROM_LEAD',
        actorUserId,
        undefined,
        schemeProspect as unknown as Record<string, unknown>,
        { leadId }
      );
    }

    // 4. Create Opportunity
    const oppName = options.opportunityName || `${organisation.name} — Platform Adoption`;
    const opportunity = await this.oppRepo.createOpportunity(
      tenantId,
      {
        organisationId: organisation.id,
        leadId: lead.id,
        primaryContactId: contact.id,
        schemeProspectId: schemeProspect?.id,
        name: oppName,
        stage: OpportunityStage.DISCOVERY,
        estimatedValue: options.estimatedValue || (lead.estimatedUnits ? lead.estimatedUnits * 25 : 5000),
        currency: 'ZAR',
        probability: 25,
        expectedCloseDate: options.expectedCloseDate,
        ownerUserId: lead.leadOwnerId,
        source: lead.source,
      },
      actorUserId
    );

    await this.audit.record(
      tenantId,
      'opportunity',
      opportunity.id,
      'OPPORTUNITY_CREATED_FROM_LEAD',
      actorUserId,
      undefined,
      opportunity as unknown as Record<string, unknown>,
      { leadId }
    );

    // 5. Create Conversion Activity
    await this.actRepo.createActivity(tenantId, {
      activityType: ActivityType.DISCOVERY,
      subject: `Lead Converted: ${lead.title}`,
      description: `Lead converted to Opportunity "${opportunity.name}". Associated with Organisation "${organisation.name}" and Contact "${contact.displayName}".`,
      createdBy: actorUserId,
      leadId: lead.id,
      contactId: contact.id,
      organisationId: organisation.id,
      opportunityId: opportunity.id,
    });

    // 6. Update Lead to CONVERTED
    const now = new Date().toISOString();
    const updatedLead = await this.leadRepo.update(tenantId, lead.id, {
      status: LeadStatus.CONVERTED,
      organisationId: organisation.id,
      contactId: contact.id,
      convertedAt: now,
      convertedOpportunityId: opportunity.id,
    });

    await this.audit.record(
      tenantId,
      'lead',
      lead.id,
      'LEAD_CONVERTED',
      actorUserId,
      { status: lead.status },
      { status: LeadStatus.CONVERTED, opportunityId: opportunity.id }
    );

    await this.eventBus.publish(
      CRMEventType.LEAD_CONVERTED,
      tenantId,
      {
        leadId: lead.id,
        opportunityId: opportunity.id,
        organisationId: organisation.id,
        contactId: contact.id,
      },
      actorUserId
    );

    return {
      lead: updatedLead || lead,
      organisation,
      contact,
      schemeProspect,
      opportunity,
    };
  }

  public async softDelete(tenantId: string, id: string, actorUserId: string): Promise<boolean> {
    const before = await this.leadRepo.findById(tenantId, id);
    if (!before) return false;

    const ok = await this.leadRepo.softDelete(tenantId, id);
    if (ok) {
      await this.audit.record(
        tenantId,
        'lead',
        id,
        'LEAD_SOFT_DELETED',
        actorUserId,
        before as unknown as Record<string, unknown>
      );
    }
    return ok;
  }
}

export const leadService = new LeadService();
