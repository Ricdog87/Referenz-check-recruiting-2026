'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { signOut } from 'next-auth/react'

interface User {
  id: string
  name: string
  email: string
  company: string
  createdAt: Date
}

interface Stats {
  candidates: number
  checks: number
  documents: number
}

export function SettingsClient({ user, stats }: { user: User; stats: Stats }) {
  const router = useRouter()
  const [name, setName] = useState(user.name)
  const [company, setCompany] = useState(user.company)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function saveProfile() {
    setSaving(true)
    setMsg('')
    setError('')

    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), company: company.trim() }),
    })

    setSaving(false)
    if (res.ok) {
      setMsg('Profil gespeichert.')
      router.refresh()
    } else {
      setError('Fehler beim Speichern.')
    }
  }

  async function changePassword() {
    if (password !== passwordConfirm) { setError('Passwörter stimmen nicht überein.'); return }
    if (password.length < 8) { setError('Min. 8 Zeichen.'); return }

    setSaving(true)
    setMsg('')
    setError('')

    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    setSaving(false)
    if (res.ok) {
      setMsg('Passwort geändert.')
      setPassword('')
      setPasswordConfirm('')
    } else {
      setError('Fehler beim Ändern des Passworts.')
    }
  }

  async function exportData() {
    const res = await fetch('/api/gdpr/export')
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `refcheck-export-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function deleteAccount() {
    if (
      !confirm(
        'ACHTUNG: Ihr Konto und ALLE Daten (Kandidaten, Prüfungen, Dokumente) werden unwiderruflich gelöscht.\n\nMöchten Sie wirklich fortfahren?'
      )
    )
      return

    setDeleting(true)
    const res = await fetch('/api/gdpr/delete', { method: 'DELETE' })
    if (res.ok) {
      await signOut({ callbackUrl: '/' })
    } else {
      setError('Fehler beim Löschen des Kontos.')
      setDeleting(false)
    }
  }

  return (
    <>
      {/* Account info */}
      <div className="card space-y-4">
        <h2 className="section-title">Profil</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Name</label>
            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Unternehmen</label>
            <input className="input-field" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">E-Mail</label>
          <input className="input-field" value={user.email} disabled />
          <p className="text-xs text-text-muted mt-1">E-Mail kann nicht geändert werden.</p>
        </div>
        {msg && <div className="text-sm text-status-success bg-status-successBg border border-status-success/20 rounded-lg px-3 py-2">{msg}</div>}
        {error && <div className="text-sm text-status-error bg-status-errorBg border border-status-error/20 rounded-lg px-3 py-2">{error}</div>}
        <button onClick={saveProfile} disabled={saving} className="btn-primary">
          Profil speichern
        </button>
      </div>

      {/* Password */}
      <div className="card space-y-4">
        <h2 className="section-title">Passwort ändern</h2>
        <div>
          <label className="label">Neues Passwort</label>
          <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 Zeichen" />
        </div>
        <div>
          <label className="label">Passwort bestätigen</label>
          <input type="password" className="input-field" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} />
        </div>
        <button onClick={changePassword} disabled={saving || !password} className="btn-secondary">
          Passwort ändern
        </button>
      </div>

      {/* Data overview */}
      <div className="card">
        <h2 className="section-title mb-4">Ihre gespeicherten Daten</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { label: 'Kandidaten', value: stats.candidates },
            { label: 'Prüfungen', value: stats.checks },
            { label: 'Dokumente', value: stats.documents },
          ].map((s) => (
            <div key={s.label} className="bg-bg-secondary rounded-lg p-4 text-center">
              <div className="text-2xl font-bold font-mono text-accent">{s.value}</div>
              <div className="text-xs text-text-secondary mt-1">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="text-xs text-text-muted">
          Konto erstellt: {formatDate(user.createdAt)} · Alle Daten auf deutschen Servern
        </div>
      </div>

      {/* GDPR section */}
      <div className="card border-accent/20 bg-accent-glow">
        <h2 className="section-title mb-1">🛡 DSGVO-Rechte</h2>
        <p className="text-xs text-text-secondary mb-5 leading-relaxed">
          Gemäß DSGVO Art. 17 und Art. 20 haben Sie das Recht auf Löschung und Datenportabilität.
        </p>
        <div className="space-y-3">
          <button onClick={exportData} className="btn-secondary w-full justify-start gap-3">
            <span>📥</span>
            Alle Daten exportieren (Art. 20 DSGVO)
          </button>
          <button
            onClick={deleteAccount}
            disabled={deleting}
            className="btn-danger w-full justify-start gap-3"
          >
            <span>{deleting ? '⏳' : '🗑'}</span>
            {deleting ? 'Konto wird gelöscht…' : 'Konto & alle Daten löschen (Art. 17 DSGVO)'}
          </button>
        </div>
        <p className="text-xs text-text-muted mt-4">
          Die Datenlöschung ist unwiderruflich. Exportieren Sie Ihre Daten vorher.
        </p>
      </div>
    </>
  )
}
