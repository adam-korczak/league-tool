"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEFAULT_REGION, REGIONS, toRiotIdSlug, type RegionSlug } from "@/lib/regions";

export function SearchBar({ initialRegion = DEFAULT_REGION, large = false }: { initialRegion?: RegionSlug; large?: boolean }) {
  const router = useRouter();
  const [region, setRegion] = useState<RegionSlug>(initialRegion);
  const [query, setQuery] = useState("");

  function submit() {
    const [name, tag] = query.split("#").map((s) => s.trim());
    if (!name) return;
    router.push(`/lol/${region}/${toRiotIdSlug(name, tag || REGIONS[region].defaultTag)}`);
  }

  const size = large ? "h-14 text-base" : "h-10 text-sm";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className={`flex w-full overflow-hidden rounded-lg border border-border bg-surface-2 ${size}`}>
      <select
        value={region}
        onChange={(e) => setRegion(e.target.value as RegionSlug)}
        className="border-r border-border bg-transparent px-3 font-semibold outline-none"
        aria-label="Region"
      >
        {Object.entries(REGIONS).map(([slug, r]) => (
          <option key={slug} value={slug} className="bg-surface-2">
            {r.label}
          </option>
        ))}
      </select>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Game Name #TAG"
        className="min-w-0 flex-1 bg-transparent px-4 outline-none placeholder:text-muted"
        aria-label="Riot ID"
      />
      <button type="submit" className="bg-win px-5 font-semibold text-white hover:brightness-110">
        Search
      </button>
    </form>
  );
}
