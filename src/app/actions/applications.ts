"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/auth";
import { sendApplication } from "@/core/applications/service";
import { prisma } from "@/lib/db";

async function ownApplication(form: FormData) {
  const user = await requireUser();
  return prisma.application.findFirst({ where: { id: String(form.get("id") ?? ""), userId: user.id } });
}

export async function sendDraft(form: FormData): Promise<void> {
  const app = await ownApplication(form);
  if (!app || app.status === "SENT") return;
  const coverLetter = form.get("coverLetter");
  if (typeof coverLetter === "string" && coverLetter.trim()) {
    await prisma.application.update({ where: { id: app.id }, data: { coverLetter: coverLetter.slice(0, 5000) } });
  }
  await sendApplication(app.id);
  revalidatePath("/dashboard");
}

/** Für Anbieter ohne Bewerbungs-API: Nutzer hat sich direkt beim Anbieter beworben. */
export async function markApplied(form: FormData): Promise<void> {
  const app = await ownApplication(form);
  if (!app || app.status === "SENT") return;
  await prisma.application.update({
    where: { id: app.id },
    data: { status: "SENT", sentAt: new Date(), externalRef: "extern", error: null },
  });
  revalidatePath("/dashboard");
}

export async function discardApplication(form: FormData): Promise<void> {
  const app = await ownApplication(form);
  if (!app || app.status === "SENT") return;
  await prisma.application.update({ where: { id: app.id }, data: { status: "WITHDRAWN" } });
  revalidatePath("/dashboard");
}
