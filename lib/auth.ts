import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

const DEMO_LOGIN = {
  email: 'demo@refcheck.de',
  password: 'demo1234',
  name: 'Demo Benutzer',
  company: 'Demo GmbH',
  role: 'CLIENT',
} as const

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'E-Mail', type: 'email' },
        password: { label: 'Passwort', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const normalizedEmail = credentials.email.toLowerCase()
        let user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        })

        if (normalizedEmail === DEMO_LOGIN.email && credentials.password === DEMO_LOGIN.password) {
          const hashedPassword = await bcrypt.hash(DEMO_LOGIN.password, 12)

          try {
            await prisma.user.upsert({
              where: { email: DEMO_LOGIN.email },
              update: {
                password: hashedPassword,
                name: DEMO_LOGIN.name,
                company: DEMO_LOGIN.company,
                role: DEMO_LOGIN.role,
              },
              create: {
                email: DEMO_LOGIN.email,
                name: DEMO_LOGIN.name,
                company: DEMO_LOGIN.company,
                role: DEMO_LOGIN.role,
                password: hashedPassword,
              },
            })
          } catch (error) {
            console.error('Demo account upsert failed:', error)
          }

          user = await prisma.user.findUnique({
            where: { email: DEMO_LOGIN.email },
          })
        }

        if (!user) return null

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          company: user.company,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.company = (user as any).company
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.company = token.company as string
        session.user.role = token.role as string
      }
      return session
    },
  },
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      company: string
      role: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    company: string
    role: string
  }
}
