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
}

export function TrendChart({ history, milestone }: TrendChartProps) {
  if (history.length < 2) {
    return (
      <p className="text-xs text-ink-faint">
        Come back after a few more readings to see your VO2max trend here.
      </p>
    );
  }

  const values = history.map((h) => h.vo2max);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1; // avoid divide-by-zero when every reading is identical

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1.5" style={{ height: 56 }}>
        {history.map((point, i) => {
          // Floor at 15% height so even the lowest bar in the window stays visible, not a sliver.
          const heightPct = 15 + ((point.vo2max - min) / range) * 85;
          const isLatest = i === history.length - 1;
          return (
            <div key={point.date} className="flex flex-1 flex-col items-center justify-end gap-1">
              <div
                className={`w-full rounded-t ${isLatest ? "bg-accent" : "bg-hairline"}`}
                style={{ height: `${heightPct}%` }}
                title={`${point.date}: ${point.vo2max} mL/kg/min`}
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
