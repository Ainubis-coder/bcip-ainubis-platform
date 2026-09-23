import { IntegrationConnector } from './types';

export interface DispatchMessagePayload {
  recipient: string;
  channel: 'email' | 'sms' | 'whatsapp';
  subject?: string;
  body: string;
  tenantId: string;
}

export class MessagingGatewayConnector implements IntegrationConnector {
  public id = 'connector-messaging-abstract';
  public name = 'Omnichannel Notification Gateway';
  public category = 'messaging' as const;
  public version = '1.0.0';
  public isEnabled = false;

  public async testConnection(): Promise<{ success: boolean; latencyMs: number }> {
    return { success: true, latencyMs: 10 };
  }

  public async dispatchMessage(payload: DispatchMessagePayload): Promise<{ messageId: string; status: 'queued' | 'sent' }> {
    return {
      messageId: `msg_${Date.now()}`,
      status: 'queued',
    };
  }
}

export const messagingConnector = new MessagingGatewayConnector();
