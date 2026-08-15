import { getSession } from "@/lib/session";
import { computeVo2Max } from "@/lib/vo2max-service";
import { StopBangForm } from "./StopBangForm";

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "You declined the Fitbit authorization request.",
  invalid_state: "That login attempt couldn't be verified. Please try again.",
  token_exchange_failed: "Couldn't reach Fitbit just now. This is on us, not your data — please try again.",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await getSession();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">AeroCoach</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Your Fitbit already knows more than you think. AeroCoach translates VO2max — the
          fitness number you already track — into a plain-English read on your sleep-apnea risk.
          No lab visit, no new device.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-zinc-100 px-4 py-3 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            {ERROR_MESSAGES[error] ?? "Something went wrong. Please try again."}
          </p>
        )}

        {!session ? (
          <>
            <a
              href="/api/auth/login"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Connect Fitbit
            </a>
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              Takes under a minute. AeroCoach is a wellness and educational tool, not a
              diagnostic medical device. It doesn&apos;t replace a physician or a clinical sleep
              study — it helps you know when it&apos;s time to ask for one.
            </p>
          </>
        ) : (
          <Result />
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
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Connect Fitbit
        </a>
      );
    }

    // State 3 (insufficient data): not an error, just not enough Fitbit history yet —
    // same neutral treatment as the connect card, not a warning color.
    if (result.error === "no_age" || result.error === "no_resting_heart_rate") {
      return (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl bg-zinc-100 p-4 dark:bg-zinc-900">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Almost there.</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{result.message}</p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-zinc-300 px-4 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Check again
            </a>
            <a href="/api/auth/logout" className="text-xs text-zinc-500 underline dark:text-zinc-400">
              Disconnect
            </a>
          </div>
        </div>
      );
    }

    // State 6 (error): reassuring, not alarming — a scary-looking error on a health-adjacent
    // product can itself cause worry, so this stays visually calm too.
    return (
      <div className="mt-6 space-y-4">
        <div className="rounded-xl bg-zinc-100 p-4 dark:bg-zinc-900">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Something didn&apos;t load right.
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {result.message} This is on us, not your data.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-zinc-300 px-4 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Try again
          </a>
          <a href="/api/auth/logout" className="text-xs text-zinc-500 underline dark:text-zinc-400">
            Disconnect
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-xl bg-zinc-100 p-6 text-center dark:bg-zinc-900">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Estimated VO2 max</p>
        <p className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">{result.vo2max}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">mL/kg/min</p>
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Resting heart rate</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-50">
            {result.restingHeartRate} bpm
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Age</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-50">{result.age}</dd>
        </div>
      </dl>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Estimate only, based on the Uth–Sørensen–Overgaard–Pedersen formula (HRmax/HRrest). Most
        accurate for moderately fit adults — not a substitute for a lab-measured VO2max test.
      </p>

      {process.env.GEMINI_API_KEY ? (
        <StopBangForm />
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-300 p-4 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          AeroCoach is disabled — set <code>GEMINI_API_KEY</code> in <code>.env.local</code> to
          enable daily AI coaching.
        </div>
      )}

      <a href="/api/auth/logout" className="text-xs text-zinc-500 underline dark:text-zinc-400">
        Disconnect
      </a>
    </div>
  );
}
