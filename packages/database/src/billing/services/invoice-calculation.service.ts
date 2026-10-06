/**
 * BCIP Deterministic Invoice Calculation Service
 * Phase 3 — Prompt 003-001
 */

import type { InvoiceLine } from '../types.ts';

export interface CalculationResult {
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  lines: InvoiceLine[];
}

export class InvoiceCalculationService {
  /**
   * Rounds monetary amounts to 2 decimal places deterministically.
   */
  public static roundCurrency(amount: number): number {
    return Math.round((amount + Number.EPSILON) * 100) / 100;
  }

  /**
   * Calculates totals for a set of line items and returns updated lines with calculated fields.
   */
  public static calculateInvoiceTotals(
    lines: Array<Omit<InvoiceLine, 'lineSubtotal' | 'lineTotal' | 'taxAmount' | 'createdAt' | 'updatedAt'> & { createdAt?: string; updatedAt?: string }>,
    globalTaxRate: number = 0
  ): CalculationResult {
    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;
    let grandTotal = 0;

    const processedLines: InvoiceLine[] = lines.map((line, index) => {
      // 1. Validation
      if (line.quantity <= 0) {
        throw new Error(`Invalid line quantity: ${line.quantity}. Quantity must be greater than 0.`);
      }
      if (line.unitPrice < 0) {
        throw new Error(`Invalid unit price: ${line.unitPrice}. Negative unit prices are prohibited.`);
      }
      if (line.discountAmount < 0) {
        throw new Error(`Invalid discount amount: ${line.discountAmount}.`);
      }

      const grossLine = line.quantity * line.unitPrice;
      const discount = this.roundCurrency(line.discountAmount);
      const lineSub = this.roundCurrency(grossLine - discount);

      if (lineSub < 0) {
        throw new Error(`Line discount exceeds gross line value for item: "${line.description}".`);
      }

      const taxRate = line.taxRate !== undefined && line.taxRate >= 0 ? line.taxRate : globalTaxRate;
      if (taxRate < 0 || taxRate > 100) {
        throw new Error(`Invalid tax rate: ${taxRate}. Must be between 0 and 100.`);
      }

      const taxAmount = this.roundCurrency(lineSub * (taxRate / 100));
      const lineTotal = this.roundCurrency(lineSub + taxAmount);

      subtotal = this.roundCurrency(subtotal + lineSub);
      taxTotal = this.roundCurrency(taxTotal + taxAmount);
      discountTotal = this.roundCurrency(discountTotal + discount);
      grandTotal = this.roundCurrency(grandTotal + lineTotal);

      return {
        ...line,
        sortOrder: line.sortOrder !== undefined ? line.sortOrder : index + 1,
        discountAmount: discount,
        taxRate,
        taxAmount,
        lineSubtotal: lineSub,
        lineTotal,
      } as InvoiceLine;
    });

    return {
      subtotal,
      taxTotal,
      discountTotal,
      grandTotal,
      lines: processedLines,
    };
  }
}
