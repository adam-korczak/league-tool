export function kdaRatio(kills: number, deaths: number, assists: number) {
  if (deaths === 0) return kills + assists === 0 ? "0.00" : "Perfect";
  return ((kills + assists) / deaths).toFixed(2);
}

export const percent = (x: number) => `${Math.round(x * 100)}%`;

export function winRate(wins: number, games: number) {
  return games === 0 ? "0%" : percent(wins / games);
}

export function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function timeAgo(timestamp: number) {
  const mins = Math.floor((Date.now() - timestamp) / 60_000);
  if (mins < 60) return `${Math.max(mins, 1)} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

export function compact(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}
