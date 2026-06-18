import type { Metadata } from 'next'
import Link from 'next/link'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { Mail, FileText, ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Auftragsverarbeitungsvertrag (AVV) — candiq',
  description:
    'Auftragsverarbeitungsvertrag nach Art. 28 DSGVO. Standardvorlage zum Download, individuelle Anpassungen jederzeit möglich.',
  alternates: { canonical: 'https://candiq.de/avv' },
  robots: { index: false, follow: true },
}

export default function AvvPage() {
  return (
    <>
      <LandingNav />
      <main id="main" className="bg-white">
        <article className="prose prose-slate mx-auto px-6 pt-24 pb-16 max-w-3xl">
          <div className="not-prose mb-8 flex items-center gap-3 text-sm text-text-secondary">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Art. 28 DSGVO
            </span>
            <span>Auftragsverarbeitungsvertrag · Stand 2026-06</span>
          </div>

          <h1>Auftragsverarbeitungsvertrag (AVV)</h1>
          <p className="lead">
            Zwischen Ihnen (Verantwortlicher) und der{' '}
            <strong>RSG Recruiting Solutions Group GmbH</strong> (Auftragsverarbeiter, Betreiber
            von candiq) gilt mit Vertragsschluss der unten skizzierte AVV nach Art. 28 DSGVO. Die
            ausformulierte PDF-Version bekommen Sie automatisch im Onboarding zugesendet — bei
            Vertrags-Reviewern Ihres DPO koennen wir die Vorlage auch vorab schicken.
          </p>

          <div className="not-prose my-6 p-5 rounded-2xl border border-brand-200 bg-brand-50/40 flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-white border border-brand-200 flex items-center justify-center text-brand-700 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-text-primary mb-1">
                AVV-Vorlage als PDF anfragen
              </div>
              <p className="text-xs text-text-secondary leading-relaxed mb-3">
                Wir schicken Ihnen die vollstaendige Standardvorlage (inkl.
                Subprozessor-Anhang, TOMs, SCCs für Drittland-Subdienstleister) als PDF zur
                internen Prüfung — typisch innerhalb von 24h.
              </p>
              <a
                href="mailto:hello@candiq.de?subject=AVV-Vorlage%20anfragen&body=Hallo%20candiq-Team%2C%20bitte%20schickt%20mir%20die%20AVV-Vorlage%20fuer%20unseren%20DPO-Review.%20Firma%3A%20"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 underline"
              >
                <Mail className="w-3.5 h-3.5" /> AVV per Mail anfragen
              </a>
            </div>
          </div>

          <h2>1. Gegenstand und Dauer der Verarbeitung</h2>
          <p>
            candiq verarbeitet personenbezogene Daten von Bewerbern (Kandidaten) und deren
            Referenzgebern ausschließlich im Auftrag und nach Weisung des Verantwortlichen, zum
            Zweck der digitalen Referenzpruefung im Recruiting-Prozess. Die Dauer richtet sich
            nach dem Hauptvertrag (Subscription) plus gesetzliche Aufbewahrungsfristen.
          </p>

          <h2>2. Art der personenbezogenen Daten</h2>
          <ul>
            <li>Stammdaten der Bewerber (Name, E-Mail, optional Telefon, Position, Abteilung)</li>
            <li>Bewerbungsunterlagen (CV als PDF/DOC, optional weitere Dokumente)</li>
            <li>Referenzgeber-Kontaktdaten (Name, Firma, Position, E-Mail oder Telefon)</li>
            <li>Prüfungsergebnisse (Notizen, Bewertungen, Diskrepanz-Markierungen)</li>
            <li>Audit-Trail (Login-Events, Datenzugriffe, Consent-Akzeptanz mit IP+UA)</li>
          </ul>

          <h2>3. Kategorien betroffener Personen</h2>
          <ul>
            <li>Bewerber des Verantwortlichen</li>
            <li>Vom Bewerber benannte Referenzgeber</li>
            <li>HR-Mitarbeiter:innen des Verantwortlichen (Plattformnutzer)</li>
          </ul>

          <h2>4. Pflichten des Auftragsverarbeiters (Art. 28 Abs. 3)</h2>
          <ul>
            <li>Verarbeitung nur auf dokumentierte Weisung (= Konfiguration im Dashboard)</li>
            <li>Vertraulichkeitsverpflichtung aller beteiligten Personen</li>
            <li>Technische und organisatorische Maßnahmen (TOMs, siehe Anhang)</li>
            <li>Subprozessoren werden vorher angekündigt; Widerspruchsrecht des Verantwortlichen</li>
            <li>
              Unterstützung bei Betroffenenrechten (Art. 15–22), Datenschutz-Folgenabschaetzung
              (Art. 35), Meldung von Verletzungen (Art. 33)
            </li>
            <li>Löschung oder Rückgabe nach Vertragsende</li>
          </ul>

          <h2>5. Subprozessoren</h2>
          <p>
            candiq setzt heute folgende Subprozessoren ein. Eine aktuelle Liste mit Verarbeitungs-
            zweck, Standort und Rechtsgrundlage finden Sie auch in der{' '}
            <Link href="/datenschutz" className="text-brand-700 font-semibold">
              Datenschutzerklärung
            </Link>
            .
          </p>
          <table>
            <thead>
              <tr>
                <th>Anbieter</th>
                <th>Zweck</th>
                <th>Standort</th>
                <th>Rechtsgrundlage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Vercel Inc.</td>
                <td>App-Hosting + CV-Storage (Vercel Blob, EU)</td>
                <td>EU (Frankfurt) / US (Backup)</td>
                <td>SCC + DPF</td>
              </tr>
              <tr>
                <td>Supabase Inc.</td>
                <td>Datenbank (Postgres, EU-Region)</td>
                <td>EU</td>
                <td>—</td>
              </tr>
              <tr>
                <td>Stripe Payments Europe</td>
                <td>Abrechnung &amp; Subscription-Management</td>
                <td>EU / US (DPF)</td>
                <td>SCC + DPF</td>
              </tr>
              <tr>
                <td>Resend Inc.</td>
                <td>Transaktions-E-Mails (Einladungen, Reports)</td>
                <td>US</td>
                <td>SCC + DPF</td>
              </tr>
              <tr>
                <td>Anthropic Inc.</td>
                <td>KI-gestuetzte CV-Plausibilitätsprüfung</td>
                <td>US</td>
                <td>SCC + DPF, keine Trainings-Nutzung</td>
              </tr>
              <tr>
                <td>HubSpot Inc.</td>
                <td>Termin-Buchung &amp; CRM-Sync</td>
                <td>US</td>
                <td>SCC + DPF</td>
              </tr>
            </tbody>
          </table>

          <h2>6. Technische und organisatorische Maßnahmen (TOMs)</h2>
          <ul>
            <li>Verschlüsselte Datenübertragung (TLS 1.3)</li>
            <li>Passwoerter bcrypt-gehasht, NEXTAUTH_SECRET als Server-Geheimnis</li>
            <li>
              Consent-Token: HMAC-SHA256-signiert, SHA-256-Hash in DB, Single-Use,
              14-Tage-TTL, timing-safe-equal Vergleich
            </li>
            <li>
              CV-Consent-Gate: Server-seitige Prüfung (lib/cv-gate.ts) erzwingt, dass Reviewer
              CVs nur nach erteilter Bewerber-Einwilligung sehen. Jeder Zugriff (granted +
              denied) wird im Audit-Log dokumentiert.
            </li>
            <li>
              Rollen-Modell: CLIENT (HR), REVIEWER (candiq-intern), ADMIN. Workspace-Isolation
              auf Application-Layer in jeder Mutation.
            </li>
            <li>Audit-Trail unveränderlich (Append-Only, AuditLog-Tabelle)</li>
            <li>Backup-Strategie: tagliche Snapshots der Postgres-DB, 30-Tage-Retention</li>
            <li>
              Auto-Löschung der Bewerberdaten 180 Tage nach Abschluss (Status COMPLETED /
              REJECTED / CONSENT_REVOKED). Audit-Logs bleiben gem. § 257 HGB.
            </li>
            <li>Rate-Limiting auf allen Auth- und Upload-Endpoints</li>
          </ul>

          <h2>7. Betroffenenrechte</h2>
          <p>
            Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung
            (Art. 18), Datenübertragbarkeit (Art. 20), Widerspruch (Art. 21) und Widerruf (Art. 7
            Abs. 3) sind im Dashboard als Self-Service-Funktionen verfuegbar. Bewerber koennen
            zusätzlich ihre Einwilligung jederzeit über den Magic-Link in ihrer Einladungs-Mail
            widerrufen.
          </p>

          <h2>8. Anpassungen</h2>
          <p>
            Individuelle Anpassungen (z.B. zusätzliche TOMs, abweichende Subprozessor-Vorgaben,
            Prüfrechte) verhandeln wir gern direkt im Vertragsentwurf. Bitte melden Sie sich an{' '}
            <a href="mailto:hello@candiq.de">hello@candiq.de</a>.
          </p>

          <p className="text-xs text-text-muted mt-12">
            Dies ist eine Kurz-Übersicht. Die ausformulierte AVV-PDF (inkl. Unterschriftenfeld) ist
            Vertragsbestandteil und wird im Onboarding bereitgestellt. Bei Fragen oder
            individuellen Anpassungen{' '}
            <a href="mailto:hello@candiq.de" className="text-brand-700 font-semibold">
              hello@candiq.de
            </a>
            .
          </p>
        </article>
      </main>
      <LandingFooter />
    </>
  )
}
