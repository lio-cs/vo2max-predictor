/**
 * The follow-up chat is the one surface where arbitrary user-typed text reaches Gemini — every
 * other input (STOP-BANG answers, wearable metrics) is structured data with no room for someone
 * to type their name, email, or phone number into it. This is a best-effort scrub of the
 * mechanically-detectable patterns (email, phone) run on that text before it's ever included in
 * a Gemini prompt or logged to LangFuse. It deliberately does NOT attempt to catch names typed
 * into a sentence ("Hi, I'm John") — a regex or keyword guesser for that would be unreliable
 * enough to create false confidence, which is worse than being upfront that it isn't covered.
 */

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_PATTERN = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;

export interface RedactionResult {
  text: string;
  redacted: boolean;
}

export function redactPotentialPII(text: string): RedactionResult {
  const scrubbed = text.replace(EMAIL_PATTERN, "[redacted email]").replace(PHONE_PATTERN, "[redacted phone number]");
  return { text: scrubbed, redacted: scrubbed !== text };
}
