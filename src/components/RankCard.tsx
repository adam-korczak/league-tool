import { winRate } from "@/lib/format";
import type { LeagueEntry } from "@/lib/riot/types";

const TIER_COLORS: Record<string, string> = {
  IRON: "#8c7a72",
  BRONZE: "#b0754d",
  SILVER: "#9fb0bd",
  GOLD: "#e2b04a",
  PLATINUM: "#3fb6a8",
  EMERALD: "#2ec27e",
  DIAMOND: "#6f8cff",
  MASTER: "#b45ee8",
  GRANDMASTER: "#e8534a",
  CHALLENGER: "#f4d27a",
};

// Master+ has no divisions.
const APEX = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"]);

export function RankCard({ title, entry, quip }: { title: string; entry?: LeagueEntry; quip: string | null }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-muted">{title}</h2>
      {entry ? (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-bold capitalize" style={{ color: TIER_COLORS[entry.tier] }}>
              {entry.tier.toLowerCase()} {APEX.has(entry.tier) ? "" : entry.rank}
            </p>
            <p className="text-sm">{entry.leaguePoints} LP</p>
          </div>
          <div className="text-right text-sm">
            <p>
              {entry.wins}W {entry.losses}L
            </p>
            <p className="text-muted">{winRate(entry.wins, entry.wins + entry.losses)} win rate</p>
          </div>
        </div>
      ) : (
        <p className="text-muted">Unranked</p>
      )}
      {quip && <p className="mt-3 border-t border-border pt-2 text-xs text-muted italic">{quip}</p>}
    </section>
  );
}
