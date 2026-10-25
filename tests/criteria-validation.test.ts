import { describe, expect, it } from "vitest";
import { parseFormData } from "@/core/forms/fields";
import { housingVertical } from "@/verticals/housing";

const schema = housingVertical.criteriaSchema;

describe("Kriterien-Validierung (Wohnen)", () => {
  it("akzeptiert gültige Kriterien und setzt Standardwerte", () => {
    const c = schema.parse({ cityKey: "koeln", rentMax: 900, roomsMin: 2 });
    expect(c.radiusKm).toBe(10);
    expect(c.extras).toEqual([]);
  });

  it.each([
    [{ cityKey: "paris", rentMax: 900, roomsMin: 2 }, "cityKey"],
    [{ cityKey: "koeln", rentMax: -1, roomsMin: 2 }, "rentMax"],
    [{ cityKey: "koeln", rentMin: 1000, rentMax: 900, roomsMin: 2 }, "rentMin"],
    [{ cityKey: "koeln", rentMax: 900, roomsMin: 3, roomsMax: 2 }, "roomsMin"],
    [{ cityKey: "koeln", rentMax: 900, roomsMin: 2, moveInFrom: "2030-05-01", moveInLatest: "2030-04-01" }, "moveInFrom"],
    [{ cityKey: "koeln", rentMax: 900, roomsMin: 2, moveInFrom: "01.05.2030" }, "moveInFrom"],
    [{ cityKey: "koeln", rentMax: 900, roomsMin: 2, extras: ["pool"] }, "extras"],
  ])("lehnt %j ab (Feld %s)", (input, field) => {
    const r = schema.safeParse(input);
    expect(r.success).toBe(false);
    expect(r.error!.issues.some((i) => i.path[0] === field)).toBe(true);
  });

  it("baut aus Formulardaten ein gültiges Objekt", () => {
    const f = new FormData();
    f.set("cityKey", "berlin");
    f.set("radiusKm", "15");
    f.set("rentMax", "1.200".replace(".", ""));
    f.set("roomsMin", "2,5");
    f.set("areaMin", "");
    f.append("extras", "balcony");
    f.append("extras", "kitchen");
    const parsed = schema.parse(parseFormData(housingVertical.criteriaFields, f));
    expect(parsed).toMatchObject({ cityKey: "berlin", radiusKm: 15, rentMax: 1200, roomsMin: 2.5, extras: ["balcony", "kitchen"] });
    expect(parsed.areaMin).toBeUndefined();
  });

  it("prüft das Bewerbungsprofil", () => {
    const f = new FormData();
    f.set("firstName", "Mia");
    f.set("lastName", "Muster");
    f.set("householdSize", "2");
    f.set("occupation", "Pflegefachkraft");
    f.set("netIncomeMonthly", "3100");
    f.set("pets", "on");
    const p = housingVertical.profileSchema.parse(parseFormData(housingVertical.profileFields, f));
    expect(p).toMatchObject({ pets: true, smoker: false, children: 0, householdSize: 2 });
    expect(housingVertical.profileSchema.safeParse({ ...p, firstName: "" }).success).toBe(false);
  });
});
