import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if ((await auth())?.user) redirect("/dashboard");
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <Link href="/" className="muted hover:underline">← Startseite</Link>
      <div className="card mt-4">
        <h1 className="h1">Anmelden oder registrieren</h1>
        <p className="muted mb-5 mt-1">Wir schicken dir einen Anmeldelink per E-Mail – ganz ohne Passwort.</p>
        <LoginForm />
      </div>
    </main>
  );
}
