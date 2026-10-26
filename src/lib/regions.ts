// Riot splits its API into "platform" hosts (summoner, league) and "regional"
// hosts (account, match). Each URL slug maps to one of each.
export const REGIONS = {
  na: { platform: "na1", regional: "americas", label: "NA", defaultTag: "NA1" },
  euw: { platform: "euw1", regional: "europe", label: "EUW", defaultTag: "EUW" },
  eune: { platform: "eun1", regional: "europe", label: "EUNE", defaultTag: "EUNE" },
  kr: { platform: "kr", regional: "asia", label: "KR", defaultTag: "KR1" },
  jp: { platform: "jp1", regional: "asia", label: "JP", defaultTag: "JP1" },
  br: { platform: "br1", regional: "americas", label: "BR", defaultTag: "BR1" },
  lan: { platform: "la1", regional: "americas", label: "LAN", defaultTag: "LAN" },
  las: { platform: "la2", regional: "americas", label: "LAS", defaultTag: "LAS" },
  oce: { platform: "oc1", regional: "sea", label: "OCE", defaultTag: "OCE" },
  tr: { platform: "tr1", regional: "europe", label: "TR", defaultTag: "TR1" },
  ru: { platform: "ru", regional: "europe", label: "RU", defaultTag: "RU1" },
  me: { platform: "me1", regional: "europe", label: "ME", defaultTag: "ME1" },
  sea: { platform: "sg2", regional: "sea", label: "SEA", defaultTag: "SG2" },
  tw: { platform: "tw2", regional: "sea", label: "TW", defaultTag: "TW2" },
  vn: { platform: "vn2", regional: "sea", label: "VN", defaultTag: "VN2" },
} as const;

export type RegionSlug = keyof typeof REGIONS;
export type Regional = (typeof REGIONS)[RegionSlug]["regional"];

export const DEFAULT_REGION: RegionSlug = "na";

export function getRegion(slug: string) {
  return slug in REGIONS ? REGIONS[slug as RegionSlug] : undefined;
}

// account-v1 has no "sea" host; SEA players are served from "asia".
export function accountHost(regional: Regional) {
  return regional === "sea" ? "asia" : regional;
}

// URL form is "GameName-TAG". Game names may contain "-", tags can't, so split on the last one.
export function toRiotIdSlug(gameName: string, tagLine: string) {
  return encodeURIComponent(`${gameName}-${tagLine}`);
}

export function parseRiotIdSlug(slug: string) {
  const decoded = decodeURIComponent(slug).replace("#", "-");
  const i = decoded.lastIndexOf("-");
  if (i <= 0 || i === decoded.length - 1) return null;
  return { gameName: decoded.slice(0, i), tagLine: decoded.slice(i + 1) };
}
