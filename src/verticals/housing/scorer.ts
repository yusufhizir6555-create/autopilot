import type { ScoreReason, ScoreResult } from "@/core/verticals/types";
import { cities, distanceKm } from "./cities";
import { extras, type HousingCriteria, type HousingListing } from "./schema";

export const weights = { rent: 30, location: 25, rooms: 15, area: 15, moveIn: 10, extras: 5 } as const;

const eur = (n: number) => `${Math.round(n).toLocaleString("de-DE")} €`;
const DAY = 24 * 60 * 60 * 1000;

/** Anteil zwischen 1 (bei limit) und 0 (bei limit * (1 + tolerance)), linear. */
function taper(value: number, limit: number, tolerance: number): number {
  if (value <= limit) return 1;
  const over = (value - limit) / (limit * tolerance);
  return Math.max(0, 1 - over);
}

export function scoreHousing(c: HousingCriteria, l: HousingListing): ScoreResult {
  const reasons: ScoreReason[] = [];
  let excluded = false;

  // Miete (hart: mehr als 10 % über Budget → ausgeschlossen)
  {
    const f = taper(l.rentWarm, c.rentMax, 0.1);
    if (f === 0) excluded = true;
    reasons.push({
      criterion: "rent",
      ok: f === 1,
      points: weights.rent * f,
      maxPoints: weights.rent,
      text:
        f === 1
          ? `Warmmiete ${eur(l.rentWarm)} ≤ ${eur(c.rentMax)}`
          : `Warmmiete ${eur(l.rentWarm)} über Budget ${eur(c.rentMax)}`,
    });
  }

  // Lage (hart: mehr als 50 % über dem Radius → ausgeschlossen)
  {
    const city = cities[c.cityKey];
    const d = distanceKm(city, l);
    const f = taper(d, c.radiusKm, 0.5);
    if (f === 0) excluded = true;
    reasons.push({
      criterion: "location",
      ok: f === 1,
      points: weights.location * f,
      maxPoints: weights.location,
      text: `${d.toFixed(1).replace(".", ",")} km vom Zentrum ${city.name} (Radius ${c.radiusKm} km)`,
    });
  }

  // Zimmer
  {
    const tooFew = c.roomsMin - l.rooms;
    const tooMany = c.roomsMax !== undefined && l.rooms > c.roomsMax;
    const f = tooMany ? 0.5 : tooFew <= 0 ? 1 : tooFew <= 0.5 ? 0.5 : 0;
    reasons.push({
      criterion: "rooms",
      ok: f === 1,
      points: weights.rooms * f,
      maxPoints: weights.rooms,
      text: `${l.rooms.toLocaleString("de-DE")} Zimmer (gewünscht ab ${c.roomsMin.toLocaleString("de-DE")}${
        c.roomsMax ? ` bis ${c.roomsMax.toLocaleString("de-DE")}` : ""
      })`,
    });
  }

  // Fläche
  {
    const f = c.areaMin === undefined ? 1 : l.areaSqm >= c.areaMin ? 1 : Math.max(0, 1 - (c.areaMin - l.areaSqm) / (c.areaMin * 0.1));
    reasons.push({
      criterion: "area",
      ok: f === 1,
      points: weights.area * f,
      maxPoints: weights.area,
      text: c.areaMin ? `${l.areaSqm} m² (gewünscht ab ${c.areaMin} m²)` : `${l.areaSqm} m²`,
    });
  }

  // Einzug
  {
    const avail = Date.parse(l.availableFrom);
    const from = c.moveInFrom ? Date.parse(c.moveInFrom) : -Infinity;
    const latest = c.moveInLatest ? Date.parse(c.moveInLatest) : Infinity;
    const gap = avail < from ? from - avail : avail > latest ? avail - latest : 0;
    const f = gap === 0 ? 1 : gap <= 30 * DAY ? 0.5 : 0;
    reasons.push({
      criterion: "moveIn",
      ok: f === 1,
      points: weights.moveIn * f,
      maxPoints: weights.moveIn,
      text: `Frei ab ${new Date(avail).toLocaleDateString("de-DE")}`,
    });
  }

  // Extras
  {
    const wanted = c.extras;
    const have = wanted.filter((e) => l.extras.includes(e));
    const f = wanted.length === 0 ? 1 : have.length / wanted.length;
    const missing = wanted.filter((e) => !l.extras.includes(e)).map((e) => extras[e]);
    reasons.push({
      criterion: "extras",
      ok: f === 1,
      points: weights.extras * f,
      maxPoints: weights.extras,
      text:
        wanted.length === 0
          ? "Keine Extras gewünscht"
          : missing.length === 0
            ? "Alle gewünschten Extras vorhanden"
            : `Fehlt: ${missing.join(", ")}`,
    });
  }

  const score = reasons.reduce((sum, r) => sum + r.points, 0);
  return {
    score: Math.round(score),
    excluded,
    reasons: reasons.map((r) => ({ ...r, points: Math.round(r.points * 10) / 10 })),
  };
}
