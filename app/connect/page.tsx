import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getAppleSession } from "@/lib/appleHealthSession";
import { AppleHealthImportForm } from "../AppleHealthImportForm";

interface Wearable {
  name: string;
  description: string;
  href: string | null;
}

// Fitbit (Google Health API, see lib/googleHealth.ts) and Apple Watch (Health app export, see
// lib/appleHealthParse.ts) are both real integrations. Everything else is still a roadmap
// signal for the XPRIZE narrative, not a built feature — no href, no flow, just a disabled card.
const WEARABLES: Wearable[] = [
  {
    name: "Fitbit",
    description: "Connect your Fitbit account to get started right away.",
    href: "/api/auth/login",
  },
  {
    name: "More wearables",
    description: "We're working on support for more devices.",
    href: null,
  },
];

function BrandRow() {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
      </span>
      <span className="font-display text-lg font-semibold tracking-tight text-ink">AeroCoach</span>
    </div>
  );
}

function WatchIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="none">
      <rect x="7" y="7" width="10" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M9 3.5h6M9 20.5h6M11 10.5v2.2l1.6 1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WearableCard({ name, description, href }: Wearable) {
  const available = href !== null;

  const card = (
    <div
      className={`flex items-center gap-4 rounded-xl border border-hairline bg-paper-alt p-4 transition-colors ${
        available ? "hover:border-accent" : "opacity-60"
      }`}
    >
      <WatchIcon className={`h-6 w-6 shrink-0 ${available ? "text-accent" : "text-ink-faint"}`} />
      <div className="flex-1">
        <p className="text-sm font-medium text-ink">{name}</p>
        <p className="mt-0.5 text-xs text-ink-faint">{description}</p>
      </div>
      {!available && (
        <span className="shrink-0 rounded-full border border-hairline px-2 py-0.5 text-[10px] font-medium text-ink-faint">
          Coming soon
        </span>
      )}
    </div>
  );

  if (!available) {
    return (
      <div aria-disabled="true" className="cursor-default">
        {card}
      </div>
    );
  }

  return (
    <a href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper rounded-xl">
      {card}
    </a>
  );
}

// Same outer chrome as WearableCard's "available" state, but Apple Watch needs an inline file
// picker rather than a single link — so it's its own block instead of going through the
// href-driven WEARABLES list above.
function AppleWatchCard() {
  return (
    <div className="space-y-3 rounded-xl border border-hairline bg-paper-alt p-4">
      <div className="flex items-center gap-4">
        <WatchIcon className="h-6 w-6 shrink-0 text-accent" />
        <div className="flex-1">
          <p className="text-sm font-medium text-ink">Apple Watch</p>
          <p className="mt-0.5 text-xs text-ink-faint">Import a Health app export to get started.</p>
        </div>
      </div>
      <AppleHealthImportForm />
    </div>
  );
}

export default async function ConnectPage() {
  const googleSession = await getSession();
  const appleSession = googleSession ? null : await getAppleSession();
  if (googleSession || appleSession) {
    redirect("/");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-16 sm:px-10">
        <Link href="/" className="w-fit">
          <BrandRow />
        </Link>

        <div className="mt-10">
          <h1 className="font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
            Choose your wearable
          </h1>
          <p className="mt-3 max-w-prose text-sm leading-relaxed text-ink-soft sm:text-base">
            AeroCoach works with the fitness data you already track. Pick where yours comes
            from — more devices are on the way.
          </p>
          <p className="mt-2 max-w-prose text-xs text-ink-faint">
            We only ever see your fitness data — never your name or email.
          </p>

          <div className="mt-8 space-y-3">
            <WearableCard {...WEARABLES[0]} />
            <AppleWatchCard />
            {WEARABLES.slice(1).map((w) => (
              <WearableCard key={w.name} {...w} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
