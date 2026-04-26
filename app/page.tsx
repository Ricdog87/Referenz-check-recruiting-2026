import Link from 'next/link'

const painPoints = [
  {
    title: 'KI-Bewerbungen wirken perfekt',
    text: 'Lebensläufe sehen makellos aus — aber wichtige Stationen, Verantwortungen oder Zeiträume sind oft geschönt.',
    stat: '+400%',
  },
  {
    title: 'Zeitdruck im Recruiting',
    text: 'HR-Teams entscheiden unter hoher Last. Für saubere Referenzchecks bleiben häufig nur wenige Minuten.',
    stat: '<2 Min',
  },
  {
    title: 'Fehlbesetzungen sind teuer',
    text: 'Ein einzelner Fehlgriff kostet nicht nur Geld, sondern Vertrauen, Teamleistung und wertvolle Monate.',
    stat: '50k–200k€',
  },
]

const storySteps = [
  {
    step: '01',
    title: 'Kandidat anlegen',
    text: 'CV und Basisdaten hochladen. Alles zentral an einem Ort — nachvollziehbar, sauber strukturiert.',
  },
  {
    step: '02',
    title: 'Referenzen prüfen lassen',
    text: 'Frühere Arbeitgeber, Positionen und Zeiträume werden systematisch abgeglichen und dokumentiert.',
  },
  {
    step: '03',
    title: 'Sicher entscheiden',
    text: 'Sie erhalten ein klares Ergebnis mit Notizen und Status — für belastbare Hiring-Entscheidungen.',
  },
]

const pricing = [
  {
    name: 'Starter',
    price: '199€',
    quota: '15 CVs / Monat',
    description: 'Für kleinere Teams mit fokussiertem Hiring-Bedarf.',
  },
  {
    name: 'Growth',
    price: '399€',
    quota: '45 CVs / Monat',
    description: 'Für aktive Recruiting-Teams mit konstantem Volumen.',
    featured: true,
  },
  {
    name: 'Scale',
    price: '699€',
    quota: '90 CVs / Monat',
    description: 'Für Unternehmen mit hohem Bewerbungsaufkommen.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* 3D-style background layers */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div
          className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[1200px] h-[620px]"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(10,132,255,0.26) 0%, rgba(10,132,255,0.06) 35%, transparent 70%)',
            filter: 'blur(8px)',
            transform: 'perspective(900px) rotateX(58deg)'
          }}
        />
        <div
          className="absolute top-[24%] left-[12%] w-[520px] h-[520px]"
          style={{ background: 'radial-gradient(circle, rgba(94,92,230,0.22) 0%, transparent 68%)', filter: 'blur(24px)' }}
        />
        <div
          className="absolute bottom-[12%] right-[10%] w-[460px] h-[460px]"
          style={{ background: 'radial-gradient(circle, rgba(48,209,88,0.14) 0%, transparent 66%)', filter: 'blur(20px)' }}
        />
      </div>

      <nav
        className="fixed top-0 left-0 right-0 z-50 h-[58px] flex items-center px-6"
        style={{
          background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'saturate(180%) blur(18px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center" style={{ boxShadow: '0 0 16px rgba(10,132,255,0.45)' }}>
              <span className="text-[10px] font-bold">RC</span>
            </div>
            <span className="text-sm font-semibold text-white/90">RefCheck</span>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="text-sm px-4 py-2 text-white/65 hover:text-white transition-colors">
              Live-Dashboard
            </Link>
            <Link href="/dashboard" className="btn-primary text-xs py-2 px-4 rounded-full">
              Demo starten
            </Link>
          </div>
        </div>
      </nav>

      <section className="pt-36 pb-28 px-6 relative">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-7 border border-accent/25 text-accent"
              style={{ background: 'rgba(10,132,255,0.1)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Recruiting ohne Blindflug
            </div>

            <h1 className="text-[clamp(40px,6vw,76px)] leading-[0.98] font-bold tracking-tight mb-7">
              <span className="gradient-text-white">Wenn Bewerbungen</span>
              <br />
              <span className="gradient-text">perfekt klingen,</span>
              <br />
              <span className="gradient-text-white">prüfen wir die Realität.</span>
            </h1>

            <p className="text-lg text-white/55 max-w-xl leading-relaxed mb-9">
              Ihr Team soll sicher einstellen — nicht hoffen. RefCheck macht Referenzprüfung schnell,
              strukturiert und DSGVO-konform, damit Entscheidungen nicht auf Bauchgefühl basieren.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard" className="btn-primary px-8 py-3.5 rounded-full text-sm font-semibold">
                Jetzt live testen
              </Link>
              <a href="#pricing" className="px-8 py-3.5 rounded-full text-sm font-medium border border-white/15 text-white/75 hover:text-white hover:border-white/30 transition-colors">
                Preise ansehen
              </a>
            </div>
          </div>

          <div className="relative">
            <div
              className="rounded-3xl p-6 border"
              style={{
                background: 'linear-gradient(165deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
                borderColor: 'rgba(255,255,255,0.14)',
                boxShadow: '0 20px 70px rgba(0,0,0,0.65), 0 8px 28px rgba(10,132,255,0.22)',
                transform: 'perspective(1200px) rotateY(-10deg) rotateX(6deg)',
              }}
            >
              <div className="text-xs uppercase tracking-widest text-white/35 mb-4">Executive Snapshot</div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[
                  ['Verifizierungsquote', '94%'],
                  ['Durchlaufzeit', '<48h'],
                  ['Risiko-Hinweise', 'Live'],
                  ['DSGVO-Status', '100%'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl p-4 border border-white/10 bg-black/25">
                    <div className="text-[11px] text-white/40 mb-1">{label}</div>
                    <div className="text-xl font-semibold tracking-tight">{value}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl p-4 bg-status-infoBg border border-status-info/30 text-sm text-status-info">
                „RefCheck hilft uns, kritische Fehlentscheidungen vor Vertragsunterschrift zu vermeiden.“
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-3">Pain Points</p>
            <h2 className="text-[clamp(30px,4vw,52px)] font-bold tracking-tight gradient-text-white">
              Warum klassische Referenzprüfung heute nicht mehr reicht
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {painPoints.map((item) => (
              <div key={item.title} className="rounded-2xl p-6 border border-white/10 bg-white/[0.03]">
                <div className="text-3xl font-bold mb-3">{item.stat}</div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest text-status-success font-semibold mb-3">Story</p>
            <h2 className="text-[clamp(30px,4vw,50px)] font-bold tracking-tight gradient-text-white">
              Von Unsicherheit zu klaren Hiring-Entscheidungen
            </h2>
          </div>

          <div className="space-y-4">
            {storySteps.map((s) => (
              <div key={s.step} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 flex gap-5">
                <div className="text-3xl font-bold text-white/25 w-12 flex-shrink-0">{s.step}</div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{s.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-3">Preisstaffelung</p>
            <h2 className="text-[clamp(30px,4vw,50px)] font-bold tracking-tight gradient-text-white">Monatliche Pakete</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className="rounded-3xl p-7 border relative"
                style={{
                  background: plan.featured
                    ? 'linear-gradient(180deg, rgba(10,132,255,0.16), rgba(255,255,255,0.03))'
                    : 'rgba(255,255,255,0.03)',
                  borderColor: plan.featured ? 'rgba(10,132,255,0.5)' : 'rgba(255,255,255,0.1)',
                }}
              >
                {plan.featured && <span className="absolute top-4 right-4 text-[10px] px-2 py-1 rounded-full border border-accent/40 text-accent">Empfohlen</span>}
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <p className="text-4xl font-bold tracking-tight mb-1">{plan.price}</p>
                <p className="text-sm text-white/70 mb-4">{plan.quota}</p>
                <p className="text-sm text-white/45 mb-6">{plan.description}</p>
                <Link href="/dashboard" className="btn-primary block w-full text-center py-3 rounded-xl">
                  Paket wählen
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-28 px-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <h2 className="text-[clamp(32px,5vw,58px)] font-bold tracking-tight gradient-text-white mb-5">
          Ihr Kunde sitzt im Meeting —
          <br />
          zeigen Sie Sicherheit statt Risiko.
        </h2>
        <p className="text-lg text-white/45 mb-8">Direkt ins Dashboard und live demonstrieren.</p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 btn-primary px-10 py-4 rounded-full">
          Jetzt Demo öffnen
          <span>→</span>
        </Link>
      </section>

      <footer className="py-10 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
          <span>© 2026 RefCheck</span>
          <div className="flex gap-5">
            <Link href="/datenschutz" className="hover:text-white/70 transition-colors">Datenschutz</Link>
            <Link href="/impressum" className="hover:text-white/70 transition-colors">Impressum</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
