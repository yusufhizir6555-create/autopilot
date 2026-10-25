import type { ApplicationStatus } from "@prisma/client";
import Link from "next/link";
import { discardApplication, markApplied, sendDraft } from "@/app/actions/applications";
import { requireUser } from "@/auth";
import type { ScoreReason } from "@/core/verticals/types";
import { prisma } from "@/lib/db";
import { getSource, getVertical } from "@/verticals";

const statusLabel: Record<ApplicationStatus, { text: string; cls: string }> = {
  DRAFT: { text: "Entwurf", cls: "bg-amber-50 text-amber-800" },
  SENT: { text: "Gesendet", cls: "bg-emerald-50 text-emerald-800" },
  FAILED: { text: "Fehlgeschlagen", cls: "bg-red-50 text-red-800" },
  WITHDRAWN: { text: "Verworfen", cls: "bg-stone-100 text-stone-600" },
};

function scoreCls(score: number) {
  return score >= 90 ? "bg-emerald-700 text-white" : score >= 75 ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900";
}

export default async function DashboardPage() {
  const user = await requireUser();
  const [profiles, applicantCount, prefs, applications] = await Promise.all([
    prisma.searchProfile.findMany({ where: { userId: user.id } }),
    prisma.applicantProfile.count({ where: { userId: user.id } }),
    prisma.notificationPreference.findMany({ where: { userId: user.id, enabled: true, optInAt: { not: null } } }),
    prisma.application.findMany({
      where: { userId: user.id, status: { not: "WITHDRAWN" } },
      orderBy: { updatedAt: "desc" },
      include: { listing: true },
    }),
  ]);

  const matches = (
    await prisma.match.findMany({
      where: { searchProfileId: { in: profiles.map((p) => p.id) }, excluded: false },
      orderBy: [{ score: "desc" }, { createdAt: "desc" }],
      include: { listing: { include: { partner: true } }, searchProfile: true },
      take: 200,
    })
  )
    .filter((m) => m.score >= m.searchProfile.scoreThreshold && m.listing.active)
    .slice(0, 60);

  const appByListing = new Map(applications.map((a) => [a.listingId, a]));
  const drafts = applications.filter((a) => a.status === "DRAFT" || a.status === "FAILED");
  const sent = applications.filter((a) => a.status === "SENT");

  const onboarding = [
    { done: applicantCount > 0, text: "Bewerbungsprofil anlegen", href: "/profil" },
    { done: profiles.length > 0, text: "Suchauftrag mit Kriterien anlegen", href: "/suche/neu" },
    { done: prefs.length > 0, text: "Benachrichtigungskanal freigeben", href: "/einstellungen" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="h1">Dashboard</h1>
        <p className="muted mt-1">
          Benachrichtigung über: {prefs.length ? prefs.map((p) => p.channel).join(", ") : "kein Kanal freigegeben"} ·{" "}
          <Link href="/einstellungen" className="underline">ändern</Link>
        </p>
      </div>

      {onboarding.some((o) => !o.done) && (
        <section className="card border-emerald-200 bg-emerald-50/40">
          <h2 className="font-semibold">So geht&apos;s los</h2>
          <ol className="mt-2 space-y-1 text-sm">
            {onboarding.map((o) => (
              <li key={o.text}>
                {o.done ? "✅" : "⬜️"}{" "}
                {o.done ? o.text : <Link href={o.href} className="font-medium text-emerald-800 underline">{o.text}</Link>}
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Passende Anzeigen" value={matches.length} />
        <Stat label="Gesendete Bewerbungen" value={sent.length} />
        <Stat label="Offene Entwürfe" value={drafts.length} />
      </div>

      {drafts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Warten auf dich</h2>
          {drafts.map((a) => {
            const canSend = typeof getSource(a.listing.sourceKey)?.submitApplication === "function";
            return (
              <div key={a.id} className="card space-y-3" data-testid="draft">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`badge ${statusLabel[a.status].cls}`}>{statusLabel[a.status].text}</span>
                  <span className="font-medium">{a.listing.title}</span>
                  <span className="muted">{a.listing.city}</span>
                </div>
                {a.error && <p className="text-sm text-red-700">{a.error}</p>}
                <form className="space-y-3">
                  <input type="hidden" name="id" value={a.id} />
                  <details>
                    <summary className="cursor-pointer text-sm text-stone-600">Anschreiben ansehen/bearbeiten</summary>
                    <textarea name="coverLetter" rows={10} defaultValue={a.coverLetter} className="input mt-2 font-mono text-[13px]" />
                  </details>
                  <div className="flex flex-wrap gap-2">
                    {canSend ? (
                      <button formAction={sendDraft} className="btn">Mit einem Klick senden</button>
                    ) : (
                      <>
                        <a href={`/go/${a.listing.id}?p=draft`} target="_blank" rel="noopener" className="btn">Beim Anbieter bewerben ↗</a>
                        <button formAction={markApplied} className="btn-secondary">Als beworben markieren</button>
                      </>
                    )}
                    <button formAction={discardApplication} className="btn-secondary">Verwerfen</button>
                  </div>
                  {!canSend && <p className="muted">Dieser Anbieter nimmt keine direkten Bewerbungen an. Kopiere das Anschreiben und bewirb dich dort.</p>}
                </form>
              </div>
            );
          })}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Treffer</h2>
        {matches.length === 0 && <p className="muted">Noch keine Treffer. Lege einen Suchauftrag an oder senke die Mindest-Übereinstimmung.</p>}
        <div className="grid gap-4 md:grid-cols-2">
          {matches.map((m) => {
            const vertical = getVertical(m.listing.verticalKey);
            const facts = vertical.listingFacts(vertical.listingDataSchema.parse(m.listing.data));
            const app = appByListing.get(m.listing.id);
            const reasons = m.reasons as ScoreReason[];
            return (
              <article key={m.id} className="card flex flex-col gap-3" data-testid="match">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {m.listing.sponsored && <span className="badge border border-stone-300 text-stone-600">Anzeige</span>}
                      <h3 className="font-semibold">{m.listing.title}</h3>
                    </div>
                    <p className="muted">{m.listing.partner?.name ?? m.listing.sourceKey} · Suchauftrag „{m.searchProfile.name}“</p>
                  </div>
                  <span className={`badge shrink-0 text-sm ${scoreCls(m.score)}`}>{m.score} %</span>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {facts.map((f) => (
                    <div key={f.label} className={f.label === "Adresse" ? "col-span-2" : undefined}>
                      <dt className="inline text-stone-500">{f.label}: </dt>
                      <dd className="inline">{f.value}</dd>
                    </div>
                  ))}
                </dl>
                <details className="text-sm">
                  <summary className="cursor-pointer text-stone-600">Warum passt das?</summary>
                  <ul className="mt-2 space-y-0.5">
                    {reasons.map((r) => (
                      <li key={r.criterion}>
                        {r.ok ? "✓" : "–"} {r.text} <span className="text-stone-400">({r.points}/{r.maxPoints})</span>
                      </li>
                    ))}
                  </ul>
                </details>
                <div className="mt-auto flex items-center justify-between gap-2">
                  {app ? (
                    <span className={`badge ${statusLabel[app.status].cls}`}>
                      {statusLabel[app.status].text}
                      {app.status === "SENT" && app.mode === "AUTO" ? " (automatisch)" : ""}
                    </span>
                  ) : (
                    <span />
                  )}
                  <a href={`/go/${m.listing.id}?p=dashboard`} target="_blank" rel="noopener sponsored" className="btn-secondary">
                    Zum Angebot ↗
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {sent.length > 0 && (
        <section className="card overflow-x-auto">
          <h2 className="mb-3 text-lg font-semibold">Gesendete Bewerbungen</h2>
          <table className="w-full text-left text-sm">
            <thead className="text-stone-500">
              <tr><th className="py-1">Gesendet</th><th>Anzeige</th><th>Modus</th><th>Referenz</th></tr>
            </thead>
            <tbody>
              {sent.map((a) => (
                <tr key={a.id} className="border-t border-stone-100" data-testid="sent-application">
                  <td className="py-2">{a.sentAt?.toLocaleString("de-DE")}</td>
                  <td>{a.listing.title}</td>
                  <td>{a.mode === "AUTO" ? "automatisch" : "manuell"}</td>
                  <td className="font-mono text-xs">{a.externalRef}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card">
      <div className="muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
