import { auth } from "@/auth";
import { buildTargetUrl, parsePlacement } from "@/core/monetization/links";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Tracking-Redirect zu Partner-Anzeigen. Protokolliert nur Anzeige, Partner, Platzierung und ggf. Nutzer. */
export async function GET(req: Request, { params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params;
  const listing = await prisma.listing.findUnique({ where: { id: listingId }, include: { partner: true } });
  if (!listing) return new Response("Anzeige nicht gefunden", { status: 404 });

  const session = await auth();
  await prisma.clickEvent.create({
    data: {
      listingId: listing.id,
      partnerId: listing.partnerId,
      userId: session?.user?.id ?? null,
      placement: parsePlacement(new URL(req.url).searchParams.get("p")),
    },
  });
  const target = buildTargetUrl(listing.url, listing.partner?.active ? listing.partner.affiliateUrlTemplate : null);
  return new Response(null, { status: 302, headers: { Location: target, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
