import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })

        if (!user) return null

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          company: user.company,
          role: user.role,
          accountType: user.accountType,
          plan: user.plan,
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
        token.accountType = (user as any).accountType
        token.plan = (user as any).plan
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.company = token.company as string
        session.user.role = token.role as string
        session.user.accountType = token.accountType as string
        session.user.plan = token.plan as string
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
      accountType: string
      plan: string
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
  }
}
