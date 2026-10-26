// Shareable "roast card" PNG. Also served as the profile's link-preview image.
// Note: next/og (Satori) requires display:flex on any element with multiple children.
import { ImageResponse } from "next/og";
import { championIcon, getDdragonVersion, profileIcon } from "@/lib/ddragon";
import { kdaRatio, winRate } from "@/lib/format";
import { loadProfile } from "@/lib/profile";
import { highlightQuips, parseRoastLevel, playerTitle, streakQuip, type RoastLevel } from "@/lib/quips";
import { getRegion, parseRiotIdSlug, type RegionSlug } from "@/lib/regions";
import { RiotApiError } from "@/lib/riot/client";
import { summarize } from "@/lib/stats";

const C = { bg: "#0e0f12", surface: "#16181d", border: "#2a2e37", text: "#e7e9ee", muted: "#8b919e", win: "#4a8cff", loss: "#ff5c6c" };

const LEVEL_LABELS: Record<RoastLevel, string> = { wholesome: "Wholesome", normal: "Normal", unhinged: "Unhinged" };

const APEX = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"]);

function Pill({ text, color }: { text: string; color: string }) {
  return (
    <div style={{ display: "flex", padding: "4px 14px", borderRadius: 8, background: `${color}26`, color, fontSize: 22, fontWeight: 700 }}>
      {text}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "12px 18px", borderRadius: 12, background: C.surface, border: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", fontSize: 18, color: C.muted }}>{label}</div>
      <div style={{ display: "flex", fontSize: 32, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export async function GET(req: Request, { params }: { params: Promise<{ region: string; riotId: string }> }) {
  const { region, riotId } = await params;
  const regionInfo = getRegion(region);
  const id = parseRiotIdSlug(riotId);
  if (!regionInfo || !id) return new Response("Not found", { status: 404 });
  const level = parseRoastLevel(new URL(req.url).searchParams.get("level"));

  let profile;
  try {
    profile = await loadProfile(region as RegionSlug, id.gameName, id.tagLine);
  } catch (e) {
    if (e instanceof RiotApiError) return new Response(e.message, { status: e.status === 404 ? 404 : 502 });
    throw e;
  }

  const version = await getDdragonVersion();
  const { account, summoner, leagues, matches } = profile;
  const summary = summarize(matches, account.puuid);
  const title = playerTitle(summary, account.puuid, level);
  const streak = streakQuip(matches, account.puuid, level);
  const quips = highlightQuips(matches, account.puuid, level);
  const solo = leagues.find((l) => l.queueType === "RANKED_SOLO_5x5");
  const rank = solo ? `${solo.tier[0]}${solo.tier.slice(1).toLowerCase()}${APEX.has(solo.tier) ? "" : ` ${solo.rank}`}` : "Unranked";
  const rankLabel = solo ? `Solo/Duo · ${solo.leaguePoints} LP` : "Solo/Duo";

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: 48, gap: 20, background: C.bg, color: C.text, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <img src={profileIcon(version, summoner.profileIconId)} width={104} height={104} style={{ borderRadius: 20, border: `2px solid ${C.border}` }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <div style={{ display: "flex", fontSize: 52, fontWeight: 700 }}>{account.gameName}</div>
              <div style={{ display: "flex", fontSize: 36, color: C.muted }}>{`#${account.tagLine}`}</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Pill text={regionInfo.label} color={C.muted} />
              {title && <Pill text={title.title} color={C.win} />}
              {streak && <Pill text={`${streak.won ? "W" : "L"} streak`} color={streak.won ? C.win : C.loss} />}
            </div>
          </div>
        </div>

        {title && <div style={{ display: "flex", fontSize: 26, color: C.muted }}>{title.blurb}</div>}

        <div style={{ display: "flex", gap: 14 }}>
          <Stat label={`Last ${summary.games} games`} value={winRate(summary.wins, summary.games)} />
          <Stat label="KDA" value={kdaRatio(summary.kills, summary.deaths, summary.assists)} />
          <Stat label="CS / min" value={summary.minutes ? (summary.cs / summary.minutes).toFixed(1) : "0.0"} />
          <Stat label={rankLabel} value={rank} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
          {quips.map((q, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <img src={championIcon(version, q.champion)} width={44} height={44} style={{ borderRadius: 22 }} />
              <div style={{ display: "flex", flex: 1, fontSize: 24 }}>{`“${q.text}”`}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 22 }}>
          <div style={{ display: "flex", fontWeight: 700, color: C.win }}>betteropgg</div>
          <div style={{ display: "flex", color: level === "unhinged" ? C.loss : C.muted }}>{`Roast level: ${LEVEL_LABELS[level]}`}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=600" } },
  );
}
