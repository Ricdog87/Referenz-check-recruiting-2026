import { NextRequest, NextResponse } from 'next/server'
import { GET as documentsGet } from '@/app/api/documents/[id]/route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/download/:id
 *
 * Legacy-Alias auf /api/documents/:id. Ehemals 302-Redirect zur
 * Vercel-Blob-URL → URL leakte an Client. Jetzt: delegiert an die
 * neue Streaming-Route mit Consent-Gate (lib/cv-gate). Behaelt das
 * alte URL-Schema fuer bestehende UI-Links bei.
 *
 * Neue Codes sollen direkt /api/documents/:id verwenden.
 */
export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  return documentsGet(req, ctx)
}

// Optional: explizit „Download erzwingen"-Variante. Bestaendiger Link
// fuer „Download"-Buttons, der attachment-Header setzt.
export async function POST() {
  return NextResponse.json({ error: 'Methode nicht erlaubt.' }, { status: 405 })
}
