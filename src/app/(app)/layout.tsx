import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { requireUser } from "@/auth";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profil", label: "Bewerbungsprofil" },
  { href: "/suche", label: "Suchaufträge" },
  { href: "/einstellungen", label: "Benachrichtigungen" },
  { href: "/konto", label: "Konto & Daten" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div>
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/dashboard" className="font-semibold">🏠 Wohnungssuche</Link>
          <nav className="flex flex-wrap gap-4 text-sm">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="text-stone-600 hover:text-stone-900">{n.label}</Link>
            ))}
            {user.role === "ADMIN" && <Link href="/admin" className="font-medium text-emerald-700">Admin</Link>}
          </nav>
          <form action={logout} className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-stone-500">{user.email}</span>
            <button className="text-stone-600 hover:text-stone-900 hover:underline">Abmelden</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
