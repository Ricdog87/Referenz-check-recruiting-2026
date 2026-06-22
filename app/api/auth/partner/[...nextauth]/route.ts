/**
 * NextAuth-Handler für das Partner-Programm.
 *
 * Mountpoint: /api/auth/partner/[...nextauth]
 *   - /api/auth/partner/signin           — Sign-In-Seite (delegiert auf pages.signIn)
 *   - /api/auth/partner/callback/partner-credentials  — Credentials-POST
 *   - /api/auth/partner/csrf             — CSRF-Token für die Login-Form
 *   - /api/auth/partner/session          — aktuelle Session-Info
 *   - /api/auth/partner/signout          — Logout
 *
 * Komplett unabhängig vom HR-User-NextAuth-Handler in
 * /api/auth/[...nextauth]. Eigener Cookie, eigenes Schema.
 *
 * Flag-Gate: wenn PARTNER_PROGRAM_ENABLED=false → 404.
 */

import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { partnerAuthOptions } from '@/lib/partner/auth'
import { isPartnerProgramEnabled } from '@/lib/flags'

const handler = NextAuth(partnerAuthOptions)

async function guard(req: Request, ctx: any) {
  if (!isPartnerProgramEnabled()) {
    return new NextResponse('Not Found', { status: 404 })
  }
  return handler(req, ctx)
}

export { guard as GET, guard as POST }
