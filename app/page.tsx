import Link from 'next/link'

const trustBullets = [
  '14 Tage Testphase',
  'Keine Kreditkarte erforderlich',
  'DSGVO-konform',
  'Serverstandort Deutschland',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* ——— Navbar ——— */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-[52px] flex items-center px-6"
        style={{
          background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 rounded-lg bg-accent flex items-center justify-center flex-shrink-0"
              style={{ boxShadow: '0 0 12px rgba(10,132,255,0.4)' }}
            >
              <span className="text-white text-[10px] font-bold">CQ</span>
            </div>
            <span className="text-sm font-semibold text-white/90 tracking-tight">candiq</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/preise"
              className="text-sm font-medium text-white/60 hover:text-white px-4 py-1.5 rounded-full transition-colors duration-150"
            >
              Preise
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-white/60 hover:text-white px-4 py-1.5 rounded-full transition-colors duration-150"
            >
              Anmelden
            </Link>
            <Link href="/register" className="btn-primary text-xs py-1.5 px-4">
              Kostenlos starten
            </Link>
          </div>
        </div>
      </nav>

      {/* ——— Hero ——— */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[600px] opacity-30"
            style={{ background: 'radial-gradient(ellipse, rgba(10,132,255,0.2) 0%, transparent 65%)' }}
          />
          <div
            className="absolute top-1/3 left-1/4 w-[500px] h-[500px] opacity-20"
            style={{ background: 'radial-gradient(ellipse, rgba(94,92,230,0.25) 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] opacity-15"
            style={{ background: 'radial-gradient(ellipse, rgba(48,209,88,0.2) 0%, transparent 70%)' }}
          />
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
              backgroundSize: '80px 80px',
            }}
          />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto animate-fade-in-up">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-10 text-xs font-medium text-accent border border-accent/20"
            style={{ background: 'rgba(10,132,255,0.08)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Hiring-Risk-Reduction · DSGVO-konform · Server in Deutschland
          </div>

          <h1 className="text-[clamp(42px,7vw,82px)] font-bold leading-[1.0] tracking-tightest mb-8">
            <span className="gradient-text-white">Reduzieren Sie Hiring-Risiken</span>
            <br />
            <span className="gradient-text">bevor der Vertrag unterschrieben ist.</span>
          </h1>

          <p className="text-[clamp(17px,2vw,21px)] text-white/50 font-light leading-relaxed max-w-3xl mx-auto mb-12 tracking-tight">
            KI-optimierte Bewerbungen wirken überzeugend, sind aber oft schwer verifizierbar. candiq prüft
            berufsrelevante Angaben strukturiert, dokumentiert und auditierbar — damit Teams Fehlbesetzungen,
            Zeitverlust und Compliance-Risiken früh reduzieren.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/register"
              className="btn-primary text-base py-3.5 px-8 rounded-full font-semibold"
              style={{
                background: 'linear-gradient(135deg, #0a84ff, #0070e0)',
                boxShadow: '0 4px 24px rgba(10,132,255,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              14 Tage kostenlos starten
            </Link>
            <Link
              href="/preise"
              className="text-base py-3.5 px-8 rounded-full font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/20 transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(10px)' }}
            >
              Preise ansehen →
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-white/45">
            {trustBullets.map((item) => (
              <span key={item}>• {item}</span>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-24 grid grid-cols-3 gap-12 max-w-xl mx-auto">
          {[
            { n: '<48h', t: 'Durchschnittliche Rückmeldung' },
            { n: '100%', t: 'Dokumentierter Workflow' },
            { n: 'DSGVO', t: 'Konformer Prozess' },
          ].map((s) => (
            <div key={s.t} className="text-center">
              <div className="text-3xl font-bold tracking-tighter text-white mb-1" style={{ fontFeatureSettings: '"tnum"' }}>
                {s.n}
              </div>
              <div className="text-xs text-white/35 font-medium uppercase tracking-widest">{s.t}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ——— Problem ——— */}
      <section className="py-32 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-4">Das Problem</p>
            <h2 className="text-[clamp(32px,5vw,56px)] font-bold tracking-tighter gradient-text-white mb-6">
              Hoher Einstellungsdruck, wenig verlässliche Fakten
            </h2>
            <p className="text-lg text-white/40 max-w-3xl mx-auto leading-relaxed">
              Inhouse-Recruiting, Personaldienstleister und Executive-Search-Teams müssen schnell entscheiden —
              gleichzeitig steigen Anforderungen an Nachweisbarkeit, Datenschutz und Qualität.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: 'Lebensläufe und Tätigkeiten sind schwer verifizierbar',
                desc: 'Bewerbungsunterlagen sind professionell formuliert, aber frühere Rollen, Verantwortungsumfang und Zeiträume sind ohne strukturierte Prüfung kaum belastbar.',
              },
              {
                title: 'Recruiter haben keine Zeit für manuelle Referenzchecks',
                desc: 'Manuelle Nachverfolgung kostet Zeit, erzeugt Medienbrüche und bremst den Hiring-Prozess im operativen Tagesgeschäft.',
              },
              {
                title: 'Fehlbesetzungen sind teuer',
                desc: 'Falsche Einstellungen binden Budget, Management-Zeit und Teamkapazität — besonders kritisch bei Schlüsselpositionen.',
              },
              {
                title: 'Datenschutz und Auditierbarkeit verhindern improvisierte Prozesse',
                desc: 'Spontane Checks per Mail oder Telefon ohne nachvollziehbare Dokumentation erhöhen rechtliche und prozessuale Risiken.',
              },
            ].map((c) => (
              <div key={c.title} className="card-glass p-7 rounded-2xl">
                <div className="text-sm font-semibold text-white/90 mb-3">{c.title}</div>
                <p className="text-sm text-white/45 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— Solution / Features ——— */}
      <section className="py-32 px-6" style={{ background: 'linear-gradient(180deg, rgba(10,132,255,0.03) 0%, transparent 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-xs font-semibold text-status-success uppercase tracking-widest mb-4">Die Lösung</p>
            <h2 className="text-[clamp(32px,5vw,56px)] font-bold tracking-tighter gradient-text-white mb-6">
              Plattformgestützte Referenzprüfung mit klarer Entscheidungsbasis
            </h2>
            <p className="text-lg text-white/40 max-w-3xl mx-auto leading-relaxed">
              candiq kombiniert digitale Prozesssteuerung mit standardisierter telefonischer Verifikation innerhalb
              eines dokumentierten Workflows.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: '⬆',
                label: 'Kandidatenakte in Minuten',
                color: '#0a84ff',
                desc: 'CV und Nachweise sicher hochladen, Prüfauftrag starten und alle Informationen zentral in der Plattform verwalten.',
              },
              {
                icon: '📞',
                label: 'Standardisierte Verifikation',
                color: '#30d158',
                desc: 'Berufsbezogene Angaben werden telefonisch über einen strukturierten Prüfprozess verifiziert und einheitlich dokumentiert.',
              },
              {
                icon: '🛡',
                label: 'Consent & Datenschutz',
                color: '#5e5ce6',
                desc: 'Einwilligung, Datenhaltung, Löschung und Export sind integriert und auf DSGVO-konforme Abläufe ausgelegt.',
              },
              {
                icon: '📊',
                label: 'Auditierbares Reporting',
                color: '#ff9f0a',
                desc: 'Ergebnisse, Status und Historie sind nachvollziehbar aufbereitet — für Fachbereich, HR und Compliance.',
              },
              {
                icon: '⚡',
                label: 'Schnelle Durchlaufzeiten',
                color: '#ff453a',
                desc: 'Klare SLA-orientierte Abläufe helfen, Einstellungsentscheidungen ohne unnötige Verzögerung abzusichern.',
              },
              {
                icon: '🔒',
                label: 'Team- und Rollensteuerung',
                color: '#bf5af2',
                desc: 'Mehrere Standorte und Teams arbeiten mit einheitlichen Zugriffen, Rollen und Prozessstandards zusammen.',
              },
            ].map((f) => (
              <div
                key={f.label}
                className="group relative p-6 rounded-2xl border border-white/6 hover:border-white/12 transition-all duration-300 cursor-default overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${f.color}08 0%, transparent 60%)` }}
                />
                <div className="relative z-10">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl mb-5"
                    style={{ background: `${f.color}15`, border: `1px solid ${f.color}25` }}
                  >
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-white/90 mb-2 text-sm">{f.label}</h3>
                  <p className="text-xs text-white/40 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— How it works ——— */}
      <section className="py-32 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">So funktioniert es</p>
          <h2 className="text-[clamp(28px,4vw,48px)] font-bold tracking-tighter gradient-text-white mb-20">
            In drei Schritten von der Anfrage zur belastbaren Entscheidung
          </h2>

          <div className="space-y-1">
            {[
              {
                step: '01',
                title: 'Prüfauftrag digital anlegen',
                desc: 'Kandidat anlegen, Dokumente hochladen und Einwilligung im System hinterlegen. Alle Schritte sind revisionsfähig dokumentiert.',
              },
              {
                step: '02',
                title: 'Standardisierte Verifikation starten',
                desc: 'candiq führt die telefonische Verifikation anhand eines definierten Fragen- und Qualitätsrasters durch und protokolliert den Ablauf strukturiert.',
              },
              {
                step: '03',
                title: 'Ergebnis im Dashboard entscheiden',
                desc: 'Sie erhalten eine klare Zusammenfassung verifizierter Angaben und möglicher Abweichungen — als belastbare Grundlage für Hiring-Entscheidungen.',
              },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-6 p-7 rounded-2xl hover:bg-white/[0.02] transition-colors text-left group">
                <div
                  className="text-4xl font-bold tracking-tighter w-14 flex-shrink-0 text-right"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {s.step}
                </div>
                <div className="pt-1">
                  <h3 className="font-semibold text-white/90 text-lg mb-2 tracking-tight">{s.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed max-w-lg">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— Pricing teaser ——— */}
      <section className="py-24 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-4">Pricing</p>
            <h2 className="text-[clamp(28px,4vw,46px)] font-bold tracking-tighter gradient-text-white mb-5">
              Planbar starten, skalierbar wachsen
            </h2>
            <p className="text-white/45 max-w-2xl mx-auto">
              Transparentes SaaS-Modell für Teams mit unterschiedlichen Volumina — vom Einstieg bis zur
              unternehmensweiten Compliance-Lösung.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-10">
            {[
              { plan: 'Starter', price: '79 €', detail: '3 Prüfungen inkl. · danach 49 € / Prüfung' },
              { plan: 'Professional', price: '249 €', detail: '10 Prüfungen inkl. · danach 35 € / Prüfung' },
              { plan: 'Business', price: '649 €', detail: '30 Prüfungen inkl. · danach 25 € / Prüfung' },
              { plan: 'Enterprise', price: 'Individuell', detail: 'Für hohe Volumina, Multi-Team, Governance' },
            ].map((p) => (
              <div key={p.plan} className="card-glass rounded-2xl p-6">
                <p className="text-sm font-semibold text-white/80 mb-3">{p.plan}</p>
                <p className="text-3xl font-bold tracking-tight text-white mb-2">{p.price}</p>
                <p className="text-xs text-white/45">{p.detail}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/preise" className="btn-primary text-sm px-7 py-3 rounded-full">
              Vollständige Preisübersicht ansehen
            </Link>
          </div>
        </div>
      </section>

      {/* ——— FAQ ——— */}
      <section className="py-24 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">FAQ</p>
            <h2 className="text-[clamp(26px,4vw,42px)] font-bold tracking-tighter gradient-text-white">
              Häufige Fragen vor dem Start
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'Wie schnell ist der Go-live?',
                a: 'In der Regel am selben Arbeitstag. Teamzugänge, Rollen und erster Prüfauftrag sind in wenigen Minuten eingerichtet.',
              },
              {
                q: 'Wie läuft die Einwilligung der Kandidaten?',
                a: 'Die Einwilligung wird vor Start des Prüfprozesses dokumentiert. Der Ablauf ist in die Plattform integriert und nachvollziehbar protokolliert.',
              },
              {
                q: 'Ist candiq auch für Personaldienstleister geeignet?',
                a: 'Ja. candiq ist für Inhouse-Recruiting, Personaldienstleister und Executive-Search-Prozesse im DACH-Raum ausgelegt.',
              },
              {
                q: 'Wie werden Zusatzprüfungen abgerechnet?',
                a: 'Je nach Paket gelten feste Stückpreise pro zusätzlicher Prüfung. Die Abrechnung ist transparent im gewählten Tarif hinterlegt.',
              },
            ].map((item) => (
              <div key={item.q} className="card-glass p-5 rounded-2xl">
                <h3 className="text-sm font-semibold text-white/90 mb-2">{item.q}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— CTA ——— */}
      <section className="py-36 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px]"
            style={{ background: 'radial-gradient(ellipse, rgba(10,132,255,0.12) 0%, transparent 70%)' }}
          />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-[clamp(34px,5vw,58px)] font-bold tracking-tightest gradient-text-white mb-6">
            Senken Sie Hiring-Risiken ab der nächsten Einstellung
          </h2>
          <p className="text-lg text-white/40 mb-10">
            14 Tage testen, ohne Kreditkarte. Schnell startklar für datenschutzkonforme, standardisierte
            Referenzprüfungen.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-base py-4 px-10 rounded-full font-semibold text-white transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #0a84ff, #0070e0)',
              boxShadow: '0 8px 32px rgba(10,132,255,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            Jetzt kostenlos starten
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <p className="text-xs text-white/40 mt-5">Keine Kreditkarte · 14 Tage Test · Deutsche Server · DSGVO-konform</p>
        </div>
      </section>

      {/* ——— Footer ——— */}
      <footer className="py-10 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-accent flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">CQ</span>
            </div>
            <span className="text-xs text-white/25">© 2026 candiq</span>
          </div>
          <div className="flex gap-6 text-xs text-white/25">
            <Link href="/preise" className="hover:text-white/60 transition-colors">
              Preise
            </Link>
            <Link href="/datenschutz" className="hover:text-white/60 transition-colors">
              Datenschutz
            </Link>
            <Link href="/impressum" className="hover:text-white/60 transition-colors">
              Impressum
            </Link>
            <Link href="/agb" className="hover:text-white/60 transition-colors">
              AGB
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
