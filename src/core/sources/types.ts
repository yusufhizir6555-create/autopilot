/** Eine Anzeige, wie ein Quellen-Adapter sie liefert (vor Validierung). */
export type SourceListing = {
  externalId: string;
  title: string;
  url: string;
  city?: string;
  publishedAt?: Date;
  sponsored?: boolean;
  /** Vertical-spezifische Felder; werden gegen listingDataSchema geprüft. */
  data: unknown;
};

export type ApplicationPayload = {
  externalListingId: string;
  applicant: { name: string; email: string; phone?: string };
  coverLetter: string;
  profile: unknown;
  documents: { kind: string; filename: string; mimeType: string }[];
};

/**
 * Anbindung an eine offizielle Quelle (Partner-API, Feed, Makler-Schnittstelle).
 * Scraping fremder Portale ist ausdrücklich nicht vorgesehen.
 */
export interface ListingSource {
  key: string;
  name: string;
  verticalKey: string;
  /** Partner.key – für Affiliate-Links und Klick-Tracking */
  partnerKey?: string;
  fetchListings(): Promise<SourceListing[]>;
  /** Nur Quellen, die Bewerbungen offiziell entgegennehmen, implementieren das. */
  submitApplication?(payload: ApplicationPayload): Promise<{ externalRef: string }>;
}
