/**
 * BCIP Invoice Numbering Service
 * Phase 3 — Prompt 003-001
 */

import { invoiceRepository } from '../repositories/invoice.repository.ts';
import { billingProfileRepository } from '../repositories/billing-profile.repository.ts';

export class InvoiceNumberingService {
  /**
   * Generates the next unique, collision-safe invoice number for a tenant.
   */
  public static async generateNextInvoiceNumber(tenantId: string, profileId?: string): Promise<string> {
    let prefix = 'INV';
    let nextNum = 1;

    if (profileId) {
      const profile = await billingProfileRepository.findById(tenantId, profileId);
      if (profile) {
        prefix = profile.invoicePrefix || 'INV';
        nextNum = profile.nextInvoiceNumber || 1;
      }
    }

    // Ensure uniqueness by verifying against existing records
    let candidateNumber = `${prefix}-${String(nextNum).padStart(6, '0')}`;
    let existing = await invoiceRepository.findByInvoiceNumber(tenantId, candidateNumber);

    while (existing) {
      nextNum++;
      candidateNumber = `${prefix}-${String(nextNum).padStart(6, '0')}`;
      existing = await invoiceRepository.findByInvoiceNumber(tenantId, candidateNumber);
    }

    // Update profile next invoice number if profile exists
    if (profileId) {
      const profile = await billingProfileRepository.findById(tenantId, profileId);
      if (profile) {
        await billingProfileRepository.update(tenantId, profileId, {
          nextInvoiceNumber: nextNum + 1,
        });
      }
    }

    return candidateNumber;
  }
}
