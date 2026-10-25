import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";
import type { NotificationChannel, OutgoingMessage } from "../types";

let transport: nodemailer.Transporter | undefined;

function smtp(): nodemailer.Transporter | undefined {
  if (!process.env.SMTP_HOST) return undefined;
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  });
  return transport;
}

/** Ohne SMTP-Konfiguration landen Mails in der Dev-Mailbox (/dev/mailbox). */
export async function sendEmail(to: string, message: OutgoingMessage): Promise<void> {
  const t = smtp();
  if (t) {
    await t.sendMail({ from: process.env.EMAIL_FROM, to, subject: message.subject, text: message.text });
    return;
  }
  await prisma.devMail.create({ data: { to, subject: message.subject, text: message.text } });
  console.info(`[email:dev] an ${to}: ${message.subject}`);
}

export const emailChannel: NotificationChannel = {
  channel: "EMAIL",
  send: sendEmail,
};
