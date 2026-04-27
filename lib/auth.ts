import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

const DEMO_EMAIL = 'demo@refcheck.de'
const DEMO_PASSWORD = 'demo1234'

async function ensureDemoWorkspace() {
  let user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } })
  if (!user) {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12)
    user = await prisma.user.create({
      data: {
        name: 'Demo Benutzer',
        company: 'Demo GmbH',
        email: DEMO_EMAIL,
        password: passwordHash,
      },
    })
  }

  const candidate = await prisma.candidate.upsert({
    where: { id: 'seed-candidate-1' },
    update: {},
    create: {
      id: 'seed-candidate-1',
      firstName: 'Max',
      lastName: 'Mustermann',
      email: 'max.mustermann@example.de',
      position: 'Senior Software Developer',
      department: 'Engineering',
      status: 'IN_REVIEW',
      gdprConsent: true,
      gdprConsentDate: new Date(),
      userId: user.id,
    },
  })

  await prisma.referenceCheck.upsert({
    where: { id: 'seed-check-1' },
    update: {},
    create: {
      id: 'seed-check-1',
      candidateId: candidate.id,
      employerName: 'Beispiel AG',
      employerContact: 'Frau Schmidt, HR',
      employerPhone: '+49 89 12345678',
      position: 'Software Developer',
      startDate: '03/2020',
      endDate: '12/2023',
      status: 'IN_PROGRESS',
    },
  })

  return user
}

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
        const normalizedEmail = credentials.email.toLowerCase().trim()

        if (normalizedEmail === DEMO_EMAIL && credentials.password === DEMO_PASSWORD) {
          const demoUser = await ensureDemoWorkspace()
          return {
            id: demoUser.id,
            email: demoUser.email,
            name: demoUser.name,
            company: demoUser.company,
            role: demoUser.role,
          }
        }

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
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
