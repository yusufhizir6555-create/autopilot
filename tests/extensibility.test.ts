import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parseFormData } from "@/core/forms/fields";
import { evaluate } from "@/core/matching/engine";
import { defineVertical, type AnyVertical } from "@/core/verticals/types";

/**
 * Beweist, dass ein neues Vertical nur Schema + Scoring (+ Adapter) braucht:
 * Der Kern (Formular-Parsing, Matching) funktioniert ohne Änderung.
 */
const jobsVertical = defineVertical({
  key: "jobs",
  name: "Jobsuche",
  itemLabel: "Stelle",
  criteriaSchema: z.object({ keyword: z.string().min(2), remote: z.boolean().default(false), minSalary: z.number().optional() }),
  listingDataSchema: z.object({ description: z.string(), remote: z.boolean(), salary: z.number() }),
  profileSchema: z.object({ name: z.string() }),
  criteriaFields: [
    { name: "keyword", label: "Stichwort", type: "text", required: true },
    { name: "remote", label: "Remote", type: "checkbox" },
    { name: "minSalary", label: "Mindestgehalt", type: "number" },
  ],
  profileFields: [{ name: "name", label: "Name", type: "text" }],
  documentKinds: [{ key: "cv", label: "Lebenslauf" }],
  defaultCoverLetter: "Hallo, ich bin {{name}}.",
  coverLetterPlaceholders: { name: "Name" },
  score: (c, l) => {
    const kw = l.description.toLowerCase().includes(c.keyword.toLowerCase());
    const remoteOk = !c.remote || l.remote;
    const salaryOk = c.minSalary === undefined || l.salary >= c.minSalary;
    const reasons = [
      { criterion: "keyword", ok: kw, points: kw ? 60 : 0, maxPoints: 60, text: "Stichwort" },
      { criterion: "remote", ok: remoteOk, points: remoteOk ? 20 : 0, maxPoints: 20, text: "Remote" },
      { criterion: "salary", ok: salaryOk, points: salaryOk ? 20 : 0, maxPoints: 20, text: "Gehalt" },
    ];
    return { score: reasons.reduce((s, r) => s + r.points, 0), reasons, excluded: !kw };
  },
  listingFacts: (l) => [{ label: "Gehalt", value: String(l.salary) }],
  dedupeKey: (l, title) => `${title}|${l.salary}`,
  coverLetterContext: (p) => ({ name: p.name }),
}) as AnyVertical;

describe("Erweiterbarkeit", () => {
  it("bewertet Anzeigen eines neuen Verticals über den unveränderten Kern", () => {
    const form = new FormData();
    form.set("keyword", "TypeScript");
    form.set("remote", "on");
    const criteria = parseFormData(jobsVertical.criteriaFields, form);

    const hit = evaluate(jobsVertical, criteria, { description: "Senior TypeScript Dev", remote: true, salary: 70000 }, 70);
    const miss = evaluate(jobsVertical, criteria, { description: "Java Dev", remote: true, salary: 90000 }, 0);

    expect(hit).toMatchObject({ score: 100, isMatch: true });
    expect(miss).toMatchObject({ excluded: true, isMatch: false });
  });
});
