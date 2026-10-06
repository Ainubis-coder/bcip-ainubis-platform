/**
 * BCIP Commercial Operations & Invoicing Domain Types
 * Phase 3 — Prompt 003-001
 */

import { CustomerStatus, BillingFrequency, InvoiceStatus } from './enums.ts';

export interface BaseBillingEntity {
  id: string;
  tenantId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface BillingCustomer extends BaseBillingEntity {
  organisationId?: string; // Link to CRM Organisation
  customerNumber: string;
  legalName: string;
  tradingName?: string;
  billingEmail: string;
  billingPhone?: string;
  billingAddress: string;
  taxIdentifier?: string;
  currency: string;
  status: CustomerStatus;
  metadata?: Record<string, any>;
}

export interface BillingProfile extends BaseBillingEntity {
  billingCustomerId: string;
  billingFrequency: BillingFrequency;
  defaultCurrency: string;
  defaultPaymentTerms: string; // e.g. 'NET_30'
  defaultTaxConfigurationId?: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  status: CustomerStatus;
}

export interface BillingTaxConfiguration extends BaseBillingEntity {
  taxCode: string;
  taxName: string;
  taxRate: number; // percentage e.g. 15.0 for VAT
  isInclusive: boolean;
  isActive: boolean;
}

export interface InvoiceLine extends BaseBillingEntity {
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number; // stored in minor currency units or exact numeric representation
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  lineSubtotal: number;
  lineTotal: number;
  sortOrder: number;
  metadata?: Record<string, any>;
}

export interface Invoice extends BaseBillingEntity {
  billingCustomerId: string;
  billingProfileId?: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  notes?: string;
  internalNotes?: string;
  createdBy: string;
  issuedBy?: string;
  issuedAt?: string;
  voidedAt?: string;
  voidReason?: string;
  crmOpportunityId?: string;
  crmContractId?: string;
}

export interface BillingAuditLog extends BaseBillingEntity {
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  previousState?: any;
  newState?: any;
  correlationId: string;
  reason?: string;
}

export type InvoiceDocumentStatus = 'GENERATED' | 'SUPERSEDED' | 'FAILED';
export type InvoiceDocumentType = 'INVOICE';
export type DeliveryStatus = 'NOT_SENT' | 'QUEUED' | 'SENT' | 'FAILED';

export interface InvoiceDocument extends BaseBillingEntity {
  invoiceId: string;
  documentType: InvoiceDocumentType;
  documentNumber: string;
  version: number;
  status: InvoiceDocumentStatus;
  generatedAt: string;
  generatedBy: string;
  contentHash: string;
  storageReference: string;
  fileName: string;
  mimeType: string;
  deliveryStatus: DeliveryStatus;
  deliveryDetails?: Record<string, any>;
  metadata?: Record<string, any>;
}

export type InvoiceDeliveryStatus = 'PENDING' | 'QUEUED' | 'SENDING' | 'SENT' | 'FAILED';

export interface InvoiceDelivery extends BaseBillingEntity {
  invoiceId: string;
  invoiceDocumentId: string;
  customerId: string;
  deliveryChannel: 'EMAIL';
  destination: string;
  templateId: string;
  status: InvoiceDeliveryStatus;
  requestedBy: string;
  requestedAt: string;
  completedAt?: string;
  correlationId: string;
  idempotencyKey?: string;
}

export interface InvoiceDeliveryAttempt extends BaseBillingEntity {
  deliveryId: string;
  attemptNumber: number;
  startedAt: string;
  completedAt?: string;
  status: InvoiceDeliveryStatus;
  providerReference?: string;
  failureCode?: string;
  failureMessage?: string;
  correlationId: string;
}

export interface InvoiceDeliveryTemplate extends BaseBillingEntity {
  name: string;
  subject: string;
  body: string;
  isActive: boolean;
  version: number;
  createdBy: string;
}

export interface InvoiceDeliveryTemplateInput {
  tenantId: string | null; // null represents SYSTEM templates
  name: string;
  subject: string;
  body: string;
  isActive: boolean;
  version: number;
  createdBy: string;
}

export type ReceivableStatus = 'OPEN' | 'PARTIALLY_PAID' | 'PAID' | 'OVERPAID' | 'VOIDED';
export type PaymentMethod = 'BANK_TRANSFER' | 'CARD' | 'CASH' | 'OTHER';
export type PaymentStatus = 'RECORDED' | 'ALLOCATED' | 'PARTIALLY_ALLOCATED' | 'UNAPPLIED' | 'REVERSED';

export interface Receivable extends BaseBillingEntity {
  customerId: string;
  invoiceId: string;
  invoiceDocumentId?: string;
  invoiceNumber: string;
  currency: string;
  originalAmount: number;
  amountReceived: number;
  amountAllocated: number;
  outstandingAmount: number;
  status: ReceivableStatus;
  dueDate: string;
  openedAt: string;
  closedAt?: string;
}

export interface PaymentRecord extends BaseBillingEntity {
  customerId: string;
  currency: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  externalReference?: string;
  receivedReference?: string;
  status: PaymentStatus;
  notes?: string;
  recordedBy: string;
  recordedAt: string;
  reversedAt?: string;
  reversalReason?: string;
  correlationId: string;
  idempotencyKey?: string;
}

export interface PaymentAllocation extends BaseBillingEntity {
  paymentId: string;
  receivableId: string;
  invoiceId: string;
  allocatedAmount: number;
  allocatedAt: string;
  allocatedBy: string;
  correlationId: string;
  reversedAt?: string;
  reversalReason?: string;
  reversedBy?: string;
}
