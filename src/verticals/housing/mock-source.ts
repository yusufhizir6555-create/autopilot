import type { ApplicationPayload, ListingSource, SourceListing } from "@/core/sources/types";
import { cities } from "./cities";
import { mockRows, type MockRow } from "./mock-data";
import type { HousingListing } from "./schema";

const DAY = 24 * 60 * 60 * 1000;

export function mockRowToListing(row: MockRow, urlBase: string, now = new Date()): SourceListing {
  const city = cities[row.city];
  const latPerKm = 1 / 110.574;
  const lngPerKm = 1 / (111.32 * Math.cos((city.lat * Math.PI) / 180));
  const extraCosts = Math.round(row.area * 2.8);
  const data: HousingListing = {
    rentCold: row.cold,
    rentWarm: row.cold + extraCosts,
    rooms: row.rooms,
    areaSqm: row.area,
    address: `${row.street}, ${city.name}`,
    district: row.district,
    lat: city.lat + row.km[1] * latPerKm,
    lng: city.lng + row.km[0] * lngPerKm,
    availableFrom: new Date(now.getTime() + row.inDays * DAY).toISOString().slice(0, 10),
    extras: row.extras,
    description: `${row.title} in ${row.district}. ${row.rooms} Zimmer auf ${row.area} m².`,
  };
  return {
    externalId: row.id,
    title: row.title,
    url: `${urlBase}/${row.id}`,
    city: city.name,
    publishedAt: new Date(now.getTime() - (row.inDays % 5) * DAY),
    data,
  };
}

/**
 * Mock einer Partner-API, die Bewerbungen direkt entgegennimmt.
 * Ersetzen durch einen echten Adapter, sobald ein Partnervertrag besteht.
 */
export const mockHousingSource: ListingSource = {
  key: "mock-housing",
  name: "Demo-Partner Wohnen (Mock-API)",
  verticalKey: "housing",
  partnerKey: "demo-partner",
  async fetchListings() {
    return mockRows.map((row) => mockRowToListing(row, "https://partner.example/wohnung"));
  },
  async submitApplication(payload: ApplicationPayload) {
    if (!mockRows.some((r) => r.id === payload.externalListingId)) {
      throw new Error(`Anzeige ${payload.externalListingId} ist beim Partner nicht mehr verfügbar`);
    }
    return { externalRef: `MOCK-${payload.externalListingId}-${Date.now().toString(36).toUpperCase()}` };
  },
};

/**
 * Mock eines reinen Anzeigen-Feeds (z. B. XML-Feed eines Portals) ohne Bewerbungs-API.
 * Enthält bewusst 3 Dubletten aus mockHousingSource und gesponserte Anzeigen.
 */
export const mockFeedSource: ListingSource = {
  key: "mock-feed",
  name: "Demo-Portal Feed (nur Anzeigen)",
  verticalKey: "housing",
  partnerKey: "demo-portal",
  async fetchListings() {
    const duplicates = mockRows
      .filter((r) => ["B-1001", "H-2002", "K-4003"].includes(r.id))
      .map((r) => ({ ...mockRowToListing(r, "https://portal.example/expose"), externalId: `FEED-${r.id}` }));
    const own: MockRow[] = [
      { id: "FEED-9001", city: "berlin", district: "Moabit", street: "Turmstraße 60", title: "Neu renoviert: 2 Zimmer in Moabit", rooms: 2, area: 58, cold: 760, extras: ["kitchen", "balcony"], km: [-2.8, 1.4], inDays: 16 },
      { id: "FEED-9002", city: "berlin", district: "Tempelhof", street: "Tempelhofer Damm 140", title: "3 Zimmer nahe Tempelhofer Feld", rooms: 3, area: 75, cold: 980, extras: ["balcony", "elevator"], km: [0.6, -4.9], inDays: 24 },
      { id: "FEED-9003", city: "hamburg", district: "St. Georg", street: "Lange Reihe 44", title: "Zentrale 2-Zimmer in St. Georg", rooms: 2, area: 52, cold: 1020, extras: ["kitchen"], km: [0.9, 0.3], inDays: 19 },
      { id: "FEED-9004", city: "leipzig", district: "Reudnitz", street: "Dresdner Str. 80", title: "Sanierter Altbau mit Balkon", rooms: 2, area: 59, cold: 560, extras: ["balcony"], km: [1.9, -0.4], inDays: 13 },
    ];
    return [
      ...duplicates,
      ...own.map((r, i) => ({ ...mockRowToListing(r, "https://portal.example/expose"), sponsored: i < 2 })),
    ];
  },
};
