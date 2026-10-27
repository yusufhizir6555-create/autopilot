// Einmalige Einrichtung auf einem neuen Rechner (Windows, macOS, Linux):
//   npm run setup
// Legt .env mit zufälligen Schlüsseln an, startet Postgres per Docker,
// spielt das Datenbankschema ein, lädt Demo-Daten und importiert Anzeigen.
// Mit --no-docker wird eine bereits laufende Datenbank aus DATABASE_URL verwendet.
import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

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

// Immer die im Projekt installierte Prisma-Version nutzen – npx würde sonst
// bei fehlender Installation eine fremde, neuere Version herunterladen.
const prismaCli = path.join("node_modules", "prisma", "build", "index.js");
function prisma(args, opts) {
  run(`node "${prismaCli}" ${args}`, opts);
}

function secret() {
  return randomBytes(32).toString("base64");
}

step("Installation prüfen");
const required = ["prisma/build/index.js", "@prisma/client/package.json", "next/package.json", "tsx/package.json"];
const missing = required.filter((f) => !existsSync(path.join("node_modules", f)));
if (missing.length) {
  fail(
    `npm install ist nicht vollständig (fehlt: ${missing.map((m) => m.split("/")[0]).join(", ")}).\n` +
      "  Bitte `npm install` ausführen, bis es ohne „ERR!“ endet, und danach `npm run setup` erneut starten.",
  );
}
console.log(`  Prisma ${JSON.parse(readFileSync(path.join("node_modules", "prisma", "package.json"), "utf8")).version} gefunden.`);

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
    fail("Datenbank-Container konnte nicht starten. Ist Port 5433 schon belegt? Dann in docker-compose.yml und .env einen anderen Port eintragen.");
  }
}

step("Datenbankschema einspielen");
let migrated = false;
let lastError = "";
for (let attempt = 1; attempt <= 20 && !migrated; attempt++) {
  try {
    prisma("migrate deploy", { quiet: true });
    migrated = true;
  } catch (err) {
    lastError = `${err.stdout ?? ""}${err.stderr ?? ""}`.trim();
    // Falsches Passwort o. Ä. wird durch Warten nicht besser
    if (/P1000|authentication failed/i.test(lastError)) break;
    if (attempt === 1) console.log("  Warte, bis die Datenbank bereit ist …");
    await new Promise((r) => setTimeout(r, 2000));
  }
}
if (!migrated) {
  const url = (readFileSync(".env", "utf8").match(/^DATABASE_URL="?([^"\n]*)/m) ?? [])[1] ?? "?";
  console.error(`\n${lastError}`);
  fail(
    `Datenbank nicht erreichbar (DATABASE_URL: ${url.replace(/:[^:@/]+@/, ":***@")}).\n` +
      "  Passt der Port in .env zu docker-compose.yml? Läuft der Container „db“ in Docker Desktop?",
  );
}
console.log("  Schema ist aktuell.");

step("Demo-Partner und Admin anlegen");
prisma("db seed");

step("Demo-Anzeigen importieren");
run("npm run -s job import");

console.log(`
✔ Fertig. Seite starten mit:

    npm run dev

Dann im Browser http://localhost:3000 öffnen.
Anmeldelinks erscheinen unter http://localhost:3000/dev/mailbox
Admin-Zugang: mit admin@example.com anmelden.
`);
