export type IntegrationCategory =
  | 'accounting'
  | 'payments'
  | 'messaging'
  | 'smart_meters'
  | 'access_control'
  | 'compliance';

export interface IntegrationConnector {
  id: string;
  name: string;
  category: IntegrationCategory;
  version: string;
  isEnabled: boolean;
  testConnection(): Promise<{ success: boolean; latencyMs: number }>;
}

export interface AccountingSyncEvent {
  tenantId: string;
  schemeId: string;
  invoiceId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'synced' | 'failed';
}

export interface PaymentGatewayEvent {
  transactionId: string;
  tenantId: string;
  unitId: string;
  amount: number;
  status: 'initiated' | 'completed' | 'failed';
  timestamp: string;
}
