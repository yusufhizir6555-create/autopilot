import Link from "next/link";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/db";
import { getVertical } from "@/verticals";

export default async function SearchProfilesPage() {
  const user = await requireUser();
  const profiles = await prisma.searchProfile.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { applications: true } }, matches: { select: { score: true, excluded: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="h1">Suchaufträge</h1>
          <p className="muted mt-1">Deine Wünsche und Kriterien. Neue Anzeigen werden automatisch dagegen geprüft.</p>
        </div>
        <Link href="/suche/neu" className="btn">+ Neuer Suchauftrag</Link>
      </div>

      {profiles.length === 0 && (
        <div className="card text-center">
          <p>Noch kein Suchauftrag. Lege jetzt deine Kriterien fest.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {profiles.map((p) => {
          const hits = p.matches.filter((m) => !m.excluded && m.score >= p.scoreThreshold).length;
          return (
            <Link key={p.id} href={`/suche/${p.id}`} className="card block hover:border-emerald-600">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">{p.name}</h2>
                <span className={`badge ${p.active ? "bg-emerald-50 text-emerald-800" : "bg-stone-100 text-stone-600"}`}>
                  {p.active ? "aktiv" : "pausiert"}
                </span>
              </div>
              <p className="muted mt-1">{getVertical(p.verticalKey).name} · ab {p.scoreThreshold} %</p>
              <p className="mt-3 text-sm">
                {hits} Treffer · {p._count.applications} Bewerbungen · Auto-Bewerben {p.autoApply ? `an (max. ${p.dailyApplyLimit}/Tag)` : "aus"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
