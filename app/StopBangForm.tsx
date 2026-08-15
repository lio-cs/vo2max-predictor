"use client";

import { useState } from "react";
import { FollowUpChat } from "./FollowUpChat";

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
  stopBang: { score: number; riskLevel: "low" | "intermediate" | "high" };
  decision: CoachDecision;
}

const RISK_STYLES: Record<string, string> = {
  low: "bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100",
  intermediate: "bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100",
  high: "bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100",
};

export function StopBangForm() {
  const [answers, setAnswers] = useState<StopBangAnswers>(DEFAULT_ANSWERS);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<CoachResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">AeroCoach — OSA screening (STOP-BANG)</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            8 quick yes/no questions. STOP-BANG is a validated screening questionnaire, not a
            diagnostic test — AeroCoach does not diagnose OSA or any other condition, only a
            clinician-ordered sleep study can. The information shown, including any
            AI-generated explanation, is general health information, not medical advice.
          </p>
        </div>

        <div className="space-y-2">
          {QUESTIONS.map((q) => (
            <label key={q.key} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={answers[q.key]}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.checked }))}
                className="mt-0.5"
              />
              {q.label}
            </label>
          ))}
        </div>

        {errorMessage && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex w-full items-center justify-center rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {status === "loading" ? "Checking…" : "Get my coaching"}
        </button>
      </form>
    );
  }

  const { fitness, stopBang, decision } = result;

  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">AeroCoach</p>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${RISK_STYLES[stopBang.riskLevel]}`}>
          STOP-BANG {stopBang.score}/8 · {stopBang.riskLevel} risk
        </span>
      </div>

      <p className="text-sm text-zinc-800 dark:text-zinc-200">{decision.riskExplanation}</p>

      <div className="rounded-lg bg-white/60 p-3 text-sm dark:bg-black/20">
        <p className="font-medium text-zinc-900 dark:text-zinc-50">
          Recommended: {decision.recommendedAction.type.replace(/_/g, " ")}
        </p>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{decision.recommendedAction.rationale}</p>
      </div>

      <p className="text-xs italic text-zinc-600 dark:text-zinc-400">{decision.motivationalNudge}</p>

      <p className="text-[10px] text-zinc-500 dark:text-zinc-500">
        VO2max {fitness.vo2max} mL/kg/min (trend: {fitness.trend.replace(/_/g, " ")}) — general fitness context,
        separate from your OSA risk tier above, not evidence of OSA risk itself. This is a screening result,
        not a diagnosis — talk to a healthcare provider if you&apos;re concerned about your symptoms.
      </p>

      <button
        onClick={() => setResult(null)}
        className="text-xs text-zinc-500 underline dark:text-zinc-400"
      >
        Redo screening
      </button>

      <FollowUpChat stopBang={stopBang} fitness={fitness} decision={decision} />
    </div>
  );
}
