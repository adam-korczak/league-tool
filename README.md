# betteropgg

A League of Legends stats site in the spirit of op.gg, focused on deeper personal analysis.

## Setup

1. Install Node.js 20+.
2. `npm install`
3. Copy `.env.example` to `.env.local` and set `RIOT_API_KEY` (from https://developer.riotgames.com).
4. `npm run dev` and open http://localhost:3000

Dev keys expire every 24 hours. Regenerate, update `.env.local`, and restart the dev server.

## How it works

- `src/lib/riot/` is the server-only Riot API client: a rate limiter tuned to dev-key limits, retries on 429/5xx, and an in-memory cache (finished matches are cached forever).
- The API key is only read on the server and never sent to the browser.
- Static assets (champion, item, and spell icons) come from Data Dragon.

## Going public

A public site needs a Production key. Apply on the developer portal with a working prototype, then raise the limits in `src/lib/riot/rateLimiter.ts`.
