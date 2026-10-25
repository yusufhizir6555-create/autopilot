import { adminRunJobs } from "@/app/actions/admin";
import { requireAdmin } from "@/auth";
import { prisma } from "@/lib/db";

const DAY = 24 * 60 * 60 * 1000;

export default async function AdminPage() {
  await requireAdmin();
  const since7 = new Date(Date.now() - 7 * DAY);

  const [partners, clicksTotal, clicks7, sources, byStatus, users, recent] = await Promise.all([
    prisma.partner.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { listings: true, clickEvents: true } } } }),
    prisma.clickEvent.groupBy({ by: ["partnerId"], _count: true }),
    prisma.clickEvent.groupBy({ by: ["partnerId"], where: { createdAt: { gte: since7 } }, _count: true }),
    prisma.source.findMany({ include: { _count: { select: { listings: true } } }, orderBy: { key: "asc" } }),
    prisma.application.groupBy({ by: ["status"], _count: true }),
    prisma.user.count(),
    prisma.application.findMany({
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: { listing: { select: { title: true, partner: { select: { name: true } } } }, user: { select: { email: true } } },
    }),
  ]);
  const sentByPartner = await prisma.application.groupBy({ by: ["listingId"], where: { status: "SENT" }, _count: true });
  const listingPartner = new Map(
    (await prisma.listing.findMany({ where: { id: { in: sentByPartner.map((s) => s.listingId) } }, select: { id: true, partnerId: true } })).map((l) => [l.id, l.partnerId]),
  );
  const sentCount = (partnerId: string) => sentByPartner.filter((s) => listingPartner.get(s.listingId) === partnerId).reduce((a, s) => a + s._count, 0);
  const count = (rows: { partnerId: string | null; _count: number }[], id: string) => rows.find((r) => r.partnerId === id)?._count ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="h1">Admin</h1>
        <form action={adminRunJobs}>
          <button className="btn-secondary">Import + Matching jetzt ausführen</button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Nutzer" value={users} />
        {(["SENT", "DRAFT", "FAILED"] as const).map((s) => (
          <Stat key={s} label={`Bewerbungen ${s}`} value={byStatus.find((b) => b.status === s)?._count ?? 0} />
        ))}
      </div>

      <section className="card overflow-x-auto">
        <h2 className="mb-3 font-semibold">Partner</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-stone-500">
            <tr><th className="py-1">Partner</th><th>Gesponsert</th><th>Anzeigen</th><th>Klicks 7 Tage</th><th>Klicks gesamt</th><th>Bewerbungen gesendet</th></tr>
          </thead>
          <tbody>
            {partners.map((p) => (
              <tr key={p.id} className="border-t border-stone-100">
                <td className="py-2 font-medium">{p.name} <span className="muted">({p.key})</span></td>
                <td>{p.sponsored ? "ja" : "nein"}</td>
                <td>{p._count.listings}</td>
                <td>{count(clicks7, p.id)}</td>
                <td>{count(clicksTotal, p.id)}</td>
                <td>{sentCount(p.id)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card overflow-x-auto">
        <h2 className="mb-3 font-semibold">Quellen</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-stone-500">
            <tr><th className="py-1">Quelle</th><th>Vertical</th><th>Bewerbungs-API</th><th>Anzeigen</th><th>Letzter Import</th></tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.key} className="border-t border-stone-100">
                <td className="py-2 font-medium">{s.name}</td>
                <td>{s.verticalKey}</td>
                <td>{s.supportsApply ? "ja" : "nein"}</td>
                <td>{s._count.listings}</td>
                <td>{s.lastImportAt?.toLocaleString("de-DE") ?? "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card overflow-x-auto">
        <h2 className="mb-3 font-semibold">Letzte Bewerbungen</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-stone-500">
            <tr><th className="py-1">Zeit</th><th>Nutzer</th><th>Anzeige</th><th>Partner</th><th>Modus</th><th>Status</th></tr>
          </thead>
          <tbody>
            {recent.map((a) => (
              <tr key={a.id} className="border-t border-stone-100">
                <td className="py-2">{a.updatedAt.toLocaleString("de-DE")}</td>
                <td>{a.user.email}</td>
                <td>{a.listing.title}</td>
                <td>{a.listing.partner?.name ?? "–"}</td>
                <td>{a.mode}</td>
                <td>{a.status}{a.error ? ` – ${a.error}` : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
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
