import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { devMailboxEnabled } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Nur Entwicklung: zeigt E-Mails, die mangels SMTP nicht verschickt wurden. */
export default async function DevMailboxPage() {
  if (!devMailboxEnabled()) notFound();
  const mails = await prisma.devMail.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  const linkify = (text: string) =>
    text.split(/(https?:\/\/\S+)/g).map((part, i) =>
      /^https?:\/\//.test(part) ? (
        <a key={i} href={part} className="break-all font-medium text-emerald-700 underline">{part}</a>
      ) : (
        part
      ),
    );

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-10">
      <h1 className="h1">Dev-Mailbox</h1>
      <p className="muted">Ohne SMTP-Konfiguration landen alle E-Mails hier.</p>
      {mails.length === 0 && <p className="muted">Keine E-Mails.</p>}
      {mails.map((m) => (
        <article key={m.id} className="card" data-testid="dev-mail">
          <div className="muted">
            An <strong className="text-stone-800">{m.to}</strong> · {m.createdAt.toLocaleString("de-DE")}
          </div>
          <h2 className="mt-1 font-semibold">{m.subject}</h2>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm">{linkify(m.text)}</pre>
        </article>
      ))}
    </main>
  );
}
