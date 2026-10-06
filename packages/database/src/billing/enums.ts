/**
 * BCIP Commercial Operations & Invoicing Enums
 * Phase 3 — Prompt 003-001
 */

export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum BillingFrequency {
  ONE_TIME = 'ONE_TIME',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUAL = 'ANNUAL',
  CUSTOM = 'CUSTOM',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  REVIEW_REQUIRED = 'REVIEW_REQUIRED',
  APPROVED = 'APPROVED',
  ISSUED = 'ISSUED',
  VOIDED = 'VOIDED',
  CANCELLED = 'CANCELLED',
}
