import { LoadingLines } from "./LoadingLines";

// Suspense fallback for <Result/> in page.tsx — covers the moment between "session cookie
// found" and "Google Health responded," so a slow API call doesn't leave a blank content area.
export function ConnectingState() {
  return (
    <div className="mt-6 rounded-xl bg-zinc-100 p-6 dark:bg-zinc-900">
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
