"use server";

import { redirect } from "next/navigation";
import { requireUser, signOut } from "@/auth";
import { deleteStored } from "@/core/documents/storage";
import { prisma } from "@/lib/db";

export async function deleteAccount(form: FormData): Promise<void> {
  const user = await requireUser();
  if (String(form.get("confirm") ?? "").trim().toLowerCase() !== user.email.toLowerCase()) {
    redirect("/konto?fehler=bestaetigung");
  }
  const docs = await prisma.document.findMany({ where: { userId: user.id }, select: { storageKey: true } });
  // Kaskade löscht Profile, Suchaufträge, Bewerbungen, Benachrichtigungen, Sessions
  await prisma.user.delete({ where: { id: user.id } });
  await Promise.all(docs.map((d) => deleteStored(d.storageKey)));
  await signOut({ redirectTo: "/?konto=geloescht" });
}
