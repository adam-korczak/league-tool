import "server-only";
import { accountHost, REGIONS, type RegionSlug } from "./regions";
import { getAccountByRiotId, getLeagueEntries, getMatch, getMatchIds, getSummonerByPuuid } from "./riot/client";

export async function loadProfile(region: RegionSlug, gameName: string, tagLine: string, matchCount = 20) {
  const { platform, regional } = REGIONS[region];
  const account = await getAccountByRiotId(accountHost(regional), gameName, tagLine);

  const [summoner, leagues, matchIds] = await Promise.all([
    getSummonerByPuuid(platform, account.puuid),
    getLeagueEntries(platform, account.puuid),
    getMatchIds(regional, account.puuid, 0, matchCount),
  ]);

  // One bad match shouldn't break the whole page.
  const results = await Promise.allSettled(matchIds.map((id) => getMatch(regional, id)));
  const matches = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));

  return { account, summoner, leagues, matches };
}

export type Profile = Awaited<ReturnType<typeof loadProfile>>;
