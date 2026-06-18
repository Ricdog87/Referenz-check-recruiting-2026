import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { ensureSchema, withDbRecovery } from '@/lib/db-init'
import { logger } from '@/lib/logger'
import '@/lib/env'

const isProd = process.env.NODE_ENV === 'production'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24h — keeps mobile users signed in for a workday
    updateAge: 60 * 60, // 1h — stale-while-valid Refresh
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  // Sichere Cookie-Konfig für Production (HTTPS) — bleibt unter Localhost frei.
  cookies: isProd
    ? {
        sessionToken: {
          name: '__Secure-next-auth.session-token',
          options: {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            secure: true,
          },
        },
      }
    : undefined,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'E-Mail', type: 'email' },
        password: { label: 'Passwort', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const email = String(credentials.email).trim().toLowerCase()
        if (!email || email.length > 254) return null

        try {
          await ensureSchema()
        } catch (err) {
          logger.warn('auth_schema_warn', err)
        }

        const user = await withDbRecovery(() =>
          prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } },
          }),
        ).catch((err) => {
          logger.error('auth_lookup_error', err)
          return null
        })

        if (!user) return null

        const valid = await bcrypt.compare(String(credentials.password), user.password).catch(() => false)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          company: user.company,
          role: user.role,
          accountType: user.accountType,
          plan: user.plan,
          trialEndsAt: user.trialEndsAt?.toISOString() ?? null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.company = (user as any).company
        token.role = (user as any).role
        token.accountType = (user as any).accountType
        token.plan = (user as any).plan
        token.trialEndsAt = (user as any).trialEndsAt ?? null
      }
      // Bei expliziten Updates Token aus DB nachladen — z. B. nach Plan-Upgrade.
      if (trigger === 'update' && token.id) {
        try {
          const fresh = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { plan: true, accountType: true, trialEndsAt: true, company: true, role: true, name: true },
          })
          if (fresh) {
            token.plan = fresh.plan
            token.accountType = fresh.accountType
            token.role = fresh.role
            token.company = fresh.company
            token.trialEndsAt = fresh.trialEndsAt?.toISOString() ?? null
            token.name = fresh.name
          }
        } catch (err) {
          logger.warn('jwt_refresh_warn', err)
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.company = (token.company as string) ?? ''
        session.user.role = (token.role as string) ?? 'CLIENT'
        session.user.accountType = (token.accountType as string) ?? 'HR_DEPARTMENT'
        session.user.plan = (token.plan as string) ?? 'STARTER'
        session.user.trialEndsAt = (token.trialEndsAt as string | null) ?? null
        // name/email werden normalerweise von NextAuth aus dem Token
        // propagiert. Wir setzen sie hier ABER explizit mit Fallback —
        // sonst kann `session.user.name` undefined sein (Token aus Seed-/
        // Demo-/Legacy-Flow ohne name) und Server-Components, die
        // `session.user.name.split(...)` o.ä. aufrufen, crashen die
        // komplette Seite über die error.tsx-Boundary.
        session.user.name = (token.name as string) ?? session.user.name ?? ''
        session.user.email = (token.email as string) ?? session.user.email ?? ''
      }
      return session
    },
  },
  events: {
    async signIn({ user }) {
      // Fire-and-forget Audit-Log — auth darf nie an Logging scheitern.
      try {
        if (!user?.id) return
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'LOGIN',
            entity: 'User',
            entityId: user.id,
            details: 'Erfolgreiche Anmeldung',
          },
        })
      } catch (err) {
        logger.warn('signin_audit_warn', err)
      }
    },
  },
  // Eigene NEXTAUTH_SECRET aus env. NextAuth erkennt das automatisch,
  // expliziter Pfad macht die Konfig lesbarer.
  secret: process.env.NEXTAUTH_SECRET,
  debug: false,
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      company: string
      role: string
      accountType: string
      plan: string
      trialEndsAt: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    company: string
    role: string
    accountType: string
    plan: string
    trialEndsAt: string | null
  }
}
