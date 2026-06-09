import { z } from 'zod'

export const stationSchema = z.object({
  company: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(200),
  startDate: z.string().trim().min(4).max(32),
  endDate: z.string().trim().min(4).max(32),
  location: z.string().trim().max(200).optional(),
})

export const educationSchema = z.object({
  institution: z.string().trim().min(1).max(200),
  degree: z.string().trim().min(1).max(200),
  startDate: z.string().trim().min(4).max(32).optional(),
  endDate: z.string().trim().min(4).max(32).optional(),
})

export const certificationSchema = z.object({
  name: z.string().trim().min(1).max(200),
  issuer: z.string().trim().max(200).optional(),
  year: z.coerce.number().int().min(1950).max(2100).optional(),
})

export const refereeSchema = z.object({
  name: z.string().trim().min(1).max(200),
  company: z.string().trim().min(1).max(200),
  role: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(254).optional().or(z.literal('')),
  phone: z.string().trim().max(80).optional(),
})

export const candidateInputSchema = z.object({
  rawCvText: z.string().max(60000).optional(),
  stations: z.array(stationSchema).max(80),
  education: z.array(educationSchema).max(50),
  certifications: z.array(certificationSchema).max(80).optional().default([]),
  referees: z.array(refereeSchema).max(50),
  consentGiven: z.boolean(),
})

export const flagSeveritySchema = z.enum(['low', 'medium', 'high'])
export const flagSourceSchema = z.enum(['deterministic', 'external', 'llm'])

export const claimFlagSchema = z.object({
  claim: z.string().trim().min(1).max(1000),
  type: z.string().trim().min(1).max(80),
  severity: flagSeveritySchema,
  reason: z.string().trim().min(1).max(1000),
  source: flagSourceSchema,
})

export const llmClaimSchema = z.object({
  claim: z.string().trim().min(1).max(1000),
  type: z.string().trim().min(1).max(80),
  severity: flagSeveritySchema,
  reason: z.string().trim().min(1).max(1000),
  verificationPriority: z.enum(['low', 'medium', 'high']),
})

export const llmClaimAnalysisSchema = z.object({
  claims: z.array(llmClaimSchema).max(40),
  checklist: z.array(z.string().trim().min(1).max(300)).max(25),
  explanations: z.array(z.string().trim().min(1).max(500)).max(20),
})

export const parsedCvSchema = z.object({
  stations: z.array(stationSchema).default([]),
  education: z.array(educationSchema).default([]),
  certifications: z.array(certificationSchema).default([]),
  referees: z.array(refereeSchema).default([]),
})

export const subScoresSchema = z.object({
  timeline: z.number().min(0).max(100),
  employer: z.number().min(0).max(100),
  referee: z.number().min(0).max(100),
  claims: z.number().min(0).max(100),
})

export const riskReportSchema = z.object({
  riskScore: z.number().min(0).max(100),
  rag: z.enum(['green', 'amber', 'red']),
  subScores: subScoresSchema,
  flags: z.array(claimFlagSchema),
  verificationChecklist: z.array(z.string().trim().min(1).max(300)),
  explanations: z.array(z.string().trim().min(1).max(500)),
})

export type CandidateInput = z.infer<typeof candidateInputSchema>
export type Station = z.infer<typeof stationSchema>
export type Education = z.infer<typeof educationSchema>
export type Certification = z.infer<typeof certificationSchema>
export type Referee = z.infer<typeof refereeSchema>
export type ClaimFlag = z.infer<typeof claimFlagSchema>
export type RiskReport = z.infer<typeof riskReportSchema>
export type ParsedCv = z.infer<typeof parsedCvSchema>
export type LlmClaimAnalysis = z.infer<typeof llmClaimAnalysisSchema>
export type FlagSeverity = z.infer<typeof flagSeveritySchema>
