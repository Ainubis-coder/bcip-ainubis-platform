import { IntegrationConnector, PaymentGatewayEvent } from './types';

export class PaymentGatewayConnector implements IntegrationConnector {
  public id = 'connector-payments-abstract';
  public name = 'Payment Gateway & Debit Order Provider';
  public category = 'payments' as const;
  public version = '1.0.0';
  public isEnabled = false;

  public async testConnection(): Promise<{ success: boolean; latencyMs: number }> {
    return { success: true, latencyMs: 25 };
  }

  public async verifyPayment(reference: string): Promise<PaymentGatewayEvent> {
    return {
      transactionId: reference,
      tenantId: 'tenant-demo',
      unitId: 'unit-101',
      amount: 2450.0,
      status: 'completed',
      timestamp: new Date().toISOString(),
    };
  }
}

export const paymentConnector = new PaymentGatewayConnector();
