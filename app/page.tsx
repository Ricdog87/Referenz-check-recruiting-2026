import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">

      {/* ——— Navbar ——— */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-[52px] flex items-center px-6"
        style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-accent flex items-center justify-center flex-shrink-0"
              style={{ boxShadow: '0 0 12px rgba(10,132,255,0.4)' }}>
              <span className="text-white text-[10px] font-bold">RC</span>
            </div>
            <span className="text-sm font-semibold text-white/90 tracking-tight">RefCheck</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard"
              className="text-sm font-medium text-white/60 hover:text-white px-4 py-1.5 rounded-full transition-colors duration-150">
              Dashboard öffnen
            </Link>
            <Link href="/dashboard"
              className="btn-primary text-xs py-1.5 px-4">
              Jetzt testen
            </Link>
          </div>
        </div>
      </nav>

      {/* ——— Hero ——— */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 pb-24 px-6 overflow-hidden">

        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[600px] opacity-30"
            style={{ background: 'radial-gradient(ellipse, rgba(10,132,255,0.2) 0%, transparent 65%)' }} />
          <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] opacity-20"
            style={{ background: 'radial-gradient(ellipse, rgba(94,92,230,0.25) 0%, transparent 70%)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] opacity-15"
            style={{ background: 'radial-gradient(ellipse, rgba(48,209,88,0.2) 0%, transparent 70%)' }} />
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto animate-fade-in-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-10 text-xs font-medium text-accent border border-accent/20"
            style={{ background: 'rgba(10,132,255,0.08)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            DSGVO-konform · Server in Deutschland
          </div>

          {/* Headline */}
          <h1 className="text-[clamp(44px,7vw,88px)] font-bold leading-[1.0] tracking-tightest mb-8">
            <span className="gradient-text-white">Die Wahrheit hinter</span>
            <br />
            <span className="gradient-text">jeder Bewerbung.</span>
          </h1>

          {/* Subtext */}
          <p className="text-[clamp(17px,2vw,21px)] text-white/50 font-light leading-relaxed max-w-2xl mx-auto mb-12 tracking-tight">
            KI generiert täglich hunderte Bewerbungen — wir prüfen die Realität.
            Zeugnisse, Tätigkeiten, frühere Arbeitgeber. In unter 48 Stunden.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link href="/dashboard"
              className="btn-primary text-base py-3.5 px-8 rounded-full font-semibold"
              style={{ background: 'linear-gradient(135deg, #0a84ff, #0070e0)', boxShadow: '0 4px 24px rgba(10,132,255,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
              Jetzt live testen
            </Link>
            <Link href="/dashboard"
              className="text-base py-3.5 px-8 rounded-full font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/20 transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(10px)' }}>
              Demo ansehen →
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 mt-24 grid grid-cols-3 gap-12 max-w-xl mx-auto">
          {[
            { n: '94%', t: 'Verifizierungsquote' },
            { n: '<48h', t: 'Durchlaufzeit' },
            { n: '100%', t: 'DSGVO-konform' },
          ].map((s) => (
            <div key={s.t} className="text-center">
              <div className="text-3xl font-bold tracking-tighter text-white mb-1"
                style={{ fontFeatureSettings: '"tnum"' }}>{s.n}</div>
              <div className="text-xs text-white/35 font-medium uppercase tracking-widest">{s.t}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ——— Problem ——— */}
      <section className="py-32 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-4">Das Problem</p>
            <h2 className="text-[clamp(32px,5vw,56px)] font-bold tracking-tighter gradient-text-white mb-6">
              Der KI-Tsunami im Recruiting
            </h2>
            <p className="text-lg text-white/40 max-w-2xl mx-auto leading-relaxed">
              GPT-optimierte Bewerbungen überschwemmen Ihr Postfach.
              Alles klingt perfekt — aber was stimmt wirklich?
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { n: '↑ 400%', t: 'Mehr Bewerbungen', d: 'Unternehmen berichten von einer Vervierfachung eingehender Bewerbungen seit Einführung von KI-Tools.' },
              { n: '< 2 min', t: 'Zeit pro Referenz', d: 'Im Schnitt verbringen Recruiter weniger als 2 Minuten auf die manuelle Überprüfung einer Referenz.' },
              { n: '€ 150k', t: 'Kosten Fehlbesetzung', d: 'Eine einzige falsche Einstellung kostet Unternehmen durchschnittlich 50.000–200.000 Euro.' },
            ].map((c) => (
              <div key={c.t} className="card-glass p-7 rounded-2xl">
                <div className="text-3xl font-bold tracking-tight mb-2 text-white" style={{ fontFeatureSettings: '"tnum"' }}>{c.n}</div>
                <div className="text-sm font-semibold text-white/80 mb-3">{c.t}</div>
                <p className="text-xs text-white/40 leading-relaxed">{c.d}</p>
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
              Wir prüfen. Sie entscheiden.
            </h2>
            <p className="text-lg text-white/40 max-w-2xl mx-auto leading-relaxed">
              Systematische Referenzprüfung als Service —
              transparent, nachvollziehbar, rechtskonform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: '⬆',
                label: 'CV Upload',
                color: '#0a84ff',
                desc: 'Bewerbungsunterlagen per Drag & Drop hochladen. PDF, DOC, Bilder — alles verschlüsselt gespeichert.',
              },
              {
                icon: '📞',
                label: 'Arbeitgeber-Check',
                color: '#30d158',
                desc: 'Wir kontaktieren frühere Arbeitgeber systematisch und verifizieren Positionen, Zeiträume und Tätigkeiten.',
              },
              {
                icon: '🛡',
                label: 'DSGVO-konform',
                color: '#5e5ce6',
                desc: 'Einwilligungsmanagement, Datenlöschung und Export auf Knopfdruck. Ausschließlich deutsche Server.',
              },
              {
                icon: '📊',
                label: 'Live-Dashboard',
                color: '#ff9f0a',
                desc: 'Alle Kandidaten und Prüfungen auf einen Blick. Echtzeit-Status, Notizen, Ergebnisse.',
              },
              {
                icon: '⚡',
                label: 'Status-Tracking',
                color: '#ff453a',
                desc: 'Von offen bis abgeschlossen — jede Prüfung hat einen klaren Status und vollständigen Verlauf.',
              },
              {
                icon: '🔒',
                label: 'Maximale Sicherheit',
                color: '#bf5af2',
                desc: 'TLS-Verschlüsselung, sichere Sessions, Audit-Log für alle Datenzugriffe.',
              },
            ].map((f) => (
              <div key={f.label}
                className="group relative p-6 rounded-2xl border border-white/6 hover:border-white/12 transition-all duration-300 cursor-default overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${f.color}08 0%, transparent 60%)` }} />
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl mb-5"
                    style={{ background: `${f.color}15`, border: `1px solid ${f.color}25` }}>
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
            In drei Schritten zur Sicherheit
          </h2>

          <div className="space-y-1">
            {[
              {
                step: '01',
                title: 'Kandidat hochladen',
                desc: 'Bewerbungsunterlagen im Dashboard anlegen, CV und Zeugnisse hochladen. DSGVO-Einwilligung dokumentieren.',
              },
              {
                step: '02',
                title: 'Prüfung beauftragen',
                desc: 'Frühere Arbeitgeber angeben, Zeiträume und Positionen hinterlegen. Wir übernehmen den Rest.',
              },
              {
                step: '03',
                title: 'Ergebnis erhalten',
                desc: 'Klares Ergebnis: Verifiziert oder Unstimmigkeit gefunden — mit vollständigem Gesprächsprotokoll.',
              },
            ].map((s, i) => (
              <div key={s.step} className="flex items-start gap-6 p-7 rounded-2xl hover:bg-white/[0.02] transition-colors text-left group">
                <div className="text-4xl font-bold tracking-tighter w-14 flex-shrink-0 text-right"
                  style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
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

      {/* ——— DSGVO ——— */}
      <section className="py-20 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(94,92,230,0.04)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-10 items-center">
            <div className="flex-shrink-0 w-16 h-16 rounded-3xl flex items-center justify-center text-3xl"
              style={{ background: 'linear-gradient(135deg, rgba(94,92,230,0.2), rgba(10,132,255,0.2))', border: '1px solid rgba(94,92,230,0.3)' }}>
              🇩🇪
            </div>
            <div>
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-2">Datenschutz</p>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-3">DSGVO-Compliance by Design</h2>
              <p className="text-sm text-white/45 leading-relaxed max-w-2xl">
                Alle Daten auf deutschen Servern. Kandidaten-Einwilligungen werden dokumentiert.
                Datenexport (Art. 20) und vollständige Löschung (Art. 17) per Knopfdruck.
                Keine Weitergabe an Dritte. Kein Tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ——— Pricing ——— */}
      <section className="py-28 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-4">Preisstaffelung</p>
            <h2 className="text-[clamp(30px,5vw,52px)] font-bold tracking-tighter gradient-text-white mb-5">Flexible Pakete pro Monat</h2>
            <p className="text-lg text-white/45">Alle Pakete inklusive DSGVO-Dokumentation, Dashboard und Referenz-Tracking.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: 'Starter', price: '199€', cvs: '15 CVs / Monat', note: 'Für kleine Teams und erste Pilotphasen.' },
              { name: 'Growth', price: '399€', cvs: '45 CVs / Monat', note: 'Ideal für aktive Recruiting-Teams.', featured: true },
              { name: 'Scale', price: '699€', cvs: '90 CVs / Monat', note: 'Für hohe Volumen und mehrere Hiring-Manager.' },
            ].map((plan) => (
              <div key={plan.name} className="rounded-3xl p-7 border relative" style={{
                background: plan.featured ? 'linear-gradient(180deg, rgba(10,132,255,0.14), rgba(255,255,255,0.03))' : 'rgba(255,255,255,0.03)',
                borderColor: plan.featured ? 'rgba(10,132,255,0.5)' : 'rgba(255,255,255,0.08)',
                boxShadow: plan.featured ? '0 12px 40px rgba(10,132,255,0.22)' : 'none',
              }}>
                {plan.featured && <span className="absolute top-4 right-4 text-[10px] px-2 py-1 rounded-full border border-accent/30 text-accent">Beliebt</span>}
                <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                <p className="text-4xl font-bold tracking-tight mb-1">{plan.price}</p>
                <p className="text-sm text-white/60 mb-6">{plan.cvs}</p>
                <p className="text-sm text-white/45 mb-8">{plan.note}</p>
                <Link href="/dashboard" className="btn-primary w-full text-center py-3 rounded-xl block">Paket wählen</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— CTA ——— */}
      <section className="py-40 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px]"
            style={{ background: 'radial-gradient(ellipse, rgba(10,132,255,0.12) 0%, transparent 70%)' }} />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-[clamp(36px,5vw,64px)] font-bold tracking-tightest gradient-text-white mb-6">
            Bereit zu starten?
          </h2>
          <p className="text-lg text-white/40 mb-10">
            Kostenlos testen. Keine Kreditkarte. Kein Commitment.
          </p>
          <Link href="/dashboard"
            className="inline-flex items-center gap-2 text-base py-4 px-10 rounded-full font-semibold text-white transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, #0a84ff, #0070e0)', boxShadow: '0 8px 32px rgba(10,132,255,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
            Zum Live-Dashboard
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ——— Footer ——— */}
      <footer className="py-10 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-accent flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">RC</span>
            </div>
            <span className="text-xs text-white/25">© 2026 RefCheck</span>
          </div>
          <div className="flex gap-6 text-xs text-white/25">
            <Link href="/datenschutz" className="hover:text-white/60 transition-colors">Datenschutz</Link>
            <Link href="/impressum" className="hover:text-white/60 transition-colors">Impressum</Link>
            <Link href="/agb" className="hover:text-white/60 transition-colors">AGB</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
