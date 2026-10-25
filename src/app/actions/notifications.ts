"use server";

import type { Channel } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/auth";
import { notifyUser } from "@/core/notifications/service";
import type { ActionState } from "@/lib/action-state";
import { prisma } from "@/lib/db";

const phone = z.string().regex(/^\+[1-9]\d{6,14}$/, "Telefonnummer im Format +49170…");
const destinationSchema: Record<Channel, z.ZodString> = {
  EMAIL: z.string().email("Ungültige E-Mail"),
  SMS: phone,
  WHATSAPP: phone,
};
const channels: Channel[] = ["EMAIL", "SMS", "WHATSAPP"];

export async function saveNotificationPreferences(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const fieldErrors: Record<string, string> = {};
  const values: Record<string, unknown> = {};
  const updates: { channel: Channel; destination: string; enabled: boolean }[] = [];

  for (const channel of channels) {
    const destination = String(form.get(`${channel}_destination`) ?? "").replace(/\s+/g, "");
    const enabled = form.get(`${channel}_enabled`) === "on";
    const consent = form.get(`${channel}_consent`) === "on";
    Object.assign(values, {
      [`${channel}_destination`]: destination,
      [`${channel}_enabled`]: enabled,
      [`${channel}_consent`]: consent,
    });

    if (enabled && !consent) fieldErrors[`${channel}_consent`] = "Einwilligung erforderlich";
    if (destination) {
      const r = destinationSchema[channel].safeParse(destination);
      if (!r.success) fieldErrors[`${channel}_destination`] = r.error.issues[0].message;
    } else if (enabled) {
      fieldErrors[`${channel}_destination`] = "Pflichtfeld, wenn der Kanal aktiv ist";
    }
    updates.push({ channel, destination, enabled });
  }
  if (Object.keys(fieldErrors).length) return { ok: false, message: "Bitte prüfe die markierten Felder.", fieldErrors, values };

  const existing = await prisma.notificationPreference.findMany({ where: { userId: user.id } });
  for (const u of updates) {
    const prev = existing.find((e) => e.channel === u.channel);
    // Opt-in-Zeitpunkt bleibt erhalten, solange der Kanal aktiv ist; Deaktivieren widerruft ihn.
    const optInAt = u.enabled ? (prev?.enabled && prev.destination === u.destination ? prev.optInAt : new Date()) : null;
    await prisma.notificationPreference.upsert({
      where: { userId_channel: { userId: user.id, channel: u.channel } },
      create: { userId: user.id, channel: u.channel, destination: u.destination, enabled: u.enabled, optInAt },
      update: { destination: u.destination, enabled: u.enabled, optInAt },
    });
  }
  revalidatePath("/einstellungen");
  return { ok: true, message: "Einstellungen gespeichert." };
}

export async function sendTestNotification(): Promise<void> {
  const user = await requireUser();
  await notifyUser(user.id, "test", {
    subject: "Testnachricht",
    text: "Das ist eine Testnachricht. Deine Benachrichtigungen funktionieren.",
  });
  revalidatePath("/einstellungen");
}
