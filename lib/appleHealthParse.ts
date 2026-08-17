import { Unzip, UnzipInflate } from "fflate";

/**
 * Parses an Apple Health "export.zip" entirely client-side. Real exports are commonly
 * hundreds of MB uncompressed (export.xml alone) — this streams the zip's bytes straight from
 * the File object, decompresses only the one entry we need, and reads it line-by-line, never
 * holding more than the current line + the running "latest so far" values in memory. It also
 * never leaves the browser: only the handful of scalars extracted below are ever sent to the
 * server (see app/api/apple-health/import/route.ts), both because Cloud Run hard-caps request
 * bodies at 32MB (real exports routinely exceed that) and because there's no reason for the
 * server to ever see the full export.
 */

export interface AppleHealthParseResult {
  age: number;
  restingHeartRate: number;
  oxygenPercentage: number | null;
}

export type AppleHealthParseError =
  | { error: "missing_export"; message: string }
  | { error: "no_date_of_birth"; message: string }
  | { error: "no_resting_heart_rate"; message: string }
  | { error: "parse_error"; message: string };

const RESTING_HR_TYPE = 'type="HKQuantityTypeIdentifierRestingHeartRate"';
const OXYGEN_TYPE = 'type="HKQuantityTypeIdentifierOxygenSaturation"';

export function extractAttr(line: string, name: string): string | null {
  const match = line.match(new RegExp(`\\b${name}="([^"]*)"`));
  return match ? match[1] : null;
}

/**
 * Apple's export.xml timestamps look like "2026-06-09 16:50:49 +0300" — not valid ISO 8601
 * (space instead of "T", no colon in the offset), so Date's built-in parser can't be trusted
 * to handle it consistently. Rewritten into a strict ISO string before parsing.
 */
export function parseAppleDate(raw: string): number {
  const match = raw.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) ([+-]\d{2})(\d{2})$/);
  if (!match) return NaN;
  const [, date, time, offHours, offMinutes] = match;
  return new Date(`${date}T${time}${offHours}:${offMinutes}`).getTime();
}

export function computeAge(dateOfBirth: string, now: Date = new Date()): number {
  const dob = new Date(`${dateOfBirth}T00:00:00Z`);
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const hadBirthdayThisYear =
    now.getUTCMonth() > dob.getUTCMonth() ||
    (now.getUTCMonth() === dob.getUTCMonth() && now.getUTCDate() >= dob.getUTCDate());
  if (!hadBirthdayThisYear) age--;
  return age;
}

/**
 * Accumulates the three values we need (date of birth, latest resting heart rate, latest
 * SpO2) from export.xml's lines, in a single streaming pass — kept separate from the fflate
 * wiring below so this logic is unit-testable against real sample lines without needing a
 * browser's File/stream APIs.
 */
export class AppleHealthLineAccumulator {
  private dateOfBirth: string | null = null;
  private latestHeartRate: { value: number; at: number } | null = null;
  private latestOxygen: { value: number; at: number } | null = null;

  processLine(line: string): void {
    if (this.dateOfBirth === null && line.includes("<Me ")) {
      this.dateOfBirth = extractAttr(line, "HKCharacteristicTypeIdentifierDateOfBirth");
      return;
    }
    if (line.includes(RESTING_HR_TYPE)) {
      this.considerReading(line, (value, at) => {
        if (!this.latestHeartRate || at > this.latestHeartRate.at) {
          this.latestHeartRate = { value, at };
        }
      });
      return;
    }
    if (line.includes(OXYGEN_TYPE)) {
      this.considerReading(line, (value, at) => {
        if (!this.latestOxygen || at > this.latestOxygen.at) {
          this.latestOxygen = { value, at };
        }
      });
    }
  }

  private considerReading(line: string, keep: (value: number, at: number) => void): void {
    const rawValue = extractAttr(line, "value");
    const startDate = extractAttr(line, "startDate");
    if (rawValue == null || startDate == null) return;
    const at = parseAppleDate(startDate);
    if (Number.isNaN(at)) return;
    keep(Number(rawValue), at);
  }

  finish(): AppleHealthParseResult | AppleHealthParseError {
    if (!this.dateOfBirth) {
      return {
        error: "no_date_of_birth",
        message:
          "Your export doesn't include a date of birth — set it in the Health app under your profile picture, then export again.",
      };
    }
    if (!this.latestHeartRate) {
      return {
        error: "no_resting_heart_rate",
        message: "No resting heart rate found in your export yet — wear your Apple Watch for a few more days and export again.",
      };
    }
    // HealthKit stores oxygen saturation as a 0-1 fraction even though its unit is "%".
    return {
      age: computeAge(this.dateOfBirth),
      restingHeartRate: this.latestHeartRate.value,
      oxygenPercentage: this.latestOxygen ? Math.round(this.latestOxygen.value * 100) : null,
    };
  }
}

export async function parseAppleHealthZip(
  file: File,
  onProgress?: (bytesRead: number, totalBytes: number) => void
): Promise<AppleHealthParseResult | AppleHealthParseError> {
  return new Promise((resolve) => {
    const accumulator = new AppleHealthLineAccumulator();
    const decoder = new TextDecoder();
    let lineBuffer = "";
    let foundExport = false;
    let settled = false;

    const settle = (result: AppleHealthParseResult | AppleHealthParseError) => {
      if (settled) return;
      settled = true;
      reader.cancel().catch(() => {});
      resolve(result);
    };

    const unzip = new Unzip((entry) => {
      if (!entry.name.endsWith("/export.xml")) return;
      foundExport = true;
      entry.ondata = (err, chunk, final) => {
        if (err) {
          settle({ error: "parse_error", message: "Couldn't read export.xml from that zip." });
          return;
        }
        // fflate's synchronous (non-worker) inflate doesn't stream its output in small
        // pieces the way it streams input — for a file this size it can hand back nearly
        // the entire decompressed content in one callback, which is well over V8's ~536M
        // character limit for a single string. Decoding in bounded slices sidesteps that
        // regardless of how large a chunk fflate hands us; lineBuffer itself stays small
        // either way since it's drained on every newline found.
        const SLICE_BYTES = 2_000_000;
        for (let offset = 0; offset < chunk.length; offset += SLICE_BYTES) {
          const slice = chunk.subarray(offset, offset + SLICE_BYTES);
          const isLastSlice = offset + SLICE_BYTES >= chunk.length;
          lineBuffer += decoder.decode(slice, { stream: !(final && isLastSlice) });
          let newlineIndex: number;
          while ((newlineIndex = lineBuffer.indexOf("\n")) !== -1) {
            accumulator.processLine(lineBuffer.slice(0, newlineIndex));
            lineBuffer = lineBuffer.slice(newlineIndex + 1);
          }
        }
        if (chunk.length === 0 && final) {
          lineBuffer += decoder.decode();
        }
        if (final) {
          if (lineBuffer) accumulator.processLine(lineBuffer);
          settle(accumulator.finish());
        }
      };
      entry.start();
    });
    unzip.register(UnzipInflate);

    const streamReader = file.stream().getReader();
    const reader = streamReader;
    let bytesRead = 0;

    function pump() {
      reader
        .read()
        .then(({ done, value }) => {
          if (settled) return;
          if (done) {
            unzip.push(new Uint8Array(0), true);
            if (!foundExport) {
              settle({
                error: "missing_export",
                message: "That doesn't look like an Apple Health export — make sure it's the zip from Health app → profile picture → Export All Health Data.",
              });
            }
            return;
          }
          bytesRead += value.byteLength;
          onProgress?.(bytesRead, file.size);
          unzip.push(value);
          pump();
        })
        .catch(() => settle({ error: "parse_error", message: "Couldn't read that file." }));
    }
    pump();
  });
}
