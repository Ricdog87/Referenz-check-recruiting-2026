import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

const DEMO_SESSION_USER = {
  email: 'demo@refcheck.de',
  password: 'demo1234',
  name: 'Demo Benutzer',
  company: 'RefCheck Demo Account',
  role: 'CLIENT',
} as const

export async function getAppSession() {
  const session = await getServerSession(authOptions)
  if (session) return session

  let user = await prisma.user.findFirst({
    where: { email: DEMO_SESSION_USER.email },
  })

  if (!user) {
    const hashedPassword = await bcrypt.hash(DEMO_SESSION_USER.password, 12)
    user = await prisma.user.create({
      data: {
        email: DEMO_SESSION_USER.email,
        password: hashedPassword,
        name: DEMO_SESSION_USER.name,
        company: DEMO_SESSION_USER.company,
        role: DEMO_SESSION_USER.role,
      },
    })
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      company: user.company,
      role: user.role,
    },
  }
}
