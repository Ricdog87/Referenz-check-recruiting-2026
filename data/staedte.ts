export type Stadt = {
  slug: string
  name: string
  region: string
  leitbranchen: string[]
  h1: string
  intro: string
  branchenAngle: string
  localFaq: { q: string; a: string }
}

export const STAEDTE: Stadt[] = [
  {
    slug: 'berlin',
    name: 'Berlin',
    region: 'Berlin',
    leitbranchen: ['Tech & SaaS', 'Startups', 'Öffentlicher Sektor', 'Medien'],
    h1: 'Referenzprüfung in Berlin — Tempo für den Startup- und Tech-Hub',
    intro:
      'Berlin stellt schneller ein als fast jede andere Stadt — Startups, Scale-ups und Tech-Unternehmen besetzen Rollen oft in Wochen, nicht Monaten. Genau dieses Tempo macht die Referenzprüfung kritisch: Bei internationalen Lebensläufen und vielen Quereinsteigern ist die telefonische Verifizierung früherer Stationen oft das einzige verlässliche Signal.',
    branchenAngle:
      'Besonders relevant für Tech & SaaS, Startups, Plattform-Unternehmen und den öffentlichen Sektor. Bei Lead- und Senior-Engineering-Rollen, wo eine Fehlbesetzung ein ganzes Team ausbremst, lohnt sich die Express-Option in 24 Stunden.',
    localFaq: {
      q: 'Funktioniert candiq für internationale Kandidaten in Berlin?',
      a: 'Ja — unsere KI-gestützte, trainierte Telefonassistentin führt Referenzgespräche auch mit Referenzgebern im Ausland, die Einwilligung läuft über das mehrsprachige Self-Service-Portal.',
    },
  },
  {
    slug: 'muenchen',
    name: 'München',
    region: 'Bayern',
    leitbranchen: ['Versicherung', 'Tech', 'Automotive', 'High-Tech'],
    h1: 'Referenzprüfung in München — bei teuren Senior-Hires kein Risiko',
    intro:
      'München ist der teuerste Talentmarkt Deutschlands. Wer hier eine Schlüsselrolle falsch besetzt, zahlt doppelt — über das hohe Gehaltsniveau und über die lange Nachbesetzungszeit. Die Referenzprüfung ist hier weniger „nice to have" als günstige Versicherung gegen einen sechsstelligen Fehler.',
    branchenAngle:
      'Stark in Versicherung und Finanzdienstleistung (Konzerne mit hohen Compliance-Anforderungen), Tech sowie Automotive und High-Tech-Zulieferern. Gerade in regulierten Häusern zählt der lückenlose Audit-Trail von candiq.',
    localFaq: {
      q: 'Eignet sich candiq für Konzern-HR in München?',
      a: 'Ja — mit Audit-Trail-Export (DSGVO Art. 30), ATS-Integration und Mehr-Standort-Verwaltung in den größeren Paketen.',
    },
  },
  {
    slug: 'hamburg',
    name: 'Hamburg',
    region: 'Hamburg',
    leitbranchen: ['Logistik', 'Medien', 'Luftfahrt', 'Handel'],
    h1: 'Referenzprüfung in Hamburg — für Logistik, Medien und Handel',
    intro:
      'Hamburgs Arbeitsmarkt lebt von Hafen und Logistik, von Verlagen und Medien sowie von Luftfahrt und Handel — vielen operativen und kaufmännischen Rollen, in denen Verlässlichkeit und nachgewiesene Erfahrung direkt aufs Geschäft durchschlagen.',
    branchenAngle:
      'Besonders sinnvoll für Logistik & Supply Chain, Medien/Verlage, Luftfahrt und Groß-/Einzelhandel. Bei Rollen mit Budget- oder Personalverantwortung verifiziert candiq genau die Stationen, die im Lebenslauf am leichtesten überzeichnet werden.',
    localFaq: {
      q: 'Können wir mehrere Prüfungen pro Monat in Hamburg laufen lassen?',
      a: 'Ja — die Pakete sind auf wiederkehrendes Volumen ausgelegt, inklusive Live-Status pro Kandidat im Dashboard.',
    },
  },
  {
    slug: 'frankfurt',
    name: 'Frankfurt am Main',
    region: 'Hessen',
    leitbranchen: ['Banking & Finance', 'Beratung', 'IT'],
    h1: 'Referenzprüfung in Frankfurt — Compliance-fest für den Finanzplatz',
    intro:
      'In Frankfurt entscheidet oft die Compliance mit. Banken, Asset Manager und Beratungen unterliegen hohem regulatorischem Druck — eine nachvollziehbar dokumentierte Bewerberprüfung ist hier kein Bonus, sondern Erwartung. Genau dafür ist candiqs Audit-Trail gebaut.',
    branchenAngle:
      'Stark in Banking & Finance, Asset Management, Beratung und IT/Rechenzentren. Wo BaFin-Nähe und interne Revision mitlesen, liefern Einwilligungs-Workflow und lückenloser Audit-Trail die nötige Verteidigbarkeit.',
    localFaq: {
      q: 'Erfüllt candiq Anforderungen an die Dokumentation im Finanzsektor?',
      a: 'candiq protokolliert jeden Datenzugriff und bietet Audit-Trail-Export nach DSGVO Art. 30 — ein verteidigbarer Nachweis für interne und externe Prüfer.',
    },
  },
  {
    slug: 'koeln',
    name: 'Köln',
    region: 'Nordrhein-Westfalen',
    leitbranchen: ['Versicherung', 'Medien', 'Handel'],
    h1: 'Referenzprüfung in Köln — für Versicherung, Medien und Handel',
    intro:
      'Köln verbindet große Versicherer, Medienhäuser und einen breiten Handels- und Dienstleistungssektor mit einer wachsenden Startup-Szene. Dieser Mix bringt sehr unterschiedliche Lebensläufe auf den Tisch — und damit den Bedarf, Stationen verlässlich zu verifizieren statt zu raten.',
    branchenAngle:
      'Relevant für Versicherung, Medien & Entertainment, Handel und Dienstleistung. Bei kundennahen und vertrieblichen Rollen prüft candiq, ob Verantwortung und Ergebnisse aus dem CV der Realität standhalten.',
    localFaq: {
      q: 'Passt candiq auch für mittelständische Arbeitgeber in Köln?',
      a: 'Ja — der Starter-Tarif ab 65 €/Monat ist genau für kleinere HR-Teams gedacht, ohne Mindestvertrag.',
    },
  },
  {
    slug: 'stuttgart',
    name: 'Stuttgart',
    region: 'Baden-Württemberg',
    leitbranchen: ['Automotive', 'Maschinenbau', 'Engineering'],
    h1: 'Referenzprüfung in Stuttgart — für Automotive, Maschinenbau und Engineering',
    intro:
      'Stuttgart ist das industrielle Herz Deutschlands: Automotive, Maschinenbau und Engineering prägen den Arbeitsmarkt. Bei technischen Fach- und Führungsrollen ist nachgewiesene Erfahrung entscheidend — und genau die lässt sich im Lebenslauf am leichtesten aufhübschen.',
    branchenAngle:
      'Stark für Automotive & Zulieferer, Maschinen- und Anlagenbau sowie Ingenieurdienstleistung. candiq verifiziert Projektverantwortung, Zeiträume und Tätigkeiten bei Ingenieur- und Technik-Rollen — bevor Sie in einen langen, teuren Auswahlprozess investieren.',
    localFaq: {
      q: 'Kann candiq technische Rollen sinnvoll prüfen?',
      a: 'Ja — die Fragenkataloge unserer KI-gestützten, trainierten Telefonassistentin lassen sich vertikal anpassen, auch für Engineering und Operations.',
    },
  },
  {
    slug: 'duesseldorf',
    name: 'Düsseldorf',
    region: 'Nordrhein-Westfalen',
    leitbranchen: ['Beratung', 'Marketing', 'Industrie', 'Handel'],
    h1: 'Referenzprüfung in Düsseldorf — für Beratung, Marketing und Industrie',
    intro:
      'Düsseldorf ist Standort für Beratung, Werbung und Marketing, für Mode und Handel sowie für große Industrie- und Telekommunikationsunternehmen. Gerade in Agentur-, Beratungs- und Vertriebsrollen klaffen Selbstdarstellung und Realität oft am weitesten auseinander.',
    branchenAngle:
      'Relevant für Beratung, Marketing/Werbung, Mode & Handel und Industrie. candiq verifiziert, ob die im CV beanspruchten Erfolge und Verantwortungen von früheren Vorgesetzten bestätigt werden.',
    localFaq: {
      q: 'Wie schnell bekommen wir in Düsseldorf den ersten Report?',
      a: 'Typischerweise unter 48 Stunden ab Freigabe der Referenzgeber, Express in 24 Stunden.',
    },
  },
]

export function getStadt(slug: string): Stadt | undefined {
  return STAEDTE.find((s) => s.slug === slug)
}

export function listStaedte(): Stadt[] {
  return STAEDTE
}
