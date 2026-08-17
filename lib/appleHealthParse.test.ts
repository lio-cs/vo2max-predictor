import { describe, it, expect } from "vitest";
import { extractAttr, parseAppleDate, computeAge, AppleHealthLineAccumulator } from "./appleHealthParse";

// Real sample lines pulled from an actual Apple Health export.xml, not fabricated —
// verified against a live export before writing the parser against them.
const ME_LINE =
  ' <Me HKCharacteristicTypeIdentifierDateOfBirth="2007-05-09" HKCharacteristicTypeIdentifierBiologicalSex="HKBiologicalSexFemale" HKCharacteristicTypeIdentifierBloodType="HKBloodTypeNotSet" HKCharacteristicTypeIdentifierFitzpatrickSkinType="HKFitzpatrickSkinTypeNotSet" HKCharacteristicTypeIdentifierCardioFitnessMedicationsUse="None"/>';

const HR_LINE_OLDER =
  ' <Record type="HKQuantityTypeIdentifierRestingHeartRate" sourceName="Jyrah’s Apple Watch" sourceVersion="26.5" unit="count/min" creationDate="2026-06-01 21:27:55 +0300" startDate="2026-06-01 16:50:49 +0300" endDate="2026-06-01 21:22:32 +0300" value="88"/>';

const HR_LINE_NEWER =
  ' <Record type="HKQuantityTypeIdentifierRestingHeartRate" sourceName="Jyrah’s Apple Watch" sourceVersion="26.5" unit="count/min" creationDate="2026-06-09 21:27:55 +0300" startDate="2026-06-09 16:50:49 +0300" endDate="2026-06-09 21:22:32 +0300" value="93"/>';

const O2_LINE =
  ' <Record type="HKQuantityTypeIdentifierOxygenSaturation" sourceName="Jyrah’s Apple Watch" sourceVersion="26.5" device="&lt;&lt;HKDevice: 0x74e51dd40&gt;, name:Apple Watch&gt;" unit="%" creationDate="2026-06-10 21:18:24 +0300" startDate="2026-06-10 21:18:24 +0300" endDate="2026-06-10 21:18:24 +0300" value="0.96">';

const UNRELATED_LINE =
  ' <Record type="HKQuantityTypeIdentifierStepCount" sourceName="iPhone" unit="count" startDate="2026-06-10 09:00:00 +0300" endDate="2026-06-10 09:05:00 +0300" value="412"/>';

describe("extractAttr", () => {
  it("extracts a named attribute's value", () => {
    expect(extractAttr(HR_LINE_NEWER, "value")).toBe("93");
    expect(extractAttr(HR_LINE_NEWER, "unit")).toBe("count/min");
  });

  it("returns null for a missing attribute", () => {
    expect(extractAttr(HR_LINE_NEWER, "notAnAttribute")).toBeNull();
  });

  it("doesn't false-positive on a substring match without the word boundary", () => {
    // "startDate" contains "Date" but shouldn't match a request for "Date"
    expect(extractAttr(HR_LINE_NEWER, "Date")).toBeNull();
  });
});

describe("parseAppleDate", () => {
  it("parses Apple's space-separated-offset timestamp format", () => {
    const ms = parseAppleDate("2026-06-09 16:50:49 +0300");
    expect(Number.isNaN(ms)).toBe(false);
    expect(new Date(ms).toISOString()).toBe("2026-06-09T13:50:49.000Z");
  });

  it("returns NaN for an unrecognized format", () => {
    expect(Number.isNaN(parseAppleDate("not a date"))).toBe(true);
  });
});

describe("computeAge", () => {
  it("computes age when the birthday has already passed this year", () => {
    expect(computeAge("2007-05-09", new Date("2026-08-16T00:00:00Z"))).toBe(19);
  });

  it("computes age when the birthday hasn't happened yet this year", () => {
    expect(computeAge("2007-12-25", new Date("2026-08-16T00:00:00Z"))).toBe(18);
  });

  it("handles a birthday exactly today as already had", () => {
    expect(computeAge("2007-08-16", new Date("2026-08-16T00:00:00Z"))).toBe(19);
  });
});

describe("AppleHealthLineAccumulator", () => {
  it("extracts date of birth, latest resting heart rate, and latest oxygen from real sample lines", () => {
    const acc = new AppleHealthLineAccumulator();
    for (const line of [ME_LINE, HR_LINE_OLDER, UNRELATED_LINE, HR_LINE_NEWER, O2_LINE]) {
      acc.processLine(line);
    }
    const result = acc.finish();
    expect(result).toEqual({
      age: computeAge("2007-05-09"),
      restingHeartRate: 93, // the newer of the two HR readings, not the older one
      oxygenPercentage: 96, // 0.96 fraction -> 96%
    });
  });

  it("picks the latest heart rate regardless of line order", () => {
    const acc = new AppleHealthLineAccumulator();
    for (const line of [ME_LINE, HR_LINE_NEWER, HR_LINE_OLDER]) {
      acc.processLine(line);
    }
    const result = acc.finish();
    expect("restingHeartRate" in result && result.restingHeartRate).toBe(93);
  });

  it("returns no_date_of_birth when <Me> is missing", () => {
    const acc = new AppleHealthLineAccumulator();
    acc.processLine(HR_LINE_NEWER);
    expect(acc.finish()).toEqual({
      error: "no_date_of_birth",
      message: expect.stringContaining("date of birth"),
    });
  });

  it("returns no_resting_heart_rate when no HR record was found", () => {
    const acc = new AppleHealthLineAccumulator();
    acc.processLine(ME_LINE);
    expect(acc.finish()).toEqual({
      error: "no_resting_heart_rate",
      message: expect.stringContaining("resting heart rate"),
    });
  });

  it("returns null oxygenPercentage when no SpO2 record was found, without failing", () => {
    const acc = new AppleHealthLineAccumulator();
    acc.processLine(ME_LINE);
    acc.processLine(HR_LINE_NEWER);
    const result = acc.finish();
    expect("oxygenPercentage" in result && result.oxygenPercentage).toBeNull();
  });

  it("ignores unrelated record types", () => {
    const acc = new AppleHealthLineAccumulator();
    acc.processLine(ME_LINE);
    acc.processLine(UNRELATED_LINE);
    acc.processLine(HR_LINE_NEWER);
    const result = acc.finish();
    expect("restingHeartRate" in result && result.restingHeartRate).toBe(93);
  });
});
