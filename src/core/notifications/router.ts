import type { ChannelPreference } from "./types";

/** Reine Funktion: Kanäle, über die tatsächlich benachrichtigt werden darf. */
export function routeNotification(prefs: ChannelPreference[]): { channel: ChannelPreference["channel"]; destination: string }[] {
  return prefs
    .filter((p) => p.enabled && p.optInAt !== null && p.destination.trim() !== "")
    .map((p) => ({ channel: p.channel, destination: p.destination.trim() }));
}
