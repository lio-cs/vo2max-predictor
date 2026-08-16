"use client";

import { useState } from "react";
import { FollowUpChat } from "./FollowUpChat";
import { LoadingLines } from "./LoadingLines";
import { TrendChart } from "./TrendChart";
import { VO2MaxContext } from "./VO2MaxContext";

interface StopBangAnswers {
  snoring: boolean;
  tiredness: boolean;
  observedApnea: boolean;
  highBloodPressure: boolean;
  bmiOver35: boolean;
  ageOver50: boolean;
  neckOver40cm: boolean;
  male: boolean;
}

const QUESTIONS: Array<{ key: keyof StopBangAnswers; label: string }> = [
  { key: "snoring", label: "Do you snore loudly (louder than talking or loud enough to be heard through closed doors)?" },
  { key: "tiredness", label: "Do you often feel tired, fatigued, or sleepy during the daytime?" },
  { key: "observedApnea", label: "Has anyone observed you stop breathing during your sleep?" },
  { key: "highBloodPressure", label: "Do you have, or are you being treated for, high blood pressure?" },
  { key: "bmiOver35", label: "Is your BMI more than 35 kg/m²?" },
  { key: "ageOver50", label: "Are you older than 50?" },
  { key: "neckOver40cm", label: "Is your neck circumference greater than 40 cm (about 16 in)?" },
  { key: "male", label: "Is your sex male?" },
];

const DEFAULT_ANSWERS: StopBangAnswers = {
  snoring: false,
  tiredness: false,
  observedApnea: false,
  highBloodPressure: false,
  bmiOver35: false,
  ageOver50: false,
  neckOver40cm: false,
  male: false,
};

interface CoachDecision {
  riskExplanation: string;
  recommendedAction: { type: string; rationale: string };
  motivationalNudge: string;
}

interface CoachResponse {
  fitness: { vo2max: number; trend: string };
  oxygen: { percentage: number; level: "normal" | "borderline" | "low" } | null;
  stopBang: { score: number; riskLevel: "low" | "intermediate" | "high" };
  decision: CoachDecision;
  history: Array<{ date: string; vo2max: number }>;
  milestone: { type: "new_high" | "improving_streak"; message: string } | null;
}

const WHY_THIS_MATTERS =
  "Sleep apnea affects an estimated 1 in 3 US adults, and about 80% don't know they have it. " +
  "It's not something your fitness tracker can diagnose — but the patterns it's picking up are " +
  "worth a closer look.";

interface StopBangFormProps {
  age: number;
}

export function StopBangForm({ age }: StopBangFormProps) {
  const [answers, setAnswers] = useState<StopBangAnswers>(DEFAULT_ANSWERS);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<CoachResponse | null>(null);
  // Explicit consent gate for processing special-category health data (GDPR Art. 9) — see
  // app/privacy/page.tsx. Required before submission, not just disclosed after the fact.
  const [consented, setConsented] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consented) return;
    setStatus("loading");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stopBang: answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Something went wrong");
      }
      setResult(data as CoachResponse);
      setStatus("idle");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  if (!result) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-hairline p-5">
        <div>
          <p className="font-display text-base font-medium text-ink">AeroCoach — OSA screening (STOP-BANG)</p>
          <p className="mt-1 text-xs text-ink-faint">
            8 quick yes/no questions. STOP-BANG is a validated screening questionnaire, not a
            diagnostic test — AeroCoach does not diagnose OSA or any other condition, only a
            clinician-ordered sleep study can. The information shown, including any
            AI-generated explanation, is general health information, not medical advice.
          </p>
        </div>

        {status === "loading" ? (
          // Keeps the same card shell (title + border) in place while swapping the
          // questions out for rotating status copy — no layout jump between states.
          <div className="rounded-lg bg-paper-alt p-4">
            <LoadingLines
              lines={[
                "Scoring your STOP-BANG answers…",
                "Checking in on your fitness trend…",
                "Translating that into plain English…",
              ]}
              stallMessage="Still working — almost there…"
            />
          </div>
        ) : (
          <div className="space-y-2">
            {QUESTIONS.map((q) => (
              <label key={q.key} className="flex items-start gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={answers[q.key]}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.checked }))}
                  className="mt-0.5 accent-accent"
                />
                {q.label}
              </label>
            ))}
          </div>
        )}

        {errorMessage && (
          <p className="rounded-lg bg-paper-alt px-3 py-2 text-xs text-ink-soft">{errorMessage}</p>
        )}

        {status !== "loading" && (
          <label className="flex items-start gap-2 text-xs text-ink-soft">
            <input
              type="checkbox"
              checked={consented}
              onChange={(e) => setConsented(e.target.checked)}
              className="mt-0.5 accent-accent"
            />
            I consent to processing my screening answers and fitness data as described in the{" "}
            <a href="/privacy" target="_blank" rel="noreferrer" className="underline">
              Privacy Policy
            </a>
            .
          </label>
        )}

        <button
          type="submit"
          disabled={status === "loading" || !consented}
          className="inline-flex w-full items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-all hover:-translate-y-0.5 hover:bg-accent disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          {status === "loading" ? "Checking…" : "Get my coaching"}
        </button>
      </form>
    );
  }

  const { fitness, oxygen, stopBang, decision, history, milestone } = result;

  return (
    <div className="space-y-4">
      <div className="space-y-4 rounded-xl border border-hairline bg-paper-alt p-5">
        <div className="flex items-center justify-between">
          <p className="font-display text-base font-medium text-ink">AeroCoach</p>
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent-ink capitalize">
            {stopBang.riskLevel} risk
          </span>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
            What your data&apos;s been saying
          </p>
          <p className="mt-1 text-sm text-ink">{decision.riskExplanation}</p>
        </div>

        <details className="group rounded-lg bg-paper px-3 py-2.5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-semibold tracking-wide text-ink-faint uppercase [&::-webkit-details-marker]:hidden">
            Why this matters
            <ChevronIcon className="h-3.5 w-3.5 shrink-0 text-accent transition-transform group-open:rotate-180" />
          </summary>
          <p className="mt-2 text-sm text-ink">{WHY_THIS_MATTERS}</p>
        </details>

        <div>
          <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">What to do next</p>
          <div className="mt-1 rounded-lg bg-paper p-3 text-sm">
            <p className="font-medium text-ink capitalize">{decision.recommendedAction.type.replace(/_/g, " ")}</p>
            <p className="mt-1 text-xs text-ink-soft">{decision.recommendedAction.rationale}</p>
          </div>
        </div>

        <p className="text-xs text-ink-soft italic">{decision.motivationalNudge}</p>

        <div>
          <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">Your trend</p>
          <div className="mt-1 rounded-lg bg-paper p-3">
            <TrendChart history={history} milestone={milestone} />
          </div>
        </div>

        <VO2MaxContext vo2max={fitness.vo2max} age={age} sex={answers.male ? "male" : "female"} />

        <p className="text-[10px] text-ink-faint">
          VO2max {fitness.vo2max} mL/kg/min (trend: {fitness.trend.replace(/_/g, " ")})
          {oxygen ? ` · Blood oxygen ${oxygen.percentage}% (${oxygen.level})` : ""} — general fitness
          context, separate from your OSA risk tier above, not evidence of OSA risk itself. AeroCoach is a
          wellness and educational tool, not a diagnostic medical device. It doesn&apos;t replace a physician
          or a clinical sleep study — it helps you know when it&apos;s time to ask for one.
        </p>

        <button onClick={() => setResult(null)} className="text-xs text-ink-faint underline">
          Redo screening
        </button>
      </div>

      {/* Separate card, not nested in the result card above — the thread grows as the user asks
          follow-ups, and FollowUpChat caps its own height with internal scroll (see that file),
          so this outer card stays a fixed, predictable size instead of the whole page growing. */}
      <FollowUpChat stopBang={stopBang} fitness={fitness} oxygen={oxygen} decision={decision} />
    </div>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
