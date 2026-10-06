/**
 * BCIP Commercial Operations - Receivables & Payment Tracking Service
 * Phase 3 — Prompt 003-005
 */

import { invoiceRepository } from '../repositories/invoice.repository.ts';
import { invoiceDocumentRepository } from '../repositories/invoice-document.repository.ts';
import { receivableRepository } from '../repositories/receivable.repository.ts';
import { paymentRepository } from '../repositories/payment.repository.ts';
import { paymentAllocationRepository } from '../repositories/payment-allocation.repository.ts';
import { billingAuditRepository } from '../repositories/billing-audit.repository.ts';
import type { Receivable, PaymentRecord, PaymentAllocation, ReceivableStatus, PaymentStatus, PaymentMethod } from '../types.ts';
import { InvoiceStatus } from '../enums.ts';

export class ReceivableService {
  /**
   * Safe decimal multiplication/addition wrapper to prevent floating point inaccuracies
   */
  private static toMinor(value: number): number {
    return Math.round(value * 100);
  }

  private static fromMinor(value: number): number {
    return value / 100;
  }

  /**
   * Deterministically creates a receivable from an eligible issued invoice.
   * This is idempotent.
   */
  public static async createReceivable(
    tenantId: string,
    invoiceId: string,
    actor: string,
    correlationId: string
  ): Promise<Receivable> {
    const invoice = await invoiceRepository.findById(tenantId, invoiceId);
    if (!invoice) throw new Error('Invoice not found.');

    if (invoice.status !== InvoiceStatus.ISSUED) {
      throw new Error(`Cannot open receivable. Invoice must be in ISSUED status. Current: ${invoice.status}`);
    }

    // Idempotency: Check if receivable already exists
    const existing = await receivableRepository.findByInvoiceId(tenantId, invoiceId);
    if (existing) {
      return existing;
    }

    const latestDoc = await invoiceDocumentRepository.findLatestByInvoiceId(tenantId, invoiceId);

    const receivableId = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const receivable: Receivable = {
      id: receivableId,
      tenantId,
      customerId: invoice.billingCustomerId,
      invoiceId,
      invoiceDocumentId: latestDoc?.id,
      invoiceNumber: invoice.invoiceNumber,
      currency: invoice.currency,
      originalAmount: invoice.grandTotal,
      amountReceived: 0,
      amountAllocated: 0,
      outstandingAmount: invoice.grandTotal,
      status: 'OPEN',
      dueDate: invoice.dueDate,
      openedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await receivableRepository.create(receivable);

    await billingAuditRepository.record(
      tenantId,
      actor,
      'receivable_created',
      'receivable',
      receivableId,
      correlationId,
      undefined,
      created,
      `Opened receivable record for issued invoice ${invoice.invoiceNumber}`
    );

    return created;
  }

  /**
   * Transitions a corresponding receivable to VOIDED status when an invoice is voided.
   */
  public static async voidReceivable(
    tenantId: string,
    invoiceId: string,
    actor: string,
    correlationId: string
  ): Promise<Receivable | null> {
    const receivable = await receivableRepository.findByInvoiceId(tenantId, invoiceId);
    if (!receivable) return null;

    const previousState = { ...receivable };
    const updated = await receivableRepository.update(tenantId, receivable.id, {
      status: 'VOIDED',
      outstandingAmount: 0,
    });

    await billingAuditRepository.record(
      tenantId,
      actor,
      'receivable_status_changed',
      'receivable',
      receivable.id,
      correlationId,
      previousState,
      updated,
      `Voided receivable record matching voided invoice ${receivable.invoiceNumber}`
    );

    return updated;
  }

  /**
   * Records an externally-confirmed customer payment record.
   */
  public static async recordPayment(params: {
    tenantId: string;
    customerId: string;
    currency: string;
    amount: number;
    paymentDate: string;
    paymentMethod: PaymentMethod;
    externalReference?: string;
    notes?: string;
    recordedBy: string;
    correlationId: string;
    idempotencyKey?: string;
  }): Promise<PaymentRecord> {
    const { tenantId, customerId, currency, amount, paymentDate, paymentMethod, externalReference, notes, recordedBy, correlationId, idempotencyKey } = params;

    if (amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    // Check idempotency key if provided
    if (idempotencyKey) {
      const all = await paymentRepository.findAll(tenantId);
      const match = all.find((p) => p.idempotencyKey === idempotencyKey);
      if (match) return match;
    }

    const paymentId = `pmt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const payment: PaymentRecord = {
      id: paymentId,
      tenantId,
      customerId,
      currency,
      amount,
      paymentDate,
      paymentMethod,
      externalReference,
      status: 'UNAPPLIED',
      notes,
      recordedBy,
      recordedAt: new Date().toISOString(),
      correlationId,
      idempotencyKey,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await paymentRepository.create(payment);

    await billingAuditRepository.record(
      tenantId,
      recordedBy,
      'payment_recorded',
      'payment',
      paymentId,
      correlationId,
      undefined,
      created,
      `Recorded external payment of ${amount} ${currency} from customer`
    );

    return created;
  }

  /**
   * Allocates a payment amount against an open receivable.
   */
  public static async allocatePayment(params: {
    tenantId: string;
    paymentId: string;
    receivableId: string;
    allocatedAmount: number;
    allocatedBy: string;
    correlationId: string;
  }): Promise<{ payment: PaymentRecord; receivable: Receivable; allocation: PaymentAllocation }> {
    const { tenantId, paymentId, receivableId, allocatedAmount, allocatedBy, correlationId } = params;

    if (allocatedAmount <= 0) {
      throw new Error('Allocation amount must be greater than zero.');
    }

    const payment = await paymentRepository.findById(tenantId, paymentId);
    if (!payment) throw new Error('Payment record not found.');
    if (payment.status === 'REVERSED') throw new Error('Cannot allocate a reversed payment.');

    const receivable = await receivableRepository.findById(tenantId, receivableId);
    if (!receivable) throw new Error('Receivable record not found.');
    if (receivable.status === 'VOIDED') throw new Error('Cannot allocate payment to a voided receivable.');

    if (payment.currency !== receivable.currency) {
      throw new Error(`Currency mismatch. Payment currency (${payment.currency}) must match receivable currency (${receivable.currency}).`);
    }

    // Compute remaining allocatable payment amount
    const allocations = await paymentAllocationRepository.findByPaymentId(tenantId, paymentId);
    const totalAllocatedFromPmt = allocations.reduce((sum, a) => sum + this.toMinor(a.allocatedAmount), 0);
    const pmtMinor = this.toMinor(payment.amount);
    const remainingPmtMinor = pmtMinor - totalAllocatedFromPmt;

    if (this.toMinor(allocatedAmount) > remainingPmtMinor) {
      throw new Error(`Insufficient unapplied payment balance. Remaining available: ${this.fromMinor(remainingPmtMinor)}`);
    }

    // Compute outstanding receivable amount
    const recOutstandingMinor = this.toMinor(receivable.outstandingAmount);
    if (this.toMinor(allocatedAmount) > recOutstandingMinor) {
      throw new Error(`Allocation amount exceeds outstanding receivable balance. Outstanding: ${receivable.outstandingAmount}`);
    }

    // Create the allocation record
    const allocationId = `alc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const allocation: PaymentAllocation = {
      id: allocationId,
      tenantId,
      paymentId,
      receivableId,
      invoiceId: receivable.invoiceId,
      allocatedAmount,
      allocatedAt: new Date().toISOString(),
      allocatedBy,
      correlationId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const createdAllocation = await paymentAllocationRepository.create(allocation);

    // Update Receivable balances and status
    const newAllocatedMinor = this.toMinor(receivable.amountAllocated) + this.toMinor(allocatedAmount);
    const newReceivedMinor = this.toMinor(receivable.amountReceived) + this.toMinor(allocatedAmount);
    const newOutstandingMinor = this.toMinor(receivable.originalAmount) - newAllocatedMinor;

    let recStatus: ReceivableStatus = 'OPEN';
    let closedAt: string | undefined = undefined;
    if (newOutstandingMinor === 0) {
      recStatus = 'PAID';
      closedAt = new Date().toISOString();
    } else if (newOutstandingMinor < 0) {
      recStatus = 'OVERPAID';
    } else if (newAllocatedMinor > 0) {
      recStatus = 'PARTIALLY_PAID';
    }

    const previousRec = { ...receivable };
    const updatedRec = await receivableRepository.update(tenantId, receivableId, {
      amountAllocated: this.fromMinor(newAllocatedMinor),
      amountReceived: this.fromMinor(newReceivedMinor),
      outstandingAmount: this.fromMinor(newOutstandingMinor),
      status: recStatus,
      closedAt,
    });

    // Update Payment status
    const totalAllocatedMinorAfter = totalAllocatedFromPmt + this.toMinor(allocatedAmount);
    let pmtStatus: PaymentStatus = 'RECORDED';
    if (totalAllocatedMinorAfter === pmtMinor) {
      pmtStatus = 'ALLOCATED';
    } else if (totalAllocatedMinorAfter > 0) {
      pmtStatus = 'PARTIALLY_ALLOCATED';
    }

    const previousPmt = { ...payment };
    const updatedPmt = await paymentRepository.update(tenantId, paymentId, {
      status: pmtStatus,
    });

    // Audit Log Entry
    await billingAuditRepository.record(
      tenantId,
      allocatedBy,
      'payment_allocated',
      'payment_allocation',
      allocationId,
      correlationId,
      undefined,
      createdAllocation,
      `Allocated ${allocatedAmount} ${payment.currency} from payment to receivable ${receivable.invoiceNumber}`
    );

    return { payment: updatedPmt!, receivable: updatedRec!, allocation: createdAllocation };
  }

  /**
   * Reverses a recorded payment and undoes all allocations safely.
   */
  public static async reversePayment(
    tenantId: string,
    paymentId: string,
    actor: string,
    correlationId: string,
    reason: string
  ): Promise<PaymentRecord> {
    const payment = await paymentRepository.findById(tenantId, paymentId);
    if (!payment) throw new Error('Payment record not found.');
    if (payment.status === 'REVERSED') throw new Error('Payment is already reversed.');

    const allocations = await paymentAllocationRepository.findByPaymentId(tenantId, paymentId);

    // Rollback allocations from each linked receivable
    for (const alloc of allocations) {
      const rec = await receivableRepository.findById(tenantId, alloc.receivableId);
      if (rec) {
        const prevRec = { ...rec };
        const rollAllocatedMinor = this.toMinor(rec.amountAllocated) - this.toMinor(alloc.allocatedAmount);
        const rollReceivedMinor = this.toMinor(rec.amountReceived) - this.toMinor(alloc.allocatedAmount);
        const rollOutstandingMinor = this.toMinor(rec.originalAmount) - rollAllocatedMinor;

        let recStatus: ReceivableStatus = 'OPEN';
        if (rollOutstandingMinor === this.toMinor(rec.originalAmount)) {
          recStatus = 'OPEN';
        } else if (rollAllocatedMinor > 0) {
          recStatus = 'PARTIALLY_PAID';
        }

        await receivableRepository.update(tenantId, rec.id, {
          amountAllocated: this.fromMinor(rollAllocatedMinor),
          amountReceived: this.fromMinor(rollReceivedMinor),
          outstandingAmount: this.fromMinor(rollOutstandingMinor),
          status: recStatus,
          closedAt: undefined,
        });

        // Soft delete/reverse the payment allocation record by setting reversed fields
        await paymentAllocationRepository.update(tenantId, alloc.id, {
          reversedAt: new Date().toISOString(),
          reversalReason: `Payment Reversal: ${reason}`,
          reversedBy: actor,
        });
      }
    }

    const previousPmt = { ...payment };
    const updatedPmt = await paymentRepository.update(tenantId, paymentId, {
      status: 'REVERSED',
      reversedAt: new Date().toISOString(),
      reversalReason: reason,
    });

    await billingAuditRepository.record(
      tenantId,
      actor,
      'payment_reversed',
      'payment',
      paymentId,
      correlationId,
      previousPmt,
      updatedPmt,
      `Reversed payment due to: ${reason}`
    );

    return updatedPmt!;
  }

  /**
   * Recalculates outstanding balances and status for a receivable based on active allocations.
   */
  public static async recalculateReceivable(
    tenantId: string,
    receivableId: string,
    actor: string,
    correlationId: string
  ): Promise<Receivable> {
    const receivable = await receivableRepository.findById(tenantId, receivableId);
    if (!receivable) throw new Error('Receivable not found.');

    const allocations = await paymentAllocationRepository.findByReceivableId(tenantId, receivableId);
    // filter out reversed ones
    const activeAllocations = allocations.filter(a => !a.reversedAt);

    const amountAllocatedMinor = activeAllocations.reduce((sum, a) => sum + this.toMinor(a.allocatedAmount), 0);
    const originalMinor = this.toMinor(receivable.originalAmount);
    const outstandingMinor = originalMinor - amountAllocatedMinor;

    const isOverdue = new Date(receivable.dueDate) < new Date() && outstandingMinor > 0;
    let recStatus: ReceivableStatus = 'OPEN';
    let closedAt: string | undefined = undefined;

    if (receivable.status === 'VOIDED') {
      recStatus = 'VOIDED';
    } else if (outstandingMinor <= 0) {
      recStatus = outstandingMinor < 0 ? 'OVERPAID' : 'PAID';
      closedAt = new Date().toISOString();
    } else if (amountAllocatedMinor > 0) {
      recStatus = isOverdue ? 'OVERDUE' : 'PARTIALLY_PAID';
    } else {
      recStatus = isOverdue ? 'OVERDUE' : 'OPEN';
    }

    const previousRec = { ...receivable };
    const updatedRec = await receivableRepository.update(tenantId, receivableId, {
      amountAllocated: this.fromMinor(amountAllocatedMinor),
      amountReceived: this.fromMinor(amountAllocatedMinor),
      outstandingAmount: this.fromMinor(outstandingMinor),
      status: recStatus,
      closedAt: recStatus === 'PAID' ? (receivable.closedAt || closedAt) : undefined,
    });

    await billingAuditRepository.record(
      tenantId,
      actor,
      'receivable_recalculated',
      'receivable',
      receivableId,
      correlationId,
      previousRec,
      updatedRec,
      `Recalculated balances for receivable ${receivable.invoiceNumber}`
    );

    return updatedRec!;
  }

  /**
   * Reverses a payment allocation safely, recalculating the associated receivable and payment.
   */
  public static async reverseAllocation(
    tenantId: string,
    allocationId: string,
    actor: string,
    correlationId: string,
    reason: string
  ): Promise<PaymentAllocation> {
    if (!reason || !reason.trim()) {
      throw new Error('Reversal reason is mandatory.');
    }

    const allAllocations = await paymentAllocationRepository.findAll(tenantId);
    const allocation = allAllocations.find((a) => a.id === allocationId);
    if (!allocation) throw new Error('Payment allocation not found.');
    if (allocation.reversedAt) throw new Error('Allocation is already reversed.');

    const previousAlloc = { ...allocation };
    
    // Mark the allocation as reversed
    const updatedAlloc = await paymentAllocationRepository.update(tenantId, allocationId, {
      reversedAt: new Date().toISOString(),
      reversalReason: reason,
      reversedBy: actor,
    });

    // Recalculate the associated receivable
    await this.recalculateReceivable(tenantId, allocation.receivableId, actor, correlationId);

    // Recalculate payment status
    const payment = await paymentRepository.findById(tenantId, allocation.paymentId);
    if (payment) {
      const pAllocs = await paymentAllocationRepository.findByPaymentId(tenantId, payment.id);
      const activePAllocs = pAllocs.filter(a => !a.reversedAt);
      const totalAllocatedMinor = activePAllocs.reduce((sum, a) => sum + this.toMinor(a.allocatedAmount), 0);
      const pmtMinor = this.toMinor(payment.amount);

      let pmtStatus: PaymentStatus = 'RECORDED';
      if (totalAllocatedMinor === pmtMinor) {
        pmtStatus = 'ALLOCATED';
      } else if (totalAllocatedMinor > 0) {
        pmtStatus = 'PARTIALLY_ALLOCATED';
      } else {
        pmtStatus = 'UNAPPLIED';
      }

      await paymentRepository.update(tenantId, payment.id, {
        status: pmtStatus,
      });
    }

    // Audit log entry
    await billingAuditRepository.record(
      tenantId,
      actor,
      'payment_allocation_reversed',
      'payment_allocation',
      allocationId,
      correlationId,
      previousAlloc,
      updatedAlloc,
      `Reversed payment allocation of ${allocation.allocatedAmount} against receivable`
    );

    return updatedAlloc!;
  }
}
