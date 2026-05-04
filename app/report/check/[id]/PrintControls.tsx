'use client'

import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'

export function ReportPrintControls({ backHref }: { backHref: string }) {
  return (
    <div className="no-print" style={{
      maxWidth: 820,
      margin: '0 auto 16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    }}>
      <Link
        href={backHref}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          color: '#475569',
          textDecoration: 'none',
        }}
      >
        <ArrowLeft style={{ width: 14, height: 14 }} />
        Zurück
      </Link>
      <button
        type="button"
        onClick={() => window.print()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 18px',
          background: 'linear-gradient(135deg,#4f46e5,#8b5cf6)',
          color: '#fff',
          border: 'none',
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(79,70,229,.3)',
        }}
      >
        <Printer style={{ width: 14, height: 14 }} />
        Als PDF speichern / drucken
      </button>
    </div>
  )
}
