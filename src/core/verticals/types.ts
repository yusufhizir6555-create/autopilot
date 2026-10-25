import type { z } from "zod";
import type { FieldDef } from "@/core/forms/fields";

export type ScoreReason = {
  criterion: string;
  ok: boolean;
  points: number;
  maxPoints: number;
  text: string;
};

export type ScoreResult = {
  /** 0–100 */
  score: number;
  reasons: ScoreReason[];
  /** Ein hartes Kriterium ist verletzt – unabhängig vom Score kein Treffer. */
  excluded: boolean;
};

export type ListingFact = { label: string; value: string };

/**
 * Alles, was einen Suchbereich (Wohnen, Jobs, Kitas, …) ausmacht.
 * Der Kern (Import, Matching, Bewerbung, Benachrichtigung) kennt nur dieses Interface.
 */
export interface VerticalDefinition<TCriteria = unknown, TListing = unknown, TProfile = unknown> {
  key: string;
  name: string;
  /** Bezeichnung einer einzelnen Anzeige, z. B. "Wohnung" */
  itemLabel: string;

  criteriaSchema: z.ZodType<TCriteria, z.ZodTypeDef, unknown>;
  listingDataSchema: z.ZodType<TListing, z.ZodTypeDef, unknown>;
  profileSchema: z.ZodType<TProfile, z.ZodTypeDef, unknown>;

  criteriaFields: FieldDef[];
  profileFields: FieldDef[];
  documentKinds: { key: string; label: string }[];

  defaultCoverLetter: string;
  /** Platzhalter für das Anschreiben → Beschreibung. {{titel}} stellt der Kern immer bereit. */
  coverLetterPlaceholders: Record<string, string>;

  score(criteria: TCriteria, listing: TListing): ScoreResult;
  listingFacts(listing: TListing): ListingFact[];
  /** Felder für die Dublettenerkennung über Quellen hinweg */
  dedupeKey(listing: TListing, title: string): string;
  coverLetterContext(profile: TProfile, listing: TListing): Record<string, string>;
}

export type AnyVertical = VerticalDefinition<unknown, unknown, unknown>;

export function defineVertical<C, L, P>(def: VerticalDefinition<C, L, P>): VerticalDefinition<C, L, P> {
  return def;
}
