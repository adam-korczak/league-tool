import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ChampionList } from "@/components/ChampionList";
import { MatchCard } from "@/components/MatchCard";
import { ProfileHeader } from "@/components/ProfileHeader";
import { RankCard } from "@/components/RankCard";
import { RecentSummary } from "@/components/RecentSummary";
import { RoastToggle } from "@/components/RoastToggle";
import { SearchBar } from "@/components/SearchBar";
import { ShareCard } from "@/components/ShareCard";
import { getDdragonVersion, getSpellImages } from "@/lib/ddragon";
import { loadProfile, type Profile } from "@/lib/profile";
import { parseRoastLevel, playerTitle, rankQuip, ROAST_COOKIE, streakQuip } from "@/lib/quips";
import { getRegion, parseRiotIdSlug, toRiotIdSlug, type RegionSlug } from "@/lib/regions";
import { RiotApiError } from "@/lib/riot/client";
import { summarize } from "@/lib/stats";

type Params = Promise<{ region: string; riotId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { region, riotId } = await params;
  const id = parseRiotIdSlug(riotId);
  if (!id) return { title: "betteropgg" };
  const title = `${id.gameName}#${id.tagLine} · betteropgg`;
  // The roast card doubles as the link preview on Discord, Twitter, etc.
  const image = `/lol/${region}/${toRiotIdSlug(id.gameName, id.tagLine)}/card`;
  return {
    title,
    openGraph: { title, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", images: [image] },
  };
}

export default async function ProfilePage({ params }: { params: Params }) {
  const { region, riotId } = await params;
  const regionInfo = getRegion(region);
  const id = parseRiotIdSlug(riotId);
  if (!regionInfo || !id) notFound();
  const regionSlug = region as RegionSlug;
  const roast = parseRoastLevel((await cookies()).get(ROAST_COOKIE)?.value);

  let profile: Profile;
  try {
    profile = await loadProfile(regionSlug, id.gameName, id.tagLine);
  } catch (e) {
    if (!(e instanceof RiotApiError)) throw e;
    const message =
      e.status === 404
        ? `No player named ${id.gameName}#${id.tagLine} on ${regionInfo.label}. Typo, or are they dodging us too?`
        : e.message;
    return (
      <div className="space-y-6">
        <SearchBar initialRegion={regionSlug} />
        <div className="rounded-lg border border-border bg-surface p-8 text-center">
          <p className="text-lg font-semibold">{message}</p>
          {(e.status === 401 || e.status === 403) && (
            <p className="mt-2 text-sm text-muted">
              Dev keys expire every 24 hours. Regenerate yours at developer.riotgames.com, update .env.local, and
              restart the server.
            </p>
          )}
        </div>
      </div>
    );
  }

  const version = await getDdragonVersion();
  const spells = await getSpellImages(version);
  const { account, summoner, leagues, matches } = profile;
  const summary = summarize(matches, account.puuid);
  const solo = leagues.find((l) => l.queueType === "RANKED_SOLO_5x5");
  const flex = leagues.find((l) => l.queueType === "RANKED_FLEX_SR");
  const profilePath = `/lol/${regionSlug}/${toRiotIdSlug(account.gameName, account.tagLine)}`;

  return (
    <div className="space-y-6">
      <SearchBar initialRegion={regionSlug} />
      <ProfileHeader
        account={account}
        summoner={summoner}
        version={version}
        regionLabel={regionInfo.label}
        title={playerTitle(summary, account.puuid, roast)}
        streak={streakQuip(matches, account.puuid, roast)}
        actions={
          <>
            <RoastToggle level={roast} />
            {summary.games > 0 && (
              <ShareCard
                cardUrl={`${profilePath}/card?level=${roast}`}
                profilePath={profilePath}
                fileName={`${account.gameName}-roast.png`}
              />
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <RankCard title="Ranked Solo/Duo" entry={solo} quip={rankQuip(solo, roast, account.puuid + "solo")} />
          <RankCard title="Ranked Flex" entry={flex} quip={rankQuip(flex, roast, account.puuid + "flex")} />
          <ChampionList champions={summary.champions} version={version} />
        </aside>

        <section className="space-y-3">
          <RecentSummary summary={summary} />
          {matches.length === 0 && (
            <p className="rounded-lg border border-border bg-surface p-6 text-center text-muted">
              No recent games. Either on a break or touching grass. Both are healthy.
            </p>
          )}
          {matches.map((m) => (
            <MatchCard
              key={m.metadata.matchId}
              match={m}
              puuid={account.puuid}
              region={regionSlug}
              assets={{ version, spells }}
              roast={roast}
            />
          ))}
        </section>
      </div>
    </div>
  );
}
