import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { syncRegistry } from "@/core/registry-sync";
import { prisma } from "@/lib/db";
import { getVertical, sources } from "@/verticals";

export type ImportStats = {
  source: string;
  fetched: number;
  created: number;
  updated: number;
  duplicates: number;
  invalid: number;
  error?: string;
};

export function contentHash(verticalKey: string, dedupeKey: string): string {
  return createHash("sha256").update(`${verticalKey}|${dedupeKey}`).digest("hex");
}

/** Holt Anzeigen aus allen registrierten Quellen, validiert und dedupliziert sie. */
export async function runImport(): Promise<ImportStats[]> {
  await syncRegistry();
  const results: ImportStats[] = [];

  for (const source of sources) {
    const stats: ImportStats = { source: source.key, fetched: 0, created: 0, updated: 0, duplicates: 0, invalid: 0 };
    results.push(stats);
    const vertical = getVertical(source.verticalKey);
    const dbSource = await prisma.source.findUniqueOrThrow({ where: { key: source.key } });

    let items;
    try {
      items = await source.fetchListings();
    } catch (err) {
      stats.error = err instanceof Error ? err.message : String(err);
      continue;
    }
    stats.fetched = items.length;

    for (const item of items) {
      const parsed = vertical.listingDataSchema.safeParse(item.data);
      if (!parsed.success) {
        stats.invalid++;
        continue;
      }
      const hash = contentHash(vertical.key, vertical.dedupeKey(parsed.data, item.title));
      const fields = {
        title: item.title,
        url: item.url,
        city: item.city ?? null,
        data: parsed.data as Prisma.InputJsonValue,
        contentHash: hash,
        sponsored: item.sponsored ?? false,
        publishedAt: item.publishedAt ?? null,
        partnerId: dbSource.partnerId,
        active: true,
      };

      const existing = await prisma.listing.findUnique({
        where: { sourceKey_externalId: { sourceKey: source.key, externalId: item.externalId } },
      });
      if (existing) {
        await prisma.listing.update({ where: { id: existing.id }, data: fields });
        stats.updated++;
        continue;
      }

      // Dieselbe Anzeige aus einer anderen Quelle? Dann nicht doppelt aufnehmen.
      const duplicate = await prisma.listing.findFirst({
        where: { contentHash: hash, active: true, sourceKey: { not: source.key } },
      });
      if (duplicate) {
        stats.duplicates++;
        continue;
      }

      await prisma.listing.create({
        data: { ...fields, verticalKey: vertical.key, sourceKey: source.key, externalId: item.externalId },
      });
      stats.created++;
    }

    await prisma.source.update({ where: { key: source.key }, data: { lastImportAt: new Date() } });
  }
  return results;
}
