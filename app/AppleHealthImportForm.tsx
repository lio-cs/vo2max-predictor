"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseAppleHealthZip } from "@/lib/appleHealthParse";

type Status = "idle" | "reading" | "uploading" | "error";

export function AppleHealthImportForm() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleFile(file: File) {
    setStatus("reading");
    setProgress(0);
    setErrorMessage(null);

    const result = await parseAppleHealthZip(file, (bytesRead, totalBytes) => {
      setProgress(totalBytes > 0 ? bytesRead / totalBytes : 0);
    });

    if ("error" in result) {
      setErrorMessage(result.message);
      setStatus("error");
      return;
    }

    setStatus("uploading");
    try {
      const res = await fetch("/api/apple-health/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Couldn't save that import. Please try again.");
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  return (
    <div className="space-y-3">
      <label
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-hairline bg-paper-alt px-4 py-8 text-center transition-colors hover:border-accent ${
          status === "reading" || status === "uploading" ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6 text-ink-faint">
          <path
            d="M12 16V4m0 0 4 4m-4-4-4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-sm font-medium text-ink">Choose your export.zip</span>
        <div className="space-y-0.5 text-xs leading-relaxed text-ink-faint">
          <p>1. Open the Health app</p>
          <p>2. Tap your profile picture, top right</p>
          <p>3. Tap Export All Health Data</p>
        </div>
        <input
          type="file"
          accept=".zip,application/zip"
          className="sr-only"
          disabled={status === "reading" || status === "uploading"}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </label>

      {status === "reading" && (
        <div className="space-y-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-paper-alt">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${Math.max(4, Math.round(progress * 100))}%` }}
            />
          </div>
          <p className="text-xs text-ink-faint" aria-live="polite">
            Reading your export in your browser — this file never leaves your device. {Math.round(progress * 100)}%
          </p>
        </div>
      )}

      {status === "uploading" && <p className="text-xs text-ink-faint">Saving…</p>}

      {status === "error" && errorMessage && (
        <p className="rounded-lg bg-paper-alt px-3 py-2 text-xs text-ink-soft">{errorMessage}</p>
      )}

      <p className="text-[11px] text-ink-faint">
        Your export is parsed entirely in your browser — only your age, resting heart rate, and blood oxygen
        (if available) are sent to AeroCoach. The zip file itself is never uploaded anywhere.
      </p>
    </div>
  );
}
