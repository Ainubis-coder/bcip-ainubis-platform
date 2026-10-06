/**
 * BCIP Commercial Operations & Invoicing Router
 * Phase 3 — Prompt 003-001
 */

import express from 'express';
import { SYSTEM_PERMISSIONS } from '@bcip/auth';
import { BillingController } from '../controllers/billing.controller.ts';
import { InvoiceDocumentsController } from '../controllers/invoice-documents.controller.ts';
import { InvoiceDeliveriesController } from '../controllers/invoice-deliveries.controller.ts';
import { ReceivablesController, PaymentsController, PaymentAllocationsController } from '../controllers/receivables.controller.ts';
import { ArAgingController } from '../controllers/ar-aging.controller.ts';
import { authMiddleware } from '../../crm/middleware/auth.middleware.ts';

import { requirePermission } from '../../crm/middleware/rbac.middleware.ts';

export const billingRouter = express.Router();

billingRouter.use(authMiddleware);

// ============================================================================
// CUSTOMERS
// ============================================================================
billingRouter.get(
  '/customers',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_CUSTOMER_VIEW),
  BillingController.listCustomers
);

billingRouter.post(
  '/customers',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_CUSTOMER_CREATE),
  BillingController.createCustomer
);

billingRouter.get(
  '/customers/:id',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_CUSTOMER_VIEW),
  BillingController.getCustomerById
);

billingRouter.put(
  '/customers/:id',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_CUSTOMER_EDIT),
  BillingController.updateCustomer
);

billingRouter.delete(
  '/customers/:id',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_CUSTOMER_ADMIN),
  BillingController.deleteCustomer
);

// ============================================================================
// BILLING PROFILES
// ============================================================================
billingRouter.get(
  '/profiles',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_PROFILE_VIEW),
  BillingController.listProfiles
);

billingRouter.post(
  '/profiles',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_PROFILE_CREATE),
  BillingController.createProfile
);

billingRouter.get(
  '/profiles/:id',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_PROFILE_VIEW),
  BillingController.getProfileById
);

billingRouter.put(
  '/profiles/:id',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_PROFILE_EDIT),
  BillingController.updateProfile
);

// ============================================================================
// INVOICES & LIFECYCLE
// ============================================================================
billingRouter.get(
  '/invoices',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_INVOICE_VIEW),
  BillingController.listInvoices
);

billingRouter.post(
  '/invoices',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_INVOICE_CREATE),
  BillingController.createInvoice
);

billingRouter.get(
  '/invoices/:id',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_INVOICE_VIEW),
  BillingController.getInvoiceById
);

billingRouter.put(
  '/invoices/:id',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_INVOICE_EDIT),
  BillingController.updateInvoice
);

billingRouter.post(
  '/invoices/:id/submit-review',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_INVOICE_SUBMIT),
  BillingController.submitReview
);

billingRouter.post(
  '/invoices/:id/approve',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_INVOICE_APPROVE),
  BillingController.approveInvoice
);

billingRouter.post(
  '/invoices/:id/issue',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_INVOICE_ISSUE),
  BillingController.issueInvoice
);

billingRouter.post(
  '/invoices/:id/void',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_INVOICE_VOID),
  BillingController.voidInvoice
);

// ============================================================================
// INVOICE LINES
// ============================================================================
billingRouter.get(
  '/invoices/:id/lines',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_INVOICE_VIEW),
  BillingController.listInvoiceLines
);

billingRouter.post(
  '/invoices/:id/lines',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_INVOICE_EDIT),
  BillingController.addInvoiceLine
);

billingRouter.put(
  '/invoices/:id/lines/:lineId',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_INVOICE_EDIT),
  BillingController.updateInvoiceLine
);

billingRouter.delete(
  '/invoices/:id/lines/:lineId',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_INVOICE_EDIT),
  BillingController.deleteInvoiceLine
);

// ============================================================================
// INVOICE DOCUMENTS & DELIVERY
// ============================================================================
billingRouter.post(
  '/invoices/:invoiceId/documents',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_INVOICE_DOCUMENT_GENERATE),
  InvoiceDocumentsController.generateDocument
);

billingRouter.get(
  '/invoices/:invoiceId/documents',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_INVOICE_DOCUMENT_VIEW),
  InvoiceDocumentsController.listDocumentsForInvoice
);

billingRouter.get(
  '/invoice-documents/:documentId',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_INVOICE_DOCUMENT_VIEW),
  InvoiceDocumentsController.getDocumentById
);

// ============================================================================
// INVOICE DELIVERY & COMMUNICATIONS
// ============================================================================
billingRouter.get(
  '/delivery-templates',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_INVOICE_DELIVERY_VIEW),
  InvoiceDeliveriesController.listTemplates
);

billingRouter.post(
  '/invoices/:invoiceId/deliveries',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_INVOICE_DELIVERY_SEND),
  InvoiceDeliveriesController.initiateDelivery
);

billingRouter.get(
  '/invoices/:invoiceId/deliveries',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_INVOICE_DELIVERY_VIEW),
  InvoiceDeliveriesController.listDeliveriesForInvoice
);

billingRouter.post(
  '/invoice-deliveries/:deliveryId/retry',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_INVOICE_DELIVERY_RETRY),
  InvoiceDeliveriesController.retryDelivery
);

billingRouter.get(
  '/invoice-deliveries/:deliveryId/attempts',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_INVOICE_DELIVERY_VIEW),
  InvoiceDeliveriesController.listAttempts
);

// ============================================================================
// AR AGING & OVERDUE INTELLIGENCE (PHASE 3 — PROMPT 003-006)
// ============================================================================
billingRouter.get(
  '/receivables/aging',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_RECEIVABLE_VIEW),
  ArAgingController.getAging
);

billingRouter.get(
  '/receivables/overdue',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_RECEIVABLE_VIEW),
  ArAgingController.getOverdue
);

billingRouter.get(
  '/receivables/summary',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_RECEIVABLE_VIEW),
  ArAgingController.getSummary
);

billingRouter.get(
  '/receivables/collection-priority',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_RECEIVABLE_VIEW),
  ArAgingController.getCollectionPriority
);

// ============================================================================
// CUSTOMER STATEMENTS & BALANCES (PHASE 3 — PROMPT 003-006)
// ============================================================================
billingRouter.get(
  '/customers/:customerId/balance',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_CUSTOMER_VIEW),
  ArAgingController.getCustomerBalance
);

billingRouter.get(
  '/customers/:id/statement',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_CUSTOMER_VIEW),
  ArAgingController.getCustomerStatement
);


billingRouter.get(
  '/statements/:customerId',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_CUSTOMER_VIEW),
  ArAgingController.getCustomerStatement
);

// ============================================================================
// COMMERCIAL LEDGER RECONCILIATION (PHASE 3 — PROMPT 003-006)
// ============================================================================
billingRouter.get(
  '/reconciliation',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_RECEIVABLE_VIEW),
  ArAgingController.getReconciliation
);

// ============================================================================
// RECEIVABLES
// ============================================================================
billingRouter.get(
  '/receivables',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_RECEIVABLE_VIEW),
  ReceivablesController.listReceivables
);


billingRouter.get(
  '/receivables/:id',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_RECEIVABLE_VIEW),
  ReceivablesController.getReceivableById
);

billingRouter.post(
  '/receivables/:id/recalculate',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_RECEIVABLE_MANAGE),
  ReceivablesController.recalculate
);

// ============================================================================
// PAYMENTS
// ============================================================================
billingRouter.get(
  '/payments',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_PAYMENT_VIEW),
  PaymentsController.listPayments
);

billingRouter.get(
  '/payments/:id',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_PAYMENT_VIEW),
  PaymentsController.getPaymentById
);

billingRouter.post(
  '/payments',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_PAYMENT_CREATE),
  PaymentsController.recordPayment
);

billingRouter.post(
  '/payments/:id/reverse',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_PAYMENT_REVERSE),
  PaymentsController.reversePayment
);

// ============================================================================
// PAYMENT ALLOCATIONS
// ============================================================================
billingRouter.get(
  '/payment-allocations',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_PAYMENT_ALLOCATION_VIEW),
  PaymentAllocationsController.listAllocations
);

billingRouter.post(
  '/payment-allocations',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_PAYMENT_ALLOCATION_CREATE),
  PaymentAllocationsController.allocate
);

billingRouter.post(
  '/payment-allocations/:id/reverse',
  requirePermission(SYSTEM_PERMISSIONS.BILLING_PAYMENT_ALLOCATION_REVERSE),
  PaymentAllocationsController.reverseAllocation
);

