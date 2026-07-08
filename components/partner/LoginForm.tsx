'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react'

/**
 * Partner-Login.
 *
 * Spricht direkt den NextAuth-Endpoint /api/auth/partner/callback/partner-credentials
 * an. Default `signIn()` aus `next-auth/react` würde gegen /api/auth/* gehen — das
 * wäre die HR-User-Auth. Hier brauchen wir den separaten Partner-Handler.
 *
 * CSRF-Token wird beim Mount aus /api/auth/partner/csrf gezogen.
 */
export function PartnerLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/partner/dashboard'
  const errorParam = searchParams.get('error')

  const [csrfToken, setCsrfToken] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [message, setMessage] = useState(
    errorParam ? 'E-Mail oder Passwort falsch — oder der Account ist suspendiert.' : '',
  )

  useEffect(() => {
    fetch('/api/auth/partner/csrf')
      .then((r) => r.json())
      .then((d) => setCsrfToken(d.csrfToken ?? ''))
      .catch(() => setMessage('Auth-Endpoint nicht erreichbar. Bitte Seite neu laden.'))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'submitting' || !csrfToken) return
    setStatus('submitting')
    setMessage('')

    try {
      const body = new URLSearchParams({
        email,
        password,
        csrfToken,
        callbackUrl,
        json: 'true',
      })

      await fetch('/api/auth/partner/callback/partner-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
        redirect: 'manual',
      })

      // NextAuths Fehler-Redirect-URLs zeigen bei einer zweiten Instanz
      // (basePath-Annahme /api/auth) auf den HR-Handler — data.url blind zu
      // pushen würde den Partner bei falschem Passwort auf das HR-Login
      // (/login) schicken. Deshalb ignorieren wir die Redirect-URL komplett:
      // die EINZIGE Wahrheit ist, ob danach eine Partner-Session existiert.
      const sess = await fetch('/api/auth/partner/session').then((r) => r.json()).catch(() => null)
      if (sess?.partner?.id) {
        router.push(callbackUrl)
        return
      }

      setStatus('error')
      setMessage('E-Mail oder Passwort falsch — oder der Account ist suspendiert.')
    } catch {
      setStatus('error')
      setMessage('Netzwerk-Fehler. Bitte erneut versuchen.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto">
      <Field
        label="E-Mail"
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="email"
        required
      />
      <Field
        label="Passwort"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        required
      />

      {message && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting' || !csrfToken}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-text-primary text-white font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
      >
        {status === 'submitting' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Einloggen…
          </>
        ) : (
          <>
            Einloggen <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <div className="flex items-center justify-between text-xs">
        <Link href="/partner/forgot-password" className="text-text-secondary hover:text-indigo-600 underline">
          Passwort vergessen?
        </Link>
        <Link href="/partner/register" className="text-text-secondary hover:text-indigo-600 underline">
          Noch keinen Account?
        </Link>
      </div>
    </form>
  )
}

function Field(props: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  autoComplete?: string
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-text-secondary mb-1.5 block">{props.label}</span>
      <input
        type={props.type ?? 'text'}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        required={props.required}
        autoComplete={props.autoComplete}
        className="w-full px-3 py-2.5 rounded-lg border border-border-default bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 text-sm"
      />
    </label>
  )
}
