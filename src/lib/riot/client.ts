import "server-only";
import { cacheGet, cacheSet } from "./cache";
import { acquireSlot, sleep } from "./rateLimiter";
import type { Account, LeagueEntry, Match, Summoner } from "./types";

export class RiotApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const MINUTE = 60_000;
const MAX_ATTEMPTS = 3;

const inflight = new Map<string, Promise<unknown>>();

function errorMessage(status: number) {
  switch (status) {
    case 401:
    case 403:
      return "Riot API key is missing, invalid, or expired.";
    case 404:
      return "Not found.";
    case 429:
      return "Rate limited by Riot. Try again in a moment.";
    default:
      return `Riot API error (${status}).`;
  }
}

async function request<T>(url: string, ttlMs: number | null): Promise<T> {
  const key = process.env.RIOT_API_KEY;
  if (!key) throw new RiotApiError(401, "RIOT_API_KEY is not set in .env.local.");

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    await acquireSlot();
    const res = await fetch(url, { headers: { "X-Riot-Token": key }, cache: "no-store" });

    if (res.status === 429 || res.status >= 500) {
      if (attempt === MAX_ATTEMPTS) break;
      const retryAfter = Number(res.headers.get("Retry-After")) || attempt;
      await sleep(retryAfter * 1000);
      continue;
    }
    if (!res.ok) throw new RiotApiError(res.status, errorMessage(res.status));

    const data = (await res.json()) as T;
    cacheSet(url, data, ttlMs);
    return data;
  }
  throw new RiotApiError(429, errorMessage(429));
}

// Cached, de-duplicated GET against a Riot host (e.g. "na1", "americas").
function riotGet<T>(host: string, path: string, ttlMs: number | null): Promise<T> {
  const url = `https://${host}.api.riotgames.com${path}`;
  const cached = cacheGet<T>(url);
  if (cached !== undefined) return Promise.resolve(cached);

  let pending = inflight.get(url) as Promise<T> | undefined;
  if (!pending) {
    pending = request<T>(url, ttlMs).finally(() => inflight.delete(url));
    inflight.set(url, pending);
  }
  return pending;
}

const enc = encodeURIComponent;

export function getAccountByRiotId(host: string, gameName: string, tagLine: string) {
  return riotGet<Account>(host, `/riot/account/v1/accounts/by-riot-id/${enc(gameName)}/${enc(tagLine)}`, 10 * MINUTE);
}

export function getSummonerByPuuid(platform: string, puuid: string) {
  return riotGet<Summoner>(platform, `/lol/summoner/v4/summoners/by-puuid/${puuid}`, 5 * MINUTE);
}

export function getLeagueEntries(platform: string, puuid: string) {
  return riotGet<LeagueEntry[]>(platform, `/lol/league/v4/entries/by-puuid/${puuid}`, 2 * MINUTE);
}

export function getMatchIds(regional: string, puuid: string, start = 0, count = 20) {
  return riotGet<string[]>(regional, `/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}`, MINUTE);
}

export function getMatch(regional: string, matchId: string) {
  return riotGet<Match>(regional, `/lol/match/v5/matches/${matchId}`, null);
}
