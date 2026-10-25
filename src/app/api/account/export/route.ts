import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/** DSGVO Art. 15/20: alle gespeicherten Daten des Nutzers als JSON. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response("Nicht angemeldet", { status: 401 });
  const data = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      applicantProfiles: true,
      documents: { select: { id: true, kind: true, filename: true, mimeType: true, size: true, createdAt: true } },
      searchProfiles: true,
      applications: { include: { listing: { select: { title: true, url: true } } } },
      notificationPreferences: true,
      notifications: true,
      clickEvents: { select: { listingId: true, placement: true, createdAt: true } },
    },
  });
  return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), user: data }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="meine-daten.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
