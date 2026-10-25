import { defineVertical } from "@/core/verticals/types";
import { cities, cityKeys } from "./cities";
import { extras, housingCriteriaSchema, housingListingSchema, housingProfileSchema } from "./schema";
import { scoreHousing } from "./scorer";

const extraOptions = Object.entries(extras).map(([value, label]) => ({ value, label }));

export const housingVertical = defineVertical({
  key: "housing",
  name: "Wohnungssuche",
  itemLabel: "Wohnung",
  criteriaSchema: housingCriteriaSchema,
  listingDataSchema: housingListingSchema,
  profileSchema: housingProfileSchema,

  criteriaFields: [
    {
      name: "cityKey",
      label: "Stadt",
      type: "select",
      required: true,
      options: cityKeys.map((k) => ({ value: k, label: cities[k].name })),
    },
    { name: "radiusKm", label: "Umkreis (km)", type: "number", required: true, min: 1, max: 100 },
    { name: "rentMin", label: "Warmmiete ab (€)", type: "number", min: 0, step: 10 },
    { name: "rentMax", label: "Warmmiete bis (€)", type: "number", required: true, min: 0, step: 10 },
    { name: "roomsMin", label: "Zimmer ab", type: "number", required: true, min: 1, max: 10, step: 0.5 },
    { name: "roomsMax", label: "Zimmer bis", type: "number", min: 1, max: 10, step: 0.5 },
    { name: "areaMin", label: "Wohnfläche ab (m²)", type: "number", min: 10, max: 500 },
    { name: "moveInFrom", label: "Einzug frühestens", type: "date" },
    { name: "moveInLatest", label: "Einzug spätestens", type: "date" },
    { name: "extras", label: "Gewünschte Extras", type: "multiselect", options: extraOptions },
  ],

  profileFields: [
    { name: "firstName", label: "Vorname", type: "text", required: true },
    { name: "lastName", label: "Nachname", type: "text", required: true },
    { name: "phone", label: "Telefon", type: "tel" },
    { name: "householdSize", label: "Personen im Haushalt", type: "number", required: true, min: 1, max: 15 },
    { name: "children", label: "davon Kinder", type: "number", min: 0, max: 10 },
    { name: "occupation", label: "Beruf / Tätigkeit", type: "text", required: true },
    { name: "netIncomeMonthly", label: "Haushaltsnettoeinkommen (€/Monat)", type: "number", required: true, min: 0, step: 50 },
    { name: "pets", label: "Haustiere", type: "checkbox" },
    { name: "smoker", label: "Raucher", type: "checkbox" },
    { name: "aboutMe", label: "Über mich (kurz)", type: "textarea", help: "Wird als {{ueber_mich}} im Anschreiben verwendet." },
  ],

  documentKinds: [
    { key: "schufa", label: "SCHUFA-Auskunft" },
    { key: "income", label: "Einkommensnachweis" },
    { key: "landlord", label: "Mietschuldenfreiheitsbescheinigung" },
    { key: "id", label: "Ausweiskopie (geschwärzt)" },
    { key: "other", label: "Sonstiges" },
  ],

  defaultCoverLetter: `Sehr geehrte Damen und Herren,

mit großem Interesse habe ich Ihre Anzeige „{{titel}}“ ({{adresse}}) gesehen und möchte mich hiermit um die Wohnung bewerben.

{{ueber_mich}}

Wir sind ein Haushalt mit {{personen}} Person(en); ich arbeite als {{beruf}}. Die Unterlagen (SCHUFA, Einkommensnachweise) reiche ich gern nach oder habe sie beigefügt.

Über eine Einladung zur Besichtigung freue ich mich sehr.

Mit freundlichen Grüßen
{{name}}
{{telefon}}`,

  coverLetterPlaceholders: {
    name: "Vor- und Nachname",
    vorname: "Vorname",
    nachname: "Nachname",
    telefon: "Telefon",
    personen: "Personen im Haushalt",
    beruf: "Beruf",
    ueber_mich: "„Über mich“-Text",
    adresse: "Adresse der Wohnung",
    miete: "Warmmiete der Wohnung",
  },

  score: scoreHousing,

  listingFacts: (l) => [
    { label: "Warmmiete", value: `${l.rentWarm.toLocaleString("de-DE")} €` },
    { label: "Zimmer", value: l.rooms.toLocaleString("de-DE") },
    { label: "Fläche", value: `${l.areaSqm} m²` },
    { label: "Frei ab", value: new Date(l.availableFrom).toLocaleDateString("de-DE") },
    { label: "Adresse", value: l.address },
  ],

  dedupeKey: (l, title) =>
    [title.toLowerCase().replace(/\s+/g, " ").trim(), l.address.toLowerCase(), l.rentWarm, l.areaSqm, l.rooms].join("|"),

  coverLetterContext: (p, l) => ({
    name: `${p.firstName} ${p.lastName}`,
    vorname: p.firstName,
    nachname: p.lastName,
    telefon: p.phone ?? "",
    personen: String(p.householdSize),
    beruf: p.occupation,
    ueber_mich: p.aboutMe ?? "",
    adresse: l.address,
    miete: `${l.rentWarm.toLocaleString("de-DE")} €`,
  }),
});
