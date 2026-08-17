# AeroCoach — Submission narrative

**Status:** written to the actual XPRIZE format (500–1000 words, covering AI usage, human/AI
split, economic opportunity, and the build story), honestly — we have no real users or revenue
to report, and we're not going to invent any. Updated Aug 18 to reflect the final build, not
just the Aug 15 midpoint. Word count: ~860.

---

Untreated obstructive sleep apnea affects an estimated 936 million to 1 billion people
worldwide — roughly 83.7 million adults in the US alone (about one in three) — and over 80% of
them don't know it. The gold-standard test is an overnight stay in a sleep lab, which almost
nobody books proactively. AeroCoach exists to close the gap between "how many people have this"
and "how many people have ever been asked to check": it reads the fitness and sleep data people
already generate through a wearable they already own — a Fitbit or an Apple Watch — and turns it
into a plain-English nudge toward a validated screening step they'd otherwise never take.

**How we use AI day to day.** Inside the product, Gemini has exactly one job: translation, not
judgment. AeroCoach's risk tier comes from STOP-BANG, a validated clinical screening
questionnaire, scored deterministically in code. The recommended next action is also decided by
fixed rules mapped from that score, never by the model. Gemini's only role is turning that
already-decided outcome into calm, jargon-free language a non-clinician can actually use, and
every call is traced through LangFuse so we can see exactly what the model was given and what it
returned. Separately, we used Claude throughout the build as a working technical partner, not
just a drafting tool — it implemented real, shipped UI, and more usefully, it caught things we
would have missed under deadline pressure: a real streaming bug in our Apple Health parser that
only surfaced against an actual 777MB export (a synthetic test file never would have caught it),
a Firestore bug where every user's history was silently colliding into one document, and — on
the very last day — a factual error in our own submission category that had gone uncorrected
for hours until it was checked against our own planning notes instead of assumed.

**What humans do versus what AI does.** Every product decision in this build was made by a
person. Lio, our technical lead, scoped the Fitbit and Apple Health integrations, made the real
engineering call on how to parse a health export too large for our server to ever receive (parse
it client-side, send only three numbers), and decided what stayed in scope with a day left. Jyrah
led product design and shipped it herself — not mockups, the actual interface — and made the
calls a designer has to make under pressure: how to keep a growing AI conversation from taking
over a phone screen, what "kept pseudonymous" should actually mean in the architecture, not just
the copy. Where AI (Gemini, inside the product) or Claude (helping us build it) surfaced a
tradeoff — a privacy gap, a stale claim in a script, a wrong category on our own submission — a
human decided what to do about it every time. AI did the writing-heavy, verification-heavy, and
implementation-heavy work underneath those decisions. It never made one of them.

**Jobs and economic opportunity.** We're not going to overstate this: this was a short practice
build with a $0 budget, no customers, and no revenue, and a job-creation story invented for a
hackathon narrative wouldn't be honest. What's genuinely true is narrower but real: AeroCoach's
"what to do next" step is a live referral nudge toward an actual clinician visit, not a closed
loop that ends at our own product — if this reached real users, the economic activity it creates
sits downstream of us, in the sleep-clinic and primary-care visits it prompts, not in headcount
we'd hire ourselves. If it grew past a hackathon prototype, the roles that come with running a
health-adjacent screening tool responsibly are real and specific: clinical review, support,
compliance. That's a real possibility, not a current fact, and we'd rather say that plainly than
manufacture numbers.

**The story of building it this way.** We were assigned to this competition with about a week of
runway left, and the actual rules ask for a 90-day operating business with verified revenue — a
bar we couldn't honestly clear in the time we had. Rather than submit something that pretended
otherwise, we treated the time as a real practice sprint, held to the same technical bar as a
real build (a working Gemini integration, real production logging, a privacy architecture that
does what it claims) without fabricating the traction we don't have. That decision cost us more
than once — we spent hours making a data-separation gap and a retention gap real instead of
just disclaiming them, because a flagged gap that never gets fixed isn't actually honesty, it's
just a documented shortcut. It cost us again on the very last day, when a technical issue kept
our deployment stale for hours and a teammate had to step away from the project unexpectedly
partway through — which is the actual reason this narrative is reaching you by email rather than
through the submission portal. We chose to finish anyway: to record the demo ourselves rather
than not have one, and to send what's real rather than let a rough final day erase a week of
work that wasn't. We think that's a more honest story than a fabricated growth chart — and a
better use of the week either way.
