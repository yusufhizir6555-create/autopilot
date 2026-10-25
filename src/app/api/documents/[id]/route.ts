import { auth } from "@/auth";
import { readDecrypted } from "@/core/documents/storage";
import { prisma } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Nicht angemeldet", { status: 401 });
  const { id } = await params;
  const doc = await prisma.document.findFirst({ where: { id, userId: session.user.id } });
  if (!doc) return new Response("Nicht gefunden", { status: 404 });

  const content = await readDecrypted(doc);
  return new Response(new Uint8Array(content), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(doc.filename)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
