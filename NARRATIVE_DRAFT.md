# AeroCoach — Practice submission narrative (draft)

**Status:** practice draft, not a real submission. Written to the actual XPRIZE format (500–
1000 words, covering AI usage, human/AI split, economic opportunity, and the build story) as
rehearsal — but honestly, since we have no real users or revenue to report. Word count: ~800.

---

Untreated obstructive sleep apnea affects an estimated 936 million to 1 billion people
worldwide — roughly 83.7 million adults in the US alone — and over 80% of them don't know it.
The gold-standard test is an overnight stay in a sleep lab, which almost nobody books
proactively. AeroCoach exists to close the gap between "how many people have this" and "how
many people have ever been asked to check": it reads the fitness and sleep data people already
generate through a wearable they already own, and turns it into a plain-English nudge toward a
validated screening step they'd otherwise never take.

**How we use AI day to day.** Inside the product, Gemini has exactly one job: translation, not
judgment. AeroCoach's risk tier comes from STOP-BANG, a validated clinical screening
questionnaire, scored deterministically in code. The recommended next action — monitor,
mention it to a doctor, or see one soon — is also decided by fixed rules mapped from that
score, never by the model. Gemini's only role is turning that already-decided outcome into
calm, jargon-free language a non-clinician can actually use, and every call is traced through
LangFuse so we can see exactly what the model was given and what it returned. We made that
split deliberately: an AI system making an undisclosed clinical judgment is a real risk in a
health-adjacent product, and it wasn't one we were willing to take just to make the "AI"
in the pitch look more central than it needs to be. Separately, we used Claude throughout the
week as a technical and research partner — verifying every scientific claim in our marketing
research against primary sources before using it, catching a real data-ordering bug in our
Fitbit integration that had been silently returning stale heart-rate readings, and drafting
first passes of documents (like this one) for a human to review and correct.

**What humans do versus what AI does.** Every product decision in this build was made by a
person. Our technical lead scoped and approved the shift from an early general-fitness framing
to the OSA-specific one, and made the call to keep the tech stack simple rather than adopt a
heavier framework under deadline pressure. Our market lead ran competitive research that
surfaced a real strategic risk — that our own data platform is building a similar coaching
feature natively — and used it to sharpen, not abandon, our positioning. Our mentor set the
technical priorities (observability, guardrails, MVP-first) that shaped what we built and in
what order. AI did the writing-heavy, verification-heavy, and drafting-heavy work underneath
those decisions — never the decisions themselves.

**Jobs and economic opportunity.** We're not going to overstate this: this was a several-day
practice build with a $0 budget, no customers, and no revenue, and we don't think a job-creation
story invented for a hackathon narrative would be honest. What's genuinely true is narrower:
this project is a real prototype feature on top of an existing early-stage health company's
actual product, not a throwaway demo, so the technical work here has a real chance of feeding
into that company's roadmap and, if it matures, the roles that come with running a screening
product responsibly — clinical review, customer support, compliance. That's a real possibility,
not a current fact, and we'd rather say that plainly than manufacture numbers.

**The story of building it this way.** We were assigned to this competition with about a week
of runway left before the deadline, and the actual rules ask for a 90-day operating business
with verified revenue — a bar we couldn't honestly clear in the time we had. Rather than
submit something that pretended otherwise, we made a deliberate choice: treat the remaining
time as a real practice sprint, held to the same technical bar (a working Gemini integration, a
Google Cloud product doing real work, actual production logging) without fabricating the
business traction we don't have. That decision shaped everything downstream — we built on our
company's real, working codebase instead of a disposable one; we fact-checked every research
claim before it went into a pitch deck instead of trusting it because it sounded good; and when
research surfaced an uncomfortable finding (a much larger competitor building the same thing
into our own data source), we wrote it down and planned around it instead of leaving it out.
We think that's a more honest story than a fabricated growth chart — and a better use of the
week either way.
