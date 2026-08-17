interface HistoryPoint {
  date: string;
  vo2max: number;
}

interface Milestone {
  type: "new_high" | "improving_streak";
  message: string;
}

interface TrendChartProps {
  history: HistoryPoint[];
  milestone: Milestone | null;
  provider: "google" | "apple";
}

export interface DisplaySlot {
  date: string;
  vo2max: number | null;
}

export const MAX_DAILY_SPAN = 30; // see fillDailyGaps's comment below

export function daysBetween(a: string, b: string): number {
  const start = new Date(`${a}T00:00:00Z`).getTime();
  const end = new Date(`${b}T00:00:00Z`).getTime();
  return Math.round((end - start) / 86_400_000);
}

/**
 * Google/Fitbit readings can be sporadic — a user might connect, skip two weeks, then come
 * back. Plotting the (at most 7) stored entries back-to-back would silently compress those
 * gaps away, making irregular use look like a clean daily streak. This fills in every calendar
 * day between the oldest and newest entry, in true 24-hour increments, so a skipped day renders
 * as a visible gap instead of vanishing. Bounded to MAX_DAILY_SPAN days so a genuinely sparse
 * history (e.g. one reading a month) doesn't render dozens of near-invisible slivers — falls
 * back to plain sequential spacing beyond that, same as the Apple path below.
 */
export function fillDailyGaps(history: HistoryPoint[]): DisplaySlot[] {
  const span = daysBetween(history[0].date, history[history.length - 1].date);
  if (span > MAX_DAILY_SPAN) {
    return history.map((h) => ({ date: h.date, vo2max: h.vo2max }));
  }

  const byDate = new Map(history.map((h) => [h.date, h.vo2max]));
  const start = new Date(`${history[0].date}T00:00:00Z`);
  const slots: DisplaySlot[] = [];
  for (let i = 0; i <= span; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    slots.push({ date: dateStr, vo2max: byDate.get(dateStr) ?? null });
  }
  return slots;
}

export function TrendChart({ history, milestone, provider }: TrendChartProps) {
  if (history.length < 2) {
    return (
      <p className="text-xs text-ink-faint">
        Come back after a few more readings to see your VO2max trend here.
      </p>
    );
  }

  // Apple's readings come from a single point-in-time export, not a continuously-synced
  // device, so entries don't carry the same "did they skip a day" meaning Fitbit's do —
  // deliberately left as plain sequential spacing, unchanged from before this split existed.
  const slots: DisplaySlot[] = provider === "google" ? fillDailyGaps(history) : history.map((h) => ({ date: h.date, vo2max: h.vo2max }));

  const values = history.map((h) => h.vo2max);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1; // avoid divide-by-zero when every reading is identical

  const latestDate = history[history.length - 1].date;

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1.5" style={{ height: 56 }}>
        {slots.map((slot) => {
          const hasReading = slot.vo2max != null;
          // Floor at 15% height so even the lowest bar in the window stays visible, not a sliver.
          const heightPct = hasReading ? 15 + ((slot.vo2max! - min) / range) * 85 : 6;
          const isLatest = hasReading && slot.date === latestDate;
          return (
            <div key={slot.date} className="flex flex-1 flex-col items-center justify-end gap-1">
              <div
                className={`w-full rounded-t ${
                  !hasReading ? "border border-dashed border-hairline bg-transparent" : isLatest ? "bg-accent" : "bg-hairline"
                }`}
                style={{ height: `${heightPct}%` }}
                title={hasReading ? `${slot.date}: ${slot.vo2max} mL/kg/min` : `${slot.date}: no reading`}
              />
            </div>
          );
        })}
      </div>
      {milestone && (
        <p className="rounded-full bg-accent-soft px-2.5 py-1 text-center text-[11px] font-medium text-accent-ink">
          {milestone.message}
        </p>
      )}
    </div>
  );
}
