import { prisma } from "@/lib/db";
import { sources, verticals } from "@/verticals";

/** Spiegelt die im Code registrierten Verticals und Quellen in die Datenbank. */
export async function syncRegistry(): Promise<void> {
  for (const v of Object.values(verticals)) {
    await prisma.vertical.upsert({ where: { key: v.key }, create: { key: v.key, name: v.name }, update: { name: v.name } });
  }
  for (const s of sources) {
    const partner = s.partnerKey ? await prisma.partner.findUnique({ where: { key: s.partnerKey } }) : null;
    const data = {
      name: s.name,
      verticalKey: s.verticalKey,
      partnerId: partner?.id ?? null,
      supportsApply: typeof s.submitApplication === "function",
    };
    await prisma.source.upsert({ where: { key: s.key }, create: { key: s.key, ...data }, update: data });
  }
}
