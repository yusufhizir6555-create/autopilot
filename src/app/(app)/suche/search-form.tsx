"use client";

import { saveSearchProfile } from "@/app/actions/search";
import { ActionForm, useFormState } from "@/components/action-form";
import { Field, Fields } from "@/components/field";
import type { FieldDef } from "@/core/forms/fields";

type Settings = { name: string; scoreThreshold: number; dailyApplyLimit: number; autoApply: boolean; active: boolean };

function ConsentBox({ initial }: { initial: boolean }) {
  const { fieldErrors } = useFormState();
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm sm:col-span-2">
      <Field field={{ name: "autoApply", label: "Auto-Bewerben aktivieren", type: "checkbox" }} value={initial} />
      <label className="mt-2 flex items-start gap-2 text-amber-900">
        <input type="checkbox" name="autoApplyConsent" defaultChecked={initial} className="mt-0.5 size-4" />
        <span>
          Ich willige ein, dass bei passenden Anzeigen von Partnern mit Bewerbungsschnittstelle automatisch in meinem Namen
          eine Bewerbung mit meinem Profil, Anschreiben und meinen Nachweisen gesendet wird. Ich kann das jederzeit
          abschalten; dann werden nur noch Entwürfe angelegt.
        </span>
      </label>
      {fieldErrors?.autoApplyConsent && <p className="mt-1 text-xs text-red-700">{fieldErrors.autoApplyConsent}</p>}
    </div>
  );
}

export function SearchProfileForm(props: {
  verticalKey: string;
  id: string | null;
  fields: FieldDef[];
  criteria?: Record<string, unknown>;
  settings: Settings;
}) {
  const s = props.settings;
  return (
    <ActionForm action={saveSearchProfile.bind(null, props.verticalKey, props.id)} submitLabel="Speichern & Anzeigen bewerten" className="space-y-6">
      <Field field={{ name: "name", label: "Name des Suchauftrags", type: "text", required: true, placeholder: "z. B. 2 Zimmer Berlin" }} value={s.name} />
      <Fields fields={props.fields} values={props.criteria} />
      <div className="grid gap-4 border-t border-stone-100 pt-5 sm:grid-cols-2">
        <Field
          field={{ name: "scoreThreshold", label: "Mindest-Übereinstimmung (%)", type: "number", min: 0, max: 100, required: true, help: "Nur Anzeigen ab diesem Score gelten als Treffer." }}
          value={s.scoreThreshold}
        />
        <Field
          field={{ name: "dailyApplyLimit", label: "Max. automatische Bewerbungen pro Tag", type: "number", min: 0, max: 50, required: true }}
          value={s.dailyApplyLimit}
        />
        <ConsentBox initial={s.autoApply} />
        <Field field={{ name: "active", label: "Suchauftrag aktiv", type: "checkbox" }} value={s.active} />
      </div>
    </ActionForm>
  );
}
