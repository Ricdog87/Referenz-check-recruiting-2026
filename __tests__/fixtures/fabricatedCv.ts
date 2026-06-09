import type { CandidateInput } from '@/lib/cv-analysis'

export const fabricatedCv: CandidateInput = {
  consentGiven: true,
  rawCvText: 'Max Muster behauptet mehrere parallele Senior-Rollen und schnelle Beförderungen.',
  stations: [
    { company: 'Alpha GmbH', title: 'Intern', startDate: '2025-01', endDate: '2025-03', location: 'Berlin' },
    { company: 'Beta AG', title: 'Head of Sales', startDate: '2025-06', endDate: '2026-12', location: 'Remote' },
    { company: 'Gamma GmbH', title: 'Director Operations', startDate: '2025-08', endDate: '2025-12', location: 'München' },
  ],
  education: [{ institution: 'Universität Beispiel', degree: 'B.Sc.', startDate: '2018', endDate: '2021' }],
  certifications: [{ name: 'Example Security Lead', issuer: 'Example Org', year: 2026 }],
  referees: [
    { name: 'Jane Ref', company: 'Beta AG', role: 'Friend', email: 'janeref@gmail.com' },
  ],
}
