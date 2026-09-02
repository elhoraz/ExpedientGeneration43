import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function triggerHaptic(pattern = 15) {
  if (typeof window === 'undefined') return;
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // Gracefully ignore
  }
}

describe('Safe Haptic Utility', () => {
  it('should not throw in Node.js environment where window is undefined', () => {
    assert.doesNotThrow(() => {
      triggerHaptic(50);
      triggerHaptic([100, 50, 100]);
    });
  });

  it('should safely execute when window and navigator.vibrate are available', () => {
    let vibrationTriggered = null;
    globalThis.window = {};
    const originalNavigator = globalThis.navigator;

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        vibrate: (pattern) => {
          vibrationTriggered = pattern;
          return true;
        }
      },
      configurable: true,
      writable: true
    });

    triggerHaptic(30);
    assert.equal(vibrationTriggered, 30);

    triggerHaptic([50, 50]);
    assert.deepEqual(vibrationTriggered, [50, 50]);

    delete globalThis.window;
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true
    });
  });

  it('should safely catch if navigator.vibrate throws error', () => {
    globalThis.window = {};
    const originalNavigator = globalThis.navigator;

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        vibrate: () => {
          throw new Error('Not allowed by permissions policy');
        }
      },
      configurable: true,
      writable: true
    });

    assert.doesNotThrow(() => {
      triggerHaptic(50);
    });

    delete globalThis.window;
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true
    });
  });
});
