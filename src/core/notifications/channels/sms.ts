import type { NotificationChannel } from "../types";

/** Log-Stub. Hier wird später der Twilio-Adapter angebunden (TWILIO_* in .env). */
export const smsChannel: NotificationChannel = {
  channel: "SMS",
  async send(destination, message) {
    console.info(`[sms:stub] an ${destination}: ${message.subject} – ${message.text.slice(0, 120)}`);
  },
};
