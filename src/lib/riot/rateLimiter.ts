// Sliding-window limiter for Riot's app-wide limits. Dev keys allow 20 req/1s
// and 100 req/2min; we stay a little under. Raise these for a production key.
const WINDOWS = [
  { limit: 19, ms: 1_000 },
  { limit: 95, ms: 120_000 },
];

type LimiterState = { stamps: number[][]; chain: Promise<void> };

// Kept on globalThis so dev hot-reloads don't reset the counters.
const g = globalThis as unknown as { __riotLimiter?: LimiterState };
const state = (g.__riotLimiter ??= { stamps: WINDOWS.map(() => []), chain: Promise.resolve() });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitForSlot() {
  for (;;) {
    const now = Date.now();
    let wait = 0;
    WINDOWS.forEach((w, i) => {
      const stamps = (state.stamps[i] = state.stamps[i].filter((t) => now - t < w.ms));
      if (stamps.length >= w.limit) wait = Math.max(wait, w.ms - (now - stamps[0]));
    });
    if (wait === 0) {
      state.stamps.forEach((s) => s.push(now));
      return;
    }
    await sleep(wait + 10);
  }
}

// Requests take slots in FIFO order.
export function acquireSlot(): Promise<void> {
  const next = state.chain.then(waitForSlot);
  state.chain = next.catch(() => {});
  return next;
}

export { sleep };
