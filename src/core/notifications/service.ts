import type { Channel } from "@prisma/client";
import { prisma } from "@/lib/db";
import { emailChannel } from "./channels/email";
import { smsChannel } from "./channels/sms";
import { whatsappChannel } from "./channels/whatsapp";
import { routeNotification } from "./router";
import type { NotificationChannel, OutgoingMessage } from "./types";

const channels: Record<Channel, NotificationChannel> = {
  EMAIL: emailChannel,
  SMS: smsChannel,
  WHATSAPP: whatsappChannel,
};

/** Benachrichtigt über alle freigegebenen Kanäle und protokolliert jeden Versuch. */
export async function notifyUser(userId: string, type: string, message: OutgoingMessage): Promise<number> {
  const prefs = await prisma.notificationPreference.findMany({ where: { userId } });
  const targets = routeNotification(prefs);

  if (targets.length === 0) {
    await prisma.notification.create({
      data: { userId, channel: "EMAIL", type, subject: message.subject, body: message.text, status: "SKIPPED", error: "Kein Kanal freigegeben" },
    });
    return 0;
  }

  let sent = 0;
  for (const target of targets) {
    const record = await prisma.notification.create({
      data: { userId, channel: target.channel, type, subject: message.subject, body: message.text },
    });
    try {
      await channels[target.channel].send(target.destination, message);
      await prisma.notification.update({ where: { id: record.id }, data: { status: "SENT", sentAt: new Date() } });
      sent++;
    } catch (err) {
      await prisma.notification.update({
        where: { id: record.id },
        data: { status: "FAILED", error: err instanceof Error ? err.message : String(err) },
      });
    }
  }
  return sent;
}
