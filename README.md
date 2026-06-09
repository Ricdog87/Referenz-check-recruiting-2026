# candiq – CV Fabrication & Consistency Analyzer

This repository contains the Next.js application for candiq and now includes a backend module that helps human reviewers identify factual CV fabrication and consistency risks.

## What the analyzer does — and does not do

The analyzer is **decision support only**. It never auto-rejects a candidate and it never attempts to detect whether a CV was written with AI.

It focuses on:

- factual timeline contradictions,
- impossible or future-dated periods,
- unexplained gaps and implausible role progression,
- employer and referee verification risk,
- verifiable claims that should be prioritized in the reference call.

It explicitly does **not** score or flag:

- writing style,
- grammar,
- fluency,
- formatting quality,
- perceived AI authorship,
- protected or sensitive characteristics such as gender, age, origin, religion, disability, family status, photo, or name origin.

## Architecture

The module lives in `lib/cv-analysis/` and is orchestrated by `analyzeCv()`:

1. `types.ts` defines zod schemas and TypeScript types for `CandidateInput`, `ClaimFlag`, and `RiskReport`.
2. `llmClaimAnalysis.ts` optionally parses raw CV text into structured fields and extracts factual claims via Anthropic or OpenAI SDKs. The system prompt contains strict guardrails against style, AI-writing, and protected-characteristic analysis.
3. `deterministicChecks.ts` runs pure TypeScript checks without any LLM dependency.
4. `externalChecks.ts` contains an adapter interface for company/referee plausibility lookups. The default DNS adapter has a timeout and returns `unknown` when external checks are disabled or unavailable.
5. `score.ts` aggregates explainable flags into sub-scores (`timeline`, `employer`, `referee`, `claims`), a `riskScore` from 0–100, and a RAG status (`green`, `amber`, `red`).
6. `index.ts` runs the full pipeline and validates the final report with zod.

## API

`POST /api/cv-analysis`

### Request body

```json
{
  "rawCvText": "optional raw CV text",
  "stations": [{ "company": "Example GmbH", "title": "Sales Manager", "startDate": "2021-01", "endDate": "2024-12", "location": "Berlin" }],
  "education": [{ "institution": "Example University", "degree": "B.Sc.", "startDate": "2017", "endDate": "2020" }],
  "certifications": [{ "name": "Example Certificate", "issuer": "Example Org", "year": 2023 }],
  "referees": [{ "name": "Jane Manager", "company": "Example GmbH", "role": "Head of Sales", "email": "jane.manager@example.com" }],
  "consentGiven": true
}
```

### Consent and DSGVO flow

- `consentGiven=false` returns `403` before running parsing, deterministic checks, external checks, LLM calls, or persistence.
- Successful analyses are persisted as compact report JSON in `CvAnalysisReport` with a SHA-256 hash of the input rather than storing a second raw CV copy.
- Every successful analysis writes an `AuditLog` entry with action `CV_ANALYSIS_CREATE`.
- Deploy the database in Supabase's EU region and set `DATABASE_URL` to that EU-hosted Postgres endpoint.
- Keep external lookups disabled unless the candidate consent and data-processing agreement cover them. Enable with `CV_ANALYSIS_ENABLE_EXTERNAL_LOOKUPS=true`.

## LLM configuration

The analyzer supports Anthropic and OpenAI SDKs. If both are configured, Anthropic is used first.

```bash
ANTHROPIC_API_KEY=...
CV_ANALYSIS_ANTHROPIC_MODEL=claude-3-5-haiku-latest
OPENAI_API_KEY=...
CV_ANALYSIS_OPENAI_MODEL=gpt-4o-mini
```

If no key is configured, the pipeline still returns deterministic and external-adapter results with a safe LLM fallback explanation.

## Risk report and Trust-Score integration

`RiskReport` has this shape:

```ts
{
  riskScore: number
  rag: 'green' | 'amber' | 'red'
  subScores: { timeline: number; employer: number; referee: number; claims: number }
  flags: ClaimFlag[]
  verificationChecklist: string[]
  explanations: string[]
}
```

Each `ClaimFlag` includes `{ claim, type, severity, reason, source }`. A missing `reason` is rejected by schema validation.

For the candiq report and Trust-Score, use the analyzer as a verification-risk input:

- `green`: normal reference workflow.
- `amber`: reviewer should prioritize the checklist before final assessment.
- `red`: senior reviewer should validate high-severity flags, but still no automatic rejection.

The Trust-Score should present this as **verification confidence / risk**, not as a candidate quality score.

## Testing

```bash
npm run test
npm run lint
npm run build
```

The unit tests cover deterministic checks, schema validation, explainable flags, and fixture CVs for fabricated and clean scenarios.
