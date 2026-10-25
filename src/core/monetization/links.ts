export const placements = ["dashboard", "notification", "draft", "other"] as const;
export type Placement = (typeof placements)[number];

export function parsePlacement(p: string | null): Placement {
  return (placements as readonly string[]).includes(p ?? "") ? (p as Placement) : "other";
}

/** Baut den Ziel-Link: Affiliate-Vorlage des Partners oder direkte Anzeige. Nur http(s). */
export function buildTargetUrl(listingUrl: string, affiliateUrlTemplate?: string | null): string {
  const target = affiliateUrlTemplate ? affiliateUrlTemplate.replace("{url}", encodeURIComponent(listingUrl)) : listingUrl;
  const u = new URL(target);
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("Ungültiges Linkziel");
  return u.toString();
}
