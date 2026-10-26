// The site's personality: short, stat-driven one-liners at three roast levels.
// Lines are chosen by hashing a stable id (match id, puuid), so the same game
// always gets the same joke and server/client renders agree.
import { compact, kdaRatio, percent } from "./format";
import type { LeagueEntry, Match, Participant } from "./riot/types";
import { findPlayer, isRemake, killParticipation, teamKills, totalCs, type Summary } from "./stats";

export const ROAST_LEVELS = ["wholesome", "normal", "unhinged"] as const;
export type RoastLevel = (typeof ROAST_LEVELS)[number];
export const ROAST_COOKIE = "roast";

export function parseRoastLevel(value: string | null | undefined): RoastLevel {
  return ROAST_LEVELS.includes(value as RoastLevel) ? (value as RoastLevel) : "normal";
}

type Lines = Record<RoastLevel, string[]>;
type Vars = Record<string, string | number>;

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickLine(lines: Lines, level: RoastLevel, seed: string, vars: Vars) {
  const options = lines[level];
  return options[hash(seed) % options.length].replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

// Modes without lanes, where CS and vision jokes don't make sense.
const NO_LANE_QUEUES = new Set([450, 720, 900, 1700, 1900]);

const kdaValue = (p: Participant) => (p.kills + p.assists) / Math.max(p.deaths, 1);

// ---------- Match one-liners ----------

interface MatchCtx {
  p: Participant;
  match: Match;
  minutes: number;
  csPerMin: number;
  kp: number;
  laneGame: boolean;
  support: boolean;
}

// First matching rule wins, so the most remarkable thing about a game goes first.
// `notable` lines are good enough to feature on the share card.
const MATCH_RULES: { when: (c: MatchCtx) => boolean; notable?: true; lines: Lines }[] = [
  {
    when: ({ p }) => p.pentaKills > 0,
    notable: true,
    lines: {
      wholesome: ["PENTAKILL! What a moment. You earned this one.", "A pentakill on {champ}. Absolutely beautiful."],
      normal: [
        "PENTAKILL. Screenshot it, frame it, tell your grandkids.",
        "A pentakill on {champ}. Your team will be hearing about this for weeks.",
      ],
      unhinged: [
        "PENTAKILL. You are legally allowed to be insufferable about this for one week.",
        "Pentakill on {champ}. Put it on your résumé. Put it on your tombstone.",
      ],
    },
  },
  {
    when: ({ p }) => p.deaths === 0 && p.win && p.kills + p.assists >= 5,
    notable: true,
    lines: {
      wholesome: ["{k}/0/{a} without a single death. Flawless.", "Zero deaths. Calm, careful, perfect."],
      normal: [
        "{k}/0/{a}. Untouchable. The enemy team is filing a complaint.",
        "Zero deaths. The gray screen misses you.",
        "Didn't die once. Are you sure you were playing League?",
      ],
      unhinged: [
        "{k}/0/{a}. The enemy team is in a group chat about you right now.",
        "Zero deaths. Were you playing, or spectating from a safe distance?",
      ],
    },
  },
  {
    when: ({ p }) => p.deaths >= 12,
    notable: true,
    lines: {
      wholesome: ["{d} deaths, but you kept fighting. That's the spirit.", "A rough one with {d} deaths. Every game is a lesson."],
      normal: [
        "{d} deaths. You spent more time gray than a 1950s TV.",
        "{d} deaths. The respawn timer knows you by name.",
        "Died {d} times. Bold strategy: overwhelm them with your presence.",
      ],
      unhinged: [
        "{d} deaths. You weren't playing {champ}, you were running a gold delivery service.",
        "{d} deaths. The enemy team should split their LP with you.",
        "Died {d} times. At some point it stops being a mistake and becomes a lifestyle.",
      ],
    },
  },
  {
    when: ({ p }) => p.quadraKills > 0,
    notable: true,
    lines: {
      wholesome: ["A quadra kill! So close to the penta. Still amazing.", "Quadra kill on {champ}. What a play!"],
      normal: [
        "A quadra kill! So close. Someone stole the fifth, didn't they.",
        "Quadra kill. One more and we'd be writing a song about you.",
      ],
      unhinged: [
        "Quadra kill. The fifth one got away and you will think about it in the shower for years.",
        "Quadra. One kill from greatness. Close isn't a rank, though.",
      ],
    },
  },
  {
    when: ({ p, match }) =>
      p.win && kdaValue(p) >= 4 &&
      match.info.participants.every((o) => o.totalDamageDealtToChampions <= p.totalDamageDealtToChampions),
    notable: true,
    lines: {
      wholesome: ["Top damage in the game and a {kda} KDA. You carried, and it showed.", "{dmg} damage. Your team was lucky to have you."],
      normal: [
        "Most damage in the game and a {kda} KDA. Your team should be paying you.",
        "Main character energy. {dmg} damage, no notes.",
      ],
      unhinged: [
        "{dmg} damage. That was a 1v9, and the 9 included your own team.",
        "{kda} KDA and top damage. Your teammates owe you rent.",
      ],
    },
  },
  {
    when: ({ p, match }) =>
      !p.win && kdaValue(p) >= 3 &&
      match.info.participants.filter((o) => o.teamId === p.teamId).every((o) => kdaValue(o) <= kdaValue(p)),
    notable: true,
    lines: {
      wholesome: [
        "{kda} KDA in a loss. You played great. Some games just slip away.",
        "Best on your team. The result doesn't reflect how well you played.",
      ],
      normal: [
        "{kda} KDA in a loss. You did your part. League is a team game, unfortunately.",
        "Best on your team and still lost. Somewhere, your jungler is typing an apology.",
      ],
      unhinged: [
        "{kda} KDA and still lost. You were dragging four anchors around the map.",
        "Best on your team and lost anyway. Your teammates owe you an apology and a refund.",
      ],
    },
  },
  {
    when: ({ p }) => p.win && p.deaths > p.kills + p.assists,
    notable: true,
    lines: {
      wholesome: ["You stuck with it and your team pulled through. Teamwork!", "Not your best stats, but a win is a win."],
      normal: [
        "Won with a {k}/{d}/{a}. A W is a W. We won't ask questions.",
        "Your team carried. Your job was emotional support, and you nailed it.",
      ],
      unhinged: [
        "{k}/{d}/{a} and you WON? Your team deserves a medal. You deserve an invoice.",
        "Carried like checked luggage.",
      ],
    },
  },
  {
    when: ({ kp, laneGame, match, p }) => laneGame && kp < 0.25 && teamKills(match, p.teamId) >= 10,
    notable: true,
    lines: {
      wholesome: ["{kp} kill participation. Next game, try joining a few more fights!", "Playing your own game. A few more teamfights could help."],
      normal: [
        "{kp} kill participation. Were you even invited?",
        "Your team got {tk} kills and you were there for {ka}. Ever heard of grouping?",
      ],
      unhinged: [
        "{kp} kill participation. Your team thought you disconnected.",
        "{tk} team kills and you were in {ka}. Were you playing a different game?",
      ],
    },
  },
  {
    when: ({ laneGame, support, csPerMin }) => laneGame && !support && csPerMin >= 8.5,
    lines: {
      wholesome: ["{cspm} CS/min. Great farming!", "{cs} CS. Excellent wave management."],
      normal: [
        "{cspm} CS/min. The minions fear you.",
        "{cs} CS. Farming simulator champion of the year.",
        "{cspm} CS/min. Somewhere, a minion family is grieving.",
      ],
      unhinged: [
        "{cspm} CS/min. The minion union is going on strike.",
        "{cs} CS. You hit minions with more passion than you hit champions.",
      ],
    },
  },
  {
    when: ({ laneGame, support, csPerMin, minutes }) => laneGame && !support && csPerMin < 4.5 && minutes > 15,
    notable: true,
    lines: {
      wholesome: ["{cspm} CS/min. Farming is a great thing to work on next!", "{cs} CS. Every last-hit counts. You'll get there."],
      normal: ["{cspm} CS/min. The minions send their regards.", "{cs} CS in {min} minutes. The wave was right there."],
      unhinged: [
        "{cspm} CS/min. The minions walked past you on purpose.",
        "{cs} CS in {min} minutes. A cannon minion could have outfarmed you.",
      ],
    },
  },
  {
    when: ({ laneGame, p, minutes }) => laneGame && minutes > 15 && p.visionScore < minutes * 0.35,
    lines: {
      wholesome: ["Vision score of {vs}. A few more wards could light the way!", "{vs} vision. Wards are a great next thing to practice."],
      normal: [
        "Vision score of {vs}. Wards are free, you know.",
        "{vs} vision. Fully committed to the fog of war.",
        "{vs} vision score. Playing on instinct alone. Respect.",
      ],
      unhinged: [
        "{vs} vision. You played the whole game with your eyes closed, didn't you.",
        "Vision score of {vs}. The trinket is the yellow thing. Press it.",
      ],
    },
  },
  {
    when: ({ minutes, p }) => minutes >= 40 && p.win,
    lines: {
      wholesome: ["{min} minutes of grit. What a win.", "A {min}-minute battle, and you came out on top."],
      normal: ["{min} minutes, but worth every second.", "A {min}-minute war. You outlasted them."],
      unhinged: ["{min} minutes. You didn't win, they just got tired.", "{min} minutes. Your dinner is cold and your back hurts, but hey."],
    },
  },
  {
    when: ({ minutes, p }) => minutes >= 40 && !p.win,
    lines: {
      wholesome: ["{min} minutes of fighting. A loss, but you never gave up.", "A long, tough game. Proud of the effort."],
      normal: ["{min} minutes for a loss. You can't get that time back.", "{min} minutes. That wasn't a game, it was a commitment."],
      unhinged: ["{min} minutes for a loss. You could've watched a movie. A good one.", "{min} minutes of suffering, delivered right to your door."],
    },
  },
  {
    when: ({ minutes, p }) => minutes < 22 && p.win,
    lines: {
      wholesome: ["Done in {min} minutes. Clean and efficient!", "A quick {min}-minute win. Nicely done."],
      normal: ["Done in {min} minutes. In and out.", "{min}-minute win. The enemy team is still in shock."],
      unhinged: ["{min}-minute win. That wasn't a game, it was a mugging.", "Over in {min} minutes. The enemy team needs therapy."],
    },
  },
  {
    when: ({ minutes, p }) => minutes < 22 && !p.win,
    lines: {
      wholesome: ["A quick loss. Shake it off and queue again!", "Short and rough. The next one's yours."],
      normal: ["Lost in {min} minutes. A merciful ending.", "Over in {min} minutes. Let's never speak of this."],
      unhinged: ["Lost in {min} minutes. The FF vote was the best play of the game.", "{min} minutes. Speedrunning defeat. New personal best?"],
    },
  },
  {
    when: ({ p }) => p.win,
    lines: {
      wholesome: ["A great win. Keep it up!", "Victory on {champ}. Well played!"],
      normal: ["Clean win. Nothing to roast here.", "A solid W. Keep it rolling.", "Victory on {champ}. Respectable."],
      unhinged: ["A win. We looked for something to roast and came up empty. Annoying.", "Victory on {champ}. Don't let it go to your head."],
    },
  },
  {
    when: () => true,
    lines: {
      wholesome: ["Not this time, but you'll get the next one.", "A loss, but every game makes you better."],
      normal: ["A loss. Happens to the best of us. And also to you.", "Not your game. Shake it off.", "That one's on the jungler. Probably."],
      unhinged: ["A loss. Blame the jungler. Blame the patch. Never blame yourself.", "Lost on {champ}. {champ} would like a word."],
    },
  },
];

export interface MatchQuip {
  text: string;
  champion: string;
  priority: number; // lower = more remarkable
  notable: boolean;
}

export function matchQuip(match: Match, puuid: string, level: RoastLevel): MatchQuip | null {
  const p = findPlayer(match, puuid);
  if (!p) return null;
  if (isRemake(match)) {
    return { text: "Remake. Nobody saw anything. This game never happened.", champion: p.championName, priority: Infinity, notable: false };
  }

  const minutes = match.info.gameDuration / 60;
  const cs = totalCs(p);
  const ctx: MatchCtx = {
    p,
    match,
    minutes,
    csPerMin: cs / minutes,
    kp: killParticipation(p, match),
    laneGame: !NO_LANE_QUEUES.has(match.info.queueId),
    support: p.teamPosition === "UTILITY",
  };
  const priority = MATCH_RULES.findIndex((r) => r.when(ctx));
  const rule = MATCH_RULES[priority];

  const text = pickLine(rule.lines, level, match.metadata.matchId, {
    champ: p.championName,
    k: p.kills,
    d: p.deaths,
    a: p.assists,
    ka: p.kills + p.assists,
    kda: kdaRatio(p.kills, p.deaths, p.assists),
    kp: percent(ctx.kp),
    tk: teamKills(match, p.teamId),
    cs,
    cspm: ctx.csPerMin.toFixed(1),
    min: Math.floor(minutes),
    vs: p.visionScore,
    dmg: compact(p.totalDamageDealtToChampions),
  });
  return { text, champion: p.championName, priority, notable: !!rule.notable };
}

// The most share-worthy lines across a set of matches.
export function highlightQuips(matches: Match[], puuid: string, level: RoastLevel, count = 3) {
  return matches
    .map((m) => matchQuip(m, puuid, level))
    .filter((q): q is MatchQuip => !!q && q.notable)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, count);
}

// ---------- Player title ----------

const TITLE_RULES: { when: (s: Summary) => boolean; title: string; lines: Lines }[] = [
  {
    when: (s) => s.games >= 5 && s.champions[0].games / s.games >= 0.6,
    title: "The One-Trick",
    lines: {
      wholesome: ["{main} of the last {g} games on {champ}. Dedication like that pays off."],
      normal: [
        "{main} of the last {g} games on {champ}. Loyalty like that should be studied.",
        "{champ} in {main} of {g} games. At this point it's a relationship.",
      ],
      unhinged: [
        "{champ} in {main} of {g} games. Please go outside and meet another champion.",
        "{main} of {g} games on {champ}. Your family is worried about you two.",
      ],
    },
  },
  {
    when: (s) => s.games >= 5 && s.wins / s.games >= 0.65,
    title: "On a Heater",
    lines: {
      wholesome: ["{w} wins in {g} games. You're playing great!"],
      normal: [
        "{w} wins in {g} games. Whatever you're doing, don't change a thing.",
        "{wr} win rate lately. Your LP is having a great week.",
      ],
      unhinged: ["{wr} win rate. Suspicious. We've alerted the authorities.", "{w} wins in {g} games. Who's playing on your account?"],
    },
  },
  {
    when: (s) => s.games >= 5 && s.wins / s.games <= 0.35,
    title: "Character Development Arc",
    lines: {
      wholesome: ["{w} wins in {g} games. A tough stretch, but every climb has its dips."],
      normal: [
        "{w} wins in {g} games. Every hero's story has a rough chapter.",
        "{wr} win rate lately. Have you tried unplugging it and plugging it back in?",
      ],
      unhinged: ["{wr} win rate. Your LP is in witness protection.", "{w} wins in {g} games. The enemy team sends thank-you cards."],
    },
  },
  {
    when: (s) => s.deaths / s.games >= 7.5,
    title: "Gray Screen Connoisseur",
    lines: {
      wholesome: ["{ad} deaths per game. Aggressive playstyle! Maybe a touch less next time."],
      normal: [
        "{ad} deaths per game. You really enjoy the death recap screen.",
        "Averaging {ad} deaths. The enemy team thanks you for your generosity.",
      ],
      unhinged: ["{ad} deaths per game. The enemy jungler has you on speed dial.", "Averaging {ad} deaths. You're not a player, you're an objective."],
    },
  },
  {
    when: (s) => s.killParticipation >= 0.62,
    title: "Always in the Fight",
    lines: {
      wholesome: ["{kp} kill participation. A true team player!"],
      normal: ["{kp} kill participation. If there's a fight, you're in it. You probably started it."],
      unhinged: ["{kp} kill participation. You'd join fights in other people's games if you could."],
    },
  },
  {
    when: (s) => s.killParticipation < 0.42,
    title: "Lone Wolf",
    lines: {
      wholesome: ["{kp} kill participation. Independent and self-sufficient!"],
      normal: ["{kp} kill participation. Teamfights are more of a suggestion."],
      unhinged: ["{kp} kill participation. Your team filed a missing persons report."],
    },
  },
  {
    when: (s) => s.games >= 8 && s.champions.length >= s.games * 0.6,
    title: "No Main, Many Hobbies",
    lines: {
      wholesome: ["{u} different champions in {g} games. Impressive range!"],
      normal: ["{u} different champions in {g} games. Commitment issues, but make it fun."],
      unhinged: ["{u} champions in {g} games. Still searching for the one that makes you good."],
    },
  },
  {
    when: (s) => Math.abs(s.wins / s.games - 0.5) <= 0.05,
    title: "Professional Coinflipper",
    lines: {
      wholesome: ["{w}W {l}L. Nice and steady."],
      normal: ["{w}W {l}L. Perfectly balanced, as all things should be."],
      unhinged: ["{w}W {l}L. Statistically, a coin could replace you."],
    },
  },
  {
    when: () => true,
    title: "Suspiciously Well-Adjusted",
    lines: {
      wholesome: ["Steady, solid, and consistent. Love to see it."],
      normal: ["Nothing wild to report. Honestly, that's the most unsettling thing of all."],
      unhinged: ["Nothing to roast. We're deeply disappointed in you."],
    },
  },
];

export function playerTitle(s: Summary, puuid: string, level: RoastLevel) {
  if (s.games === 0) return null;
  const rule = TITLE_RULES.find((r) => r.when(s))!;
  const blurb = pickLine(rule.lines, level, puuid + rule.title, {
    g: s.games,
    w: s.wins,
    l: s.games - s.wins,
    wr: percent(s.wins / s.games),
    main: s.champions[0].games,
    champ: s.champions[0].championName,
    ad: (s.deaths / s.games).toFixed(1),
    kp: percent(s.killParticipation),
    u: s.champions.length,
  });
  return { title: rule.title, blurb };
}

// ---------- Streaks ----------

const STREAK_LINES: Record<"win" | "loss", Lines> = {
  win: {
    wholesome: ["{n} wins in a row. You're on fire!", "{n}-game win streak. Keep it going!"],
    normal: ["{n} wins in a row. Don't touch anything.", "{n}-game win streak. Your mouse is officially lucky."],
    unhinged: ["{n} wins in a row. Lose one on purpose so we can believe it's you.", "{n}-game win streak. Matchmaking is coming for you."],
  },
  loss: {
    wholesome: ["{n} losses in a row. A break and a snack might help!", "{n}-game rough patch. Your comeback is loading."],
    normal: ["{n} losses in a row. Hydrate. Stretch. Maybe touch some grass.", "{n}-game losing streak. The queue owes you one."],
    unhinged: ["{n} losses in a row. Step away from the keyboard. Slowly.", "{n}-game losing streak. Riot is considering a welfare check."],
  },
};

export function streakQuip(matches: Match[], puuid: string, level: RoastLevel) {
  let count = 0;
  let won: boolean | undefined;
  for (const m of matches) {
    const p = findPlayer(m, puuid);
    if (!p || isRemake(m)) continue;
    if (won === undefined) won = p.win;
    if (p.win !== won) break;
    count++;
  }
  if (won === undefined || count < 3) return null;
  return { won, text: pickLine(STREAK_LINES[won ? "win" : "loss"], level, puuid + count, { n: count }) };
}

// ---------- Rank cards ----------

const APEX = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"]);

const RANK_LINES = {
  unranked: {
    wholesome: ["Plenty of time to start your climb!"],
    normal: ["Can't lose LP if you never queue.", "No rank yet. Still mysterious.", "Unranked and unbothered."],
    unhinged: ["Unranked. Scared of the ladder?", "No rank. Afraid of what you'd find out?"],
  },
  challenger: { wholesome: ["Challenger. Incredible!"], normal: ["Challenger. Okay, show-off."], unhinged: ["Challenger. Don't you have a job?"] },
  iron: {
    wholesome: ["Iron. Everyone starts somewhere!"],
    normal: ["Iron. The only way is up. Statistically."],
    unhinged: ["Iron. There's no floor beneath you. Literally."],
  },
  promo: {
    wholesome: ["{lp} LP. Promotion is so close!"],
    normal: ["{lp} LP. Promotion is right there. Don't think about it."],
    unhinged: ["{lp} LP. You're definitely going to lose the next three."],
  },
  zero: {
    wholesome: ["0 LP, but still holding on. Keep going!"],
    normal: ["0 LP. Living on the edge. Very dramatic."],
    unhinged: ["0 LP. One more loss and it's demotion city."],
  },
  winning: {
    wholesome: ["Winning more than losing. Great season!"],
    normal: ["Winning more than losing. The climb is real."],
    unhinged: ["A positive win rate? Who are you paying?"],
  },
  losing: {
    wholesome: ["A tough season so far, but there's plenty of time."],
    normal: ["Rough season so far. The LP will come back. Probably."],
    unhinged: ["That win rate is a cry for help."],
  },
} satisfies Record<string, Lines>;

export function rankQuip(entry: LeagueEntry | undefined, level: RoastLevel, seed: string) {
  const say = (key: keyof typeof RANK_LINES) => pickLine(RANK_LINES[key], level, seed, { lp: entry?.leaguePoints ?? 0 });
  if (!entry) return say("unranked");

  const games = entry.wins + entry.losses;
  const wr = games ? entry.wins / games : 0;
  if (entry.tier === "CHALLENGER") return say("challenger");
  if (entry.tier === "IRON") return say("iron");
  if (!APEX.has(entry.tier) && entry.leaguePoints >= 90) return say("promo");
  if (!APEX.has(entry.tier) && entry.leaguePoints === 0) return say("zero");
  if (games >= 20 && wr >= 0.55) return say("winning");
  if (games >= 20 && wr < 0.47) return say("losing");
  return null;
}
