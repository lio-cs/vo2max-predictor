"use client";

import { getVO2MaxRangeContext, type Sex } from "@/lib/vo2maxRanges";

interface VO2MaxContextProps {
  vo2max: number;
  age: number;
  /** Reuse whatever value STOP-BANG's gender item already produced — no new data collection. */
  sex: Sex;
  /** Optional: render expanded by default (e.g. first time a user sees the result). Defaults closed. */
  defaultOpen?: boolean;
}

const BAND_COPY: Record<string, string> = {
  below_average: "a little below typical for your age",
  average: "right in the typical range for your age",
  above_average: "above typical for your age",
};

export function VO2MaxContext({ vo2max, age, sex, defaultOpen = false }: VO2MaxContextProps) {
  const { typicalLow, typicalHigh, strongThreshold, band } = getVO2MaxRangeContext(vo2max, age, sex);

  return (
    <details
      open={defaultOpen}
      className="group rounded-lg bg-paper px-4 py-3 text-sm text-ink open:pb-4"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="font-medium">VO2max {vo2max}</span>
          <span className="text-ink/70"> · {BAND_COPY[band]}</span>
        </span>
        <ChevronIcon className="h-4 w-4 shrink-0 text-accent transition-transform group-open:rotate-180" />
      </summary>

      <div className="mt-3 space-y-2 text-ink/80">
        <p>
          Typical range for your age:{" "}
          <span className="font-medium text-ink">
            {typicalLow}–{typicalHigh} ml/kg/min
          </span>{" "}
          (around {strongThreshold}+ is considered strong).
        </p>
        <p>
          VO2max isn&apos;t fixed — it tends to shift over weeks to months with consistent
          activity. It&apos;s a trend to build, not a score to fix overnight.
        </p>
        <p className="text-xs text-ink/60">
          This is fitness context, not part of your sleep-apnea result. AeroCoach is an
          advisor, not a doctor.
        </p>
        <p className="text-xs text-ink/60">
          Ranges from the ACSM Guidelines for Exercise Testing and Prescription (11th ed.),
          Cooper Institute normative data.
        </p>
      </div>
    </details>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
