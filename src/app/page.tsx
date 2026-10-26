import { SearchBar } from "@/components/SearchBar";

export default function Home() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 pt-24 text-center">
      <h1 className="text-5xl font-bold tracking-tight">
        better<span className="text-win">opgg</span>
      </h1>
      <p className="text-muted">Look up any player, then dig into what&apos;s actually winning and losing your games.</p>
      <SearchBar large />
    </div>
  );
}
