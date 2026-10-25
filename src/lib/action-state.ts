import type { ZodError } from "zod";

export type ActionState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Zuletzt gesendete Werte, damit das Formular bei Fehlern nicht leer wird. */
  values?: Record<string, unknown>;
};

export function zodErrorState(error: ZodError, values?: Record<string, unknown>): ActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    fieldErrors[key] ??= issue.message;
  }
  return { ok: false, message: "Bitte prüfe die markierten Felder.", fieldErrors, values };
}
