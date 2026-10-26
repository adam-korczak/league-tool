// Usage: npm run check-key
// Verifies RIOT_API_KEY in .env.local against Riot without printing the key.
const key = process.env.RIOT_API_KEY;
if (!key) {
  console.error("RIOT_API_KEY is not set in .env.local");
  process.exit(1);
}

const res = await fetch("https://na1.api.riotgames.com/lol/status/v4/platform-data", {
  headers: { "X-Riot-Token": key },
});

if (res.ok) {
  console.log(`OK: key ending in ...${key.slice(-4)} is valid.`);
} else {
  const body = await res.json().catch(() => ({}));
  console.error(`FAILED (HTTP ${res.status}): ${body?.status?.message ?? res.statusText}`);
  if (res.status === 401 || res.status === 403) {
    console.error("Regenerate the key at https://developer.riotgames.com, paste it into .env.local, and try again.");
  }
  process.exit(1);
}
