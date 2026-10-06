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

export type ReceivableStatus = 'OPEN' | 'PARTIALLY_PAID' | 'PAID' | 'OVERPAID' | 'VOIDED' | 'OVERDUE';
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

// ============================================================================
// PHASE 3 — PROMPT 003-006: AR AGING, STATEMENTS & RECONCILIATION TYPES
// ============================================================================

export type AgingBucketName = 'CURRENT' | 'DAYS_1_30' | 'DAYS_31_60' | 'DAYS_61_90' | 'DAYS_91_120' | 'DAYS_121_PLUS';

export interface ReceivableAgingDetail {
  receivableId: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  currency: string;
  originalAmount: number;
  amountReceived: number;
  amountAllocated: number;
  outstandingAmount: number;
  dueDate: string;
  asOfDate: string;
  daysOutstanding: number;
  agingBucket: AgingBucketName;
  isOverdue: boolean;
  status: ReceivableStatus;
}

export interface CustomerArBalance {
  customerId: string;
  customerName: string;
  currency: string;
  totalReceivable: number;
  totalPaid: number;
  totalOutstanding: number;
  current: number;
  days1To30: number;
  days31To60: number;
  days61To90: number;
  days91To120: number;
  days121Plus: number;
  overdueAmount: number;
  receivablesCount: number;
  overdueCount: number;
}

export interface AgingPortfolioSummary {
  asOfDate: string;
  currency: string;
  totalReceivable: number;
  totalPaid: number;
  totalOutstanding: number;
  current: number;
  days1To30: number;
  days31To60: number;
  days61To90: number;
  days91To120: number;
  days121Plus: number;
  overdueAmount: number;
  totalReceivablesCount: number;
  overdueCount: number;
  customerBalances: CustomerArBalance[];
  receivables: ReceivableAgingDetail[];
}

export interface CustomerStatementLineItem {
  id: string;
  date: string;
  type: 'INVOICE' | 'PAYMENT' | 'ALLOCATION' | 'REVERSAL';
  sourceType: 'INVOICE' | 'PAYMENT' | 'ALLOCATION' | 'REVERSAL';
  sourceId: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface CustomerStatement {
  statementNumber: string;
  customerId: string;
  customer: {
    id: string;
    legalName: string;
    billingEmail: string;
    billingAddress: string;
    currency: string;
    taxNumber?: string;
  };
  statementDate: string;
  asOfDate: string;
  startDate?: string;
  endDate?: string;
  fromDate?: string;
  toDate?: string;
  currency: string;
  openingBalance: number;
  totalInvoiced: number;
  totalPayments: number;
  periodDebits: number;
  periodCredits: number;
  totalAllocated: number;
  closingBalance: number;
  overdueAmount: number;
  agingBreakdown: {
    current: number;
    days1To30: number;
    days31To60: number;
    days61To90: number;
    days91To120: number;
    days121Plus: number;
  };
  lineItems: CustomerStatementLineItem[];
  generatedAt: string;
}


export interface CollectionPriorityItem {
  customerId: string;
  customerName: string;
  currency: string;
  totalOutstanding: number;
  overdueAmount: number;
  oldestDueDate: string;
  maxDaysOverdue: number;
  dominantBucket: AgingBucketName;
  overdueInvoicesCount: number;
  priorityScore: number;
  priorityLevel: 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedAction: string;
  reasons: string[];
  lastPaymentDate?: string;
  receivables: ReceivableAgingDetail[];
}

export interface LedgerReconciliationDiscrepancy {
  type: string;
  description: string;
  expected: number;
  actual: number;
  entityId?: string;
}

export interface CurrencyReconciliation {
  currency: string;
  totalInvoiced: number;
  totalReceivables: number;
  totalPayments: number;
  totalAllocated: number;
  totalOutstanding: number;
  isReconciled: boolean;
}

export interface LedgerReconciliationReport {
  asOfDate: string;
  isReconciled: boolean;
  totalInvoicedAmount: number;
  totalReceivablesOpened: number;
  invoicingReceivablesDifference: number;
  totalPaymentsRecorded: number;
  totalAllocationsApplied: number;
  totalUnappliedPayments: number;
  totalReceivablesOutstanding: number;
  expectedOutstanding: number;
  receivablesReconciliationDifference: number;
  customerBalancesSum: number;
  customerReceivablesDifference: number;
  discrepancies: LedgerReconciliationDiscrepancy[];
  byCurrency: Record<string, CurrencyReconciliation>;
  generatedAt: string;
}

