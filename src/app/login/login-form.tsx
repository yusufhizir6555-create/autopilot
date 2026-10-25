"use client";

import { requestLoginLink } from "@/app/actions/auth";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/field";

export function LoginForm() {
  return (
    <ActionForm action={requestLoginLink} submitLabel="Anmeldelink senden">
      <Field field={{ name: "email", label: "E-Mail-Adresse", type: "email", required: true, placeholder: "du@example.com" }} />
    </ActionForm>
  );
}
