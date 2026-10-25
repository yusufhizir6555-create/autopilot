import Link from "next/link";
import { devMailboxEnabled } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function CheckEmailPage() {
  const devMailbox = devMailboxEnabled();
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <div className="card">
        <h1 className="h1">Prüfe dein Postfach</h1>
        <p className="mt-2 text-stone-600">Wir haben dir einen Anmeldelink geschickt. Er ist 24 Stunden gültig.</p>
        {devMailbox && (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            Entwicklungsmodus: Kein SMTP konfiguriert. Den Link findest du in der{" "}
            <Link href="/dev/mailbox" className="font-medium underline">Dev-Mailbox</Link>.
          </p>
        )}
      </div>
    </main>
  );
}
