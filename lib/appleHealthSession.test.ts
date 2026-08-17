import { describe, it, expect } from "vitest";
import { getAppleUserKey, type AppleHealthSession } from "./appleHealthSession";

function makeSession(id: string): AppleHealthSession {
  return { id, age: 30, restingHeartRate: 60, oxygenPercentage: 97, importedAt: Date.now() };
}

describe("getAppleUserKey", () => {
  it("is deterministic for the same id", () => {
    const a = getAppleUserKey(makeSession("import-abc"));
    const b = getAppleUserKey(makeSession("import-abc"));
    expect(a).toBe(b);
  });

  it("differs for different ids", () => {
    const a = getAppleUserKey(makeSession("import-abc"));
    const b = getAppleUserKey(makeSession("import-xyz"));
    expect(a).not.toBe(b);
  });

  it("never contains the raw id", () => {
    const id = "super-secret-import-id-value";
    expect(getAppleUserKey(makeSession(id))).not.toContain(id);
  });

  it("is a short hex string suitable as a Firestore document ID", () => {
    expect(getAppleUserKey(makeSession("import-abc"))).toMatch(/^[0-9a-f]{16}$/);
  });
});
