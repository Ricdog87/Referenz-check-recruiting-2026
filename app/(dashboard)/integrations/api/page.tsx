import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Header } from '@/components/layout/Header'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Code2, ShieldCheck, AlertTriangle, Key, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

const PLANS_WITH_INTEGRATIONS = new Set([
  'BUSINESS',
  'ENTERPRISE',
  'AGENCY_PRO',
  'AGENCY_SCALE',
])

// Heutige Auth: NextAuth Session-Cookie. Roadmap: API-Keys + OAuth.
// Damit Kunden sofort beginnen koennen, dokumentieren wir den Stand
// und sagen ehrlich, was Q4 2026 dazukommt.

const ENDPOINTS = [
  {
    method: 'GET',
    path: '/api/candidates',
    desc: 'Liste aller Kandidaten im eigenen Workspace (ownership-gated).',
  },
  {
    method: 'POST',
    path: '/api/candidates',
    desc: 'Neuen Kandidaten anlegen. Body: firstName, lastName, email, position, department?, notes?, gdprConsent?',
  },
  {
    method: 'GET',
    path: '/api/candidates/:id',
    desc: 'Einzelner Kandidat inkl. Documents und ReferenceChecks.',
  },
  {
    method: 'PATCH',
    path: '/api/candidates/:id',
    desc: 'Kandidat updaten. Body: dieselben Felder wie POST, alle optional.',
  },
  {
    method: 'POST',
    path: '/api/candidates/:id/invite',
    desc: 'Magic-Link-Einwilligungs-Mail an den Bewerber senden (Token 14 Tage gueltig).',
  },
  {
    method: 'POST',
    path: '/api/checks',
    desc: 'Referenzpruefung anlegen. Body: candidateId, employerName, employerContact, employerPhone?, ...',
  },
  {
    method: 'PATCH',
    path: '/api/checks/:id',
    desc: 'Check-Status aendern. Body: { status: "IN_REVIEW" } triggert die Reviewer-Pipeline.',
  },
  {
    method: 'GET',
    path: '/api/documents/:id',
    desc: 'CV/Dokument-Download. CV-Consent-Gate enforced: Reviewer brauchen RELEASED-Status.',
  },
  {
    method: 'GET',
    path: '/api/addons',
    desc: 'Add-on-Bestellungen des Workspace abrufen.',
  },
  {
    method: 'POST',
    path: '/api/addons',
    desc: 'Add-on buchen via Stripe-Checkout. Body: { sku: "EXPRESS_24H", checkId? }.',
  },
]

export default async function ApiDocsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const currentPlan = session.user.plan ?? 'STARTER'
  if (!PLANS_WITH_INTEGRATIONS.has(currentPlan)) redirect('/integrations')

  return (
    <>
      <Header
        title="REST-API"
        subtitle="Heutiger Stand und curl-Beispiele"
        action={
          <Link href="/integrations" className="btn-secondary">
            <ArrowLeft className="w-4 h-4" /> Zurueck
          </Link>
        }
      />

      <div className="space-y-6 max-w-4xl">
        {/* Status-Hinweis */}
        <div className="card-md bg-gradient-to-br from-emerald-50/60 to-white border-emerald-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-sm text-text-secondary leading-relaxed">
              <strong className="text-text-primary">Heute verfuegbar:</strong>{' '}
              Vollstaendige JSON-API mit denselben Funktionen wie das Dashboard.
              Authentifizierung ueber NextAuth-Session-Cookie. Ideal fuer Browser-
              und Server-zu-Server-Aufrufe innerhalb derselben Origin.
            </div>
          </div>
        </div>

        {/* Roadmap-Hinweis */}
        <div className="card-md bg-gradient-to-br from-amber-50/80 to-white border-amber-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 flex-shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div className="text-sm text-text-secondary leading-relaxed">
              <strong className="text-text-primary">Roadmap Q4 2026 — API-Keys &amp; OAuth:</strong>{' '}
              Bearer-Token fuer headless Server-Integrationen ohne Session-Cookie,
              fein-granular pro Scope. Bis dahin koennt ihr fuer Server-zu-Server
              einen Service-Account-Login per Cookie-Header simulieren.
              Bei Fragen:{' '}
              <a href="mailto:hello@candiq.de" className="text-brand-700 font-semibold">
                hello@candiq.de
              </a>
              .
            </div>
          </div>
        </div>

        {/* Auth-Beispiel */}
        <section>
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-brand-600" /> Auth
          </h2>
          <div className="card-md font-mono text-xs leading-relaxed text-text-primary">
            <div className="text-text-muted mb-2"># 1. Session-Cookie aus Browser-DevTools kopieren</div>
            <div className="text-text-muted mb-2"># 2. Cookie-Header bei curl uebergeben</div>
            <pre className="overflow-x-auto bg-bg-secondary rounded-lg p-3 text-[11px]">
{`curl https://candiq.de/api/candidates \\
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"`}
            </pre>
          </div>
        </section>

        {/* Endpoint-Liste */}
        <section>
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-brand-600" /> Endpoints
          </h2>
          <div className="card-md overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary border-b border-border">
                <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  <th className="px-4 py-2.5">Methode</th>
                  <th className="px-4 py-2.5">Pfad</th>
                  <th className="px-4 py-2.5">Beschreibung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ENDPOINTS.map((e) => (
                  <tr key={`${e.method}-${e.path}`} className="hover:bg-bg-secondary/40">
                    <td className="px-4 py-2 align-top">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          e.method === 'GET'
                            ? 'bg-emerald-50 text-emerald-700'
                            : e.method === 'POST'
                            ? 'bg-brand-50 text-brand-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {e.method}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono text-[11px] text-text-primary align-top whitespace-nowrap">
                      {e.path}
                    </td>
                    <td className="px-4 py-2 text-xs text-text-secondary align-top">
                      {e.desc}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Beispiele */}
        <section>
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-brand-600" /> Beispiel: Kandidat anlegen + Einwilligung anfordern
          </h2>
          <div className="card-md font-mono text-xs leading-relaxed text-text-primary">
            <pre className="overflow-x-auto bg-bg-secondary rounded-lg p-3 text-[11px]">
{`# 1) Kandidat anlegen
curl -X POST https://candiq.de/api/candidates \\
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "firstName": "Anna",
    "lastName": "Mustermann",
    "email": "anna@example.com",
    "position": "Senior Sales Lead",
    "department": "Sales"
  }'

# Response: { id: "cm123...", ... }

# 2) Magic-Link-Einwilligungs-Mail senden
curl -X POST https://candiq.de/api/candidates/cm123.../invite \\
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"

# Response: { ok: true, expiresAt: "2026-07-02T..." }`}
            </pre>
          </div>
        </section>

        {/* Beispiel: Pruefung an Reviewer uebergeben */}
        <section>
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-brand-600" /> Beispiel: Pruefung an Reviewer uebergeben
          </h2>
          <div className="card-md font-mono text-xs leading-relaxed text-text-primary">
            <pre className="overflow-x-auto bg-bg-secondary rounded-lg p-3 text-[11px]">
{`curl -X PATCH https://candiq.de/api/checks/CHECK_ID \\
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{ "status": "IN_REVIEW" }'

# Triggert: Mail an Reviewer-Team, optional Round-Robin-Assignment.`}
            </pre>
          </div>
        </section>

        {/* Beispiel: CV-Download mit Consent-Gate */}
        <section>
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-brand-600" /> Beispiel: CV-Download (Consent-Gate-enforced)
          </h2>
          <div className="card-md font-mono text-xs leading-relaxed text-text-primary">
            <pre className="overflow-x-auto bg-bg-secondary rounded-lg p-3 text-[11px]">
{`# Liefert die Datei direkt (Stream). HR-Owner sehen eigene Uploads
# jederzeit, Reviewer brauchen cvStatus=RELEASED (= Einwilligung erteilt).
curl https://candiq.de/api/documents/DOC_ID \\
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \\
  --output cv.pdf

# 403, wenn der Bewerber noch nicht eingewilligt hat.`}
            </pre>
          </div>
        </section>

        {/* Limits + Sicherheit */}
        <section>
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Limits &amp; Sicherheit
          </h2>
          <div className="card-md text-xs text-text-secondary leading-relaxed space-y-2">
            <p>
              <strong className="text-text-primary">Rate-Limits:</strong> Pro Endpoint
              unterschiedlich, typisch 20–60 Requests/Stunde/User. 429 mit{' '}
              <code className="text-[10px] bg-bg-secondary px-1 py-0.5 rounded">Retry-After</code>{' '}
              im Header.
            </p>
            <p>
              <strong className="text-text-primary">CSRF:</strong> Mutationen
              (POST/PATCH/DELETE) brauchen denselben Origin. Server-zu-Server-Calls
              via Cookie sind ueber TLS+SameSite gesichert.
            </p>
            <p>
              <strong className="text-text-primary">Audit:</strong> Jeder API-Call
              landet im{' '}
              <Link href="/audit" className="text-brand-700 font-semibold underline">
                Audit-Trail
              </Link>
              {' '}— inkl. CV-Zugriffen (CV_ACCESS_GRANTED/DENIED).
            </p>
            <p>
              <strong className="text-text-primary">Versionierung:</strong> Aktuell
              v1 (implizit). Breaking-Changes werden ueber{' '}
              <a href="mailto:hello@candiq.de" className="text-brand-700 font-semibold">
                hello@candiq.de
              </a>{' '}
              mit 30 Tagen Vorlauf angekuendigt.
            </p>
          </div>
        </section>

        {/* OpenAPI-Hinweis */}
        <div className="card-md flex items-center justify-between gap-4 bg-gradient-to-br from-brand-50/60 to-white border-brand-100">
          <div>
            <div className="text-sm font-semibold text-text-primary">OpenAPI-Spec gewuenscht?</div>
            <div className="text-xs text-text-secondary">
              Wir generieren ein OpenAPI 3.1-Dokument fuer dich (inkl. Postman-Import).
            </div>
          </div>
          <a
            href="mailto:hello@candiq.de?subject=OpenAPI-Spec%20anfragen"
            className="btn-secondary text-xs whitespace-nowrap"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Anfragen
          </a>
        </div>
      </div>
    </>
  )
}
