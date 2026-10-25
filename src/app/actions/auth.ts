"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import type { ActionState } from "@/lib/action-state";

export async function requestLoginLink(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = z.string().trim().toLowerCase().email().safeParse(form.get("email"));
  if (!parsed.success) {
    return { ok: false, message: "Bitte gib eine gültige E-Mail-Adresse ein.", fieldErrors: { email: "Ungültige E-Mail" } };
  }
  await signIn("email", { email: parsed.data, redirectTo: "/dashboard", redirect: false });
  redirect("/login/pruefen");
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
