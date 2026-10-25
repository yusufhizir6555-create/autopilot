import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteSearchProfile } from "@/app/actions/search";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/db";
import { resolveVerticalKey } from "@/lib/vertical-param";
import { getVertical } from "@/verticals";
import { SearchProfileForm } from "../search-form";

export default async function SearchProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ v?: string; neu?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const sp = await searchParams;
  const isNew = id === "neu";
  const profile = isNew ? null : await prisma.searchProfile.findFirst({ where: { id, userId: user.id } });
  if (!isNew && !profile) notFound();

  const verticalKey = profile?.verticalKey ?? resolveVerticalKey(sp.v);
  const vertical = getVertical(verticalKey);
  const hasApplicant = await prisma.applicantProfile.count({ where: { userId: user.id, verticalKey } });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/suche" className="muted hover:underline">← Alle Suchaufträge</Link>
        <h1 className="h1 mt-2">{isNew ? "Neuer Suchauftrag" : profile!.name}</h1>
        <p className="muted mt-1">{vertical.name}</p>
      </div>

      {sp.neu && (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
          Suchauftrag angelegt und Anzeigen bewertet. <Link href="/dashboard" className="font-medium underline">Treffer ansehen →</Link>
        </p>
      )}
      {!hasApplicant && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Ohne <Link href="/profil" className="font-medium underline">Bewerbungsprofil</Link> werden nur Entwürfe angelegt – auch wenn Auto-Bewerben an ist.
        </p>
      )}

      <section className="card">
        <SearchProfileForm
          verticalKey={verticalKey}
          id={profile?.id ?? null}
          fields={vertical.criteriaFields}
          criteria={(profile?.criteria as Record<string, unknown>) ?? { radiusKm: 10 }}
          settings={{
            name: profile?.name ?? "",
            scoreThreshold: profile?.scoreThreshold ?? 70,
            dailyApplyLimit: profile?.dailyApplyLimit ?? 5,
            autoApply: profile?.autoApply ?? false,
            active: profile?.active ?? true,
          }}
        />
      </section>

      {profile && (
        <form action={deleteSearchProfile}>
          <input type="hidden" name="id" value={profile.id} />
          <button className="text-sm text-red-700 hover:underline">Suchauftrag löschen</button>
        </form>
      )}
    </div>
  );
}
