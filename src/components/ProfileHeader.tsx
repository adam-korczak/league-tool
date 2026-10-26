import { profileIcon } from "@/lib/ddragon";
import type { Account, Summoner } from "@/lib/riot/types";

export function ProfileHeader({ account, summoner, version, regionLabel, title, streak, actions }: {
  account: Account;
  summoner: Summoner;
  version: string;
  regionLabel: string;
  title: { title: string; blurb: string } | null;
  streak: { won: boolean; text: string } | null;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative">
        <img src={profileIcon(version, summoner.profileIconId)} alt="" className="size-24 rounded-xl border border-border" />
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-border bg-surface px-2 text-xs">
          {summoner.summonerLevel}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="text-3xl font-bold">
          {account.gameName} <span className="font-normal text-muted">#{account.tagLine}</span>
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded bg-surface-2 px-2 py-0.5 text-xs font-semibold text-muted">{regionLabel}</span>
          {title && (
            <span className="rounded bg-win/15 px-2 py-0.5 text-xs font-semibold text-win">{title.title}</span>
          )}
          {streak && (
            <span
              className={`rounded px-2 py-0.5 text-xs font-semibold ${streak.won ? "bg-win/15 text-win" : "bg-loss/15 text-loss"}`}
            >
              {streak.won ? "🔥" : "🧊"} {streak.text}
            </span>
          )}
        </div>
        {title && <p className="mt-2 text-sm text-muted italic">{title.blurb}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-end gap-3">{actions}</div>}
    </div>
  );
}
