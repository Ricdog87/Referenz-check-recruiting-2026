/**
 * Partner-NextAuth-Konfiguration.
 *
 * STRIKT GETRENNT vom HR-User-Auth-Flow in lib/auth.ts:
 *   - Eigener CredentialsProvider gegen PartnerAccount (nicht User).
 *   - Eigener Cookie-Name (verhindert Kollision mit User-Session).
 *   - JWT/Session enthalten AUSSCHLIESSLICH partnerAccountId + status + tier
 *     — keine cross-domain Felder (kein userId, keine company, keine plan-Info).
 *   - Sign-In-Page zeigt /partner/login (eigener Flow, eigenes Branding).
 *
 * Diese Datei darf NICHT lib/auth.ts importieren und umgekehrt.
 */

import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import '@/lib/env'

const isProd = process.env.NODE_ENV === 'production'

// Eigener Cookie-Name verhindert, dass ein Partner-Login die HR-User-Session
// überschreibt (oder umgekehrt). Beide Sessions können parallel im Browser
// existieren, jeder Cookie hat seinen eigenen Scope.
const PARTNER_SESSION_COOKIE_NAME = isProd
  ? '__Secure-next-auth.partner-session-token'
  : 'next-auth.partner-session-token'

export const partnerAuthOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
    updateAge: 60 * 60,
  },
  pages: {
    signIn: '/partner/login',
    error: '/partner/login',
  },
  cookies: {
    sessionToken: {
      name: PARTNER_SESSION_COOKIE_NAME,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProd,
      },
    },
  },
  providers: [
    CredentialsProvider({
      id: 'partner-credentials',
      name: 'Partner-Credentials',
      credentials: {
        email: { label: 'E-Mail', type: 'email' },
        password: { label: 'Passwort', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const email = String(credentials.email).trim().toLowerCase()
        if (!email || email.length > 254) return null

        const partner = await prisma.partnerAccount
          .findFirst({
            where: { email: { equals: email, mode: 'insensitive' }, deletedAt: null },
          })
          .catch((err) => {
            logger.error('partner_auth_lookup_error', err)
            return null
          })

        if (!partner) return null

        const valid = await bcrypt
          .compare(String(credentials.password), partner.passwordHash)
          .catch(() => false)
        if (!valid) return null

        // SUSPENDED- oder REJECTED-Accounts dürfen sich nicht einloggen.
        // PENDING ist erlaubt — Partner kann Status sehen, aber kein
        // Dashboard nutzen (zweiter Guard in requireApprovedPartner).
        if (partner.status === 'SUSPENDED' || partner.status === 'REJECTED') {
          return null
        }

        // Best-effort: lastLoginAt aktualisieren. Failures NICHT throwen,
        // sonst blockt ein DB-Hick-up die ganze Auth.
        prisma.partnerAccount
          .update({ where: { id: partner.id }, data: { lastLoginAt: new Date() } })
          .catch((err) => logger.warn('partner_lastlogin_warn', err))

        // NUR partner-domain Felder ins User-Objekt — die landen via jwt()
        // im Token und session(). KEINE user-domain Daten.
        return {
          id: partner.id,
          email: partner.email,
          name: `${partner.contactFirstName} ${partner.contactLastName}`.trim(),
          status: partner.status,
          tier: partner.tier,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.partnerAccountId = (user as any).id
        token.status = (user as any).status
        token.tier = (user as any).tier
        token.statusCheckedAt = Date.now()
      }
      // Status/Tier regelmäßig aus der DB nachladen — NICHT nur bei
      // trigger==='update'. Sonst behält ein suspendierter Partner bis zu
      // 24h (JWT-maxAge) vollen Zugriff, und ein frisch approvter Partner
      // hängt auf /partner/pending fest, bis er sich neu einloggt.
      // 60s-Intervall: bei Partner-Traffic-Volumen vernachlässigbare DB-Last,
      // Sperrungen greifen praktisch sofort.
      const STATUS_REFRESH_MS = 60 * 1000
      const lastChecked = (token.statusCheckedAt as number | undefined) ?? 0
      const needsRefresh =
        trigger === 'update' ||
        (token.partnerAccountId && Date.now() - lastChecked > STATUS_REFRESH_MS)

      if (needsRefresh && token.partnerAccountId) {
        try {
          const fresh = await prisma.partnerAccount.findUnique({
            where: { id: token.partnerAccountId as string },
            select: { status: true, tier: true, deletedAt: true },
          })
          if (!fresh || fresh.deletedAt) {
            // Account weg → Token entwerten (NextAuth erwartet leeres Objekt).
            return {} as any
          }
          token.status = fresh.status
          token.tier = fresh.tier
          token.statusCheckedAt = Date.now()
        } catch (err) {
          // DB kurz nicht erreichbar → alten Status weiterverwenden,
          // beim nächsten Request erneut versuchen (Timestamp NICHT setzen).
          logger.warn('partner_jwt_refresh_warn', err)
        }
      }
      return token
    },
    async session({ session, token }) {
      // Wichtig: session.user wird KOMPLETT ersetzt, NICHT gemerged mit
      // dem NextAuth-Default. So kann garantiert kein User-Feld
      // (z. B. role, plan) versehentlich in die Partner-Session leaken.
      session.partner = {
        id: (token.partnerAccountId as string) ?? '',
        email: (token.email as string) ?? '',
        name: (token.name as string) ?? '',
        status: (token.status as string) ?? 'PENDING',
        tier: (token.tier as string) ?? 'REGISTERED',
      }
      // session.user explizit leeren — wir verwenden session.partner.
      session.user = undefined as any
      return session
    },
  },
  events: {
    async signIn({ user }) {
      try {
        if (!user?.id) return
        await prisma.partnerAuditLog.create({
          data: {
            partnerAccountId: user.id,
            action: 'PARTNER_LOGIN',
            entity: 'PartnerAccount',
            entityId: user.id,
            details: 'Erfolgreiche Partner-Anmeldung',
          },
        })
      } catch (err) {
        logger.warn('partner_signin_audit_warn', err)
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: false,
}

// ── Type-Augmentation: nur in Modulen wirksam, die `Session` aus next-auth importieren.
// Wir hängen ein OPTIONALES `partner`-Feld an Session, damit sich die User-Session-
// Augmentation in lib/auth.ts NICHT widerspricht.
declare module 'next-auth' {
  interface Session {
    partner?: {
      id: string
      email: string
      name: string
      status: string
      tier: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    partnerAccountId?: string
    status?: string
    tier?: string
    statusCheckedAt?: number
  }
}
