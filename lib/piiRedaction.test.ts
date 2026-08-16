import { describe, it, expect } from "vitest";
import { redactPotentialPII } from "./piiRedaction";

describe("redactPotentialPII", () => {
  it("leaves ordinary text untouched", () => {
    const result = redactPotentialPII("What does my STOP-BANG score actually mean?");
    expect(result).toEqual({ text: "What does my STOP-BANG score actually mean?", redacted: false });
  });

  it("redacts an email address", () => {
    const result = redactPotentialPII("You can reach me at lionel@example.com if needed.");
    expect(result.text).toBe("You can reach me at [redacted email] if needed.");
    expect(result.redacted).toBe(true);
  });

  it("redacts multiple email addresses", () => {
    const result = redactPotentialPII("cc jyrah@example.com and me@example.org");
    expect(result.text).toBe("cc [redacted email] and [redacted email]");
    expect(result.redacted).toBe(true);
  });

  it("redacts a phone number", () => {
    const result = redactPotentialPII("Call me at 555-123-4567 tomorrow.");
    expect(result.text).toBe("Call me at [redacted phone number] tomorrow.");
    expect(result.redacted).toBe(true);
  });

  it("redacts a phone number with parentheses and spaces", () => {
    const result = redactPotentialPII("(555) 123 4567 is my number");
    expect(result.text).toBe("[redacted phone number] is my number");
    expect(result.redacted).toBe(true);
  });

  it("redacts both an email and a phone number in the same message", () => {
    const result = redactPotentialPII("email me@example.com or call 555-123-4567");
    expect(result.text).toBe("email [redacted email] or call [redacted phone number]");
    expect(result.redacted).toBe(true);
  });

  it("does not flag a plain STOP-BANG-related number as PII", () => {
    const result = redactPotentialPII("My score was 5 out of 8, is that bad?");
    expect(result.redacted).toBe(false);
  });
});
