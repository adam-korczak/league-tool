import { kdaRatio, percent, winRate } from "@/lib/format";
import type { Summary } from "@/lib/stats";

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-lg font-bold">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}

export function RecentSummary({ summary: s }: { summary: Summary }) {
  if (s.games === 0) return null;
  const avg = (n: number) => (n / s.games).toFixed(1);

  return (
    <section className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-surface p-4 sm:grid-cols-4">
      <Stat label={`Last ${s.games} games`} value={winRate(s.wins, s.games)} sub={`${s.wins}W ${s.games - s.wins}L`} />
      <Stat
        label="KDA"
        value={kdaRatio(s.kills, s.deaths, s.assists)}
        sub={`${avg(s.kills)} / ${avg(s.deaths)} / ${avg(s.assists)}`}
      />
      <Stat label="CS / min" value={(s.cs / s.minutes).toFixed(1)} />
      <Stat label="Kill participation" value={percent(s.killParticipation)} />
    </section>
  );
}
