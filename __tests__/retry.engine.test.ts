import { describe, it, expect, vi, beforeEach } from "vitest";
import { RetryEngine } from "../features/retry.engine.feature.js";

describe("RetryEngine.shouldRetry", () => {
  let engine: RetryEngine;

  beforeEach(() => {
    engine = new RetryEngine({
      maxRetries: 3,
      retryableStatuses: [500, 503],
      retryOnNetworkError: true,
    });
  });

  it("returns false when attempt >= maxRetries", () => {
    expect(engine.shouldRetry(3, { response: { status: 500 } })).toBe(false);
  });

  it("returns false for non-object error", () => {
    expect(engine.shouldRetry(0, "some string error")).toBe(false);
    expect(engine.shouldRetry(0, null)).toBe(false);
  });

  it("returns true for network error (no response) when retryOnNetworkError is true", () => {
    expect(engine.shouldRetry(0, { code: "ECONNREFUSED" })).toBe(true);
  });

  it("returns false for network error when retryOnNetworkError is false", () => {
    const e = new RetryEngine({ retryOnNetworkError: false });
    expect(e.shouldRetry(0, { code: "ECONNREFUSED" })).toBe(false);
  });

  it("returns true for retryable status code", () => {
    expect(engine.shouldRetry(0, { response: { status: 500 } })).toBe(true);
    expect(engine.shouldRetry(0, { response: { status: 503 } })).toBe(true);
  });

  it("returns false for non-retryable status code", () => {
    expect(engine.shouldRetry(0, { response: { status: 404 } })).toBe(false);
    expect(engine.shouldRetry(0, { response: { status: 401 } })).toBe(false);
  });
});

describe("RetryEngine.getDelay", () => {
  it("returns delay within expected range including jitter", () => {
    const engine = new RetryEngine({
      baseDelay: 1000,
      backoffFactor: 2,
      maxDelay: 30000,
    });
    const delay = engine.getDelay(0);
    // base=1000, jitter ±25% → 750–1250
    expect(delay).toBeGreaterThanOrEqual(750);
    expect(delay).toBeLessThanOrEqual(1250);
  });

  it("does not exceed maxDelay", () => {
    const engine = new RetryEngine({
      baseDelay: 1000,
      backoffFactor: 2,
      maxDelay: 1000,
    });
    const delay = engine.getDelay(10);
    expect(delay).toBeLessThanOrEqual(1000);
  });
});

describe("RetryEngine.execute", () => {
  it("resolves immediately on first success", async () => {
    const engine = new RetryEngine();
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await engine.execute(fn);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on retryable error and eventually resolves", async () => {
    const engine = new RetryEngine({
      maxRetries: 2,
      baseDelay: 0,
      retryableStatuses: [500],
    });
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValue("ok");

    const result = await engine.execute(fn);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("throws immediately on non-retryable error", async () => {
    const engine = new RetryEngine({ maxRetries: 3, baseDelay: 0 });
    const fn = vi.fn().mockRejectedValue({ response: { status: 404 } });

    await expect(engine.execute(fn)).rejects.toEqual({
      response: { status: 404 },
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("throws after exhausting all retries", async () => {
    const engine = new RetryEngine({
      maxRetries: 2,
      baseDelay: 0,
      retryableStatuses: [500],
    });
    const fn = vi.fn().mockRejectedValue({ response: { status: 500 } });

    await expect(engine.execute(fn)).rejects.toEqual({
      response: { status: 500 },
    });
    expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });
});
