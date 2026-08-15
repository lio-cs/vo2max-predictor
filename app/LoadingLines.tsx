"use client";

import { useEffect, useState } from "react";

interface LoadingLinesProps {
  lines: string[];
  stallMessage: string;
  intervalMs?: number;
  stallAfterMs?: number;
}

// Rotates through `lines` to preview what's happening (and, on the connect flow, what the
// product does) instead of leaving a static spinner up — a stalled-looking spinner reads as
// broken on a slow connection, so we fall through to `stallMessage` after `stallAfterMs`.
export function LoadingLines({
  lines,
  stallMessage,
  intervalMs = 2500,
  stallAfterMs = 9000,
}: LoadingLinesProps) {
  const [index, setIndex] = useState(0);
  const [stalled, setStalled] = useState(false);

  useEffect(() => {
    const rotate = setInterval(() => {
      setIndex((i) => (i + 1) % lines.length);
    }, intervalMs);
    const stall = setTimeout(() => setStalled(true), stallAfterMs);
    return () => {
      clearInterval(rotate);
      clearTimeout(stall);
    };
  }, [lines.length, intervalMs, stallAfterMs]);

  return (
    <div className="flex items-center gap-3">
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-zinc-400 opacity-75 dark:bg-zinc-600" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-zinc-500 dark:bg-zinc-400" />
      </span>
      <p className="text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
        {stalled ? stallMessage : lines[index]}
      </p>
    </div>
  );
}
