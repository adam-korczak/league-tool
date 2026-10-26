import type { Match, Participant } from "./riot/types";

export const totalCs = (p: Participant) => p.totalMinionsKilled + p.neutralMinionsKilled;

export const findPlayer = (match: Match, puuid: string) =>
  match.info.participants.find((p) => p.puuid === puuid);

export const isRemake = (match: Match) =>
  match.info.participants.some((p) => p.gameEndedInEarlySurrender) || match.info.gameDuration < 240;

export function teamKills(match: Match, teamId: number) {
  return match.info.participants.filter((p) => p.teamId === teamId).reduce((sum, p) => sum + p.kills, 0);
}

export function killParticipation(p: Participant, match: Match) {
  const kills = teamKills(match, p.teamId);
  return kills === 0 ? 0 : (p.kills + p.assists) / kills;
}

export interface ChampionSummary {
  championName: string;
  games: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  minutes: number;
}

export interface Summary {
  games: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  minutes: number;
  killParticipation: number; // average over games
  champions: ChampionSummary[]; // most played first
}

// Aggregates a player's stats over the given matches, skipping remakes.
export function summarize(matches: Match[], puuid: string): Summary {
  const s: Summary = { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0, cs: 0, minutes: 0, killParticipation: 0, champions: [] };
  const champs = new Map<string, ChampionSummary>();
  let kpTotal = 0;

  for (const match of matches) {
    const p = findPlayer(match, puuid);
    if (!p || isRemake(match)) continue;
    const minutes = match.info.gameDuration / 60;

    const c = champs.get(p.championName) ??
      { championName: p.championName, games: 0, wins: 0, kills: 0, deaths: 0, assists: 0, cs: 0, minutes: 0 };
    champs.set(p.championName, c);

    for (const t of [s, c]) {
      t.games++;
      t.wins += p.win ? 1 : 0;
      t.kills += p.kills;
      t.deaths += p.deaths;
      t.assists += p.assists;
      t.cs += totalCs(p);
      t.minutes += minutes;
    }
    kpTotal += killParticipation(p, match);
  }

  s.killParticipation = s.games ? kpTotal / s.games : 0;
  s.champions = [...champs.values()].sort((a, b) => b.games - a.games || b.wins - a.wins);
  return s;
}
