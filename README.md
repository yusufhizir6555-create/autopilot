# Wohnungssuche – MVP

Nutzer legen **einmal** ihr Bewerbungsprofil und ihre Suchkriterien an. Die Plattform importiert Anzeigen aus
**offiziellen Partnerquellen**, bewertet sie, bewirbt sich auf Wunsch automatisch und benachrichtigt per
E-Mail, SMS oder WhatsApp. Später kommen weitere Bereiche wie Jobs, Kitas oder Schulen dazu.

Stack: Next.js 15 (App Router) · TypeScript · PostgreSQL + Prisma · Tailwind 4 · Auth.js (Magic Link) · Zod · Vitest

## Schnellstart

Voraussetzungen: Node.js 22 oder neuer, Docker Desktop (gestartet).

```bash
npm install
npm run setup     # .env mit Zufallsschlüsseln, Postgres per Docker, Schema, Demo-Daten, Import
npm run dev       # http://localhost:3000
```

`npm run setup` kann gefahrlos erneut ausgeführt werden. Eine vorhandene `.env` bleibt unverändert.
Ohne Docker: `DATABASE_URL` in `.env` auf eine eigene Postgres-Datenbank setzen und `npm run setup -- --no-docker` ausführen.

Login: E-Mail eingeben. Ohne SMTP-Konfiguration erscheint der Link in der **Dev-Mailbox** unter
`/dev/mailbox` (nur im Dev-Modus; mit `next start` nur bei `ENABLE_DEV_MAILBOX=true`).
Als `admin@example.com` anmelden, um `/admin` zu sehen.

### Ablauf zum Ausprobieren
1. **Bewerbungsprofil** ausfüllen und Nachweise hochladen (werden mit AES-256-GCM verschlüsselt in `storage/` abgelegt)
2. **Benachrichtigungen**: Kanal aktivieren und einwilligen
3. **Suchauftrag** anlegen, z. B. Berlin, 12 km, bis 1.100 €, ab 2 Zimmer, Auto-Bewerben an (mit Einwilligung).
   Beim Speichern werden die Anzeigen sofort bewertet.
4. **Dashboard**: Treffer mit Score und Begründung, automatisch gesendete Bewerbungen, Entwürfe zum Senden mit einem Klick
5. Die E-Mail-Zusammenfassung liegt in `/dev/mailbox`, SMS und WhatsApp erscheinen im Server-Log (`[whatsapp:stub]`)

## Befehle

| Befehl | Zweck |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` · `npm test` | ESLint · Vitest |
| `npm run job import\|match\|all` | Hintergrundjobs manuell |
| `POST /api/cron/all` mit `Authorization: Bearer $CRON_SECRET` | dasselbe für einen externen Cron (z. B. alle 10 Min.) |

## Architektur

```
src/core/                 Vertical-unabhängiger Kern
  verticals/types.ts      Interface VerticalDefinition (Schemas, Formularfelder, Scoring, …)
  sources/types.ts        Interface ListingSource (fetchListings, optional submitApplication)
  matching/engine.ts      evaluate(): validiert und bewertet, isMatch nach Schwellenwert
  applications/           rules.ts (Auto-Bewerben-Regeln, rein) · service.ts (anlegen/senden)
  notifications/          router.ts (Kanalwahl, rein) · service.ts · channels/{email,sms,whatsapp}
  jobs/                   import (validieren + deduplizieren) · match (bewerten → bewerben → benachrichtigen)
  documents/storage.ts    AES-256-GCM-Dateiablage
  monetization/links.ts   Affiliate-Ziel-URLs
src/verticals/
  index.ts                Registry: Verticals + Quellen
  housing/                Schema, Felder, Scoring, Städte, Mock-Daten, Mock-Quellen
src/app/                  Seiten, Server Actions, Route Handler
```

**Daten**: `Listing`, `SearchProfile`, `ApplicantProfile`, `Match` und `Application` sind generisch. Vertical-spezifische
Inhalte liegen als JSON vor und werden immer über das Zod-Schema des Verticals geprüft.

**Auto-Bewerben** (siehe `src/core/applications/rules.ts`): Automatisch gesendet wird nur, wenn alles zutrifft:
Auto-Bewerben ist an, die Einwilligung liegt vor, das Bewerbungsprofil ist vollständig, die Quelle hat eine
Bewerbungs-API, das Tageslimit des Suchauftrags ist nicht erreicht und es gibt noch keine Bewerbung auf die Anzeige.
Sonst entsteht ein Entwurf. Bei Quellen mit API wird er mit einem Klick gesendet. Bei Quellen ohne API führt ein
getrackter Link zum Anbieter.

**Monetarisierung**: Alle externen Links laufen über `/go/[listingId]`. Dort wird der Klick protokolliert (ohne IP und
User-Agent) und auf die Affiliate-URL des Partners weitergeleitet. Gesponserte Anzeigen sind als „Anzeige“
gekennzeichnet und werden nicht im Ranking bevorzugt. `/admin` zeigt Klicks und Bewerbungen pro Partner.

**Quellen**: Es gibt kein Scraping. Angebunden werden nur offizielle APIs, Feeds und Partnerschnittstellen.
Im MVP gibt es zwei Mocks:
- `mock-housing`: 30 Anzeigen, nimmt Bewerbungen an
- `mock-feed`: reiner Feed mit 3 Dubletten und 2 gesponserten Anzeigen

## Neues Vertical hinzufügen (z. B. Jobs)

1. Ordner `src/verticals/jobs/` anlegen mit `index.ts`, das per `defineVertical({...})` folgende Teile festlegt:
   - `criteriaSchema`, `listingDataSchema`, `profileSchema` (Zod)
   - `criteriaFields`, `profileFields` (daraus werden die Formulare automatisch gerendert)
   - `score()`, `listingFacts()`, `dedupeKey()`, `coverLetterContext()`, `documentKinds`, `defaultCoverLetter`
2. Einen Adapter schreiben, der `ListingSource` mit `verticalKey: "jobs"` implementiert
3. Beides in `src/verticals/index.ts` eintragen

Datenbank, Import, Matching, Bewerbung, Benachrichtigung und Formulare funktionieren ohne Änderung.
`tests/extensibility.test.ts` zeigt das an einem Jobs-Vertical. Seiten wählen das Vertical über `?v=jobs`.
Eine Navigation pro Vertical fehlt noch.

## Bewusst nicht enthalten / offene Punkte

- **Echte Partner**: Für echte Partner-APIs braucht es Verträge mit Portalen, Makler-Software oder
  Wohnungsbaugesellschaften. Dafür jeweils einen `ListingSource`-Adapter schreiben.
  Portale ohne offizielle Schnittstelle werden nicht angebunden.
- **SMS/WhatsApp**: Bisher Log-Stubs. Echte Anbindung über Twilio bzw. die WhatsApp Business API (Templates müssen
  von Meta freigegeben werden).
- **Dokumente an Partner**: Bisher werden nur Metadaten übermittelt. Die Übertragung der Dateien hängt von der jeweiligen Partner-API ab.
- **Scoring**: Zu wenige Zimmer gibt 0 Punkte, schließt die Anzeige aber nicht aus. Ein „hartes“ Mindestkriterium pro Feld wäre ein sinnvoller nächster Schritt.
- **Recht**: Impressum und Datenschutz sind Platzhalter und müssen vor dem Livegang fachkundig erstellt werden.
- Zahlungsabwicklung, Mobile-App und weitere Verticals sind nicht implementiert (laut Scope).
