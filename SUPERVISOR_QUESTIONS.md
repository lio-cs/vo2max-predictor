# Questions for Digvijay — AeroCoach / Gemini XPRIZE practice sprint

Grouped by: blockers we're already hitting, limitations we should flag before they bite us,
and specific advice/assistance to ask for given his data-science background.

## Blockers (current or near-term)

1. **Google Health API instability** — it's very new; the response shape for daily resting
   heart rate isn't fully documented, and our code currently throws descriptively rather than
   guessing at the schema. Is it worth hardening this now, or accept it as a known-fragile
   dependency for a practice build and move on?
2. **OAuth consent screen stuck in "Testing" mode** — refresh tokens expire every 7 days while
   it's in Testing; going to Production requires a Google privacy/security review (Restricted
   scopes). Do we have any path to that review, or is re-authenticating weekly acceptable for
   the scope of this sprint?
3. **GCP billing account requirement** — Firestore's free tier still requires a card on file
   even though nothing gets charged within quota. Should this run under a personal GCP account,
   or does AeroGlyphics have an org account we should be using instead?
4. **Gemini free-tier rate limits** — Flash-tier is generous (~1,000+ req/day), but the
   higher-quality Pro tier is capped much lower (~25–100/day). If this ever needs to be
   demoed live to more than one or two people, are we blocked, or is there an upgrade path
   worth knowing about in advance?

## Limitations to flag now (before they're assumed away)

5. **The risk-quintile model is a simplification, not the real thing** — real
   fitness-mortality hazard tables (e.g. Mandsager et al.) are sex-specific and derived from
   exercise-test data; we're using a coarse, sex-unspecified age-average approximation,
   clearly labeled as such. Is that an acceptable simplification for a practice build, or does
   it risk looking sloppy/misleading even with the disclaimer?
6. **No clinical or compliance review** — this touches health-adjacent output (risk framing,
   training prescriptions) even though it's explicitly labeled "not medical advice." Is there a
   line we shouldn't cross even in a practice/internal context — e.g. should this ever be shown
   to a real external user, or kept strictly internal?
7. **Time budget** — Lionel is covering technical/AI integration, Jyrah is covering market +
   UI/UX, both alongside other responsibilities. Is the ~5-day scope realistic given everything
   else on our plates, or should we trim it?

## Advice / assistance we'd like from him

8. Given his data-science background: any lightweight way to sanity-check or validate the
   LLM's dose-adjustment "decisions" beyond eyeballing outputs — is there a cheap eval approach
   worth adopting even for a practice build?
9. Does he have a view on whether the simplified risk-quintile model (#5) is worth iterating on
   with real reference data, or is it out of scope until AeroGlyphics has a validated model of
   its own?
10. Any existing AeroGlyphics research, data, or contacts (e.g. from the CPET-benchmarking
    validation work mentioned on the site) that could make our risk-banding approximation more
    defensible without much extra time?
11. Is there value in him reviewing the practice submission narrative/video before Day 5, purely
    as a rehearsal for how we'd eventually pitch this to investors (YC/Techstars/StartX), even
    though we're not submitting to XPRIZE for real?
