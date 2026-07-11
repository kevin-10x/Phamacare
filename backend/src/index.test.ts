import { describe, it, expect } from 'vitest';

describe('API Health Check', () => {
  it('app module exports correctly', async () => {
    const mod = await import('./index');
    expect(mod.default).toBeDefined();
  });
});
