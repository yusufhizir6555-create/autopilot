import { deleteAccount } from "@/app/actions/account";
import { requireUser } from "@/auth";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ fehler?: string }> }) {
  const user = await requireUser();
  const { fehler } = await searchParams;
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="h1">Konto & Daten</h1>

      <section className="card space-y-2">
        <h2 className="font-semibold">Datenexport</h2>
        <p className="muted">Lade alle über dich gespeicherten Daten als JSON-Datei herunter. Dokumente kannst du einzeln im Profil herunterladen.</p>
        <a href="/api/account/export" className="btn-secondary">Meine Daten exportieren</a>
      </section>

      <section className="card space-y-3 border-red-200">
        <h2 className="font-semibold text-red-800">Konto löschen</h2>
        <p className="text-sm text-stone-600">
          Löscht dein Konto, Bewerbungsprofil, alle Dokumente, Suchaufträge, Bewerbungen und Benachrichtigungen endgültig.
          Bereits an Anbieter gesendete Bewerbungen liegen dort und müssen dort gelöscht werden.
        </p>
        <form action={deleteAccount} className="space-y-3">
          <label htmlFor="confirm" className="label">Zur Bestätigung deine E-Mail-Adresse eingeben ({user.email})</label>
          <input id="confirm" name="confirm" className="input" autoComplete="off" />
          {fehler && <p className="text-sm text-red-700">Die E-Mail-Adresse stimmt nicht überein.</p>}
          <button className="btn-danger">Konto endgültig löschen</button>
        </form>
      </section>
    </div>
  );
}
