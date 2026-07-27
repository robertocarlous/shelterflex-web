import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { retryWithBackoff, withRetry } from "@/lib/retryLogic";

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("retryWithBackoff", () => {
  it("returns result on first attempt without retrying", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await retryWithBackoff(fn, { maxRetries: 3 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on 5xx and succeeds", async () => {
    const error500 = Object.assign(new Error("Internal Server Error"), { status: 500 });
    const fn = vi.fn().mockRejectedValueOnce(error500).mockResolvedValue("ok");

    const resultPromise = retryWithBackoff(fn, {
      maxRetries: 3,
      initialDelayMs: 100,
      backoffMultiplier: 1,
    });

    await vi.advanceTimersByTimeAsync(200);
    const result = await resultPromise;
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("retries on network TypeError containing 'fetch'", async () => {
    const networkError = new TypeError("fetch failed");
    const fn = vi.fn().mockRejectedValueOnce(networkError).mockResolvedValue("ok");

    const resultPromise = retryWithBackoff(fn, {
      maxRetries: 3,
      initialDelayMs: 100,
      backoffMultiplier: 1,
    });

    await vi.advanceTimersByTimeAsync(200);
    const result = await resultPromise;
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry on non-retryable 4xx (400)", async () => {
    const error400 = Object.assign(new Error("Bad Request"), { status: 400 });
    const fn = vi.fn().mockRejectedValue(error400);

    await expect(
      retryWithBackoff(fn, { maxRetries: 3, initialDelayMs: 100 }),
    ).rejects.toThrow("Bad Request");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does not retry on 401", async () => {
    const error401 = Object.assign(new Error("Unauthorized"), { status: 401 });
    const fn = vi.fn().mockRejectedValue(error401);

    await expect(
      retryWithBackoff(fn, { maxRetries: 3, initialDelayMs: 100 }),
    ).rejects.toThrow("Unauthorized");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does not retry on 403", async () => {
    const error403 = Object.assign(new Error("Forbidden"), { status: 403 });
    const fn = vi.fn().mockRejectedValue(error403);

    await expect(
      retryWithBackoff(fn, { maxRetries: 3, initialDelayMs: 100 }),
    ).rejects.toThrow("Forbidden");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does not retry on 404", async () => {
    const error404 = Object.assign(new Error("Not Found"), { status: 404 });
    const fn = vi.fn().mockRejectedValue(error404);

    await expect(
      retryWithBackoff(fn, { maxRetries: 3, initialDelayMs: 100 }),
    ).rejects.toThrow("Not Found");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on 408 Request Timeout", async () => {
    const error408 = Object.assign(new Error("Request Timeout"), { status: 408 });
    const fn = vi.fn().mockRejectedValueOnce(error408).mockResolvedValue("ok");

    const resultPromise = retryWithBackoff(fn, {
      maxRetries: 3,
      initialDelayMs: 100,
      backoffMultiplier: 1,
    });

    await vi.advanceTimersByTimeAsync(200);
    const result = await resultPromise;
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("retries on 429 Too Many Requests", async () => {
    const error429 = Object.assign(new Error("Too Many Requests"), { status: 429 });
    const fn = vi.fn().mockRejectedValueOnce(error429).mockResolvedValue("ok");

    const resultPromise = retryWithBackoff(fn, {
      maxRetries: 3,
      initialDelayMs: 100,
      backoffMultiplier: 1,
    });

    await vi.advanceTimersByTimeAsync(200);
    const result = await resultPromise;
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("retries on 502 Bad Gateway", async () => {
    const error502 = Object.assign(new Error("Bad Gateway"), { status: 502 });
    const fn = vi.fn().mockRejectedValueOnce(error502).mockResolvedValue("ok");

    const resultPromise = retryWithBackoff(fn, {
      maxRetries: 3,
      initialDelayMs: 100,
      backoffMultiplier: 1,
    });

    await vi.advanceTimersByTimeAsync(200);
    const result = await resultPromise;
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("retries on 503 Service Unavailable", async () => {
    const error503 = Object.assign(new Error("Service Unavailable"), { status: 503 });
    const fn = vi.fn().mockRejectedValueOnce(error503).mockResolvedValue("ok");

    const resultPromise = retryWithBackoff(fn, {
      maxRetries: 3,
      initialDelayMs: 100,
      backoffMultiplier: 1,
    });

    await vi.advanceTimersByTimeAsync(200);
    const result = await resultPromise;
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("retries on 504 Gateway Timeout", async () => {
    const error504 = Object.assign(new Error("Gateway Timeout"), { status: 504 });
    const fn = vi.fn().mockRejectedValueOnce(error504).mockResolvedValue("ok");

    const resultPromise = retryWithBackoff(fn, {
      maxRetries: 3,
      initialDelayMs: 100,
      backoffMultiplier: 1,
    });

    await vi.advanceTimersByTimeAsync(200);
    const result = await resultPromise;
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("stops retrying after maxRetries exhausted", async () => {
    const error500 = Object.assign(new Error("Server Error"), { status: 500 });
    const fn = vi.fn().mockRejectedValue(error500);

    const resultPromise = retryWithBackoff(fn, {
      maxRetries: 2,
      initialDelayMs: 100,
      backoffMultiplier: 1,
    }).catch((e) => e);

    await vi.advanceTimersByTimeAsync(2000);

    const caughtError = await resultPromise;
    expect(caughtError).toBeInstanceOf(Error);
    expect((caughtError as Error).message).toBe("Server Error");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("calls onRetry callback with attempt number and error", async () => {
    const error500 = Object.assign(new Error("Server Error"), { status: 500 });
    const fn = vi.fn().mockRejectedValueOnce(error500).mockResolvedValue("ok");
    const onRetry = vi.fn();

    const resultPromise = retryWithBackoff(fn, {
      maxRetries: 3,
      initialDelayMs: 100,
      backoffMultiplier: 1,
      onRetry,
    });

    await vi.advanceTimersByTimeAsync(200);
    await resultPromise;
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, error500);
  });

  it("uses exponential backoff (delay grows with attempt)", async () => {
    const error500 = Object.assign(new Error("Server Error"), { status: 500 });
    const fn = vi
      .fn()
      .mockRejectedValueOnce(error500)
      .mockRejectedValueOnce(error500)
      .mockRejectedValueOnce(error500)
      .mockResolvedValue("ok");

    const resultPromise = retryWithBackoff(fn, {
      maxRetries: 3,
      initialDelayMs: 100,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
    });

    await vi.advanceTimersByTimeAsync(1000);
    const result = await resultPromise;
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(4);
  });

  it("respects custom retryableStatusCodes", async () => {
    const error500 = Object.assign(new Error("Server Error"), { status: 500 });
    const fn = vi.fn().mockRejectedValue(error500);

    await expect(
      retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelayMs: 100,
        retryableStatusCodes: [429],
      }),
    ).rejects.toThrow("Server Error");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does not retry errors without status or fetch TypeError", async () => {
    const genericError = new Error("Something weird");
    const fn = vi.fn().mockRejectedValue(genericError);

    await expect(
      retryWithBackoff(fn, { maxRetries: 3, initialDelayMs: 100 }),
    ).rejects.toThrow("Something weird");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("wraps non-Error thrown values in Error", async () => {
    const fn = vi.fn().mockRejectedValue("string error");

    await expect(
      retryWithBackoff(fn, { maxRetries: 0, initialDelayMs: 100 }),
    ).rejects.toThrow("string error");
  });
});

describe("withRetry", () => {
  it("returns a wrapper that retries on failure", async () => {
    const error500 = Object.assign(new Error("Server Error"), { status: 500 });
    const fn = vi.fn().mockRejectedValueOnce(error500).mockResolvedValue("ok");

    const retried = withRetry(fn, {
      maxRetries: 3,
      initialDelayMs: 100,
      backoffMultiplier: 1,
    });

    const resultPromise = retried("arg1");
    await vi.advanceTimersByTimeAsync(200);
    const result = await resultPromise;
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledWith("arg1");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("preserves argument passing", async () => {
    const fn = vi.fn().mockResolvedValue({ data: "ok" });
    const retried = withRetry(fn);

    await retried("a", 123, true);
    expect(fn).toHaveBeenCalledWith("a", 123, true);
  });
});
