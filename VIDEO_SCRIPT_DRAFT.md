# AeroCoach — Submission video script (draft)

**Status:** practice draft for team review, not final — same status as `NARRATIVE_DRAFT.md` and
`DISCLAIMER_DRAFT.md`. Written to match §10n's spec: problem → how it works → AI-native proof →
category-impact/roadmap close, ≤3 minutes, honest (no fabricated users/revenue/footage per the
Devpost rules).

~335 words. At a natural narration pace (130–150 wpm) that's roughly **2:15–2:35**, leaving
margin under the 3-minute cap for scene transitions and pauses.

---

## The script — exactly what to feed to the AI voice tool

Copy everything between the lines below and nothing else. No brackets, timestamps, or scene
notes are mixed in — those are kept separate in the storyboard section further down so they
don't get read aloud by mistake.

```
An estimated one billion people worldwide have obstructive sleep apnea — and more than eighty percent of them don't know it.

The gold-standard test is an overnight stay in a sleep lab. It's expensive, inconvenient, and almost nobody books one without a reason to suspect a problem in the first place.

AeroCoach is that reason. It reads the fitness data you're already generating — your VO2max, from a Fitbit or an Apple Watch — walks you through STOP-BANG, a validated eight-question sleep apnea screening tool, and turns the result into a plain-English read on your risk.

Here's what that looks like. Connect your wearable — no new hardware, no new habit. AeroCoach estimates your VO2max from your resting heart rate and age, then asks you eight yes-or-no questions. What you're seeing here is Gemini writing this explanation live, in real time — not a canned response. Every call is traced, so we can see exactly what Gemini was given, and exactly what it wrote back.

That matters, because Gemini's job here is deliberately narrow. It never decides your risk level — that's a validated clinical rule, computed in code, every time, the same way. Gemini's only job is translation: turning an already-decided result into language a non-clinician can actually understand, without it ever sounding like a diagnosis. That's the AI-native part of this build — not a chatbot bolted onto a static app, but a model doing real, live, load-bearing work, with the same guardrails and observability you'd want in anything actually shipping to real people.

We built this as AeroGlyphics, for the Gemini XPRIZE, in Education and Human Potential — as a practice sprint, not a polished pitch. No fabricated users. No fabricated revenue. What's real is a live product, a real Fitbit and Apple Health integration, and a deliberate decision to keep AI out of the one place it shouldn't be making the call: your health risk.

Eighty percent of a billion people don't know they have this. AeroCoach is one plain-English nudge toward finding out.
```

---

## Storyboard (for syncing the screen recording — not part of the narration)

| Beat | Narration paragraph | ~Time | What's on screen |
|---|---|---|---|
| Hook | "An estimated one billion..." | 0:00–0:12 | Static title card or the landing page hero, no interaction yet |
| Problem | "The gold-standard test..." | 0:12–0:25 | Landing page, slow scroll/hold |
| Intro | "AeroCoach is that reason..." | 0:25–0:45 | `/connect` wearable-picker page |
| Live demo | "Here's what that looks like..." | 0:45–1:20 | **Real, live** click-through: connect → STOP-BANG questions → result panel appearing with Gemini's coaching text visibly generating |
| AI-native proof | "That matters, because..." | 1:20–1:55 | Hold on the coaching result text on screen while this plays; optionally a quick LangFuse trace screenshot showing the real prompt/response pair |
| Close | "We built this as AeroGlyphics..." | 1:55–2:20 | Back to a wide shot of the app / logo card |
| Tagline | "Eighty percent of a billion..." | 2:20–2:30 | Logo card, ends |

**Only use real, live footage for the demo beat** — per the Devpost rules already flagged in
§10m, no mockups presented as if they're the working product. Record the **Fitbit path**, since
that's the one that's actually been clicked through live by a human this session. The Apple
Health import (§10o) is verified end-to-end via automated tests and one real 51MB-export parse,
but nobody has clicked through the actual browser file-picker yet — don't put it in the video
until someone has, even though the script's one mention of "a real Fitbit and Apple Health
integration" is accurate either way (both are genuinely live in the deployed app).

---

## Recommended AI voice tool: ElevenLabs (free tier)

**elevenlabs.io** — sign up free, paste the script above into their Text to Speech tool, pick a
voice, generate, download the MP3. No GCP setup, no API keys, done in a couple of minutes.

- Free tier includes roughly 10,000 characters/month; this script is under 2,000 characters, so
  it fits comfortably with room to regenerate a few times if a take doesn't land.
- Voice pick: choose something calm and even — a "Narration" or "Documentary" preset, not an
  energetic/hype voice. This is health-adjacent content; the same "calm, not alarming" tone
  already baked into the product's own coaching copy (see `lib/geminiCoach.ts`'s system prompt)
  should carry into the video.
- Default settings are fine; if there's time, nudge "Stability" up slightly for a steadier,
  less performative read.

**Alternative, if you'd rather stay entirely inside the Google stack for the narrative:**
**Google Cloud Text-to-Speech**, using the same GCP project already running Firestore/Cloud Run.
Neural2 or Studio voices, genuinely free tier (1M characters/month for standard voices, smaller
but still ample quotas for the higher-quality tiers). Slower to get to first output than
ElevenLabs — needs the Text-to-Speech API enabled on the existing GCP project — but ties the
"built entirely on $0 free tiers" story together end to end. Worth it only if there's slack in
the schedule; ElevenLabs is the faster path today.
