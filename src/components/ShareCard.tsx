"use client";

import { useEffect, useState } from "react";

export function ShareCard({ cardUrl, profilePath, fileName }: { cardUrl: string; profilePath: string; fileName: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function flash(message: string) {
    setStatus(message);
    setTimeout(() => setStatus(null), 2000);
  }

  async function copyImage() {
    try {
      const blob = await (await fetch(cardUrl)).blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      flash("Image copied. Go paste it somewhere.");
    } catch {
      flash("Your browser won't copy images. Try Download instead.");
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.origin + profilePath);
    flash("Link copied.");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="self-end rounded-lg bg-win px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
      >
        Share roast card
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Share roast card"
        >
          <div className="w-full max-w-3xl space-y-4 rounded-xl border border-border bg-surface p-4" onClick={(e) => e.stopPropagation()}>
            <img src={cardUrl} alt="Roast card preview" className="aspect-[1200/630] w-full rounded-lg bg-surface-2" />
            <div className="flex flex-wrap items-center gap-2">
              <a href={cardUrl} download={fileName} className="rounded-lg bg-win px-4 py-2 text-sm font-semibold text-white hover:brightness-110">
                Download
              </a>
              <button onClick={copyImage} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-white/5">
                Copy image
              </button>
              <button onClick={copyLink} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-white/5">
                Copy link
              </button>
              {status && <span className="text-sm text-muted">{status}</span>}
              <button onClick={() => setOpen(false)} className="ml-auto px-2 text-sm text-muted hover:text-white">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
