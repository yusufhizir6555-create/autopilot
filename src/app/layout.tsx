import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wohnungssuche – einmal bewerben, automatisch finden",
  description: "Lege einmal dein Bewerbungsprofil an. Wir finden passende Wohnungen und bewerben dich automatisch.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="flex min-h-screen flex-col antialiased">
        <div className="flex-1">{children}</div>
        <footer className="border-t border-stone-200 py-6 text-center text-sm text-stone-500">
          <Link href="/impressum" className="hover:underline">Impressum</Link>
          <span className="mx-3">·</span>
          <Link href="/datenschutz" className="hover:underline">Datenschutz</Link>
        </footer>
      </body>
    </html>
  );
}
