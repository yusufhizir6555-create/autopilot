import { describe, expect, it } from "vitest";
import { evaluate } from "@/core/matching/engine";
import type { AnyVertical } from "@/core/verticals/types";
import { cities } from "@/verticals/housing/cities";
import { housingVertical } from "@/verticals/housing";
import type { HousingListing } from "@/verticals/housing/schema";
import { scoreHousing } from "@/verticals/housing/scorer";

const berlin = cities.berlin;
const listing = (over: Partial<HousingListing> = {}): HousingListing => ({
  rentWarm: 900,
  rooms: 2,
  areaSqm: 60,
  address: "Teststraße 1, Berlin",
  lat: berlin.lat,
  lng: berlin.lng,
  availableFrom: "2030-03-01",
  extras: ["balcony"],
  ...over,
});
const criteria = housingVertical.criteriaSchema.parse({
  cityKey: "berlin",
  radiusKm: 10,
  rentMax: 1000,
  roomsMin: 2,
  areaMin: 55,
  moveInFrom: "2030-02-01",
  moveInLatest: "2030-04-01",
  extras: ["balcony"],
});

describe("scoreHousing", () => {
  it("vergibt 100 Punkte, wenn alles passt", () => {
    const r = scoreHousing(criteria, listing());
    expect(r.score).toBe(100);
    expect(r.excluded).toBe(false);
    expect(r.reasons.every((x) => x.ok)).toBe(true);
  });

  it("zieht anteilig ab, wenn die Miete knapp über Budget liegt", () => {
    const r = scoreHousing(criteria, listing({ rentWarm: 1050 }));
    const rent = r.reasons.find((x) => x.criterion === "rent")!;
    expect(rent.ok).toBe(false);
    expect(rent.points).toBe(15);
    expect(r.excluded).toBe(false);
  });

  it("schließt aus, wenn die Miete mehr als 10 % über Budget liegt", () => {
    const r = scoreHousing(criteria, listing({ rentWarm: 1101 }));
    expect(r.excluded).toBe(true);
  });

  it("schließt aus, wenn die Wohnung weit außerhalb des Radius liegt", () => {
    const r = scoreHousing(criteria, listing({ lat: cities.leipzig.lat, lng: cities.leipzig.lng }));
    expect(r.excluded).toBe(true);
    expect(r.reasons.find((x) => x.criterion === "location")!.points).toBe(0);
  });

  it("vergibt halbe Punkte bei einem halben Zimmer zu wenig", () => {
    const r = scoreHousing(criteria, listing({ rooms: 1.5 }));
    expect(r.reasons.find((x) => x.criterion === "rooms")!.points).toBe(7.5);
  });

  it("berücksichtigt fehlende Extras und Einzugstermine", () => {
    const r = scoreHousing(criteria, listing({ extras: [], availableFrom: "2030-04-20" }));
    expect(r.reasons.find((x) => x.criterion === "extras")!.points).toBe(0);
    expect(r.reasons.find((x) => x.criterion === "moveIn")!.points).toBe(5);
    expect(r.score).toBe(90);
  });

  it("liefert über evaluate() Treffer abhängig vom Schwellenwert", () => {
    const v = housingVertical as AnyVertical;
    const raw = { cityKey: "berlin", radiusKm: 10, rentMax: 1000, roomsMin: 2 };
    expect(evaluate(v, raw, listing({ rentWarm: 1050 }), 80).isMatch).toBe(true);
    expect(evaluate(v, raw, listing({ rentWarm: 1050 }), 90).isMatch).toBe(false);
    expect(evaluate(v, raw, listing({ rentWarm: 1200 }), 0).isMatch).toBe(false);
  });
});
