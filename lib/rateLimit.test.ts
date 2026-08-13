import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { checkRateLimit, getClientKey } from "./rateLimit";

// checkRateLimit's request log is module-level shared state (by design — that's what makes
// the global backstop global). To keep tests isolated from each other, each test gets its own
// fake-timer window jumped far enough forward that no earlier test's timestamps are still
// inside the 60s window.
let baseTime = 1_700_000_000_000;

beforeEach(() => {
  vi.useFakeTimers();
  baseTime += 10 * 60_000; // 10 minutes, comfortably past the 60s window
  vi.setSystemTime(baseTime);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("checkRateLimit — per-client limit", () => {
  it("allows up to the per-client limit for a single key", () => {
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit("client-a").allowed).toBe(true);
    }
  });

  it("blocks the 11th request from the same client within the window", () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit("client-b");
    }
    const result = checkRateLimit("client-b");
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks different client keys independently", () => {
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit("client-x").allowed).toBe(true);
    }
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit("client-y").allowed).toBe(true);
    }
  });

  it("allows requests again once the window has passed", () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit("client-c");
    }
    expect(checkRateLimit("client-c").allowed).toBe(false);

    vi.setSystemTime(baseTime + 61_000);
    expect(checkRateLimit("client-c").allowed).toBe(true);
  });
});

describe("checkRateLimit — global backstop", () => {
  it("blocks the 31st request even across many distinct (e.g. spoofed) client keys", () => {
    for (let i = 0; i < 30; i++) {
      const result = checkRateLimit(`spoofed-client-${i}`);
      expect(result.allowed).toBe(true);
    }
    const result = checkRateLimit("spoofed-client-31");
    expect(result.allowed).toBe(false);
  });
});

describe("getClientKey", () => {
  it("takes the first address from a comma-separated X-Forwarded-For header", () => {
    const request = new Request("http://localhost/api/coach", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientKey(request)).toBe("1.2.3.4");
  });

  it("falls back to 'unknown' when the header is missing", () => {
    const request = new Request("http://localhost/api/coach");
    expect(getClientKey(request)).toBe("unknown");
  });
});
