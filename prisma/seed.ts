import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('demo1234', 12)

  const user = await prisma.user.upsert({
    where: { email: 'demo.hr@candiq.de' },
    update: {},
    create: {
      name: 'Demo Benutzer',
      company: 'Demo GmbH',
      email: 'demo.hr@candiq.de',
      password,
    },
  })

  console.log(`Demo-Benutzer erstellt: ${user.email}`)
  console.log('Passwort: demo1234')

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

  await prisma.addonOrder.upsert({
    where: { id: 'seed-addon-1' },
    update: {},
    create: {
      id: 'seed-addon-1',
      userId: user.id,
      addonKey: 'EXPRESS_VERIFY',
      addonName: 'Express Verify',
      status: 'TRIAL',
      seats: 3,
      price: 0,
    },
  })

  console.log('Demo-Daten erfolgreich erstellt.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
