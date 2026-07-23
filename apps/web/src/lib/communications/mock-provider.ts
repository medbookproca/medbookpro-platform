import 'server-only';

export type NotificationProvider = {
  readonly name: 'mock';
  send(input: { channel: 'email' | 'sms' | 'internal'; recipient: string }): Promise<{ provider: 'mock'; providerMessageId: string; status: 'sent' }>;
};

export const mockNotificationProvider: NotificationProvider = {
  name: 'mock',
  async send() {
    return { provider: 'mock', providerMessageId: `mock:${crypto.randomUUID()}`, status: 'sent' };
  },
};
