import Link from "next/link";
import { auth } from "@/auth";

const steps = [
  { title: "Einmal Profil anlegen", text: "Haushalt, Einkommen, Anschreiben und Nachweise – nur ein einziges Mal." },
  { title: "Kriterien festlegen", text: "Stadt, Umkreis, Budget, Zimmer, Einzugstermin und Extras." },
  { title: "Automatisch bewerben", text: "Passende Anzeigen unserer Partner werden bewertet, auf Wunsch bewerben wir dich sofort." },
  { title: "Benachrichtigt werden", text: "Per E-Mail, SMS oder WhatsApp – du entscheidest, welche Kanäle." },
];

export default async function Home() {
  const session = await auth();
  return (
    <main>
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <span className="font-semibold">🏠 Wohnungssuche</span>
        <Link href={session ? "/dashboard" : "/login"} className="btn-secondary">
          {session ? "Zum Dashboard" : "Anmelden"}
        </Link>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Einmal bewerben. Passende Wohnungen finden dich.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-stone-600">
          Lege dein Bewerbungsprofil einmalig an. Wir gleichen neue Anzeigen unserer Partnerportale mit deinen Wünschen ab,
          bewerben dich auf Wunsch automatisch und sagen dir sofort Bescheid.
        </p>
        <Link href="/login" className="btn mt-8 px-6 py-3 text-base">Kostenlos starten</Link>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-4 pb-20 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <div key={s.title} className="card">
            <div className="mb-2 text-sm font-semibold text-emerald-700">Schritt {i + 1}</div>
            <h2 className="font-semibold">{s.title}</h2>
            <p className="mt-1 text-sm text-stone-600">{s.text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
