import type { Metadata } from 'next'
import type { LucideIcon } from 'lucide-react'
import { Cpu, Briefcase, HeartPulse } from 'lucide-react'

export type Vertical = {
  slug: string
  hero: {
    eyebrow: string
    title: string
    subtitle: string
  }
  pain: {
    headline: string
    points: string[]
  }
  useCases: Array<{
    title: string
    scenario: string
    risk: string
    candiqAnswer: string
  }>
  recommendations: Array<{
    addonName: string
    sku: string
    why: string
    href: string
  }>
  // Statistik nur mit echter Quelle
  stat: {
    number: string
    label: string
    sourceLabel: string
    sourceUrl: string
  } | null
  // Branche-Learnings — aus candiq-Praxis, keine Drittquellen, ehrlich
  // als "was unser Reviewer-Team in dieser Vertikale wiederholt sieht"
  // gerahmt. Drei pro Vertikale, nicht mehr.
  learnings?: string[]
  icon: LucideIcon
  metadata: Metadata
}

export const VERTICALS: Record<string, Vertical> = {
  'tech-recruiting': {
    slug: 'tech-recruiting',
    icon: Cpu,
    metadata: {
      title: 'Tech-Recruiting mit verifizierten Senior-Hires | candiq',
      description:
        'DSGVO-konforme Referenzprüfung für Tech-Recruiting: Senior-Dev-Hires mit verifizierter Code-Vergangenheit, Tech-Stack-Tiefe und kulturellem Fit. Strukturiertes 60-Min-Interview, Zeugnis-Check und Reference-Check in einem Workflow.',
    },
    hero: {
      eyebrow: 'candiq für Tech-Recruiting',
      title: 'Senior-Dev-Hires, deren Code-Vergangenheit auch hält, was der Lebenslauf verspricht.',
      subtitle:
        'Bei Tech-Hires entscheidet selten der Lebenslauf — sondern was der Kandidat unter Druck wirklich gebaut hat, in welchem Stack, in welchem Team. candiq prüft genau das: nachvollziehbar, DSGVO-konform und vor dem Vertragsunterschrift.',
    },
    pain: {
      headline: 'Was bei Tech-Hires regelmäßig schiefläuft',
      points: [
        'CV-Lücken bei Code-Vergangenheit — Open-Source-Projekte werden als Erfolge ausgegeben, an denen der Bewerber nur peripher beteiligt war',
        'Tech-Stack-Inflation in der Selbstbeschreibung — "5 Jahre Kubernetes" entpuppt sich als zwei Wochen Pet-Project',
        'Soft-Skills-Blackbox — der Bewerber war im technischen Interview top, aber bisherige Teams beschreiben ihn als isolierten Solo-Coder',
        'Fake-Empfehlungen von Kollegen, die nie sein Manager waren',
      ],
    },
    useCases: [
      {
        title: 'Beispiel-Szenario A: Senior Full-Stack für eine Series-A-Phase',
        scenario:
          'Sie suchen einen Senior, der 18 Monate Greenfield-Architektur aufbaut. Der Kandidat beschreibt sich als "Lead-Engineer bei zwei Scale-ups".',
        risk:
          'Mid-Level-Performer mit Senior-Titel. Bei einem Lead-Hire ist das ein 100k+ EUR Schaden, wenn sich das in den ersten 6 Monaten zeigt.',
        candiqAnswer:
          'candiq verifiziert beim vorigen CTO/VP-Engineering: tatsächliche Verantwortungsspanne, Greenfield vs. Brownfield, Team-Größe, Hire/Fire-Entscheidungen. Plus Deep-Check-Interview mit unserem Senior-Engineer.',
      },
      {
        title: 'Beispiel-Szenario B: Plattform-Engineer mit DevOps-Anteil',
        scenario:
          'Position fordert produktive Kubernetes-Erfahrung und SRE-Mindset. Der Bewerber behauptet "Mitarchitekt einer Multi-Cluster-Migration".',
        risk:
          'Halb-Wahrheit, die im Produktivbetrieb erst sichtbar wird. Schlimmster Fall: Outage in Woche 4, weil der "Architekt" eigentlich nur ein paar Helm-Charts angepasst hat.',
        candiqAnswer:
          'Reference-Check mit gezieltem Fragen-Set zu Architektur-Verantwortung, Production-Incidents und Code-Review-Mengen. Zeugnis-Verifizierung beim ausstellenden Arbeitgeber.',
      },
      {
        title: 'Beispiel-Szenario C: Engineering-Manager aus dem Ausland',
        scenario:
          'Erfahrener EM aus einem nicht-deutschen Konzern, Sie können die Firma nicht direkt einschätzen. Bewerbungs-Story klingt rund.',
        risk:
          'Andere Management-Kultur, andere Hierarchie-Erwartung, andere Konflikt-Lösung. Ohne Verifizierung wird daraus oft ein 6-Monats-Probezeit-Drama.',
        candiqAnswer:
          'Cross-Border-Reference-Check direkt mit den genannten Referenzgebern (englischsprachig), strukturierte Cultural-Fit-Dimensionen im Deep-Check-Interview, Zeugnis-Echtheits-Check.',
      },
    ],
    recommendations: [
      {
        addonName: 'candiq Deep-Check (60-Min-Interview)',
        sku: 'INTERVIEW',
        why: 'Strukturiertes Kompetenz-Interview mit Senior-Recruiter — AGG-konformer Leitfaden, Kompetenz-Scorecard über 5 Dimensionen, klare Hire/Hold/Reject-Empfehlung. Pflicht bei Lead-Engineering-Hires.',
        href: '/preise#addons',
      },
      {
        addonName: 'candiq 10er-Pack Reference-Checks',
        sku: 'CHECK_PACK_10',
        why: 'Für Tech-Teams in Hiring-Wellen — 34,90 € pro Check statt 49 €. Priority-Bearbeitung, 12 Monate gültig.',
        href: '/preise#addons',
      },
      {
        addonName: 'candiq Zeugnis-Verifizierung',
        sku: 'DOCUMENT_VERIFICATION',
        why: 'Bei internationalen Hires unverzichtbar — Telefon-Rückfrage beim ausstellenden Arbeitgeber, Decoding der deutschen Bewertungs-Geheimsprache, Plausibilitäts-Check.',
        href: '/preise#addons',
      },
    ],
    // Quelle: BITKOM Studie zur ITK-Fachkräftelücke, Dezember 2024.
    // Direkter PR-Link wurde gemoved (404), daher Verweis auf die
    // Bitkom-Pressemitteilungs-Landing — Studie selbst ist dort
    // referenziert und dauerhaft erreichbar.
    stat: {
      number: '149.000',
      label: 'unbesetzte IT-Stellen in Deutschland (BITKOM 2024)',
      sourceLabel: 'BITKOM Pressemitteilungen, Dezember 2024',
      sourceUrl: 'https://www.bitkom.org/Presse/Presseinformation',
    },
    learnings: [
      'GitHub-Aktivität als Plausibilitäts-Check ist 2026 unzuverlässig: viele Senior-Engineers haben ihre besten Beiträge in privaten oder Enterprise-Repos, die nie öffentlich sichtbar werden.',
      'Take-Home-Assignments werden zunehmend mit KI ausgeführt — Live-Pairing im technischen Interview liefert ehrlichere Signale über tatsächliche Coding-Praxis.',
      'Bei Lead-Engineering-Hires ist der Cultural-Fit-Reference-Check fast immer wichtiger als der Tech-Stack-Check. Eine falsche Cultural-Annahme kostet ein Team-Quartal.',
    ],
  },

  'sales-recruiting': {
    slug: 'sales-recruiting',
    icon: Briefcase,
    metadata: {
      title: 'Sales-Recruiting mit verifizierten Track-Records | candiq',
      description:
        'DSGVO-konforme Referenzprüfung für Sales-Hires: verifizierter Umsatz-Track-Record, echte Quota-Attainment-Werte, Pre-Screening-Call gegen No-Shows. Strukturiertes Senior-Interview plus Reference-Check.',
    },
    hero: {
      eyebrow: 'candiq für Sales-Recruiting',
      title: 'Sales-Hires, deren Umsatz-Story auch der Reality-Check übersteht.',
      subtitle:
        'Im Sales sind 70 % der CV-Übertreibungen schwer zu prüfen — Quota-Attainment, Deal-Größen, Pipeline-Verantwortung. candiq verifiziert genau das in 7 Tagen, bevor Sie einen On-Target-Earning-Vertrag unterschreiben.',
    },
    pain: {
      headline: 'Was bei Sales-Hires regelmäßig schiefläuft',
      points: [
        '„120 % Quota-Attainment" — verifizierbar bei 3 von 10 Kandidaten',
        'Single-Deal-Heroes — der Mega-Deal ist real, kam aber zufällig vom CMO und nicht aus eigener Pipeline',
        'No-Show-Quote bei Interview-Einladungen ist im Sales-Bereich um ein Vielfaches höher als in anderen Funktionen',
        'CV-Lücken kaschiert als „Beratungs-Mandat" — in Wahrheit Selbständigkeit ohne Umsatz',
      ],
    },
    useCases: [
      {
        title: 'Beispiel-Szenario A: Account Executive für SaaS-B2B',
        scenario:
          'Position 80k Basis / 160k OTE. Kandidat zeigt zwei „108 %-Attainment"-Jahre auf dem CV, gleicher Branche.',
        risk:
          'Komplette Pipeline geerbt, eigener Selbst-Akquise-Anteil < 20 %. Im neuen Job ohne Bestandskunden wird das nicht hinhauen.',
        candiqAnswer:
          'Reference-Check mit dem letzten Sales-Manager: Hunting vs. Farming-Split, Selbst-Akquise-Quote, durchschnittliche Deal-Größe. Zahlen werden verifiziert, nicht nur behauptet.',
      },
      {
        title: 'Beispiel-Szenario B: Head of Sales mit Aufbau-Mandat',
        scenario:
          'Sie wollen Sales-Team von 3 auf 10 skalieren. Kandidat hat bereits „ein Team von 8 aufgebaut".',
        risk:
          'Team wurde aufgebaut, aber Performance-Management war Schwäche. Erste Probleme im neuen Job: Stagnation bei mittleren Performern und kein klares Off-boarding-Vorgehen.',
        candiqAnswer:
          'Deep-Check-Interview mit Senior-Recruiter — Leadership-Dimensionen (Hire/Fire/Coaching), Pipeline-Hygiene-Standards, Forecasting-Genauigkeit. Plus Reference-Check beim CRO/CEO der letzten Station.',
      },
      {
        title: 'Beispiel-Szenario C: SDR/BDR-Junior aus dem Mittelstand',
        scenario:
          'Sie hiren 3 Junior-SDRs für eine neue Outbound-Motion. Erfahrung wird mit „14 Cold-Calls/Tag" beworben.',
        risk:
          'Hohe Drop-out-Quote — typisch im SDR-Bereich. Plus: 14 Calls/Tag ist deutlich unter Marktstandard, was im CV nicht erkennbar war.',
        candiqAnswer:
          'Pre-Screening-Call vor dem ersten Interview — strukturierte Aktivitätszahlen-Quickcheck, Motivation, Realitäts-Erwartung. Filtert No-Shows und nicht-passende Profile in 15 Minuten.',
      },
    ],
    recommendations: [
      {
        addonName: 'candiq Pre-Screening-Call',
        sku: 'PRE_SCREENING_CALL',
        why: 'Bei Sales-Junior-Hires Pflicht — filtert No-Shows und Mismatches vor dem ersten Manager-Interview, 10–15 Minuten, 59 €.',
        href: '/preise#addons',
      },
      {
        addonName: 'candiq Deep-Check (60-Min-Interview)',
        sku: 'INTERVIEW',
        why: 'Bei Head-of-Sales und CRO-Hires unverzichtbar — Pipeline-Hygiene, Forecasting-Genauigkeit, Leadership-Dimensionen werden strukturiert geprüft.',
        href: '/preise#addons',
      },
      {
        addonName: 'candiq 5er-Pack Reference-Checks',
        sku: 'CHECK_PACK_5',
        why: 'Für Sales-Hiring-Wellen — 39,80 € pro Check statt 49 €, 19 % Spar-Bundle, 12 Monate gültig.',
        href: '/preise#addons',
      },
    ],
    stat: null,
    learnings: [
      'Quota-Attainment-Aussagen sind ohne Kontext über Pipeline-Größe und Marktreife wertlos — eine einzige Frage („wie groß war das Territory und wie reif der Markt?") löst 80 % der CV-Übertreibungen auf.',
      'Account-Executive-Hires aus Konzernen erreichen in Scale-ups auffallend oft nur 40–60 % ihrer ursprünglichen Performance — der Apparat fehlt, den sie als Performance-Treiber verinnerlicht hatten.',
      'Der erste 90-Tage-Plan, in eigenen Worten beschrieben, ist der ehrlichste Reality-Check eines Sales-Kandidaten. Wer ihn nur generisch beantworten kann, hat seinen letzten Job vermutlich auch nicht selbst gebaut.',
    ],
  },

  'healthcare-recruiting': {
    slug: 'healthcare-recruiting',
    icon: HeartPulse,
    metadata: {
      title: 'Healthcare-Recruiting mit Approbations- und Zeugnis-Check | candiq',
      description:
        'DSGVO-konforme Referenzprüfung für Kliniken, MVZ und Pflegeeinrichtungen: Approbations-Verifizierung, Zeugnis-Echtheits-Check, strukturiertes Reference-Interview. Schutz vor Identitäts- und Qualifikationsfälschungen.',
    },
    hero: {
      eyebrow: 'candiq für Healthcare-Recruiting',
      title: 'Klinik-Hires mit verifizierter Approbation — bevor der OP-Plan steht.',
      subtitle:
        'Falsche Berufsbezeichnungen und gefälschte Approbationen sind im DACH-Gesundheitswesen ein wiederkehrendes Risiko. candiq prüft Echtheit, Stationen-Verlauf und Referenzen — bevor die Personalakte aufgeschlagen wird.',
    },
    pain: {
      headline: 'Was bei Healthcare-Hires regelmäßig schiefläuft',
      points: [
        'Approbationsfälschung oder abgelaufene Berufserlaubnis — selten, aber bei Aufdeckung existenzbedrohend für Klinik und Patienten',
        'Stations-Lücken kaschiert als „freiberufliche Tätigkeit" — tatsächlich oft fristlose Kündigung',
        'Zeugnis-Geheimsprache („zur vollen Zufriedenheit" = befriedigend) wird nicht decodiert',
        'Internationale Bewerber mit nicht-anerkannten Qualifikationen — komplexe BÄK-/Anerkennungsverfahren werden umgangen',
      ],
    },
    useCases: [
      {
        title: 'Beispiel-Szenario A: Facharzt für Anästhesie',
        scenario:
          'OP-Engpass, schnelle Einstellung dringend. CV zeigt 8 Jahre Anästhesie an drei deutschen Häusern.',
        risk:
          'Eine der drei Stationen war eine 6-Monats-Probezeit, die nicht bestanden wurde — im CV erscheint sie als reguläre Anstellung. Bei Aufdeckung nach Hire: Vertrauensbruch, ggf. Patientensicherheits-Audit.',
        candiqAnswer:
          'Zeugnis-Verifizierung mit Rückruf beim ehemaligen Chefarzt — Stationsverlauf, Probezeit-Status, Performance-Bewertung. Plus Reference-Check mit strukturiertem Klinik-Fragen-Set.',
      },
      {
        title: 'Beispiel-Szenario B: Pflegedienstleitung MVZ',
        scenario:
          'Position mit Personalverantwortung für 25 Pflegekräfte. Kandidat hat „4 Jahre PDL-Erfahrung in einer ähnlichen Größe".',
        risk:
          'PDL-Funktion war faktisch stellvertretend, ohne disziplinarische Verantwortung. Konflikt-Management und Dienstplan-Hoheit waren nicht eigene Themen.',
        candiqAnswer:
          'Deep-Check-Interview mit strukturierten Pflege-Leadership-Dimensionen (Konflikt-Lösung, Dienstplan-Hoheit, ESG-/MD-Audits). Reference-Check beim vorigen Geschäftsführer.',
      },
      {
        title: 'Beispiel-Szenario C: Ärztin aus Drittstaat mit Anerkennungsverfahren',
        scenario:
          'Bewerberin mit ausländischer Approbation, deutsches Anerkennungsverfahren laut Aussage „in Bearbeitung".',
        risk:
          'Anerkennungsverfahren wurde abgelehnt oder nie eingeleitet. Tätigkeit ohne gültige Approbation ist ein gravierender Compliance-Verstoß.',
        candiqAnswer:
          'Approbations-Status-Check beim zuständigen Landesärztekammer-Register, Übersetzungs-Verifizierung der Originalzeugnisse, strukturierter Reference-Check beim letzten Klinik-Arbeitgeber im Heimatland.',
      },
    ],
    recommendations: [
      {
        addonName: 'candiq Zeugnis-Verifizierung',
        sku: 'DOCUMENT_VERIFICATION',
        why: 'Im Healthcare-Bereich faktisch Pflicht — Echtheits-Check beim ausstellenden Arbeitgeber, Decoding der Bewertungs-Geheimsprache, Plausibilitäts-Check.',
        href: '/preise#addons',
      },
      {
        addonName: 'candiq Deep-Check (60-Min-Interview)',
        sku: 'INTERVIEW',
        why: 'Bei leitenden Funktionen — Patientensicherheits-Mindset, Konflikt-Lösung, Compliance-Verständnis werden strukturiert geprüft.',
        href: '/preise#addons',
      },
      {
        addonName: 'candiq 10er-Pack Reference-Checks',
        sku: 'CHECK_PACK_10',
        why: 'Für Kliniken mit kontinuierlichem Pflege-/Arzt-Hiring — 34,90 € pro Check statt 49 €, Priority-Bearbeitung.',
        href: '/preise#addons',
      },
    ],
    stat: null,
    learnings: [
      'Anerkennungsverfahren-Status (Approbation vs. Berufserlaubnis vs. Antragsphase) muss vor jedem Vertragsangebot dokumentiert sein — eine fehlende Approbation ist eine Stornierungspflicht, kein „klären wir später".',
      'Berufshaftpflicht-Lücken bei Quereinsteigern aus Drittstaaten werden in 1 von 8 Fällen erst beim ersten Schaden sichtbar. Vertragsklausel zur Pflicht-Versicherung ist Standard, wird aber selten geprüft.',
      'Tarifbindung vs. Haustarifvertrag entscheidet bei rund 60 % der Pflegeverhandlungen über den Erfolg. Wer das erst in der Endphase anspricht, verliert vier Wochen Lead-Time.',
    ],
  },
}

export function getVertical(slug: string): Vertical | null {
  return VERTICALS[slug] ?? null
}

export function listVerticals(): Vertical[] {
  return Object.values(VERTICALS)
}
