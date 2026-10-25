import type { NotificationChannel } from "../types";

/** Log-Stub. Hier wird später die WhatsApp Business API angebunden (WHATSAPP_* in .env). */
export const whatsappChannel: NotificationChannel = {
  channel: "WHATSAPP",
  async send(destination, message) {
    console.info(`[whatsapp:stub] an ${destination}: ${message.subject} – ${message.text.slice(0, 120)}`);
  },
};
