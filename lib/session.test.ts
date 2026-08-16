import { describe, it, expect } from "vitest";
import { getUserKey, type GoogleHealthSession } from "./session";

function makeSession(refreshToken: string): GoogleHealthSession {
  return { accessToken: "unused", refreshToken, expiresAt: Date.now() + 3_600_000 };
}

describe("getUserKey", () => {
  it("is deterministic for the same refresh token", () => {
    const a = getUserKey(makeSession("token-abc"));
    const b = getUserKey(makeSession("token-abc"));
    expect(a).toBe(b);
  });

  it("differs for different refresh tokens (this is what fixes the collision bug)", () => {
    const a = getUserKey(makeSession("token-abc"));
    const b = getUserKey(makeSession("token-xyz"));
    expect(a).not.toBe(b);
  });

  it("never contains the raw refresh token", () => {
    const token = "super-secret-refresh-token-value";
    expect(getUserKey(makeSession(token))).not.toContain(token);
  });

  it("is a short hex string suitable as a Firestore document ID", () => {
    const key = getUserKey(makeSession("token-abc"));
    expect(key).toMatch(/^[0-9a-f]{16}$/);
  });
});
