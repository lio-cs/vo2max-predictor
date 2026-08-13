import { getSession } from "@/lib/session";
import { computeVo2Max } from "@/lib/vo2max-service";
import { StopBangForm } from "./StopBangForm";

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "You declined the Google Health authorization request.",
  invalid_state: "That login attempt couldn't be verified. Please try again.",
  token_exchange_failed: "Something went wrong talking to Google Health. Please try again.",
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
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          VO2 Max Predictor
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Estimates your cardiorespiratory fitness (VO2max) from your Fitbit resting heart rate
          and age, via the Google Health API.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {ERROR_MESSAGES[error] ?? "Something went wrong. Please try again."}
          </p>
        )}

        {!session ? (
          <a
            href="/api/auth/login"
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Connect Google Health
          </a>
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
          Connect Google Health
        </a>
      );
    }

    return (
      <div className="mt-6 space-y-4">
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          {result.message}
        </p>
        <a href="/api/auth/logout" className="text-xs text-zinc-500 underline dark:text-zinc-400">
          Disconnect
        </a>
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
