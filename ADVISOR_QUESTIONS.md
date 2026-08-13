# Questions for the advisory board's former Google developer

Grouped by where their specific insider experience is most likely to beat generic advice —
each tied to a real, current open item, not a hypothetical.

## 1. Technical — things only someone who's worked at Google would actually know

1. **We're stuck in OAuth "Testing" mode**, which means Google Health refresh tokens expire
   every 7 days and users have to reconnect. Going to "Production" requires a Google
   privacy/security review since we use Restricted scopes. What does that review actually
   involve in practice — timeline, what reviewers look for, whether a small/unfunded team has
   a realistic path through it at all?
2. **We found a real bug caused by the Google Health API's incomplete docs** — we assumed
   `dataPoints` responses were ascending, they're actually descending, and we were silently
   reading stale data for who knows how long before catching it. Is that kind of
   documentation gap typical for a brand-new Google API, and is there an internal/insider way
   to get clarity on undocumented behavior before it bites us again elsewhere in this API?
3. **Vertex AI vs. the raw Gemini API** — we're currently making raw REST calls to
   `generativelanguage.googleapis.com` from our own backend. Is Vertex AI worth the switch for
   us specifically, given the hackathon wants "execution log" evidence of AI operating in
   production — does Vertex give us that out of the box in a way that's more credible to
   judges than what we're hand-rolling ourselves?
4. **Is there a Google Cloud tool (e.g. the DLP API) that would meaningfully shortcut the
   PII-masking/auth work we've explicitly deferred to "phase two"?** We're a $0-budget team and
   don't want to build this from scratch if there's a real, cheap, off-the-shelf answer.

## 2. Strategic — the single biggest thing we need outside perspective on

5. **We found that Google itself is building the almost-exact product we are** — Google Health
   Coach (Gemini-powered, launched May 2026, built into Fitbit/Google Health, including a
   virtual-care-referral pilot with Included Health). It's the same "wearable data → AI
   conversation → path to care" shape as our product, built on the platform we depend on for
   data access. From the inside: is this the kind of feature that tends to stick and expand at
   Google, or the kind that gets deprioritized/killed a cycle or two later? How would you
   personally read this risk?
6. Related — **is there a version of this project that's actually stronger *because* Google is
   already doing the general version**, e.g. going narrower/more clinical than Google would
   ever bother to, rather than trying to out-build a Google roadmap with a $0 hackathon team?

## 3. Practical — credits, programs, and paths we might not know exist

7. We already checked the public XPRIZE resources page and found no hackathon-specific Google
   Cloud credit tier, and Google's official student credit path takes ~3 weeks to process — too
   slow for our deadline. **Is there any insider path** (Google for Startups, a Developer
   Relations contact, an internal referral) to real credits or support that isn't on the public
   pages?
8. Same question but for **Gemini API rate limits** specifically — if this project ever needed
   to run past the free tier's daily cap (e.g. for a live demo to multiple people), is there a
   fast, legitimate way to get a temporary bump, or should we just plan around Flash-tier
   limits indefinitely?

## 4. For us specifically — two second-year CS students building this

9. What would actually make this project stand out if either of us used it in a Google
   internship/new-grad application — the technical build itself, the fact that we found and
   fixed a real bug in a brand-new Google API, the honest handling of the "Google already does
   this" risk, or something else entirely that we're not thinking to highlight?
10. Anything in how we've built this that reads as a red flag to someone with actual Google
    engineering experience — even if it's working fine for a $0 hackathon MVP?
