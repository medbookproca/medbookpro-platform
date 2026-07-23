import 'server-only';

export type PaymentProvider = { readonly name: 'mock'; authorize(input: { amount: number; currency: 'CAD' | 'USD' }): Promise<{ provider: 'mock'; reference: string; status: 'authorized' }> };
export const mockPaymentProvider: PaymentProvider = { name: 'mock', async authorize() { return { provider: 'mock', reference: `mock:${crypto.randomUUID()}`, status: 'authorized' }; } };
