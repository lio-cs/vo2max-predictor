export default function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 sm:px-10">
      <h1 className="font-display text-2xl font-medium text-ink">Privacy Policy</h1>
      <p className="mt-2 text-xs text-ink-faint">Last updated Aug 17, 2026.</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink-soft">
        <section>
          <h2 className="font-display text-base font-medium text-ink">What we collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Your age and resting heart rate, either synced from your Fitbit via the Google Health API, or from an Apple Health export you import yourself, used to estimate your VO2max</li>
            <li>Your blood oxygen (SpO2), if your device supports it</li>
            <li>Your answers to the 8 STOP-BANG screening questions</li>
            <li>The risk score and coaching text derived from the above</li>
            <li>If you use the follow-up chat: the questions you type and the conversation history for that session</li>
          </ul>
          <p className="mt-2">
            If you connect via Apple Health, your export.zip is read entirely in your own browser
            — it is never uploaded anywhere. Only the age, resting heart rate, and blood oxygen
            values extracted from it are sent to us, the same handful of numbers the Fitbit path
            already provides.
          </p>
          <p className="mt-2">
            We do not collect your name, email address, or any other direct identifier — see &quot;Health
            data & special category processing&quot; below for why this still matters under GDPR.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-medium text-ink">How it&apos;s used, and who sees it</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Sent to the <strong>Google Gemini API</strong> to generate the plain-English explanation and
              chat responses. On Gemini&apos;s free tier, this data may be used by Google to improve its
              products, including model training, and may be reviewed by human raters — see{" "}
              <a
                href="https://ai.google.dev/gemini-api/terms"
                className="underline"
                target="_blank"
                rel="noreferrer"
              >
                Google&apos;s Gemini API terms
              </a>{" "}
              for the current policy.
            </li>
            <li>
              Optionally logged to <strong>Google Cloud Firestore</strong> so your fitness trend can be
              tracked over time, keyed to an anonymous per-session identifier — never your name or email.
            </li>
            <li>
              Optionally traced through <strong>LangFuse</strong> (if configured) for debugging/observability
              during development.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-base font-medium text-ink">Keeping your identity separate from your health data</h2>
          <p className="mt-2">
            What we send to Gemini is deliberately limited to your screening score, risk tier, and fitness/oxygen
            numbers — never your name, email, or Google account identity, and never your login credentials. The
            Gemini API call itself is made by our server using our own app credentials, not anything tied to your
            personal Google account, so Google&apos;s API doesn&apos;t see your account identity on that call
            either. Where your history is linked across visits (so your fitness trend can build over time), it&apos;s
            linked via a one-way hashed key derived from your session, not your account itself or anything
            reversible back to it.
          </p>
          <p className="mt-2">
            The one place free-form text reaches Gemini at all is the follow-up chat, since that&apos;s the only
            field you can type anything into. Before anything you type there is sent, we automatically scrub
            patterns that look like an email address or phone number. This is a best-effort filter, not a
            guarantee — it can&apos;t reliably catch a name typed into a sentence, so please avoid typing anything
            personally identifying into the chat regardless.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-medium text-ink">Health data &amp; special category processing</h2>
          <p className="mt-2">
            Under GDPR, information about your fitness and OSA screening result counts as{" "}
            <strong>special category data concerning health</strong> — this is true even though we don&apos;t
            collect your name, because the data is still linked to you through your session. Processing this
            category of data requires a specific legal basis. We rely on your{" "}
            <strong>explicit, informed consent</strong>, which you give before submitting the screening form.
            You can withdraw that consent at any time by disconnecting your account (see below) — this stops
            future processing but doesn&apos;t retroactively delete what&apos;s already been sent to Gemini
            under Google&apos;s own terms.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-medium text-ink">Cookies</h2>
          <p className="mt-2">
            We set up to two cookies at a time, both strictly necessary for the app to function — which ones
            depend on how you connect. Everyone gets one session cookie (either for the Fitbit path or the
            Apple Health path, never both). If you use Fitbit, a second, short-lived cookie protects the login
            handshake from cross-site request forgery and expires within minutes regardless of whether login
            succeeds. None of these are used for tracking, advertising, or analytics, so no cookie consent
            banner is shown for them — but we&apos;re disclosing them here for transparency regardless.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-medium text-ink">Your rights</h2>
          <p className="mt-2">
            You can disconnect at any time (see the &quot;Disconnect&quot; link in the app) — this deletes
            your logged coaching history immediately, not just your session. Under GDPR you&apos;re also
            entitled to request access to your data. For that, or any other question about this policy,
            contact us at{" "}
            <a href="mailto:aerocoachsupport@gmail.com" className="underline">
              aerocoachsupport@gmail.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-medium text-ink">Data retention</h2>
          <p className="mt-2">
            Your logged coaching history is retained only for as long as you stay connected. Disconnecting
            deletes it immediately and permanently — it isn&apos;t a soft delete or a scheduled cleanup, the
            underlying record is removed at that moment. There&apos;s no separate time-based auto-expiry on
            top of that: if you stay connected indefinitely, your history is kept indefinitely to power your
            fitness trend, until you disconnect or ask us to delete it sooner.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-medium text-ink">International transfers</h2>
          <p className="mt-2">
            Google Gemini, Google Cloud (Firestore), and LangFuse may process data outside the country you&apos;re
            in. Google Cloud and Gemini API rely on Google&apos;s own standard contractual clauses / adequacy
            mechanisms for cross-border transfers under GDPR.
          </p>
        </section>
      </div>
    </div>
  );
}
