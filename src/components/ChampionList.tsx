import { championIcon } from "@/lib/ddragon";
import { kdaRatio, winRate } from "@/lib/format";
import type { ChampionSummary } from "@/lib/stats";

export function ChampionList({ champions, version }: { champions: ChampionSummary[]; version: string }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-muted">Recent champions</h2>
      {champions.length === 0 && <p className="text-sm text-muted">No recent games.</p>}
      <ul className="space-y-3">
        {champions.slice(0, 7).map((c) => (
          <li key={c.championName} className="flex items-center gap-3 text-sm">
            <img src={championIcon(version, c.championName)} alt="" className="size-9 rounded-full" />
            <div className="flex-1">
              <p className="font-semibold">{c.championName}</p>
              <p className="text-xs text-muted">{(c.cs / c.minutes).toFixed(1)} CS/min</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{kdaRatio(c.kills, c.deaths, c.assists)} KDA</p>
              <p className="text-xs text-muted">
                {winRate(c.wins, c.games)} · {c.games} game{c.games === 1 ? "" : "s"}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
