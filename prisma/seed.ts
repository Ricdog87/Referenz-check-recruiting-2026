import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('demo1234', 12)

  const user = await prisma.user.upsert({
    where: { email: 'demo@refcheck.de' },
    update: {},
    create: {
      name: 'Demo Recruiter',
      company: 'Mustermann Recruiting GmbH',
      email: 'demo@refcheck.de',
      password,
    },
  })

  console.log(`✓ Demo-Benutzer: ${user.email} / demo1234`)

  // Candidate 1 — abgeschlossen, verifiziert
  const c1 = await prisma.candidate.upsert({
    where: { id: 'seed-c1' },
    update: {},
    create: {
      id: 'seed-c1',
      firstName: 'Julia',
      lastName: 'Hoffmann',
      email: 'julia.hoffmann@example.de',
      phone: '+49 89 12345678',
      position: 'Head of Marketing',
      department: 'Marketing',
      status: 'COMPLETED',
      gdprConsent: true,
      gdprConsentDate: new Date('2026-03-15'),
      userId: user.id,
    },
  })

  await prisma.referenceCheck.upsert({
    where: { id: 'seed-chk1' },
    update: {},
    create: {
      id: 'seed-chk1',
      candidateId: c1.id,
      employerName: 'Digital Agency Berlin GmbH',
      employerContact: 'Hr. Wagner, Geschäftsführer',
      employerPhone: '+49 30 9876543',
      position: 'Senior Marketing Manager',
      startDate: '05/2019',
      endDate: '02/2026',
      status: 'COMPLETED',
      result: 'VERIFIED',
      callNotes:
        'Hr. Wagner bestätigte die Angaben vollständig. Frau Hoffmann war 6,5 Jahre im Unternehmen, zuletzt als Senior Marketing Manager. Führungsstärke und Projektverantwortung ausdrücklich gelobt. Sofortige Wiedereinstellung würde angeboten.',
      rating: 5,
      calledAt: new Date('2026-03-18'),
    },
  })

  // Candidate 2 — in Prüfung, Unstimmigkeit
  const c2 = await prisma.candidate.upsert({
    where: { id: 'seed-c2' },
    update: {},
    create: {
      id: 'seed-c2',
      firstName: 'Thomas',
      lastName: 'Becker',
      email: 'thomas.becker@example.de',
      position: 'Senior Software Engineer',
      department: 'Engineering',
      status: 'IN_REVIEW',
      gdprConsent: true,
      gdprConsentDate: new Date('2026-04-10'),
      userId: user.id,
    },
  })

  await prisma.referenceCheck.upsert({
    where: { id: 'seed-chk2' },
    update: {},
    create: {
      id: 'seed-chk2',
      candidateId: c2.id,
      employerName: 'TechCorp Solutions AG',
      employerContact: 'Frau Maier, HR',
      employerPhone: '+49 40 5556789',
      employerEmail: 'hr@techcorp-solutions.de',
      position: 'Software Engineer',
      startDate: '01/2021',
      endDate: '12/2024',
      status: 'COMPLETED',
      result: 'DISCREPANCY_FOUND',
      callNotes:
        'Frau Maier bestätigte die Beschäftigung von 01/2021 bis 10/2023 — Kandidat gibt 12/2024 als Ende an. Lücke von ca. 14 Monaten nicht erklärt. Position war "Junior Developer", nicht wie angegeben "Senior Engineer".',
      discrepancies:
        'Beschäftigungsende: laut Kandidat 12/2024, laut Arbeitgeber 10/2023 (Differenz: 14 Monate).\nPositionsbezeichnung: Kandidat gibt "Senior Software Engineer" an, tatsächliche Position war "Junior Developer".',
      rating: 2,
      calledAt: new Date('2026-04-22'),
    },
  })

  await prisma.referenceCheck.upsert({
    where: { id: 'seed-chk3' },
    update: {},
    create: {
      id: 'seed-chk3',
      candidateId: c2.id,
      employerName: 'StartupHub Hannover GmbH',
      employerContact: 'Hr. Klein',
      employerPhone: '+49 511 1234567',
      position: 'Backend Developer',
      startDate: '02/2018',
      endDate: '12/2020',
      status: 'IN_PROGRESS',
    },
  })

  // Candidate 3 — ausstehend
  await prisma.candidate.upsert({
    where: { id: 'seed-c3' },
    update: {},
    create: {
      id: 'seed-c3',
      firstName: 'Sarah',
      lastName: 'Müller',
      email: 'sarah.mueller@example.de',
      phone: '+49 69 9876543',
      position: 'CFO',
      department: 'Finance',
      status: 'PENDING',
      gdprConsent: true,
      gdprConsentDate: new Date('2026-04-25'),
      notes: 'Empfehlung von Partnerkanzlei. Bewerbungsunterlagen vollständig. Erste Gespräche sehr positiv.',
      userId: user.id,
    },
  })

  console.log('✓ Demo-Kandidaten und Referenzprüfungen erstellt.')
  console.log('')
  console.log('Demo-Login:')
  console.log('  URL:      http://localhost:3000/login?demo=1')
  console.log('  E-Mail:   demo@refcheck.de')
  console.log('  Passwort: demo1234')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
