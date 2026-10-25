export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Umgebungsvariable ${name} fehlt (siehe .env.example)`);
  return value;
}

export function appUrl(path = ""): string {
  const base = (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Dev-Mailbox nur ohne SMTP und nie in Produktion – außer ausdrücklich für lokale Tests freigeschaltet. */
export function devMailboxEnabled(): boolean {
  if (process.env.SMTP_HOST) return false;
  return process.env.NODE_ENV !== "production" || process.env.ENABLE_DEV_MAILBOX === "true";
}
