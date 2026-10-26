import { LoadingQuip } from "@/components/LoadingQuip";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-10 animate-pulse rounded-lg bg-surface" />
      <LoadingQuip />
      <div className="animate-pulse space-y-6">
        <div className="flex items-center gap-5">
          <div className="size-24 rounded-xl bg-surface" />
          <div className="h-8 w-64 rounded bg-surface" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-4">
            <div className="h-24 rounded-lg bg-surface" />
            <div className="h-24 rounded-lg bg-surface" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-24 rounded-lg bg-surface" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
