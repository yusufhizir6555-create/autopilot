import type { Channel } from "@prisma/client";

export type OutgoingMessage = { subject: string; text: string };

export interface NotificationChannel {
  channel: Channel;
  send(destination: string, message: OutgoingMessage): Promise<void>;
}

export type ChannelPreference = {
  channel: Channel;
  destination: string;
  enabled: boolean;
  optInAt: Date | null;
};
