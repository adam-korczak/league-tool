// Data Dragon: Riot's static asset CDN (icons, champion/spell data). No key needed.
const CDN = "https://ddragon.leagueoflegends.com";

export async function getDdragonVersion(): Promise<string> {
  const res = await fetch(`${CDN}/api/versions.json`, { next: { revalidate: 3600 } });
  const versions = (await res.json()) as string[];
  return versions[0];
}

// Summoner spell id -> image filename (match data only gives the numeric id).
export async function getSpellImages(version: string): Promise<Record<number, string>> {
  const res = await fetch(`${CDN}/cdn/${version}/data/en_US/summoner.json`, { next: { revalidate: 86400 } });
  const json = (await res.json()) as { data: Record<string, { key: string; image: { full: string } }> };
  return Object.fromEntries(Object.values(json.data).map((s) => [Number(s.key), s.image.full]));
}

// Match data uses a few champion names that differ from Data Dragon ids.
const CHAMPION_ID_FIXES: Record<string, string> = { FiddleSticks: "Fiddlesticks" };

export const championIcon = (v: string, name: string) =>
  `${CDN}/cdn/${v}/img/champion/${CHAMPION_ID_FIXES[name] ?? name}.png`;
export const itemIcon = (v: string, id: number) => `${CDN}/cdn/${v}/img/item/${id}.png`;
export const spellIcon = (v: string, file: string) => `${CDN}/cdn/${v}/img/spell/${file}`;
export const profileIcon = (v: string, id: number) => `${CDN}/cdn/${v}/img/profileicon/${id}.png`;
