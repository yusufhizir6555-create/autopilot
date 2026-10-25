export type AutoApplyInput = {
  autoApply: boolean;
  consentAt: Date | null;
  sourceSupportsApply: boolean;
  profileComplete: boolean;
  sentToday: number;
  dailyLimit: number;
  alreadyApplied: boolean;
};

export type DraftReason =
  | "auto_apply_disabled"
  | "no_consent"
  | "profile_incomplete"
  | "source_unsupported"
  | "daily_limit_reached";

export type AutoApplyDecision =
  | { action: "send" }
  | { action: "draft"; reason: DraftReason }
  | { action: "skip"; reason: "already_applied" };

export const draftReasonText: Record<DraftReason, string> = {
  auto_apply_disabled: "Auto-Bewerben ist aus",
  no_consent: "Keine Einwilligung für Auto-Bewerben",
  profile_incomplete: "Bewerbungsprofil fehlt oder ist unvollständig",
  source_unsupported: "Anbieter nimmt keine direkten Bewerbungen an",
  daily_limit_reached: "Tageslimit erreicht",
};

/** Entscheidet, ob für einen neuen Treffer automatisch gesendet oder nur ein Entwurf angelegt wird. */
export function decideAutoApply(input: AutoApplyInput): AutoApplyDecision {
  if (input.alreadyApplied) return { action: "skip", reason: "already_applied" };
  if (!input.autoApply) return { action: "draft", reason: "auto_apply_disabled" };
  if (!input.consentAt) return { action: "draft", reason: "no_consent" };
  if (!input.profileComplete) return { action: "draft", reason: "profile_incomplete" };
  if (!input.sourceSupportsApply) return { action: "draft", reason: "source_unsupported" };
  if (input.sentToday >= input.dailyLimit) return { action: "draft", reason: "daily_limit_reached" };
  return { action: "send" };
}

export function renderTemplate(template: string, ctx: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (whole, key: string) => ctx[key] ?? whole);
}

export function startOfToday(now = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}
