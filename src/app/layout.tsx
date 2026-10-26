import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  // Absolute base for link-preview image URLs. Set SITE_URL once deployed.
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: "betteropgg",
  description: "League of Legends stats with deeper personal analysis.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
            <Link href="/" className="text-lg font-bold tracking-tight">
              better<span className="text-win">opgg</span>
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
        {/* Riot's developer policy requires this notice on public sites. */}
        <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted">
          betteropgg isn&apos;t endorsed by Riot Games and doesn&apos;t reflect the views or opinions of Riot Games or
          anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated
          properties are trademarks or registered trademarks of Riot Games, Inc.
        </footer>
      </body>
    </html>
  );
}
