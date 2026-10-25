import type { Channel } from "@prisma/client";
import { sendTestNotification } from "@/app/actions/notifications";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/db";
import { NotificationForm } from "./form";

const channels: Channel[] = ["EMAIL", "SMS", "WHATSAPP"];
const statusStyle = { SENT: "bg-emerald-50 text-emerald-800", FAILED: "bg-red-50 text-red-800", SKIPPED: "bg-stone-100 text-stone-600", PENDING: "bg-amber-50 text-amber-800" };

export default async function SettingsPage() {
  const user = await requireUser();
  const [prefs, recent] = await Promise.all([
    prisma.notificationPreference.findMany({ where: { userId: user.id } }),
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 15 }),
  ]);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <section className="space-y-4">
        <div>
          <h1 className="h1">Benachrichtigungen</h1>
          <p className="muted mt-1">Wähle, wie wir dich über neue Treffer und Bewerbungen informieren. Jeder Kanal braucht deine eigene Einwilligung.</p>
        </div>
        <div className="card">
          <NotificationForm
            prefs={channels.map((c) => {
              const p = prefs.find((x) => x.channel === c);
              return { channel: c, destination: p?.destination ?? (c === "EMAIL" ? user.email : ""), enabled: p?.enabled ?? false };
            })}
          />
        </div>
      </section>

      <aside className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Verlauf</h2>
          <form action={sendTestNotification}>
            <button className="btn-secondary">Testnachricht senden</button>
          </form>
        </div>
        {recent.length === 0 && <p className="muted">Noch keine Benachrichtigungen.</p>}
        <ul className="space-y-2">
          {recent.map((n) => (
            <li key={n.id} className="card p-3 text-sm">
              <div className="flex items-center gap-2">
                <span className={`badge ${statusStyle[n.status]}`}>{n.status}</span>
                <span className="muted">{n.channel} · {n.createdAt.toLocaleString("de-DE")}</span>
              </div>
              <p className="mt-1 font-medium">{n.subject}</p>
              {n.error && <p className="text-xs text-red-700">{n.error}</p>}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
