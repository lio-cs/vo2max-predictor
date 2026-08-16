import { Suspense } from "react";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { computeVo2Max } from "@/lib/vo2max-service";
import { StopBangForm } from "./StopBangForm";
import { ConnectingState } from "./ConnectingState";

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "You declined the Fitbit authorization request.",
  invalid_state: "That login attempt couldn't be verified. Please try again.",
  token_exchange_failed: "Couldn't reach Fitbit just now. This is on us, not your data — please try again.",
};

function BrandRow() {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
      </span>
      <span className="font-display text-lg font-semibold tracking-tight text-ink">AeroCoach</span>
    </div>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await getSession();

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-16 sm:px-10">
        <BrandRow />

        {!session ? (
          <div className="relative mt-10">
            <div
              aria-hidden
              className="animate-breathe absolute -top-16 -left-10 h-56 w-56 rounded-full bg-accent-glow/25 blur-3xl"
            />
            <h1 className="relative font-display text-4xl font-medium leading-[1.1] tracking-tight text-ink sm:text-5xl">
              Your Fitbit already knows{" "}
              <span className="text-gradient-accent">more than you think</span>.
            </h1>
            <p className="relative mt-4 max-w-prose text-base leading-relaxed text-ink-soft sm:text-lg">
              AeroCoach translates VO2max — the fitness number you already track — into a
              plain-English read on your sleep-apnea risk. No lab visit, no new device.
            </p>

            {error && (
              <p className="relative mt-4 rounded-lg bg-paper-alt px-4 py-3 text-sm text-ink-soft">
                {ERROR_MESSAGES[error] ?? "Something went wrong. Please try again."}
              </p>
            )}

            <a
              href="/api/auth/login"
              className="relative mt-8 inline-flex w-full items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper transition-all hover:-translate-y-0.5 hover:bg-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper sm:w-auto sm:px-8"
            >
              Connect Fitbit
            </a>
            <p className="relative mt-3 max-w-prose text-xs text-ink-faint">
              Takes under a minute. AeroCoach is a wellness and educational tool, not a
              diagnostic medical device. It doesn&apos;t replace a physician or a clinical sleep
              study — it helps you know when it&apos;s time to ask for one.
            </p>
          </div>
        ) : (
          <div className="mt-10">
            <Suspense fallback={<ConnectingState />}>
              <Result />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}

async function Result() {
  const result = await computeVo2Max();

  if ("error" in result) {
    if (result.error === "not_authenticated") {
      return (
        <a
          href="/api/auth/login"
          className="inline-flex w-full items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper transition-all hover:-translate-y-0.5 hover:bg-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper sm:w-auto sm:px-8"
        >
          Connect Fitbit
        </a>
      );
    }

    // State 3 (insufficient data): not an error, just not enough Fitbit history yet —
    // same neutral treatment as the connect card, not a warning color.
    if (result.error === "no_age" || result.error === "no_resting_heart_rate") {
      return (
        <div className="space-y-4">
          <div className="rounded-xl bg-paper-alt p-4">
            <svg aria-hidden viewBox="0 0 76 12" className="mb-3 h-3 w-20">
              {[0, 16, 32, 48, 64].map((cx, i) => (
                <circle
                  key={cx}
                  cx={cx + 6}
                  cy="6"
                  r="5"
                  fill={i < 3 ? "var(--accent)" : "none"}
                  stroke={i < 3 ? "none" : "var(--hairline)"}
                  strokeWidth="1.5"
                />
              ))}
            </svg>
            <p className="text-sm font-semibold text-ink">Almost there.</p>
            <p className="mt-1 text-sm text-ink-soft">{result.message}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-hairline px-4 py-2 text-xs font-medium text-ink-soft transition-colors hover:bg-paper-alt"
            >
              Check again
            </Link>
            <a href="/api/auth/logout" className="text-xs text-ink-faint underline">
              Disconnect
            </a>
          </div>
        </div>
      );
    }

    // State 6 (error): reassuring, not alarming — a scary-looking error on a health-adjacent
    // product can itself cause worry, so this stays visually calm too.
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-paper-alt p-4">
          <svg aria-hidden viewBox="0 0 24 24" className="mb-3 h-6 w-6 text-ink-faint">
            <path
              d="M21 12a9 9 0 1 1-3.5-7.14M21 4v5h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="text-sm font-semibold text-ink">Something didn&apos;t load right.</p>
          <p className="mt-1 text-sm text-ink-soft">
            {result.message} This is on us, not your data.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-hairline px-4 py-2 text-xs font-medium text-ink-soft transition-colors hover:bg-paper-alt"
          >
            Try again
          </Link>
          <a href="/api/auth/logout" className="text-xs text-ink-faint underline">
            Disconnect
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-paper-alt p-6 text-center">
        <p className="text-sm text-ink-faint">Estimated VO2 max</p>
        <div className="mt-1 flex items-center justify-center gap-3">
          <p className="text-4xl font-bold text-ink">{result.vo2max}</p>
          <span aria-hidden className="flex h-8 items-end gap-0.5">
            {[12, 20, 10, 26, 16].map((barHeight, i) => (
              <span
                key={i}
                className="animate-eq w-1 rounded-full bg-accent"
                style={{ height: barHeight, animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </span>
        </div>
        <p className="text-xs text-ink-faint">mL/kg/min</p>
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-ink-faint">Resting heart rate</dt>
          <dd className="font-medium text-ink">{result.restingHeartRate} bpm</dd>
        </div>
        <div>
          <dt className="text-ink-faint">Age</dt>
          <dd className="font-medium text-ink">{result.age}</dd>
        </div>
      </dl>

      <p className="text-xs text-ink-faint">
        Estimate only, based on the Uth–Sørensen–Overgaard–Pedersen formula (HRmax/HRrest). Most
        accurate for moderately fit adults — not a substitute for a lab-measured VO2max test.
      </p>

      {process.env.GEMINI_API_KEY ? (
        <StopBangForm age={result.age} />
      ) : (
        <div className="rounded-xl border border-dashed border-hairline p-4 text-xs text-ink-faint">
          AeroCoach is disabled — set <code>GEMINI_API_KEY</code> in <code>.env.local</code> to
          enable daily AI coaching.
        </div>
      )}

      <a href="/api/auth/logout" className="text-xs text-ink-faint underline">
        Disconnect
      </a>
    </div>
  );
}
