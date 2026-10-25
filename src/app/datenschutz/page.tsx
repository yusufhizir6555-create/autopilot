export default function DatenschutzPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-12">
      <h1 className="h1">Datenschutzerklärung</h1>
      <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
        Platzhalter – vor dem Livegang von einer fachkundigen Person (Datenschutzbeauftragte/r, Anwalt) ausarbeiten lassen.
      </p>
      <h2 className="font-semibold">Zu klären und hier zu beschreiben</h2>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        <li>Verantwortlicher und Kontakt, ggf. Datenschutzbeauftragte/r</li>
        <li>Verarbeitete Daten: Konto, Bewerbungsprofil (inkl. Einkommen), Dokumente, Suchkriterien, Bewerbungen, Benachrichtigungen, Klicks auf Partner-Links</li>
        <li>Rechtsgrundlagen: Vertrag (Art. 6 Abs. 1 lit. b), Einwilligung für Auto-Bewerben und jeden Benachrichtigungskanal (lit. a)</li>
        <li>Empfänger: Partner, an die Bewerbungen gesendet werden; E-Mail-, SMS- und WhatsApp-Dienstleister; Hosting</li>
        <li>Drittlandübermittlung (z. B. Twilio, Meta/WhatsApp) und Garantien</li>
        <li>Speicherdauer und Löschkonzept</li>
        <li>Betroffenenrechte: Auskunft/Export und Löschung sind unter „Konto & Daten“ umgesetzt</li>
        <li>Kennzeichnung gesponserter Inhalte und Affiliate-Links</li>
      </ul>
    </main>
  );
}
