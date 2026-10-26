"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ROAST_COOKIE, ROAST_LEVELS, type RoastLevel } from "@/lib/quips";

const LABELS: Record<RoastLevel, string> = { wholesome: "😇 Wholesome", normal: "😏 Normal", unhinged: "🔥 Unhinged" };

export function RoastToggle({ level }: { level: RoastLevel }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(next: RoastLevel) {
    document.cookie = `${ROAST_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div className={`flex flex-col gap-1 ${pending ? "opacity-60" : ""}`}>
      <span className="text-xs font-semibold text-muted">Roast level</span>
      <div className="flex rounded-lg border border-border bg-surface p-0.5 text-xs" role="radiogroup" aria-label="Roast level">
        {ROAST_LEVELS.map((l) => (
          <button
            key={l}
            role="radio"
            aria-checked={l === level}
            onClick={() => choose(l)}
            className={`rounded-md px-3 py-1.5 font-semibold transition-colors ${
              l === level ? (l === "unhinged" ? "bg-loss text-white" : "bg-win text-white") : "text-muted hover:text-white"
            }`}
          >
            {LABELS[l]}
          </button>
        ))}
      </div>
    </div>
  );
}
