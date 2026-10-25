import { z } from "zod";
import { cityKeys } from "./cities";

export const extras = {
  balcony: "Balkon/Terrasse",
  kitchen: "Einbauküche",
  elevator: "Aufzug",
  parking: "Stellplatz",
  pets: "Haustiere erlaubt",
  garden: "Garten",
  barrierFree: "Barrierefrei",
} as const;
export type Extra = keyof typeof extras;
const extraEnum = z.enum(Object.keys(extras) as [Extra, ...Extra[]]);

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Datum im Format JJJJ-MM-TT");

export const housingCriteriaSchema = z
  .object({
    cityKey: z.enum(cityKeys),
    radiusKm: z.number().min(1).max(100).default(10),
    rentMin: z.number().min(0).optional(),
    rentMax: z.number().positive(),
    roomsMin: z.number().min(1).max(10),
    roomsMax: z.number().min(1).max(10).optional(),
    areaMin: z.number().min(10).max(500).optional(),
    moveInFrom: isoDate.optional(),
    moveInLatest: isoDate.optional(),
    extras: z.array(extraEnum).default([]),
  })
  .refine((c) => c.rentMin === undefined || c.rentMin <= c.rentMax, {
    message: "Mindestmiete darf nicht über der Höchstmiete liegen",
    path: ["rentMin"],
  })
  .refine((c) => c.roomsMax === undefined || c.roomsMin <= c.roomsMax, {
    message: "Mindestzimmer darf nicht über Höchstzimmer liegen",
    path: ["roomsMin"],
  })
  .refine((c) => !c.moveInFrom || !c.moveInLatest || c.moveInFrom <= c.moveInLatest, {
    message: "„Einzug ab“ muss vor „Einzug spätestens“ liegen",
    path: ["moveInFrom"],
  });
export type HousingCriteria = z.infer<typeof housingCriteriaSchema>;

export const housingListingSchema = z.object({
  rentWarm: z.number().positive(),
  rentCold: z.number().positive().optional(),
  rooms: z.number().positive(),
  areaSqm: z.number().positive(),
  address: z.string(),
  district: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
  availableFrom: isoDate,
  extras: z.array(extraEnum).default([]),
  description: z.string().optional(),
});
export type HousingListing = z.infer<typeof housingListingSchema>;

export const housingProfileSchema = z.object({
  firstName: z.string().min(1, "Pflichtfeld"),
  lastName: z.string().min(1, "Pflichtfeld"),
  phone: z.string().optional(),
  householdSize: z.number().int().min(1).max(15),
  children: z.number().int().min(0).max(10).default(0),
  pets: z.boolean().default(false),
  smoker: z.boolean().default(false),
  occupation: z.string().min(1, "Pflichtfeld"),
  netIncomeMonthly: z.number().min(0),
  aboutMe: z.string().max(2000).optional(),
});
export type HousingProfile = z.infer<typeof housingProfileSchema>;
