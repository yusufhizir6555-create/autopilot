// Einmalige Einrichtung auf einem neuen Rechner (Windows, macOS, Linux):
//   npm run setup
// Legt .env mit zufälligen Schlüsseln an, startet Postgres per Docker,
// spielt das Datenbankschema ein, lädt Demo-Daten und importiert Anzeigen.
// Mit --no-docker wird eine bereits laufende Datenbank aus DATABASE_URL verwendet.
import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";

const useDocker = !process.argv.includes("--no-docker");

function step(title) {
  console.log(`\n▶ ${title}`);
}

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: opts.quiet ? "pipe" : "inherit", shell: true });
}

function fail(message) {
  console.error(`\n✖ ${message}`);
  process.exit(1);
}

function secret() {
  return randomBytes(32).toString("base64");
}

step(".env anlegen");
if (existsSync(".env")) {
  console.log("  .env existiert schon – bleibt unverändert.");
} else {
  copyFileSync(".env.example", ".env");
  const filled = readFileSync(".env", "utf8")
    .replace(/^AUTH_SECRET=""/m, `AUTH_SECRET="${secret()}"`)
    .replace(/^DOCUMENT_ENCRYPTION_KEY=""/m, `DOCUMENT_ENCRYPTION_KEY="${secret()}"`)
    .replace(/^CRON_SECRET=""/m, `CRON_SECRET="${secret()}"`)
    .replace(/^ADMIN_EMAILS=""/m, `ADMIN_EMAILS="admin@example.com"`);
  writeFileSync(".env", filled);
  console.log("  .env mit zufälligen Schlüsseln erstellt.");
}

if (useDocker) {
  step("Datenbank per Docker starten");
  try {
    run("docker info", { quiet: true });
  } catch {
    fail("Docker läuft nicht. Bitte Docker Desktop starten und warten, bis unten links „Engine running“ steht.");
  }
  try {
    run("docker compose up -d");
  } catch {
    fail("Datenbank-Container konnte nicht starten. Ist Port 5432 schon belegt (z. B. durch ein anderes Postgres)?");
  }
}

step("Datenbankschema einspielen");
let migrated = false;
for (let attempt = 1; attempt <= 20 && !migrated; attempt++) {
  try {
    run("npx prisma migrate deploy", { quiet: true });
    migrated = true;
  } catch {
    if (attempt === 1) console.log("  Warte, bis die Datenbank bereit ist …");
    await new Promise((r) => setTimeout(r, 2000));
  }
}
if (!migrated) fail("Datenbank nicht erreichbar. Läuft der Container „db“ in Docker Desktop?");
console.log("  Schema ist aktuell.");

step("Demo-Partner und Admin anlegen");
run("npx prisma db seed");

step("Demo-Anzeigen importieren");
run("npm run -s job import");

console.log(`
✔ Fertig. Seite starten mit:

    npm run dev

Dann im Browser http://localhost:3000 öffnen.
Anmeldelinks erscheinen unter http://localhost:3000/dev/mailbox
Admin-Zugang: mit admin@example.com anmelden.
`);
