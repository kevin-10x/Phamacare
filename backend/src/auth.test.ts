import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, signJwt, verifyJwt, newId } from './auth';

describe('hashPassword', () => {
  it('returns a hash and salt', async () => {
    const result = await hashPassword('testpassword');
    expect(result.hash).toBeDefined();
    expect(result.salt).toBeDefined();
    expect(typeof result.hash).toBe('string');
    expect(typeof result.salt).toBe('string');
    expect(result.hash.length).toBe(64);
  });

  it('produces different hashes for different passwords', async () => {
    const a = await hashPassword('password1');
    const b = await hashPassword('password2');
    expect(a.hash).not.toBe(b.hash);
  });

  it('produces different hashes for same password (random salt)', async () => {
    const a = await hashPassword('samepassword');
    const b = await hashPassword('samepassword');
    expect(a.hash).not.toBe(b.hash);
  });

  it('can verify with original salt', async () => {
    const { hash, salt } = await hashPassword('mypassword');
    const valid = await verifyPassword('mypassword', hash, salt);
    expect(valid).toBe(true);
  });

  it('rejects wrong password', async () => {
    const { hash, salt } = await hashPassword('correctpassword');
    const valid = await verifyPassword('wrongpassword', hash, salt);
    expect(valid).toBe(false);
  });
});

describe('signJwt / verifyJwt', () => {
  const secret = 'test-secret-key-for-jwt-signing';

  it('signs and verifies a valid token', async () => {
    const payload = { sub: 'usr_123', role: 'customer', email: 'test@test.com', exp: Math.floor(Date.now() / 1000) + 3600 };
    const token = await signJwt(payload, secret);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const decoded = await verifyJwt(token, secret);
    expect(decoded).not.toBeNull();
    expect(decoded!.sub).toBe('usr_123');
    expect(decoded!.role).toBe('customer');
    expect(decoded!.email).toBe('test@test.com');
  });

  it('rejects token signed with wrong secret', async () => {
    const payload = { sub: 'usr_123', role: 'customer', email: 'test@test.com', exp: Math.floor(Date.now() / 1000) + 3600 };
    const token = await signJwt(payload, secret);
    const decoded = await verifyJwt(token, 'wrong-secret');
    expect(decoded).toBeNull();
  });

  it('rejects expired token', async () => {
    const payload = { sub: 'usr_123', role: 'customer', email: 'test@test.com', exp: Math.floor(Date.now() / 1000) - 3600 };
    const token = await signJwt(payload, secret);
    const decoded = await verifyJwt(token, secret);
    expect(decoded).toBeNull();
  });

  it('rejects malformed token', async () => {
    const decoded = await verifyJwt('not.a.valid.token', secret);
    expect(decoded).toBeNull();
  });

  it('rejects empty token', async () => {
    const decoded = await verifyJwt('', secret);
    expect(decoded).toBeNull();
  });
});

describe('newId', () => {
  it('generates ID with prefix', () => {
    const id = newId('usr');
    expect(id.startsWith('usr_')).toBe(true);
    expect(id.length).toBeGreaterThan(4);
  });

  it('generates unique IDs', () => {
    const id1 = newId('med');
    const id2 = newId('med');
    expect(id1).not.toBe(id2);
  });

  it('supports different prefixes', () => {
    const usr = newId('usr');
    const med = newId('med');
    const ord = newId('ord');
    expect(usr.startsWith('usr_')).toBe(true);
    expect(med.startsWith('med_')).toBe(true);
    expect(ord.startsWith('ord_')).toBe(true);
  });
});
