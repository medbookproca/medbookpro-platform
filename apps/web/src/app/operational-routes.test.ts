import { describe, expect, it, afterEach } from 'vitest';
import { GET as health } from './health/route';
import { GET as ready } from './ready/route';
import { GET as diagnostics } from './diagnostics/route';
import { GET as version } from './version/route';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('operational routes', () => {
  it('returns safe health and release responses', async () => {
    const healthResponse = health();
    const healthBody = await healthResponse.json();
    const versionBody = await version().json();
    expect(healthResponse.status).toBe(200);
    expect(healthBody).toMatchObject({
      service: 'medbookpro-web',
      status: 'ok',
    });
    expect(versionBody).toHaveProperty('version');
    expect(versionBody).not.toHaveProperty('SUPABASE_SERVICE_ROLE_KEY');
  });

  it('reports readiness only when public Supabase configuration is valid', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    expect((await ready()).status).toBe(503);
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'local-test-key';
    expect((await ready()).status).toBe(200);
  });

  it('returns correlation-safe diagnostics without secrets', async () => {
    const response = diagnostics(
      new Request('http://localhost/diagnostics', {
        headers: { 'x-request-id': 'release-test' },
      }),
    );
    const body = await response.json();
    expect(body).toMatchObject({
      service: 'medbookpro-web',
      requestId: 'release-test',
    });
    expect(JSON.stringify(body)).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
  });
});
