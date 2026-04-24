import Link from 'next/link'

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <nav className="border-b border-border px-6 h-16 flex items-center justify-between max-w-4xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-accent rounded-md flex items-center justify-center">
            <span className="text-white text-xs font-bold">RC</span>
          </div>
          <span className="font-semibold">RefCheck</span>
        </Link>
        <Link href="/" className="text-sm text-text-secondary hover:text-text-primary transition-colors">← Zurück</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-6">
        <h1 className="text-3xl font-bold">Impressum</h1>
        <div className="text-sm text-text-secondary space-y-4 leading-relaxed">
          <div>
            <p className="text-text-primary font-medium">[Ihr Unternehmen]</p>
            <p>[Straße und Hausnummer]</p>
            <p>[PLZ Ort]</p>
            <p>Deutschland</p>
          </div>
          <div>
            <p>Telefon: [+49 ...]</p>
            <p>E-Mail: info@[ihre-domain].de</p>
          </div>
          <div>
            <p>Handelsregister: [HRB ...]</p>
            <p>Registergericht: Amtsgericht [Ort]</p>
            <p>USt-IdNr.: DE [...]</p>
          </div>
          <div>
            <p className="font-medium text-text-primary">Verantwortlich für den Inhalt (§ 55 RStV):</p>
            <p>[Name der verantwortlichen Person]</p>
          </div>
          <p className="text-text-muted text-xs mt-8">
            Bitte ersetzen Sie die Platzhalter mit Ihren tatsächlichen Unternehmensdaten.
          </p>
        </div>
      </div>
    </div>
  )
}
