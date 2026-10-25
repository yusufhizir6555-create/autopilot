"use client";

import type { FieldDef } from "@/core/forms/fields";
import { useFormState } from "./action-form";

/** Rendert ein Feld aus der Vertical-Definition. */
export function Field({ field, value }: { field: FieldDef; value?: unknown }) {
  const { fieldErrors, values } = useFormState();
  const current = values && field.name in values ? values[field.name] : value;
  const error = fieldErrors?.[field.name];
  const id = `f-${field.name}`;
  const errorEl = error ? <p className="mt-1 text-xs text-red-700">{error}</p> : null;
  const help = field.help ? <p className="mt-1 text-xs text-stone-500">{field.help}</p> : null;
  // key erzwingt neue Defaults, wenn der Server andere Werte zurückgibt
  const key = JSON.stringify(current ?? null);

  if (field.type === "checkbox") {
    return (
      <div>
        <label className="flex items-center gap-2 text-sm">
          <input key={key} type="checkbox" name={field.name} defaultChecked={current === true} className="size-4" />
          {field.label}
        </label>
        {errorEl}
      </div>
    );
  }

  if (field.type === "multiselect") {
    const selected = Array.isArray(current) ? current.map(String) : [];
    return (
      <fieldset className="sm:col-span-2">
        <legend className="label">{field.label}</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {field.options?.map((o) => (
            <label key={o.value + key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name={field.name} value={o.value} defaultChecked={selected.includes(o.value)} className="size-4" />
              {o.label}
            </label>
          ))}
        </div>
        {errorEl}
      </fieldset>
    );
  }

  const common = {
    id,
    name: field.name,
    required: field.required,
    placeholder: field.placeholder,
    defaultValue: current === undefined || current === null ? "" : String(current),
    className: `input ${error ? "border-red-500" : ""}`,
    "aria-invalid": error ? true : undefined,
  };

  return (
    <div className={field.type === "textarea" ? "sm:col-span-2" : undefined}>
      <label htmlFor={id} className="label">
        {field.label}
        {field.required && <span className="text-red-700"> *</span>}
      </label>
      {field.type === "textarea" ? (
        <textarea key={key} rows={4} {...common} />
      ) : field.type === "select" ? (
        <select key={key} {...common}>
          <option value="">Bitte wählen</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : (
        <input key={key} type={field.type} min={field.min} max={field.max} step={field.step ?? (field.type === "number" ? "any" : undefined)} {...common} />
      )}
      {help}
      {errorEl}
    </div>
  );
}

export function Fields({ fields, values }: { fields: FieldDef[]; values?: Record<string, unknown> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => (
        <Field key={f.name} field={f} value={values?.[f.name]} />
      ))}
    </div>
  );
}
