"use client";

import Link from "next/link";
import { useState } from "react";
import { championIcon, itemIcon, spellIcon } from "@/lib/ddragon";
import { compact, formatDuration, kdaRatio, percent, timeAgo } from "@/lib/format";
import { queueName } from "@/lib/queues";
import { matchQuip, type RoastLevel } from "@/lib/quips";
import { toRiotIdSlug } from "@/lib/regions";
import type { Match, Participant } from "@/lib/riot/types";
import { findPlayer, isRemake, killParticipation, teamKills, totalCs } from "@/lib/stats";

type Assets = { version: string; spells: Record<number, string> };

const RESULT_STYLES = {
  win: { label: "Victory", bar: "bg-win", card: "border-win/30 bg-win/10", text: "text-win" },
  loss: { label: "Defeat", bar: "bg-loss", card: "border-loss/30 bg-loss/10", text: "text-loss" },
  remake: { label: "Remake", bar: "bg-muted", card: "border-border bg-surface", text: "text-muted" },
};

const itemsOf = (p: Participant) => [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6];

function Items({ p, version, size }: { p: Participant; version: string; size: string }) {
  return (
    <div className="flex gap-0.5">
      {itemsOf(p).map((id, i) =>
        id ? (
          <img key={i} src={itemIcon(version, id)} alt="" className={`${size} rounded`} />
        ) : (
          <div key={i} className={`${size} rounded bg-surface-2`} />
        ),
      )}
    </div>
  );
}

function Spells({ p, assets, size }: { p: Participant; assets: Assets; size: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      {[p.summoner1Id, p.summoner2Id].map((id, i) =>
        assets.spells[id] ? (
          <img key={i} src={spellIcon(assets.version, assets.spells[id])} alt="" className={`${size} rounded`} />
        ) : (
          <div key={i} className={`${size} rounded bg-surface-2`} />
        ),
      )}
    </div>
  );
}

export function MatchCard({ match, puuid, region, assets, roast }: {
  match: Match;
  puuid: string;
  region: string;
  assets: Assets;
  roast: RoastLevel;
}) {
  const [open, setOpen] = useState(false);
  const me = findPlayer(match, puuid);
  if (!me) return null;

  const result = isRemake(match) ? "remake" : me.win ? "win" : "loss";
  const style = RESULT_STYLES[result];
  const minutes = match.info.gameDuration / 60;
  const cs = totalCs(me);
  const endedAt = match.info.gameEndTimestamp ?? match.info.gameCreation + match.info.gameDuration * 1000;
  const quip = matchQuip(match, puuid, roast)?.text;

  return (
    <article className={`overflow-hidden rounded-lg border ${style.card}`}>
      <div className="flex">
        <div className={`w-1.5 shrink-0 ${style.bar}`} />
        <div className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-3 p-3">
          <div className="w-28 text-xs">
            <p className={`font-semibold ${style.text}`}>{queueName(match.info.queueId)}</p>
            <p className="text-muted" suppressHydrationWarning>{timeAgo(endedAt)}</p>
            <div className="my-1 h-px w-10 bg-border" />
            <p className="font-semibold">{style.label}</p>
            <p className="text-muted">{formatDuration(match.info.gameDuration)}</p>
          </div>

          <div className="flex items-center gap-1">
            <div className="relative">
              <img src={championIcon(assets.version, me.championName)} alt={me.championName} className="size-12 rounded-full" />
              <span className="absolute -right-1 -bottom-1 rounded-full bg-surface px-1 text-[10px]">{me.champLevel}</span>
            </div>
            <Spells p={me} assets={assets} size="size-6" />
          </div>

          <div className="w-24 text-center">
            <p className="font-bold">
              {me.kills} / <span className="text-loss">{me.deaths}</span> / {me.assists}
            </p>
            <p className="text-xs text-muted">{kdaRatio(me.kills, me.deaths, me.assists)} KDA</p>
          </div>

          <div className="w-28 text-xs text-muted">
            <p>P/Kill {percent(killParticipation(me, match))}</p>
            <p>
              CS {cs} ({(cs / minutes).toFixed(1)})
            </p>
            <p>Vision {me.visionScore}</p>
          </div>

          <Items p={me} version={assets.version} size="size-7" />

          {quip && <p className="basis-full text-sm text-white/80 italic">“{quip}”</p>}
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="w-10 shrink-0 text-muted hover:bg-white/5 hover:text-white"
          aria-label={open ? "Hide details" : "Show details"}
          aria-expanded={open}
        >
          <span className={`inline-block transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
        </button>
      </div>
      {open && <MatchDetail match={match} puuid={puuid} region={region} assets={assets} />}
    </article>
  );
}

function MatchDetail({ match, puuid, region, assets }: { match: Match; puuid: string; region: string; assets: Assets }) {
  const maxDamage = Math.max(...match.info.participants.map((p) => p.totalDamageDealtToChampions));
  const minutes = match.info.gameDuration / 60;

  return (
    <div className="space-y-3 border-t border-border bg-surface p-3">
      {match.info.teams.map((team) => {
        const players = match.info.participants.filter((p) => p.teamId === team.teamId);
        return (
          <table key={team.teamId} className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted">
                <th className={`py-1 font-semibold ${team.win ? "text-win" : "text-loss"}`}>
                  {team.win ? "Victory" : "Defeat"} ({team.teamId === 100 ? "Blue" : "Red"}) · {teamKills(match, team.teamId)} kills
                </th>
                <th className="font-normal">KDA</th>
                <th className="hidden font-normal sm:table-cell">Damage</th>
                <th className="font-normal">CS</th>
                <th className="hidden font-normal md:table-cell">Gold</th>
                <th className="hidden font-normal md:table-cell">Items</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.puuid} className={p.puuid === puuid ? "bg-white/5" : ""}>
                  <td className="py-1">
                    <div className="flex items-center gap-2">
                      <img src={championIcon(assets.version, p.championName)} alt={p.championName} className="size-7 rounded-full" />
                      <Link
                        href={`/lol/${region}/${toRiotIdSlug(p.riotIdGameName, p.riotIdTagline)}`}
                        className="max-w-36 truncate hover:underline"
                      >
                        {p.riotIdGameName}
                      </Link>
                    </div>
                  </td>
                  <td>
                    {p.kills}/{p.deaths}/{p.assists}
                    <span className="ml-1 text-muted">({kdaRatio(p.kills, p.deaths, p.assists)})</span>
                  </td>
                  <td className="hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <span className="w-10">{compact(p.totalDamageDealtToChampions)}</span>
                      <div className="h-1.5 w-16 rounded bg-surface-2">
                        <div
                          className="h-full rounded bg-loss"
                          style={{ width: `${(p.totalDamageDealtToChampions / maxDamage) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    {totalCs(p)} <span className="text-muted">({(totalCs(p) / minutes).toFixed(1)})</span>
                  </td>
                  <td className="hidden md:table-cell">{compact(p.goldEarned)}</td>
                  <td className="hidden md:table-cell">
                    <Items p={p} version={assets.version} size="size-5" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      })}
    </div>
  );
}
