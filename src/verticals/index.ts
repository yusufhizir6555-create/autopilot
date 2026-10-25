import type { AnyVertical } from "@/core/verticals/types";
import type { ListingSource } from "@/core/sources/types";
import { housingVertical } from "./housing";
import { mockFeedSource, mockHousingSource } from "./housing/mock-source";

/**
 * Registry aller Suchbereiche und Quellen.
 * Neues Vertical: Ordner src/verticals/<key>/ anlegen und hier eintragen (siehe README).
 */
export const verticals: Record<string, AnyVertical> = {
  [housingVertical.key]: housingVertical as AnyVertical,
};

export const sources: ListingSource[] = [mockHousingSource, mockFeedSource];

export function getVertical(key: string): AnyVertical {
  const v = verticals[key];
  if (!v) throw new Error(`Unbekanntes Vertical: ${key}`);
  return v;
}

export function getSource(key: string): ListingSource | undefined {
  return sources.find((s) => s.key === key);
}
