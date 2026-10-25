"use client";

import { deleteDocument, saveProfile, uploadDocument } from "@/app/actions/profile";
import { ActionForm, useFormState } from "@/components/action-form";
import { Fields } from "@/components/field";
import type { FieldDef } from "@/core/forms/fields";

function CoverLetterField({ initial }: { initial: string }) {
  const { values, fieldErrors } = useFormState();
  const value = typeof values?.coverLetterTemplate === "string" ? values.coverLetterTemplate : initial;
  return (
    <div>
      <label htmlFor="coverLetterTemplate" className="label">Anschreiben-Vorlage</label>
      <textarea key={value} id="coverLetterTemplate" name="coverLetterTemplate" rows={14} defaultValue={value} className="input font-mono text-[13px]" />
      {fieldErrors?.coverLetterTemplate && <p className="mt-1 text-xs text-red-700">{fieldErrors.coverLetterTemplate}</p>}
    </div>
  );
}

export function ProfileForm(props: {
  verticalKey: string;
  fields: FieldDef[];
  values?: Record<string, unknown>;
  coverLetter: string;
  placeholders: Record<string, string>;
}) {
  return (
    <ActionForm action={saveProfile.bind(null, props.verticalKey)} submitLabel="Profil speichern" className="space-y-6">
      <Fields fields={props.fields} values={props.values} />
      <CoverLetterField initial={props.coverLetter} />
      <p className="muted -mt-3">
        Platzhalter:{" "}
        {Object.entries(props.placeholders).map(([k, label]) => (
          <code key={k} title={label} className="mr-1.5 rounded bg-stone-100 px-1 py-0.5 text-xs">{`{{${k}}}`}</code>
        ))}
      </p>
    </ActionForm>
  );
}

export function DocumentUploadForm({ verticalKey, kinds }: { verticalKey: string; kinds: { key: string; label: string }[] }) {
  return (
    <ActionForm action={uploadDocument.bind(null, verticalKey)} submitLabel="Hochladen" className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="kind" className="label">Art</label>
        <select id="kind" name="kind" className="input" required defaultValue="">
          <option value="" disabled>Bitte wählen</option>
          {kinds.map((k) => (
            <option key={k.key} value={k.key}>{k.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="file" className="label">Datei</label>
        <input id="file" name="file" type="file" accept="application/pdf,image/jpeg,image/png" required className="input" />
      </div>
    </ActionForm>
  );
}

export function DocumentList(props: {
  documents: { id: string; filename: string; size: number; kindLabel: string; createdAt: string }[];
}) {
  if (props.documents.length === 0) return <p className="muted">Noch keine Dokumente hochgeladen.</p>;
  return (
    <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
      {props.documents.map((d) => (
        <li key={d.id} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
          <span className="badge bg-stone-100 text-stone-700">{d.kindLabel}</span>
          <a href={`/api/documents/${d.id}`} className="font-medium hover:underline">{d.filename}</a>
          <span className="muted">{(d.size / 1024).toFixed(0)} KB · {new Date(d.createdAt).toLocaleDateString("de-DE")}</span>
          <form action={deleteDocument} className="ml-auto">
            <input type="hidden" name="id" value={d.id} />
            <button className="text-red-700 hover:underline">Löschen</button>
          </form>
        </li>
      ))}
    </ul>
  );
}
