# AeroCoach — Submission video script (draft)

**Status:** practice draft for team review, not final — same status as `NARRATIVE_DRAFT.md` and
`DISCLAIMER_DRAFT.md`. Written to match §10n's spec: problem → how it works → AI-native proof →
category-impact/roadmap close, ≤3 minutes, honest (no fabricated users/revenue/footage per the
Devpost rules).

~239 words. At a natural narration pace (120–135 wpm, accounting for pauses between beats)
that's roughly **1:46–1:59** — under the 2-minute target, with less margin than before now
that a progress-tracking line was added, so this is the one to trim first if a take runs long.

**Changed from the previous draft:** trimmed for length; the AI-native beat now leads with what
Gemini does (translation, not judgment) rather than dwelling on it reading data, and pivots
straight to reassurance that nothing is linked back to the user as a person — matches the
pseudonymity language already used on the landing/result pages and in the privacy policy. No
mention of the Gemini XPRIZE submission. Closing dropped the "no fabricated users/revenue" line
along with it, since that framing existed specifically to address XPRIZE-judging honesty norms —
worth flagging in case that was still wanted for a different reason. AeroCoach/AeroGlyphics
attribution is now one short line, exactly as requested.

---

## The script — exactly what to feed to the AI voice tool

Copy everything between the lines below and nothing else. No brackets, timestamps, or scene
notes are mixed in — those are kept separate in the storyboard section further down so they
don't get read aloud by mistake.

```
An estimated one billion people worldwide have obstructive sleep apnea — and more than eighty percent of them don't know it.

The gold-standard test is an overnight stay in a sleep lab — expensive, inconvenient, and almost nobody books one without a reason to suspect a problem in the first place.

AeroCoach is that reason. It reads the fitness data you're already generating — your VO2max, from a Fitbit or an Apple Watch — walks you through STOP-BANG, a validated eight-question screening tool, and turns the result into a plain-English read on your risk.

Here's what that looks like. Connect your wearable — no new hardware, no new habit. AeroCoach estimates your VO2max from your resting heart rate and age, asks you eight yes-or-no questions, and writes this explanation live, in real time — not a canned response. And every time you come back, AeroCoach tracks your VO2max trend over time, so you can watch your progress build.

Gemini's job here is deliberately narrow — it never decides your risk level, that's a validated clinical rule, computed the same way every time. Gemini only turns an already-decided result into plain language. And none of it is ever linked back to you as an individual — no name, no email, just the numbers, kept separate from your identity the whole way through.

AeroCoach — built by AeroGlyphics, powered by Gemini. Eighty percent of a billion people don't know they have this. AeroCoach is one plain-English nudge toward finding out.
```

---

## Storyboard (for syncing the screen recording — not part of the narration)

| Beat | Narration paragraph | ~Time | What's on screen |
|---|---|---|---|
| Hook | "An estimated one billion..." | 0:00–0:10 | Static title card or the landing page hero, no interaction yet |
| Problem | "The gold-standard test..." | 0:10–0:22 | Landing page, slow scroll/hold |
| Intro | "AeroCoach is that reason..." | 0:22–0:40 | `/connect` wearable-picker page |
| Live demo | "Here's what that looks like..." | 0:40–1:10 | **Real, live** click-through: connect → STOP-BANG questions → result panel appearing, then a quick beat on the trend chart for the "tracks your VO2max trend" line |
| AI-native + trust | "Gemini's job here is..." | 1:10–1:40 | Hold on the coaching result text on screen while this plays |
| Close + tagline | "AeroCoach — built by AeroGlyphics..." | 1:40–1:55 | Logo card, ends |

*(Timestamps recalculated from the word counts per beat — the "Live demo" paragraph grew by
~20 words when the trend-tracking sentence was added, but the timing column in the previous
draft wasn't updated to match, which would have cut away from the demo ~4-5s before the
narration actually got there.)*

**Only use real, live footage for the demo beat** — per the Devpost rules already flagged in
§10m, no mockups presented as if they're the working product. **Update:** the earlier caution
against recording the Apple Health path no longer applies — Jyrah clicked through the real
import end-to-end on Aug 17 and confirmed it works, so both paths are now human-verified live,
not just automated-test-verified. Either is safe to record; a good structure given the ≤2-minute
runtime is to show the `/connect` wearable-picker with both real options visible (a few seconds,
proves multi-wearable support), then do the full click-through-to-result demo on one path only
(Fitbit is the simpler one to film cleanly) rather than doubling the demo beat's length.

---

## Recommended AI voice tool: ElevenLabs (free tier)

**elevenlabs.io** — sign up free, paste the script above into their Text to Speech tool, pick a
voice, generate, download the MP3. No GCP setup, no API keys, done in a couple of minutes.

- Free tier includes roughly 10,000 characters/month; this script is around 1,200 characters, so
  it fits comfortably with plenty of room to regenerate takes.
- Voice pick, per Jyrah's Aug 17 direction: **confident and energetic — Apple/Google product-ad
  register, not a flat documentary narrator.** This is a deliberate change from this draft's
  original guidance (calm/even, matching the "calm, not alarming" tone baked into the product's
  own coaching copy in `lib/geminiCoach.ts`) — worth knowing the two are in tension for
  health-adjacent content, but the call has been made in favor of the more energetic register.
- Default settings are fine; if there's time, nudge "Stability" up slightly for a steadier,
  less performative read.

**Alternative, if you'd rather stay entirely inside the Google stack for the narrative:**
**Google Cloud Text-to-Speech**, using the same GCP project already running Firestore/Cloud Run.
Neural2 or Studio voices, genuinely free tier (1M characters/month for standard voices, smaller
but still ample quotas for the higher-quality tiers). Slower to get to first output than
ElevenLabs — needs the Text-to-Speech API enabled on the existing GCP project — but ties the
"built entirely on $0 free tiers" story together end to end. Worth it only if there's slack in
the schedule; ElevenLabs is the faster path today.
