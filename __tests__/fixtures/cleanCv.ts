import type { CandidateInput } from '@/lib/cv-analysis'

export const cleanCv: CandidateInput = {
  consentGiven: true,
  stations: [
    { company: 'Candiq GmbH', title: 'Recruiting Specialist', startDate: '2020-01', endDate: '2022-12', location: 'Berlin' },
    { company: 'Trust People GmbH', title: 'People Operations Manager', startDate: '2023-01', endDate: 'present', location: 'Hamburg' },
  ],
  education: [{ institution: 'Hochschule Beispielstadt', degree: 'M.A. Human Resources', startDate: '2017', endDate: '2019' }],
  certifications: [{ name: 'Certified HR Manager', issuer: 'HR Verband', year: 2021 }],
  referees: [
    { name: 'Mara Manager', company: 'Trust People GmbH', role: 'Head of People', email: 'mara.manager@trustpeople.com' },
  ],
}
