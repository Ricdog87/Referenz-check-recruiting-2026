# DSGVO-Checkliste Recruiting

**Rechtsgrundlagen, Einwilligungs-Pattern, Aufbewahrungsfristen, AVV-Pflichten und DSFA-Trigger für HR-Teams.**

*candiq Lead-Magnet 2/2025 · 14 Seiten · ca. 10 Minuten Lesezeit*

---

## Worum es geht

Die DSGVO regelt seit 2018 die Verarbeitung personenbezogener Daten in der EU. Für Recruiting heißt das: jede Bewerbungs-Verarbeitung braucht eine klare Rechtsgrundlage, einen dokumentierten Zweck, einen definierten Aufbewahrungszeitraum und (in vielen Fällen) eine Auftragsverarbeitungs-Vereinbarung mit Drittanbietern.

Diese Checkliste deckt die fünf wichtigsten Themen ab, die im DACH-Recruiting regelmäßig falsch oder unvollständig umgesetzt werden — mit konkreten Pattern, die in der Praxis funktionieren.

---

## 1. Rechtsgrundlagen pro Verarbeitungsschritt

Jede Verarbeitung braucht **eine** Rechtsgrundlage nach Art. 6 DSGVO. Häufige Verwirrung im Recruiting: man stützt sich auf Einwilligung, obwohl Vertragsanbahnung greift.

| Verarbeitungsschritt | Empfohlene Rechtsgrundlage | Begründung |
|---|---|---|
| Bewerbungs-Eingang via Karriere-Portal | Art. 6 Abs. 1 lit. b DSGVO (vorvertraglich) | Die Bewerbung ist die Initiative des Bewerbers zur Vertragsanbahnung. Keine Einwilligung nötig. |
| Speicherung im ATS während des Verfahrens | Art. 6 Abs. 1 lit. b DSGVO (vorvertraglich) | Verarbeitung für die Auswahlentscheidung. |
| Hinzuziehen externer Reference-Checks | Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) | Geht über die Vertragsanbahnung hinaus, da Dritte (Referenzgeber) kontaktiert werden. Bewerber muss aktiv zustimmen. |
| Aufnahme in Talent-Pool für andere Stellen | Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) | Eigenständige neue Zweckbestimmung — separate Einwilligung. |
| Background-Check (Vorstrafen, Bonität) | Art. 6 Abs. 1 lit. a DSGVO + ggf. Art. 9 (sensible Daten) | In DE nur bei direktem Job-Bezug zulässig. Beratung empfohlen. |
| Aufbewahrung nach Absage zur Abwehr von AGG-Klagen | Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse) | Üblicher Zeitraum: 6 Monate (§ 15 Abs. 4 AGG). |

**Anti-Pattern:** „Wir holen vorsichtshalber für alles Einwilligung." Wirkt freundlich, ist aber rechtlich problematisch — eine Einwilligung muss freiwillig sein, und im Bewerbungs-Kontext besteht ein erhebliches Machtgefälle (siehe EuGH-Rechtsprechung). Wenn Sie sich auf lit. b stützen können, tun Sie das.

---

## 2. Einwilligungs-Pattern (granular + widerrufbar)

Wenn Sie Einwilligung als Rechtsgrundlage brauchen (z. B. Reference-Check, Talent-Pool), muss diese vier Kriterien erfüllen — siehe Art. 7 DSGVO und EuGH Planet49 (C-673/17):

1. **Freiwillig** — keine Pflichteinwilligung als Voraussetzung für die Bewerbung
2. **Informiert** — Bewerber sieht klar, *was* erhoben, *wofür*, *von wem*, *wie lange*, *welche Drittempfänger*
3. **Granular** — separate Checkboxen pro Zweck (nicht „Ich stimme allem zu")
4. **Aktiv** — keine vorausgewählten Default-Checkboxen, kein Opt-out

**Empfohlenes Pattern für Reference-Checks:**

- Separate Checkbox „Ich willige in die Kontaktaufnahme mit den von mir genannten Referenzgebern ein."
- Separate Checkbox „Ich willige ein, dass die Antworten meiner Referenzgeber bei [Firmenname] gespeichert und im Auswahlverfahren berücksichtigt werden."
- Optionale separate Checkbox „Ich möchte einen Aufzeichnungs-Mitschnitt erhalten."
- Klarer Widerrufs-Link bzw. Hinweis: „Widerruf jederzeit ohne Begründung per E-Mail an [E-Mail-Adresse] oder über das Bewerber-Portal."

Der Bewerber muss in der Lage sein, **einzelne** Einwilligungen zu widerrufen — nicht nur „alles oder nichts".

---

## 3. Aufbewahrungsfristen

Die DSGVO selbst nennt keine konkreten Fristen — sie verlangt nur den Grundsatz „Speicherbegrenzung" (Art. 5 Abs. 1 lit. e). Konkrete Fristen ergeben sich aus anderen Gesetzen.

| Datenkategorie | Empfohlene Frist | Rechtsgrundlage |
|---|---|---|
| Bewerbungs-Unterlagen abgelehnter Kandidaten | 6 Monate nach Absage | § 15 Abs. 4 AGG (Frist für AGG-Klagen) |
| Bewerbungs-Unterlagen erfolgreicher Kandidaten | Dauer des Arbeitsverhältnisses + 3 Jahre | Allgemeine Verjährungsfrist § 195 BGB |
| Talent-Pool mit aktiver Einwilligung | 24 Monate, dann Re-Bestätigung anfragen | Best Practice — keine harte rechtliche Vorgabe |
| Reference-Check-Antworten (intern) | 6 Monate nach Auswahlentscheidung | Analog zu Bewerbungs-Unterlagen |
| Audit-Logs / Verarbeitungsverzeichnis | 3 Jahre minimum | Art. 5 Abs. 2 DSGVO + Nachweispflicht |
| Buchhaltungsrelevante Daten (Rechnungen, Verträge) | 10 Jahre | § 257 HGB, § 147 AO |

**Anti-Pattern:** „Wir speichern alles für den Fall der Fälle." DSGVO-Risk + Storage-Kosten + Datenleck-Exposure. Definieren Sie pro Kategorie eine Frist und implementieren Sie ein automatisiertes Lösch-Konzept.

---

## 4. AVV-Pflichten (Auftragsverarbeitung)

Sobald Sie einen Dritten einsetzen, der personenbezogene Daten weisungsgebunden für Sie verarbeitet, brauchen Sie eine Auftragsverarbeitungs-Vereinbarung (AVV) nach Art. 28 DSGVO. Im Recruiting sind das typischerweise:

| Anbieter | Brauchen Sie eine AVV? | Wo bekommen Sie sie? |
|---|---|---|
| Karriere-Portal-Hoster | Ja | Standard im Vertrag, ggf. Nachverhandlung |
| Applicant Tracking System (ATS) | Ja | Anbieter-Standard, prüfen auf SCC |
| E-Mail-Versand-Dienst (z. B. transaktional) | Ja | Online verfügbar |
| Reference-Check-Service | Ja | Beim Onboarding einfordern |
| Background-Check-Anbieter | Ja | Anbieter-Standard |
| HR-Analytics / BI-Tools | Ja | Anbieter-Standard |
| Personalvermittler / Headhunter | Selten — meist eigene Verantwortlichkeit | Vertraglich klären |
| Microsoft 365 / Google Workspace | Ja, aber meist im Hauptvertrag enthalten | Über Compliance-Portal abrufbar |

**Drittstaaten:** Werden Daten in die USA oder andere Drittländer übermittelt (z. B. weil der Anbieter dort hostet), brauchen Sie zusätzlich Standardvertragsklauseln (SCC) nach Art. 46 Abs. 2 lit. c DSGVO. Seit dem EU-US Data Privacy Framework gibt es bei US-zertifizierten Anbietern eine zusätzliche Rechtsgrundlage, die SCC aber gerne als Backup belassen.

**Anti-Pattern:** „Anbieter X bietet keine AVV, weil sie 'keine personenbezogenen Daten verarbeiten'." Wenn Bewerber-CVs durch das Tool laufen, verarbeitet der Anbieter personenbezogene Daten. Punkt. Ohne AVV: rechtliches Risiko bei Ihnen.

---

## 5. DSFA-Trigger (Datenschutz-Folgenabschätzung)

Eine DSFA nach Art. 35 DSGVO ist verpflichtend bei „hohem Risiko" für Betroffene. Im Recruiting greift das typischerweise bei:

- **Automatisierter Entscheidungsfindung** (z. B. AI-basiertes CV-Screening, das eine Vorauswahl ohne menschliche Beteiligung trifft) — siehe Art. 22 DSGVO
- **Profiling** auf Verhaltensdaten (z. B. Bewerbungs-Videos mit Stimmen-/Gesichts-Analyse)
- **Umfangreicher Verarbeitung sensibler Daten** nach Art. 9 (Gesundheit, Ethnie, sexuelle Identität)
- **Systematischer Überwachung** (z. B. Online-Assessments mit Webcam-Recording)
- **Cross-Border-Daten-Transfers in Drittländer** ohne Angemessenheitsbeschluss, bei großen Volumina

Wenn eines dieser Kriterien zutrifft, müssen Sie:

1. Eine schriftliche DSFA durchführen (Risikoanalyse + Schutzmaßnahmen)
2. Den Datenschutzbeauftragten (DSB) einbinden — siehe Art. 35 Abs. 2
3. Bei verbleibend hohem Risiko: die Aufsichtsbehörde konsultieren (Art. 36)

**Anti-Pattern:** „Unser HR-Tool macht 'nur Vorauswahl', deshalb ist es keine automatisierte Entscheidung." Wenn die Vorauswahl effektiv darüber entscheidet, wer überhaupt zum Interview eingeladen wird, ist das relevant — siehe auch die Diskussion um SCHUFA / Art. 22 (EuGH C-634/21).

---

## Kompakt-Audit-Checkliste (zum Abhaken)

- [ ] Pro Bewerber-Verarbeitungsschritt ist die DSGVO-Rechtsgrundlage dokumentiert
- [ ] Einwilligungen sind granular, aktiv, widerrufbar und im Audit-Log nachvollziehbar
- [ ] Pro Datenkategorie existiert eine schriftliche Aufbewahrungsfrist
- [ ] Automatische Löschungen sind als Cron-Job oder Workflow implementiert
- [ ] Alle Drittanbieter haben eine gültige AVV
- [ ] Drittstaaten-Übermittlungen sind mit SCC oder DPF abgedeckt
- [ ] Bei AI-/Automation-Tools ist eine DSFA durchgeführt und dokumentiert
- [ ] Bewerber können ihre Daten per Self-Service exportieren (Art. 20) und löschen lassen (Art. 17)
- [ ] Das Verarbeitungsverzeichnis (Art. 30) ist aktuell
- [ ] Datenschutzerklärung listet alle Verarbeitungsschritte mit Rechtsgrundlage

---

## Über candiq

candiq ist ein DSGVO-konformer Reference-Check-Service für Recruiting im DACH-Raum. Server in Deutschland, granulare Einwilligungen, 180-Tage-Auto-Löschung, AVV beim Onboarding. Mehr unter [candiq.de](https://candiq.de). Wenn Sie diese Checkliste in der Praxis umsetzen wollen: [15-Min-Termin buchen](https://candiq.de/termin).

*Stand: Mai 2026. Diese Checkliste ist eine Praxis-Übersicht und ersetzt keine Rechts- oder Datenschutzberatung. Im Zweifel: Datenschutzbeauftragten oder Kanzlei einbinden.*
