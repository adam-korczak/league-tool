// Only the fields we use. Full DTOs: https://developer.riotgames.com/apis

export interface Account {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface Summoner {
  puuid: string;
  profileIconId: number;
  summonerLevel: number;
  revisionDate: number;
}

export interface LeagueEntry {
  queueType: "RANKED_SOLO_5x5" | "RANKED_FLEX_SR" | string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
}

export interface Participant {
  puuid: string;
  riotIdGameName: string;
  riotIdTagline: string;
  championName: string;
  champLevel: number;
  teamId: number;
  teamPosition: string;
  win: boolean;
  gameEndedInEarlySurrender: boolean;
  kills: number;
  deaths: number;
  assists: number;
  quadraKills: number;
  pentaKills: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  goldEarned: number;
  totalDamageDealtToChampions: number;
  visionScore: number;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  summoner1Id: number;
  summoner2Id: number;
}

export interface Team {
  teamId: number;
  win: boolean;
  objectives: Record<"baron" | "champion" | "dragon" | "tower", { kills: number }>;
}

export interface Match {
  metadata: { matchId: string; participants: string[] };
  info: {
    gameCreation: number;
    gameDuration: number; // seconds
    gameEndTimestamp?: number;
    gameMode: string;
    queueId: number;
    participants: Participant[];
    teams: Team[];
  };
}
