"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/auth";
import { ALLOWED_MIME_TYPES, MAX_DOCUMENT_BYTES, deleteStored, storeEncrypted } from "@/core/documents/storage";
import { parseFormData } from "@/core/forms/fields";
import { syncRegistry } from "@/core/registry-sync";
import { type ActionState, zodErrorState } from "@/lib/action-state";
import { prisma } from "@/lib/db";
import { getVertical } from "@/verticals";

export async function saveProfile(verticalKey: string, _: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const vertical = getVertical(verticalKey);
  const raw = parseFormData(vertical.profileFields, form);
  const parsed = vertical.profileSchema.safeParse(raw);
  const coverLetter = z.string().max(5000, "Maximal 5000 Zeichen").safeParse(String(form.get("coverLetterTemplate") ?? ""));
  if (!parsed.success) return zodErrorState(parsed.error, { ...raw, coverLetterTemplate: form.get("coverLetterTemplate") });
  if (!coverLetter.success) return zodErrorState(coverLetter.error, raw);

  await syncRegistry();
  const data = parsed.data as object;
  await prisma.applicantProfile.upsert({
    where: { userId_verticalKey: { userId: user.id, verticalKey } },
    create: { userId: user.id, verticalKey, data, coverLetterTemplate: coverLetter.data },
    update: { data, coverLetterTemplate: coverLetter.data },
  });
  revalidatePath("/profil");
  return { ok: true, message: "Profil gespeichert." };
}

export async function uploadDocument(verticalKey: string, _: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const vertical = getVertical(verticalKey);
  const kind = String(form.get("kind") ?? "");
  const file = form.get("file");

  if (!vertical.documentKinds.some((k) => k.key === kind)) {
    return { ok: false, message: "Bitte Dokumentart wählen.", fieldErrors: { kind: "Pflichtfeld" } };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Bitte eine Datei auswählen.", fieldErrors: { file: "Pflichtfeld" } };
  }
  if (file.size > MAX_DOCUMENT_BYTES) return { ok: false, message: "Die Datei ist größer als 10 MB." };
  if (!ALLOWED_MIME_TYPES.includes(file.type)) return { ok: false, message: "Erlaubt sind PDF, JPG und PNG." };

  const stored = await storeEncrypted(Buffer.from(await file.arrayBuffer()));
  await prisma.document.create({
    data: {
      userId: user.id,
      kind,
      filename: file.name.slice(0, 200),
      mimeType: file.type,
      size: file.size,
      ...stored,
    },
  });
  revalidatePath("/profil");
  return { ok: true, message: "Dokument verschlüsselt gespeichert." };
}

export async function deleteDocument(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(form.get("id") ?? "");
  const doc = await prisma.document.findFirst({ where: { id, userId: user.id } });
  if (!doc) return;
  await prisma.document.delete({ where: { id: doc.id } });
  await deleteStored(doc.storageKey);
  revalidatePath("/profil");
}
