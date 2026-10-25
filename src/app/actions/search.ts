"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/auth";
import { parseFormData } from "@/core/forms/fields";
import { runMatching } from "@/core/jobs/match";
import { syncRegistry } from "@/core/registry-sync";
import { type ActionState, zodErrorState } from "@/lib/action-state";
import { prisma } from "@/lib/db";
import { getVertical } from "@/verticals";

const settingsSchema = z
  .object({
    name: z.string().trim().min(1, "Pflichtfeld").max(80),
    scoreThreshold: z.coerce.number().int().min(0).max(100),
    dailyApplyLimit: z.coerce.number().int().min(0).max(50),
    autoApply: z.boolean(),
    autoApplyConsent: z.boolean(),
    active: z.boolean(),
  })
  .refine((s) => !s.autoApply || s.autoApplyConsent, {
    message: "Für Auto-Bewerben ist deine Einwilligung nötig.",
    path: ["autoApplyConsent"],
  });

export async function saveSearchProfile(
  verticalKey: string,
  id: string | null,
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const vertical = getVertical(verticalKey);
  const rawCriteria = parseFormData(vertical.criteriaFields, form);
  const rawSettings = {
    name: form.get("name"),
    scoreThreshold: form.get("scoreThreshold"),
    dailyApplyLimit: form.get("dailyApplyLimit"),
    autoApply: form.get("autoApply") === "on",
    autoApplyConsent: form.get("autoApplyConsent") === "on",
    active: form.get("active") === "on",
  };
  const values = { ...rawCriteria, ...rawSettings };

  const criteria = vertical.criteriaSchema.safeParse(rawCriteria);
  const settings = settingsSchema.safeParse(rawSettings);
  if (!criteria.success) return zodErrorState(criteria.error, values);
  if (!settings.success) return zodErrorState(settings.error, values);

  const existing = id ? await prisma.searchProfile.findFirst({ where: { id, userId: user.id } }) : null;
  if (id && !existing) return { ok: false, message: "Suchauftrag nicht gefunden." };

  const { autoApplyConsent, ...s } = settings.data;
  void autoApplyConsent;
  const data = {
    ...s,
    criteria: criteria.data as Prisma.InputJsonValue,
    // Einwilligung bleibt bestehen, solange Auto-Bewerben an ist; Ausschalten widerruft sie.
    autoApplyConsentAt: s.autoApply ? (existing?.autoApplyConsentAt ?? new Date()) : null,
  };

  await syncRegistry();
  let profileId: string;
  if (existing) {
    const criteriaChanged = JSON.stringify(existing.criteria) !== JSON.stringify(criteria.data);
    await prisma.searchProfile.update({ where: { id: existing.id }, data });
    // Neue Kriterien → bisherige Bewertungen ohne Bewerbung verwerfen und neu berechnen
    if (criteriaChanged) await prisma.match.deleteMany({ where: { searchProfileId: existing.id, application: null } });
    profileId = existing.id;
  } else {
    const created = await prisma.searchProfile.create({ data: { ...data, userId: user.id, verticalKey } });
    profileId = created.id;
  }

  if (s.active) await runMatching({ searchProfileId: profileId });
  revalidatePath("/suche");
  revalidatePath("/dashboard");
  if (!existing) redirect(`/suche/${profileId}?neu=1`);
  return { ok: true, message: "Suchauftrag gespeichert und Anzeigen neu bewertet." };
}

export async function deleteSearchProfile(form: FormData): Promise<void> {
  const user = await requireUser();
  await prisma.searchProfile.deleteMany({ where: { id: String(form.get("id") ?? ""), userId: user.id } });
  revalidatePath("/suche");
  redirect("/suche");
}
