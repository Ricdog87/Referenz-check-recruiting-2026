import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const DEMO_USERS = [
  {
    email: 'demo@candiq.de',
    name: 'Lara Weber',
    company: 'Demo Holding GmbH',
    plan: 'PROFESSIONAL',
    trialDays: 12,
  },
  {
    email: 'enterprise@candiq.de',
    name: 'Dr. Martin Krüger',
    company: 'NovaCorp Holding AG',
    plan: 'BUSINESS',
    trialDays: 6,
  },
  {
    email: 'boutique@candiq.de',
    name: 'Tina Lange',
    company: 'Boutique Talent GmbH',
    plan: 'STARTER',
    trialDays: 14,
  },
] as const

async function main() {
  const password = await bcrypt.hash('demo1234', 12)

  for (const u of DEMO_USERS) {
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + u.trialDays)

    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        password,
        name: u.name,
        company: u.company,
        plan: u.plan,
        trialEndsAt,
      },
      create: {
        email: u.email,
        password,
        name: u.name,
        company: u.company,
        accountType: 'HR_DEPARTMENT',
        plan: u.plan,
        trialEndsAt,
      },
    })
    console.log(`✓ Demo-User: ${user.email}  (Plan: ${u.plan})`)
  }

  // Minimaler Beispiel-Kandidat für demo@candiq.de — der vollständige
  // Demo-Datensatz wird über `/api/demo` lazy gefüllt.
  const demoUser = await prisma.user.findUnique({ where: { email: 'demo@candiq.de' } })
  if (demoUser) {
    const existing = await prisma.candidate.findFirst({
      where: { userId: demoUser.id },
      select: { id: true },
    })
    if (!existing) {
      const candidate = await prisma.candidate.create({
        data: {
          userId: demoUser.id,
          firstName: 'Max',
          lastName: 'Mustermann',
          email: 'max.mustermann@example.de',
          position: 'Senior Software Developer',
          department: 'Engineering',
          status: 'IN_REVIEW',
          gdprConsent: true,
          gdprConsentDate: new Date(),
        },
      })
      await prisma.referenceCheck.create({
        data: {
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
    }
  }

  console.log('\nLogin: demo@candiq.de · enterprise@candiq.de · boutique@candiq.de')
  console.log('Passwort: demo1234')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
