"use client";

import { createContext, useActionState, useContext } from "react";
import type { ActionState } from "@/lib/action-state";

const FormStateContext = createContext<ActionState>({});
export const useFormState = () => useContext(FormStateContext);

type Props = {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  submitLabel: string;
  className?: string;
  encType?: "multipart/form-data";
};

export function ActionForm({ action, children, submitLabel, className }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <FormStateContext.Provider value={state}>
      <form action={formAction} className={className ?? "space-y-4"}>
        {children}
        <div className="flex items-center gap-3">
          <button type="submit" className="btn" disabled={pending}>
            {pending ? "Wird gespeichert…" : submitLabel}
          </button>
          {state.message && (
            <p role="status" className={`text-sm ${state.ok ? "text-emerald-700" : "text-red-700"}`}>
              {state.message}
            </p>
          )}
        </div>
      </form>
    </FormStateContext.Provider>
  );
}
