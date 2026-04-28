import Link from 'next/link'

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <nav className="border-b border-border px-6 h-16 flex items-center justify-between max-w-4xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-accent rounded-md flex items-center justify-center">
            <span className="text-white text-xs font-bold">CQ</span>
          </div>
          <span className="font-semibold">candiq</span>
        </Link>
        <Link href="/" className="text-sm text-text-secondary hover:text-text-primary transition-colors">← Zurück</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-6">
        <h1 className="text-3xl font-bold">Impressum</h1>
        <div className="text-sm text-text-secondary space-y-4 leading-relaxed">
          <div>
            <p className="text-text-primary font-medium">RSG Recruiting Solutions Group GmbH</p>
            <p>Am heiligenahus 9</p>
            <p>65207 Wiesbaden</p>
            <p>Deutschland</p>
          </div>

          <div>
            <p className="text-text-primary">candiq ist eine Marke der RSG Recruiting Solutions Group GmbH.</p>
          </div>

          <div>
            <p>Geschäftsführer: Ricardo Serrano</p>
            <p>Telefon: +49 176 60772556</p>
          </div>
        </div>
      </div>
    </div>
  )
}
