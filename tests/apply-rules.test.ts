import { describe, expect, it } from "vitest";
import { decideAutoApply, renderTemplate, type AutoApplyInput } from "@/core/applications/rules";

const base: AutoApplyInput = {
  autoApply: true,
  consentAt: new Date("2030-01-01"),
  sourceSupportsApply: true,
  profileComplete: true,
  sentToday: 0,
  dailyLimit: 5,
  alreadyApplied: false,
};

describe("decideAutoApply", () => {
  it("sendet, wenn alle Bedingungen erfüllt sind", () => {
    expect(decideAutoApply(base)).toEqual({ action: "send" });
  });

  it("legt nur einen Entwurf an, wenn Auto-Bewerben aus ist", () => {
    expect(decideAutoApply({ ...base, autoApply: false })).toEqual({ action: "draft", reason: "auto_apply_disabled" });
  });

  it("legt nur einen Entwurf an, wenn keine Einwilligung vorliegt", () => {
    expect(decideAutoApply({ ...base, consentAt: null })).toEqual({ action: "draft", reason: "no_consent" });
  });

  it("legt nur einen Entwurf an, wenn das Bewerbungsprofil fehlt", () => {
    expect(decideAutoApply({ ...base, profileComplete: false })).toEqual({ action: "draft", reason: "profile_incomplete" });
  });

  it("legt nur einen Entwurf an, wenn die Quelle keine Bewerbungen unterstützt", () => {
    expect(decideAutoApply({ ...base, sourceSupportsApply: false })).toEqual({ action: "draft", reason: "source_unsupported" });
  });

  it("respektiert das Tageslimit", () => {
    expect(decideAutoApply({ ...base, sentToday: 4 })).toEqual({ action: "send" });
    expect(decideAutoApply({ ...base, sentToday: 5 })).toEqual({ action: "draft", reason: "daily_limit_reached" });
    expect(decideAutoApply({ ...base, dailyLimit: 0 })).toEqual({ action: "draft", reason: "daily_limit_reached" });
  });

  it("bewirbt sich nie doppelt", () => {
    expect(decideAutoApply({ ...base, alreadyApplied: true })).toEqual({ action: "skip", reason: "already_applied" });
    expect(decideAutoApply({ ...base, autoApply: false, alreadyApplied: true }).action).toBe("skip");
  });
});

describe("renderTemplate", () => {
  it("ersetzt bekannte Platzhalter und lässt unbekannte stehen", () => {
    expect(renderTemplate("Hallo {{ name }}, {{titel}} – {{unbekannt}}", { name: "Mia", titel: "2 Zimmer" })).toBe(
      "Hallo Mia, 2 Zimmer – {{unbekannt}}",
    );
  });
});
