import { describe, it, expect } from 'vitest';
import { RequestCancellationManager } from '../features/cancellation.feature.js';
import type { AllowedKeysType } from '../types/api.config.types.js';

const key = 'get:/api/users' as AllowedKeysType;
const key2 = 'post:/api/posts' as AllowedKeysType;

describe('RequestCancellationManager.getSignal', () => {
  it('returns an AbortSignal', () => {
    const manager = new RequestCancellationManager();
    const signal = manager.getSignal(key);
    expect(signal).toBeInstanceOf(AbortSignal);
  });

  it('returns the same signal for the same key', () => {
    const manager = new RequestCancellationManager();
    const s1 = manager.getSignal(key);
    const s2 = manager.getSignal(key);
    expect(s1).toBe(s2);
  });

  it('returns different signals for different keys', () => {
    const manager = new RequestCancellationManager();
    const s1 = manager.getSignal(key);
    const s2 = manager.getSignal(key2);
    expect(s1).not.toBe(s2);
  });

  it('signal is not aborted initially', () => {
    const manager = new RequestCancellationManager();
    const signal = manager.getSignal(key);
    expect(signal.aborted).toBe(false);
  });
});

describe('RequestCancellationManager.remove', () => {
  it('removes the key so a new signal is created on next getSignal', () => {
    const manager = new RequestCancellationManager();
    const s1 = manager.getSignal(key);
    manager.remove(key);
    const s2 = manager.getSignal(key);
    expect(s1).not.toBe(s2);
  });
});

describe('RequestCancellationManager.cancelRequest', () => {
  it('aborts the signal for the given key', () => {
    const manager = new RequestCancellationManager();
    const signal = manager.getSignal(key);
    manager.cancelRequest(key);
    expect(signal.aborted).toBe(true);
  });

  it('removes the key after cancellation', () => {
    const manager = new RequestCancellationManager();
    const s1 = manager.getSignal(key);
    manager.cancelRequest(key);
    const s2 = manager.getSignal(key);
    expect(s1).not.toBe(s2);
  });

  it('does nothing when key does not exist', () => {
    const manager = new RequestCancellationManager();
    expect(() => manager.cancelRequest(key)).not.toThrow();
  });
});

describe('RequestCancellationManager.cancelAll', () => {
  it('aborts all active signals', () => {
    const manager = new RequestCancellationManager();
    const s1 = manager.getSignal(key);
    const s2 = manager.getSignal(key2);
    manager.cancelAll();
    expect(s1.aborted).toBe(true);
    expect(s2.aborted).toBe(true);
  });

  it('clears all keys so new signals are fresh after cancelAll', () => {
    const manager = new RequestCancellationManager();
    const s1 = manager.getSignal(key);
    manager.cancelAll();
    const s2 = manager.getSignal(key);
    expect(s1).not.toBe(s2);
    expect(s2.aborted).toBe(false);
  });
});
