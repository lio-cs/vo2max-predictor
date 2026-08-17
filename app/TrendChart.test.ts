import { describe, it, expect } from "vitest";
import { daysBetween, fillDailyGaps, MAX_DAILY_SPAN } from "./TrendChart";

describe("daysBetween", () => {
  it("returns 0 for the same date", () => {
    expect(daysBetween("2026-08-10", "2026-08-10")).toBe(0);
  });

  it("counts consecutive days", () => {
    expect(daysBetween("2026-08-10", "2026-08-11")).toBe(1);
  });

  it("counts across a month boundary", () => {
    expect(daysBetween("2026-07-30", "2026-08-02")).toBe(3);
  });
});

describe("fillDailyGaps", () => {
  it("returns entries unchanged when there are no gaps", () => {
    const history = [
      { date: "2026-08-10", vo2max: 38 },
      { date: "2026-08-11", vo2max: 39 },
      { date: "2026-08-12", vo2max: 40 },
    ];
    expect(fillDailyGaps(history)).toEqual(history);
  });

  it("inserts null placeholders for skipped calendar days", () => {
    const history = [
      { date: "2026-08-10", vo2max: 38 },
      { date: "2026-08-13", vo2max: 41 },
    ];
    expect(fillDailyGaps(history)).toEqual([
      { date: "2026-08-10", vo2max: 38 },
      { date: "2026-08-11", vo2max: null },
      { date: "2026-08-12", vo2max: null },
      { date: "2026-08-13", vo2max: 41 },
    ]);
  });

  it("handles multiple separate gaps", () => {
    const history = [
      { date: "2026-08-01", vo2max: 36 },
      { date: "2026-08-03", vo2max: 37 },
      { date: "2026-08-07", vo2max: 39 },
    ];
    const result = fillDailyGaps(history);
    expect(result).toHaveLength(7);
    expect(result.map((s) => s.vo2max)).toEqual([36, null, 37, null, null, null, 39]);
  });

  it("falls back to plain sequential entries when the span exceeds MAX_DAILY_SPAN", () => {
    const history = [
      { date: "2026-01-01", vo2max: 35 },
      { date: "2026-08-10", vo2max: 40 },
    ];
    expect(daysBetween(history[0].date, history[1].date)).toBeGreaterThan(MAX_DAILY_SPAN);
    expect(fillDailyGaps(history)).toEqual(history);
  });

  it("stays within MAX_DAILY_SPAN at the boundary", () => {
    const history = [
      { date: "2026-08-01", vo2max: 35 },
      { date: "2026-08-31", vo2max: 40 }, // exactly 30 days apart
    ];
    const result = fillDailyGaps(history);
    expect(result).toHaveLength(31);
  });
});
