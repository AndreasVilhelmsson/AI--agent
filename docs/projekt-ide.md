# Andreas Vilhelmsson# ✅ PLAN_TODO.md  

**Examensarbete – Real-Time AI Meeting Assistant**

---

## 🧱 FAS 1 — Projektförberedelser (Vecka 1)

### ✅ Setup arbetsmiljö

- Installera och konfigurera:
  - Visual Studio Code
  - Node.js LTS
  - .NET SDK 8
  - Docker Desktop
  - Git och GitHub Desktop (valfritt)
  - Figma (webbversion)
- Installera VS Code extensions:
  - GitHub Copilot
  - ESLint
  - Prettier
  - Markdown All in One
  - Thunder Client/REST Client

### ✅ Project Management

- Skapa Trello-board
  - Kolumner: **Backlog → Ready → In Progress → Review → Done**

### ✅ Systemkrav-specifikation

- Funktionella krav
- Icke-funktionella krav
- Risker och mitigering

### ✅ Designarbete

- Skapa Figma wireframes:
  - Input/Meeting view
  - Real-time agent-status via WebSocket
  - Resultatpanel (sammanfattning + actions)
  - Exportvy
- Stil: **Light + Professional**

### ✅ Repository & Struktur

- Skapa GitHub-repo `ai-meeting-assistant`
- Branch protection på `main`
- Mappstruktur:

# Examensarbete – Projektidé

**Real-Time AI Meeting Assistant**

## Bakgrund / Problem

Möten genererar mycket information som deltagare ofta har svårt att fånga upp, strukturera och följa upp. Detta leder till att viktiga beslut och uppgifter glöms bort, vilket skapar ineffektivitet och merarbete.

## Syfte / Mål

Att utveckla ett system som automatiskt sammanfattar mötesinnehåll i realtid och skapar tydliga action items som deltagare direkt kan godkänna, tilldela och följa upp.

## Lösning – Kort beskrivning

Jag bygger en fullstack AI-applikation där användaren kan mata in text från ett möte (manuellt eller transkriberat).

En AI-agent analyserar innehållet i realtid och genererar:

- Sammanfattning
- Beslut & viktiga punkter
- Action items (vem? vad? när?)

Resultatet visas på en dashboard där användaren kan godkänna ändringar live via WebSocket-anslutning.

---

## Teknikstack & Metodik

| Område         | Teknik                                         |
| -------------- | ---------------------------------------------- |
| Frontend       | React (Vite, TypeScript), WebSocket            |
| Backend        | .NET eller Node.js Web API                     |
| AI-integration | LLM med function calling (OpenAI/Anthropic)    |
| Databas        | SQLite eller JSON-lagring                      |
| Design         | Figma (UI-skisser och interaktionsflöden)      |
| DevOps         | Docker + deployment till molnmiljö (Azure/AWS) |

---

## Funktionella krav (MVP)

- Mata in eller klistra in mötesanteckningar
- AI-agenten bearbetar text i realtid via WebSocket
- Generera sammanfattning + åtgärdspunkter
- Resultat kan redigeras, godkännas och exporteras

---

## Icke-funktionella krav

- Human-in-the-loop: användaren godkänner ändringar
- Säker hantering av text och persondata
- Tydlig loggning av förändringar
- Stabil realtidskommunikation

---

## Tidsplan (6–7 veckor)

| Vecka | Huvudleverabler                        |
| ----- | -------------------------------------- |
| 1     | Projektsetup, kravspec, Figma-skisser  |
| 2     | WebSocket + UI-prototyp                |
| 3     | AI-analys + action items               |
| 4     | Full integration: UI ↔ Backend ↔ Agent |
| 5     | Exportfunktion + historik (vid tid)    |
| 6     | Molndeploy, optimering, testning       |
| 7     | Dokumentation & demo-förberedelse      |

---

## Förväntade resultat

En komplett demo-bar applikation som hjälper användare att:

- Spara tid på mötesadministration
- Snabbt få överblick över beslut
- Säkerställa uppföljning av ansvar och deadlines
- Uppleva AI-stöd i realtid

---

## Examination & bedömning

- Fullstack-utveckling (UI + backend + DevOps)
- Aktiv AI-integration med realtidsfunktionalitet
- Dokumentation: arkitektur, design, resultat, reflektion
- Presentation med live-demo

---

## Godkännande

Kan denna projektidé godkännas som examensarbete enligt kursens krav?
