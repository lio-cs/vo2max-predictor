import { LoadingLines } from "./LoadingLines";

// Suspense fallback for <Result/> in page.tsx — covers the moment between "session cookie
// found" and "Google Health responded," so a slow API call doesn't leave a blank content area.
export function ConnectingState() {
  return (
    <div className="rounded-xl bg-paper-alt p-6">
      <svg
        aria-hidden
        viewBox="0 0 64 24"
        className="mb-4 h-6 w-16 text-accent"
      >
        <path
          d="M0 12h14l6-10 8 20 6-14 6 8 6-4h18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-draw-line"
        />
      </svg>
      <LoadingLines
        lines={[
          "Connecting to Fitbit…",
          "Reading your VO2max and sleep trends…",
          "Translating that into plain English…",
        ]}
        stallMessage="Still working — this is taking longer than usual…"
      />
    </div>
  );
}
