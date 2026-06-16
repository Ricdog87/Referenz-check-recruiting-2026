import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ShieldCheck, Lock, FileCheck2, Share2, CheckCircle2,
  UserCheck, Sparkles, ArrowRight, Award, Eye,
} from 'lucide-react'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { CandidateWaitlistForm } from '@/components/candidate/CandidateWaitlistForm'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://candiq.de'

export const metadata: Metadata = {
  title: 'Für Bewerber:innen — Referenzen proaktiv verifizieren | candiq',
  description:
    'Wie eine SCHUFA-Auskunft für deinen Lebenslauf — nur für Recruiting. Lass deine Stationen und Referenzen vorab prüfen und sende den candiq-verifizierten Link mit jeder Bewerbung. DSGVO-konform. Geplanter Start: Q4 2026.',
  alternates: { canonical: `${BASE_URL}/bewerber` },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/bewerber`,
    siteName: 'candiq',
    title: 'Für Bewerber:innen — Referenzen proaktiv verifizieren | candiq',
    description:
      'Lass deine Bewerbung vorab durch candiq verifizieren — Stationen, Tätigkeiten, Referenzen. Sende den verifizierten Link mit jeder Bewerbung. DSGVO-konform. Closed Beta Q4 2026.',
  },
}

export default function CandidateLandingPage() {
  return (
    <div className="min-h-screen bg-white text-text-primary overflow-x-hidden antialiased">
      <LandingNav />
      <main id="main">

        {/* HERO */}
        <section className="relative pt-28 pb-20 px-6 overflow-hidden border-b border-border">
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute top-16 left-1/3 w-[720px] h-[420px] opacity-25"
              style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.4), transparent 60%)', filter: 'blur(80px)' }}
            />
            <div
              className="absolute top-40 right-1/4 w-[480px] h-[360px] opacity-20"
              style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.35), transparent 60%)', filter: 'blur(80px)' }}
            />
          </div>

          <div className="max-w-5xl mx-auto relative">
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-800 border border-violet-200">
                <Sparkles className="w-3.5 h-3.5" /> Für Bewerber:innen · Closed Beta Q4 2026
              </span>
            </div>

            <h1 className="text-[clamp(34px,5.5vw,58px)] font-black tracking-tightest leading-[1.05] text-center mb-6">
              Beweise, dass deine Bewerbung <span className="text-gradient-brand">geprüft ist.</span>
            </h1>

            <p className="text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto text-center mb-8">
              Wie eine SCHUFA-Auskunft für deinen Lebenslauf — nur für Recruiting. Lass
              deine Stationen, Tätigkeiten und Referenzen vorab prüfen, und sende den
              candiq-verifizierten Link mit jeder Bewerbung. Arbeitgeber sehen sofort:
              hier wurde sauber geprüft.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
              <a href="#waitlist" className="btn-primary inline-flex items-center gap-2">
                <UserCheck className="w-4 h-4" /> Auf die Warteliste
                <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#faq" className="btn-secondary">
                Wie funktioniert das?
              </a>
            </div>

            {/* Trust-Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto pt-8 border-t border-border">
              <TrustItem icon={ShieldCheck} label="DSGVO-konform" sub="Art. 6 (1) a" />
              <TrustItem icon={Lock} label="Datenhoheit" sub="bei dir" />
              <TrustItem icon={Eye} label="Du entscheidest" sub="wer was sieht" />
              <TrustItem icon={Award} label="Verifiziert-Badge" sub="für CV + LinkedIn" />
            </div>
          </div>
        </section>

        {/* PROBLEM */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-xs font-semibold text-brand-700 uppercase tracking-widest mb-3 text-center">
              Das Problem
            </div>
            <h2 className="text-[clamp(28px,4vw,40px)] font-bold tracking-tight text-center mb-10 leading-[1.15]">
              Du bewirbst dich. Arbeitgeber zweifelt. <br/>
              <span className="text-text-secondary font-medium">Beweisen kannst du es vorher nicht.</span>
            </h2>

            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  h: 'CVs sind heute manipulierbar',
                  b: 'ChatGPT schreibt jeden Lebenslauf passend zur Stelle. Selbst ehrliche Bewerbungen geraten in den Generalverdacht — du bezahlst für den Misstrauensvorschuss der Branche.',
                },
                {
                  h: 'Referenzen sind eine Black Box',
                  b: 'Du nennst Referenzgeber, der Recruiter ruft (vielleicht) an. Du erfährst nie, was gesagt wurde. Es gibt keine Spielregeln, keine Dokumentation, keine Transparenz.',
                },
                {
                  h: 'Du hast keinen Hebel',
                  b: 'Während Arbeitgeber den Bewerbungsprozess kontrollieren, kannst du nichts proaktiv nachweisen. Erklärungsschleifen, Bauchgefühl-Entscheidungen, verlorene Slots.',
                },
              ].map((p) => (
                <div key={p.h} className="rounded-2xl border border-border bg-slate-50/60 p-5">
                  <h3 className="font-bold text-text-primary mb-2 text-base leading-snug">{p.h}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{p.b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WIE ES FUNKTIONIERT */}
        <section className="py-20 px-6 bg-slate-50 border-y border-border">
          <div className="max-w-5xl mx-auto">
            <div className="text-xs font-semibold text-brand-700 uppercase tracking-widest mb-3 text-center">
              So funktioniert candiq für Bewerber:innen
            </div>
            <h2 className="text-[clamp(28px,4vw,40px)] font-bold tracking-tight text-center mb-12 leading-[1.15]">
              Drei Schritte. <span className="text-gradient-brand">Verifiziertes Profil.</span>
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              <Step
                n="01"
                icon={UserCheck}
                title="Profil anlegen"
                body="Kostenlos, ohne Verpflichtung. Du sagst, welche Stationen du verifizieren lassen möchtest und nennst je Station deine Referenzgeber. Du entscheidest, was geprüft wird."
              />
              <Step
                n="02"
                icon={FileCheck2}
                title="Reviewer prüft"
                body="Ein:e geschulte:r Reviewer ruft jede:n Referenzgeber:in an — mit standardisiertem, AGG-konformem Fragenkatalog. Jede Aussage wird wörtlich dokumentiert. Du siehst das fertige Ergebnis."
              />
              <Step
                n="03"
                icon={Share2}
                title="Verifizierten Link teilen"
                body="Du bekommst eine private Profil-URL und ein „candiq-verifiziert“-Badge. Du teilst beides selektiv mit Arbeitgebern. Du siehst, wer wann wie lange reingesehen hat. Du kannst Zugriff jederzeit widerrufen."
              />
            </div>

            <p className="text-center text-sm text-text-muted mt-10 max-w-2xl mx-auto">
              <strong>Wichtig:</strong> Es gibt kein öffentliches Profil. Niemand findet dich über Suche.
              Nur Empfänger:innen, denen du den Link aktiv schickst, sehen die Verifikation.
            </p>
          </div>
        </section>

        {/* WAS DU BEKOMMST */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-xs font-semibold text-brand-700 uppercase tracking-widest mb-3 text-center">
              Was du als Bewerber:in bekommst
            </div>
            <h2 className="text-[clamp(28px,4vw,40px)] font-bold tracking-tight text-center mb-12 leading-[1.15]">
              Volle Datenhoheit. <span className="text-gradient-brand">Echter Vertrauens-Vorsprung.</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-5">
              <Benefit
                icon={Award}
                title="candiq-verifiziert-Badge"
                body="SVG für deinen Lebenslauf, deine Online-Bewerbung, deinen LinkedIn-Beitrag. Klickbar zur Profil-URL — Arbeitgeber sehen mit einem Klick: hier wurde geprüft."
              />
              <Benefit
                icon={Eye}
                title="Du entscheidest, wer sieht was"
                body="Pro Empfänger:in eine eigene Zugriffs-URL. Sichtbar nur so lange, wie du willst. Du siehst im Log: wer hat wann reingesehen, was hat sie/er angeschaut."
              />
              <Benefit
                icon={Lock}
                title="DSGVO-Vollausstattung"
                body="Recht auf Auskunft (Art. 15), Berichtigung (16), Löschung (17), Datenportabilität (20), Widerruf jederzeit. Alles über einen Klick im Dashboard — nicht über E-Mail-Antrag."
              />
              <Benefit
                icon={ShieldCheck}
                title="Anti-Fraud-by-Design"
                body="Du kannst keinen Referenzgeber spielen. Jede:r Referenzgeber:in bestätigt die eigene Identität separat. Reviewer dokumentieren wörtlich. Manipulation ist technisch ausgeschlossen."
              />
            </div>
          </div>
        </section>

        {/* WAITLIST */}
        <section id="waitlist" className="py-20 px-6 bg-gradient-to-br from-brand-50/60 via-white to-violet-50/40 border-y border-border">
          <div className="max-w-3xl mx-auto">
            <div className="text-xs font-semibold text-brand-700 uppercase tracking-widest mb-3 text-center">
              Closed Beta Q4 2026
            </div>
            <h2 className="text-[clamp(28px,4vw,40px)] font-bold tracking-tight text-center mb-4 leading-[1.15]">
              Sei unter den <span className="text-gradient-brand">ersten 100 Bewerber:innen</span>.
            </h2>
            <p className="text-base text-text-secondary text-center max-w-2xl mx-auto mb-10 leading-relaxed">
              Wir starten klein und sauber. Die ersten 100 angemeldeten Bewerber:innen
              bekommen den Service in der Beta-Phase <strong>1 Jahr kostenlos</strong> und gestalten
              das Produkt aktiv mit.
            </p>

            <div className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-card-md">
              <CandidateWaitlistForm />
            </div>

            <ul className="mt-8 grid sm:grid-cols-3 gap-3 text-xs text-text-muted">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                Kein Account-Zwang jetzt
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                Eine E-Mail zum Launch. Keine Spam-Serie.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                Löschung jederzeit mit einem Klick
              </li>
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-xs font-semibold text-brand-700 uppercase tracking-widest mb-3 text-center">
              Häufige Fragen
            </div>
            <h2 className="text-[clamp(28px,4vw,40px)] font-bold tracking-tight text-center mb-10 leading-[1.15]">
              Was Bewerber:innen typischerweise fragen
            </h2>

            <div className="space-y-3">
              <FaqItem
                q="Was kostet das?"
                a="Closed-Beta-Plätze (erste 100) sind 1 Jahr kostenlos. Danach planen wir eine schlanke Pauschale pro Verifikation oder ein „Profil aktiv halten“-Abo (~9-19 €/Jahr Größenordnung — wird vor Launch finalisiert)."
              />
              <FaqItem
                q="Wer kann meine Daten sehen?"
                a="Niemand außer den Empfänger:innen, denen DU eine Zugriffs-URL gibst. Es gibt keine öffentliche Suchfunktion, kein Profil-Verzeichnis, keinen Marktplatz. Reviewer im Verifikations-Prozess sehen nur, was sie für den Anruf brauchen."
              />
              <FaqItem
                q="Können meine Referenzgeber:innen nein sagen?"
                a="Ja, jederzeit. Vor dem Anruf bekommt jede:r Referenzgeber:in eine eigene Einwilligungs-E-Mail mit allen Pflichtinfos nach Art. 13 DSGVO. Wer ablehnt, wird nicht angerufen — und du siehst das im Status."
              />
              <FaqItem
                q="Was passiert, wenn eine Referenz negativ ist?"
                a="Dann steht das wörtlich im Report — wie es gesagt wurde. Du entscheidest, ob du den Link mit dieser Station weitergibst, die Station ausblendest oder die Verifikation komplett abbrichst. Es gibt kein „Veröffentlichen ohne deine Freigabe“."
              />
              <FaqItem
                q="Wie lösche ich mein Profil?"
                a="Im Dashboard, mit einem Klick. Anschließend werden alle deine Daten (Profil, Reports, Audit-Logs deiner Aktionen) innerhalb von 30 Tagen physisch gelöscht. Was wir gesetzlich aufbewahren müssen (z. B. Rechnungen, 10 Jahre HGB), ist davon explizit ausgenommen — wird aber nicht für andere Zwecke verwendet."
              />
              <FaqItem
                q="Wann startet die Beta?"
                a="Geplant ist Q4 2026. Wir warten bewusst nicht, bis alles perfekt ist — aber wir starten erst, wenn die DSGVO-Architektur Rechts-Reviewed und der Reviewer-Workflow stabil ist."
              />
              <FaqItem
                q="Wer steht hinter candiq?"
                a={<>candiq ist eine Marke der <strong>RSG Recruiting Solutions group GmbH</strong>, Wiesbaden (HRB 35951, AG Wiesbaden). Vollständige Angaben im <Link href="/impressum" className="text-brand-700 underline hover:text-brand-800">Impressum</Link>.</>}
              />
            </div>
          </div>
        </section>

        {/* RECHTLICHER RAHMEN */}
        <section className="py-16 px-6 bg-slate-900 text-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-xs font-semibold text-cyan-300 uppercase tracking-widest mb-3 text-center">
              Rechtlicher Rahmen
            </div>
            <h2 className="text-[clamp(24px,3.5vw,32px)] font-bold tracking-tight text-center mb-8 leading-[1.2]">
              DSGVO-konform <span className="text-cyan-300">by Design</span>
            </h2>

            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <LegalCard
                label="Rechtsgrundlage Verarbeitung"
                value="Art. 6 Abs. 1 lit. a DSGVO (deine Einwilligung), für jede Station separat & granular."
              />
              <LegalCard
                label="Rechtsgrundlage Referenzgeber-Anruf"
                value="Art. 6 Abs. 1 lit. a + Art. 14 DSGVO (Info-Pflicht beim Erstkontakt)."
              />
              <LegalCard
                label="Verantwortlich"
                value="RSG Recruiting Solutions group GmbH, Wiesbaden. Du selbst hast volle Datenhoheit."
              />
              <LegalCard
                label="Speicherdauer"
                value="Profil + Reports max. 12 Monate nach Inaktivität, dann automatische Löschung."
              />
              <LegalCard
                label="Hosting"
                value="EU-Hosting. Reports auf deutschen Servern. Drittland-Transfer nur Stripe (SCC)."
              />
              <LegalCard
                label="Widerruf"
                value="Jederzeit mit einem Klick im Dashboard. Wirkung sofort, ohne Erklärungspflicht."
              />
            </div>

            <p className="text-xs text-white/60 text-center mt-8 max-w-2xl mx-auto">
              Detaillierte Informationen folgen mit dem Start der Beta in der Bewerber-spezifischen
              Datenschutzerklärung. Bis dahin gilt die{' '}
              <Link href="/datenschutz" className="text-cyan-300 underline hover:text-cyan-200">
                allgemeine Datenschutzerklärung
              </Link>
              .
            </p>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-[clamp(26px,4vw,36px)] font-bold tracking-tight mb-4">
              Bereit, deine Bewerbung verifiziert zu schicken?
            </h2>
            <p className="text-base text-text-secondary mb-6">
              Anmelden dauert 30 Sekunden. Wir melden uns zum Beta-Start.
            </p>
            <a href="#waitlist" className="btn-primary inline-flex items-center gap-2">
              <UserCheck className="w-4 h-4" /> Auf die Warteliste
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </section>

      </main>
      <LandingFooter />
    </div>
  )
}

// ── Sub-Components ─────────────────────────────────────────────────────

function TrustItem({ icon: Icon, label, sub }: { icon: any; label: string; sub: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-brand-700" />
      </div>
      <div>
        <div className="text-sm font-semibold text-text-primary leading-tight">{label}</div>
        <div className="text-[11px] text-text-muted">{sub}</div>
      </div>
    </div>
  )
}

function Step({ n, icon: Icon, title, body }: { n: string; icon: any; title: string; body: string }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-6 shadow-card-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs"
             style={{ background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)' }}>
          {n}
        </div>
        <Icon className="w-5 h-5 text-brand-600" />
      </div>
      <h3 className="font-bold text-text-primary mb-2 text-base">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{body}</p>
    </div>
  )
}

function Benefit({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-brand-700" />
        </div>
        <div>
          <h3 className="font-bold text-text-primary mb-1.5">{title}</h3>
          <p className="text-sm text-text-secondary leading-relaxed">{body}</p>
        </div>
      </div>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <details className="group rounded-xl border border-border bg-white px-5 py-4 open:bg-slate-50/60">
      <summary className="font-semibold text-text-primary cursor-pointer list-none flex items-center justify-between gap-3">
        <span>{q}</span>
        <span className="text-text-muted text-xs group-open:rotate-180 transition-transform">▼</span>
      </summary>
      <div className="mt-3 text-sm text-text-secondary leading-relaxed">{a}</div>
    </details>
  )
}

function LegalCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
      <div className="text-[11px] uppercase tracking-widest text-cyan-300 font-bold mb-1.5">{label}</div>
      <div className="text-sm text-white/85 leading-snug">{value}</div>
    </div>
  )
}
