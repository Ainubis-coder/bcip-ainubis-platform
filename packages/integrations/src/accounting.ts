import { IntegrationConnector, AccountingSyncEvent } from './types';

export class AccountingConnectorFramework implements IntegrationConnector {
  public id = 'connector-accounting-abstract';
  public name = 'General Ledger & Accounting Connector';
  public category = 'accounting' as const;
  public version = '1.0.0';
  public isEnabled = false;

  public async testConnection(): Promise<{ success: boolean; latencyMs: number }> {
    return { success: true, latencyMs: 15 };
  }

  public async syncInvoice(event: AccountingSyncEvent): Promise<{ synced: boolean; externalRef?: string }> {
    return { synced: true, externalRef: `ext_gl_${Date.now()}` };
  }
}

export const accountingConnector = new AccountingConnectorFramework();
