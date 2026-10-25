/**
 * Formular-Beschreibung eines Verticals. Daraus rendert die UI die Eingabefelder,
 * und parseFormData() baut daraus das Objekt, das anschließend per Zod geprüft wird.
 */
export type FieldOption = { value: string; label: string };

export type FieldDef = {
  name: string;
  label: string;
  type: "text" | "textarea" | "email" | "tel" | "number" | "date" | "select" | "multiselect" | "checkbox";
  required?: boolean;
  options?: FieldOption[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  help?: string;
};

export function parseFormData(fields: FieldDef[], form: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.type === "multiselect") {
      out[field.name] = form.getAll(field.name).map(String);
      continue;
    }
    if (field.type === "checkbox") {
      out[field.name] = form.get(field.name) === "on";
      continue;
    }
    const raw = form.get(field.name);
    const value = typeof raw === "string" ? raw.trim() : "";
    if (value === "") continue;
    out[field.name] = field.type === "number" ? Number(value.replace(",", ".")) : value;
  }
  return out;
}
