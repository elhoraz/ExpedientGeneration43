import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function createRateLimiter() {
  const map = new Map();
  return function rateLimit(key, limit = 3, windowMs = 1000) {
    const now = Date.now();
    const entry = map.get(key);

    if (!entry || now > entry.resetTime) {
      map.set(key, { count: 1, resetTime: now + windowMs });
      return { success: true, remaining: limit - 1, resetIn: windowMs };
    }

    if (entry.count >= limit) {
      return { success: false, remaining: 0, resetIn: entry.resetTime - now };
    }

    entry.count++;
    return { success: true, remaining: limit - entry.count, resetIn: entry.resetTime - now };
  };
}

describe('Rate Limiting Logic', () => {
  it('should allow requests within limit', () => {
    const rateLimit = createRateLimiter();
    const r1 = rateLimit('user-1', 3, 5000);
    const r2 = rateLimit('user-1', 3, 5000);
    const r3 = rateLimit('user-1', 3, 5000);

    assert.equal(r1.success, true);
    assert.equal(r1.remaining, 2);
    assert.equal(r2.success, true);
    assert.equal(r2.remaining, 1);
    assert.equal(r3.success, true);
    assert.equal(r3.remaining, 0);
  });

  it('should block requests exceeding limit', () => {
    const rateLimit = createRateLimiter();
    rateLimit('user-2', 2, 5000);
    rateLimit('user-2', 2, 5000);
    const rBlocked = rateLimit('user-2', 2, 5000);

    assert.equal(rBlocked.success, false);
    assert.equal(rBlocked.remaining, 0);
    assert.ok(rBlocked.resetIn > 0);
  });

  it('should track different keys independently', () => {
    const rateLimit = createRateLimiter();
    rateLimit('user-A', 1, 5000);
    const rA2 = rateLimit('user-A', 1, 5000);
    const rB1 = rateLimit('user-B', 1, 5000);

    assert.equal(rA2.success, false);
    assert.equal(rB1.success, true);
  });
});
