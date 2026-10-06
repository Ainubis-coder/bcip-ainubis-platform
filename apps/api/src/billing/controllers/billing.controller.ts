/**
 * BCIP Commercial Operations & Invoicing Controller
 * Phase 3 — Prompt 003-001
 */

import type { Request, Response } from 'express';
import {
  billingCustomerRepository,
  billingProfileRepository,
  billingTaxRepository,
  invoiceRepository,
  invoiceLineRepository,
  billingAuditRepository,
  InvoiceCalculationService,
  InvoiceLifecycleService,
  InvoiceNumberingService,
  CustomerStatus,
  BillingFrequency,
  InvoiceStatus,
} from '@bcip/database';
import { ApiResponse } from '../../crm/serializers/response.serializer.ts';

export class BillingController {
  // ============================================================================
  // CUSTOMERS
  // ============================================================================
  public static async listCustomers(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    try {
      const list = await billingCustomerRepository.findAll(tenantId);
      ApiResponse.success(res, list);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to list billing customers', 500);
    }
  }

  public static async createCustomer(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const dto = req.body;
    try {
      if (!dto.legalName || !dto.billingEmail || !dto.billingAddress) {
        ApiResponse.error(res, 'VALIDATION_ERROR', 'Missing required customer fields: legalName, billingEmail, billingAddress', 422);
        return;
      }

      const customerId = billingCustomerRepository.generateCustomerId();
      const customerNumber = dto.customerNumber || `CUST-${Date.now().toString().slice(-6)}`;

      const customer = await billingCustomerRepository.create({
        id: customerId,
        tenantId,
        organisationId: dto.organisationId,
        customerNumber,
        legalName: dto.legalName,
        tradingName: dto.tradingName,
        billingEmail: dto.billingEmail,
        billingPhone: dto.billingPhone,
        billingAddress: dto.billingAddress,
        taxIdentifier: dto.taxIdentifier,
        currency: dto.currency || 'ZAR',
        status: CustomerStatus.ACTIVE,
        metadata: dto.metadata || {},
      });

      await billingAuditRepository.record(
        tenantId,
        req.user?.id || 'system',
        'customer_created',
        'customer',
        customerId,
        req.correlationId || 'corr_cust',
        undefined,
        customer
      );

      ApiResponse.success(res, customer, 201);
    } catch (err: any) {
      ApiResponse.error(res, 'VALIDATION_ERROR', err.message || 'Failed to create customer', 422);
    }
  }

  public static async getCustomerById(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    try {
      const cust = await billingCustomerRepository.findById(tenantId, id);
      if (!cust) {
        ApiResponse.error(res, 'NOT_FOUND', 'Billing customer not found.', 404);
        return;
      }
      ApiResponse.success(res, cust);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to get customer', 500);
    }
  }

  public static async updateCustomer(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const patch = req.body;
    try {
      const existing = await billingCustomerRepository.findById(tenantId, id);
      if (!existing) {
        ApiResponse.error(res, 'NOT_FOUND', 'Billing customer not found.', 404);
        return;
      }

      const updated = await billingCustomerRepository.update(tenantId, id, patch);

      await billingAuditRepository.record(
        tenantId,
        req.user?.id || 'system',
        'customer_updated',
        'customer',
        id,
        req.correlationId || 'corr_cust',
        existing,
        updated
      );

      ApiResponse.success(res, updated);
    } catch (err: any) {
      ApiResponse.error(res, 'VALIDATION_ERROR', err.message || 'Failed to update customer', 422);
    }
  }

  public static async deleteCustomer(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    try {
      const success = await billingCustomerRepository.delete(tenantId, id);
      if (!success) {
        ApiResponse.error(res, 'NOT_FOUND', 'Billing customer not found.', 404);
        return;
      }
      ApiResponse.success(res, { deleted: true });
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to delete customer', 500);
    }
  }

  // ============================================================================
  // BILLING PROFILES
  // ============================================================================
  public static async listProfiles(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    try {
      const list = await billingProfileRepository.findAll(tenantId);
      ApiResponse.success(res, list);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to list billing profiles', 500);
    }
  }

  public static async createProfile(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const dto = req.body;
    try {
      if (!dto.billingCustomerId) {
        ApiResponse.error(res, 'VALIDATION_ERROR', 'Missing billingCustomerId for profile', 422);
        return;
      }

      const profileId = billingProfileRepository.generateProfileId();
      const profile = await billingProfileRepository.create({
        id: profileId,
        tenantId,
        billingCustomerId: dto.billingCustomerId,
        billingFrequency: dto.billingFrequency || BillingFrequency.MONTHLY,
        defaultCurrency: dto.defaultCurrency || 'ZAR',
        defaultPaymentTerms: dto.defaultPaymentTerms || 'NET_30',
        defaultTaxConfigurationId: dto.defaultTaxConfigurationId,
        invoicePrefix: dto.invoicePrefix || 'INV',
        nextInvoiceNumber: dto.nextInvoiceNumber || 1,
        status: CustomerStatus.ACTIVE,
      });

      ApiResponse.success(res, profile, 201);
    } catch (err: any) {
      ApiResponse.error(res, 'VALIDATION_ERROR', err.message || 'Failed to create profile', 422);
    }
  }

  public static async getProfileById(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    try {
      const prof = await billingProfileRepository.findById(tenantId, id);
      if (!prof) {
        ApiResponse.error(res, 'NOT_FOUND', 'Billing profile not found.', 404);
        return;
      }
      ApiResponse.success(res, prof);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to get profile', 500);
    }
  }

  public static async updateProfile(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const patch = req.body;
    try {
      const updated = await billingProfileRepository.update(tenantId, id, patch);
      if (!updated) {
        ApiResponse.error(res, 'NOT_FOUND', 'Billing profile not found.', 404);
        return;
      }
      ApiResponse.success(res, updated);
    } catch (err: any) {
      ApiResponse.error(res, 'VALIDATION_ERROR', err.message || 'Failed to update profile', 422);
    }
  }

  // ============================================================================
  // INVOICES
  // ============================================================================
  public static async listInvoices(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    try {
      const list = await invoiceRepository.findAll(tenantId);
      ApiResponse.success(res, list);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to list invoices', 500);
    }
  }

  public static async createInvoice(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const dto = req.body;
    try {
      if (!dto.billingCustomerId || !dto.issueDate || !dto.dueDate) {
        ApiResponse.error(res, 'VALIDATION_ERROR', 'Missing required invoice fields: billingCustomerId, issueDate, dueDate', 422);
        return;
      }

      const customer = await billingCustomerRepository.findById(tenantId, dto.billingCustomerId);
      if (!customer) {
        ApiResponse.error(res, 'NOT_FOUND', 'Billing customer not found.', 404);
        return;
      }

      const invoiceId = invoiceRepository.generateInvoiceId();
      const invoiceNumber = await InvoiceNumberingService.generateNextInvoiceNumber(tenantId, dto.billingProfileId);

      // Create initial invoice with zero totals
      const invoice = await invoiceRepository.create({
        id: invoiceId,
        tenantId,
        billingCustomerId: dto.billingCustomerId,
        billingProfileId: dto.billingProfileId,
        invoiceNumber,
        status: InvoiceStatus.DRAFT,
        issueDate: dto.issueDate,
        dueDate: dto.dueDate,
        currency: dto.currency || customer.currency || 'ZAR',
        subtotal: 0,
        taxTotal: 0,
        discountTotal: 0,
        grandTotal: 0,
        notes: dto.notes,
        internalNotes: dto.internalNotes,
        createdBy: req.user?.email || 'system',
        crmOpportunityId: dto.crmOpportunityId,
        crmContractId: dto.crmContractId,
      });

      await billingAuditRepository.record(
        tenantId,
        req.user?.id || 'system',
        'invoice_created',
        'invoice',
        invoiceId,
        req.correlationId || 'corr_inv',
        undefined,
        invoice
      );

      ApiResponse.success(res, invoice, 201);
    } catch (err: any) {
      ApiResponse.error(res, 'VALIDATION_ERROR', err.message || 'Failed to create invoice', 422);
    }
  }

  public static async getInvoiceById(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    try {
      const inv = await invoiceRepository.findById(tenantId, id);
      if (!inv) {
        ApiResponse.error(res, 'NOT_FOUND', 'Invoice not found.', 404);
        return;
      }
      const lines = await invoiceLineRepository.findByInvoiceId(tenantId, id);
      ApiResponse.success(res, { ...inv, lines });
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to get invoice', 500);
    }
  }

  public static async updateInvoice(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const patch = req.body;
    try {
      const existing = await invoiceRepository.findById(tenantId, id);
      if (!existing) {
        ApiResponse.error(res, 'NOT_FOUND', 'Invoice not found.', 404);
        return;
      }

      // Check immutability
      InvoiceLifecycleService.assertCanEditInvoice(existing);

      const updated = await invoiceRepository.update(tenantId, id, patch);
      ApiResponse.success(res, updated);
    } catch (err: any) {
      ApiResponse.error(res, 'VALIDATION_ERROR', err.message || 'Failed to update invoice', 422);
    }
  }

  // ============================================================================
  // INVOICE LIFECYCLE ACTIONS
  // ============================================================================
  public static async submitReview(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    try {
      const updated = await InvoiceLifecycleService.submitForReview(
        tenantId,
        id,
        req.user?.id || 'system',
        req.correlationId || 'corr_rev'
      );
      ApiResponse.success(res, updated);
    } catch (err: any) {
      ApiResponse.error(res, 'VALIDATION_ERROR', err.message || 'Failed to submit invoice for review', 422);
    }
  }

  public static async approveInvoice(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const { reason } = req.body;
    try {
      const updated = await InvoiceLifecycleService.approveInvoice(
        tenantId,
        id,
        req.user?.id || 'system',
        req.correlationId || 'corr_appr',
        reason
      );
      ApiResponse.success(res, updated);
    } catch (err: any) {
      ApiResponse.error(res, 'VALIDATION_ERROR', err.message || 'Failed to approve invoice', 422);
    }
  }

  public static async issueInvoice(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    try {
      const updated = await InvoiceLifecycleService.issueInvoice(
        tenantId,
        id,
        req.user?.id || 'system',
        req.user?.email || 'admin@bcip.com',
        req.correlationId || 'corr_issue'
      );
      ApiResponse.success(res, updated);
    } catch (err: any) {
      ApiResponse.error(res, 'VALIDATION_ERROR', err.message || 'Failed to issue invoice', 422);
    }
  }

  public static async voidInvoice(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const { reason } = req.body;
    try {
      const updated = await InvoiceLifecycleService.voidInvoice(
        tenantId,
        id,
        req.user?.id || 'system',
        req.correlationId || 'corr_void',
        reason
      );
      ApiResponse.success(res, updated);
    } catch (err: any) {
      ApiResponse.error(res, 'VALIDATION_ERROR', err.message || 'Failed to void invoice', 422);
    }
  }

  // ============================================================================
  // INVOICE LINES & RECALCULATION
  // ============================================================================
  public static async listInvoiceLines(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    try {
      const lines = await invoiceLineRepository.findByInvoiceId(tenantId, id);
      ApiResponse.success(res, lines);
    } catch (err: any) {
      ApiResponse.error(res, 'INTERNAL_ERROR', err.message || 'Failed to list invoice lines', 500);
    }
  }

  public static async addInvoiceLine(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const dto = req.body;
    try {
      const inv = await invoiceRepository.findById(tenantId, id);
      if (!inv) {
        ApiResponse.error(res, 'NOT_FOUND', 'Invoice not found.', 404);
        return;
      }
      InvoiceLifecycleService.assertCanEditInvoice(inv);

      const existingLines = await invoiceLineRepository.findByInvoiceId(tenantId, id);
      const newLineData = {
        id: invoiceLineRepository.generateLineId(),
        tenantId,
        invoiceId: id,
        description: dto.description || 'Professional Services',
        quantity: Number(dto.quantity || 1),
        unitPrice: Number(dto.unitPrice || 0),
        discountAmount: Number(dto.discountAmount || 0),
        taxRate: Number(dto.taxRate !== undefined ? dto.taxRate : 15),
        sortOrder: existingLines.length + 1,
        metadata: dto.metadata || {},
      };

      const allLines = [...existingLines, newLineData];
      const calculation = InvoiceCalculationService.calculateInvoiceTotals(allLines);

      // Save all lines with calculated values
      for (const calcLine of calculation.lines) {
        const found = existingLines.find((l) => l.id === calcLine.id);
        if (found) {
          await invoiceLineRepository.update(tenantId, found.id, calcLine);
        } else {
          await invoiceLineRepository.create(calcLine);
        }
      }

      // Update invoice totals
      const updatedInvoice = await invoiceRepository.update(tenantId, id, {
        subtotal: calculation.subtotal,
        taxTotal: calculation.taxTotal,
        discountTotal: calculation.discountTotal,
        grandTotal: calculation.grandTotal,
      });

      ApiResponse.success(res, { invoice: updatedInvoice, lines: calculation.lines }, 201);
    } catch (err: any) {
      ApiResponse.error(res, 'VALIDATION_ERROR', err.message || 'Failed to add invoice line', 422);
    }
  }

  public static async updateInvoiceLine(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id, lineId } = req.params;
    const patch = req.body;
    try {
      const inv = await invoiceRepository.findById(tenantId, id);
      if (!inv) {
        ApiResponse.error(res, 'NOT_FOUND', 'Invoice not found.', 404);
        return;
      }
      InvoiceLifecycleService.assertCanEditInvoice(inv);

      const line = await invoiceLineRepository.findById(tenantId, lineId);
      if (!line || line.invoiceId !== id) {
        ApiResponse.error(res, 'NOT_FOUND', 'Invoice line not found.', 404);
        return;
      }

      await invoiceLineRepository.update(tenantId, lineId, patch);

      // Recalculate all lines
      const allLines = await invoiceLineRepository.findByInvoiceId(tenantId, id);
      const calculation = InvoiceCalculationService.calculateInvoiceTotals(allLines);

      for (const calcLine of calculation.lines) {
        await invoiceLineRepository.update(tenantId, calcLine.id, calcLine);
      }

      const updatedInvoice = await invoiceRepository.update(tenantId, id, {
        subtotal: calculation.subtotal,
        taxTotal: calculation.taxTotal,
        discountTotal: calculation.discountTotal,
        grandTotal: calculation.grandTotal,
      });

      ApiResponse.success(res, { invoice: updatedInvoice, lines: calculation.lines });
    } catch (err: any) {
      ApiResponse.error(res, 'VALIDATION_ERROR', err.message || 'Failed to update invoice line', 422);
    }
  }

  public static async deleteInvoiceLine(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!;
    const { id, lineId } = req.params;
    try {
      const inv = await invoiceRepository.findById(tenantId, id);
      if (!inv) {
        ApiResponse.error(res, 'NOT_FOUND', 'Invoice not found.', 404);
        return;
      }
      InvoiceLifecycleService.assertCanEditInvoice(inv);

      await invoiceLineRepository.delete(tenantId, lineId, false);

      const allLines = await invoiceLineRepository.findByInvoiceId(tenantId, id);
      const calculation = InvoiceCalculationService.calculateInvoiceTotals(allLines);

      const updatedInvoice = await invoiceRepository.update(tenantId, id, {
        subtotal: calculation.subtotal,
        taxTotal: calculation.taxTotal,
        discountTotal: calculation.discountTotal,
        grandTotal: calculation.grandTotal,
      });

      ApiResponse.success(res, { invoice: updatedInvoice, lines: calculation.lines });
    } catch (err: any) {
      ApiResponse.error(res, 'VALIDATION_ERROR', err.message || 'Failed to delete invoice line', 422);
    }
  }
}
