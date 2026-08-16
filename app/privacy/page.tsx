export default function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 sm:px-10">
      <h1 className="font-display text-2xl font-medium text-ink">Privacy Policy</h1>
      <p className="mt-2 text-xs text-ink-faint">
        Practice build — draft for team/legal review, not a final published policy. Last updated Aug 16, 2026.
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink-soft">
        <section>
          <h2 className="font-display text-base font-medium text-ink">What we collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Your age and resting heart rate, synced from your Fitbit via the Google Health API, used to estimate your VO2max</li>
            <li>Your answers to the 8 STOP-BANG screening questions</li>
            <li>The risk score and coaching text derived from the above</li>
            <li>If you use the follow-up chat: the questions you type and the conversation history for that session</li>
          </ul>
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
            We set two cookies, both strictly necessary for the app to function (keeping you signed in, and
            protecting the login flow from cross-site request forgery). Neither is used for tracking,
            advertising, or analytics, so no cookie consent banner is shown for them — but we&apos;re
            disclosing them here for transparency regardless.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-medium text-ink">Your rights</h2>
          <p className="mt-2">
            You can disconnect your account at any time (see the &quot;Disconnect&quot; link in the app),
            which clears your session immediately. To request deletion of any logged history, or to ask what
            data we hold, contact us at{" "}
            <span className="rounded bg-paper-alt px-1 font-mono text-xs">[team contact email — placeholder]</span>.
            {" "}<em>(This needs a real inbox before this policy is actually published — placeholder for now.)</em>
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-medium text-ink">Data retention</h2>
          <p className="mt-2">
            Logged coaching history currently has no automatic expiry — it&apos;s kept until you request
            deletion. <em>(Flagging honestly: a real retention/auto-deletion policy is a reasonable next step,
            not yet built.)</em>
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

        <section className="rounded-lg bg-paper-alt p-4 text-xs text-ink-faint">
          <strong>Status note:</strong> this page is a good-faith draft written to cover the real gaps found
          during the Aug 16 team review — it is not a substitute for an actual legal read, same status as{" "}
          <code>DISCLAIMER_DRAFT.md</code>. Before this is a real, publishable policy it needs: a real data
          controller name/contact, a real deletion mechanism (not just an email address), and a decision on
          data retention length.
        </section>
      </div>
    </div>
  );
}
