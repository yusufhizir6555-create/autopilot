"use client";

import type { Channel } from "@prisma/client";
import { saveNotificationPreferences } from "@/app/actions/notifications";
import { ActionForm, useFormState } from "@/components/action-form";

type Pref = { channel: Channel; destination: string; enabled: boolean };

const meta: Record<Channel, { label: string; type: string; placeholder: string; consent: string }> = {
  EMAIL: {
    label: "E-Mail",
    type: "email",
    placeholder: "du@example.com",
    consent: "Ich möchte per E-Mail über neue Treffer und Bewerbungen informiert werden.",
  },
  SMS: {
    label: "SMS",
    type: "tel",
    placeholder: "+491701234567",
    consent: "Ich möchte per SMS informiert werden. Es können Kosten meines Mobilfunkanbieters entstehen.",
  },
  WHATSAPP: {
    label: "WhatsApp",
    type: "tel",
    placeholder: "+491701234567",
    consent: "Ich möchte über WhatsApp informiert werden. Dabei wird meine Nummer an WhatsApp (Meta) übermittelt.",
  },
};

function ChannelRow({ pref }: { pref: Pref }) {
  const { values, fieldErrors } = useFormState();
  const c = pref.channel;
  const m = meta[c];
  const v = (k: string, fallback: unknown) => (values && `${c}_${k}` in values ? values[`${c}_${k}`] : fallback);
  const destination = String(v("destination", pref.destination) ?? "");
  const enabled = v("enabled", pref.enabled) === true;
  const consent = v("consent", pref.enabled) === true;
  const err = (k: string) => fieldErrors?.[`${c}_${k}`];
  const key = `${destination}|${enabled}|${consent}`;

  return (
    <fieldset className="space-y-3 rounded-lg border border-stone-200 p-4">
      <legend className="px-1 font-semibold">{m.label}</legend>
      <label className="flex items-center gap-2 text-sm">
        <input key={key} type="checkbox" name={`${c}_enabled`} defaultChecked={enabled} className="size-4" />
        Benachrichtigungen per {m.label} aktivieren
      </label>
      <div>
        <label htmlFor={`${c}_destination`} className="label">{c === "EMAIL" ? "E-Mail-Adresse" : "Handynummer"}</label>
        <input key={key} id={`${c}_destination`} name={`${c}_destination`} type={m.type} defaultValue={destination} placeholder={m.placeholder} className="input max-w-sm" />
        {err("destination") && <p className="mt-1 text-xs text-red-700">{err("destination")}</p>}
      </div>
      <label className="flex items-start gap-2 text-sm text-stone-700">
        <input key={key} type="checkbox" name={`${c}_consent`} defaultChecked={consent} className="mt-0.5 size-4" />
        {m.consent} Widerruf jederzeit durch Deaktivieren.
      </label>
      {err("consent") && <p className="text-xs text-red-700">{err("consent")}</p>}
    </fieldset>
  );
}

export function NotificationForm({ prefs }: { prefs: Pref[] }) {
  return (
    <ActionForm action={saveNotificationPreferences} submitLabel="Einstellungen speichern">
      {prefs.map((p) => (
        <ChannelRow key={p.channel} pref={p} />
      ))}
    </ActionForm>
  );
}
