import { describe, expect, it } from "vitest";
import { routeNotification } from "@/core/notifications/router";
import type { ChannelPreference } from "@/core/notifications/types";

const optIn = new Date("2030-01-01");

describe("routeNotification", () => {
  it("nutzt nur aktivierte Kanäle mit Opt-in und Ziel", () => {
    const prefs: ChannelPreference[] = [
      { channel: "EMAIL", destination: "mia@example.com", enabled: true, optInAt: optIn },
      { channel: "SMS", destination: "+491701234567", enabled: true, optInAt: null },
      { channel: "WHATSAPP", destination: "+491701234567", enabled: false, optInAt: optIn },
    ];
    expect(routeNotification(prefs)).toEqual([{ channel: "EMAIL", destination: "mia@example.com" }]);
  });

  it("verschickt über mehrere Kanäle, wenn gewünscht", () => {
    const prefs: ChannelPreference[] = [
      { channel: "EMAIL", destination: "mia@example.com", enabled: true, optInAt: optIn },
      { channel: "WHATSAPP", destination: " +491701234567 ", enabled: true, optInAt: optIn },
    ];
    expect(routeNotification(prefs)).toEqual([
      { channel: "EMAIL", destination: "mia@example.com" },
      { channel: "WHATSAPP", destination: "+491701234567" },
    ]);
  });

  it("ignoriert Kanäle ohne Zieladresse und liefert leer, wenn nichts freigegeben ist", () => {
    expect(routeNotification([{ channel: "SMS", destination: "  ", enabled: true, optInAt: optIn }])).toEqual([]);
    expect(routeNotification([])).toEqual([]);
  });
});
