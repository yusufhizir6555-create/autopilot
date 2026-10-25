import { requireUser } from "@/auth";
import { prisma } from "@/lib/db";
import { resolveVerticalKey } from "@/lib/vertical-param";
import { getVertical } from "@/verticals";
import { DocumentList, DocumentUploadForm, ProfileForm } from "./forms";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  const user = await requireUser();
  const verticalKey = resolveVerticalKey((await searchParams).v);
  const vertical = getVertical(verticalKey);
  const [profile, documents] = await Promise.all([
    prisma.applicantProfile.findUnique({ where: { userId_verticalKey: { userId: user.id, verticalKey } } }),
    prisma.document.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="h1">Bewerbungsprofil – {vertical.name}</h1>
        <p className="muted mt-1">Diese Angaben werden für jede Bewerbung verwendet. Du legst sie nur einmal an.</p>
      </div>

      <section className="card">
        <ProfileForm
          verticalKey={verticalKey}
          fields={vertical.profileFields}
          values={(profile?.data as Record<string, unknown>) ?? undefined}
          coverLetter={profile?.coverLetterTemplate || vertical.defaultCoverLetter}
          placeholders={{ titel: `Titel der Anzeige`, ...vertical.coverLetterPlaceholders }}
        />
      </section>

      <section className="card space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Nachweise</h2>
          <p className="muted">PDF, JPG oder PNG bis 10 MB. Dateien werden verschlüsselt gespeichert und nur mit deiner Bewerbung übermittelt.</p>
        </div>
        <DocumentList
          documents={documents.map((d) => ({
            id: d.id,
            filename: d.filename,
            size: d.size,
            kindLabel: vertical.documentKinds.find((k) => k.key === d.kind)?.label ?? d.kind,
            createdAt: d.createdAt.toISOString(),
          }))}
        />
        <DocumentUploadForm verticalKey={verticalKey} kinds={vertical.documentKinds} />
      </section>
    </div>
  );
}
