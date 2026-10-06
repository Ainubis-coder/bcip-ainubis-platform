/**
 * BCIP Commercial Operations & Invoicing Enums
 * Phase 3 — Prompt 003-001
 */

export const CustomerStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ARCHIVED: 'ARCHIVED',
} as const;
export type CustomerStatus = (typeof CustomerStatus)[keyof typeof CustomerStatus];

export const BillingFrequency = {
  ONE_TIME: 'ONE_TIME',
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  ANNUAL: 'ANNUAL',
  CUSTOM: 'CUSTOM',
} as const;
export type BillingFrequency = (typeof BillingFrequency)[keyof typeof BillingFrequency];

export const InvoiceStatus = {
  DRAFT: 'DRAFT',
  REVIEW_REQUIRED: 'REVIEW_REQUIRED',
  APPROVED: 'APPROVED',
  ISSUED: 'ISSUED',
  VOIDED: 'VOIDED',
  CANCELLED: 'CANCELLED',
} as const;
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

export const AgingBucket = {
  CURRENT: 'CURRENT',
  DAYS_1_30: 'DAYS_1_30',
  DAYS_31_60: 'DAYS_31_60',
  DAYS_61_90: 'DAYS_61_90',
  DAYS_91_120: 'DAYS_91_120',
  DAYS_121_PLUS: 'DAYS_121_PLUS',
} as const;
export type AgingBucket = (typeof AgingBucket)[keyof typeof AgingBucket];

export const CollectionPriorityLevel = {
  NORMAL: 'NORMAL',
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;
export type CollectionPriorityLevel = (typeof CollectionPriorityLevel)[keyof typeof CollectionPriorityLevel];

export const CollectionRecommendedAction = {
  NO_ACTION_REQUIRED: 'NO_ACTION_REQUIRED',
  SEND_COURTESY_REMINDER: 'SEND_COURTESY_REMINDER',
  FIRST_OVERDUE_NOTICE: 'FIRST_OVERDUE_NOTICE',
  FORMAL_DEMAND_NOTICE: 'FORMAL_DEMAND_NOTICE',
  URGENT_DIRECT_CONTACT: 'URGENT_DIRECT_CONTACT',
  ESCALATE_TO_COLLECTIONS: 'ESCALATE_TO_COLLECTIONS',
  OFFER_PAYMENT_PLAN: 'OFFER_PAYMENT_PLAN',
} as const;
export type CollectionRecommendedAction = (typeof CollectionRecommendedAction)[keyof typeof CollectionRecommendedAction];

