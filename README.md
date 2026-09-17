<div align="center">
  <h1>🩺 PulseCheck — AI-Powered Multilingual Patient Triage Kiosk</h1>
  <p><strong>Smarter Intake. Faster Care. Zero Language Barriers.</strong></p>
  <a href="https://pulsecheck-health.netlify.app">🌐 Live Demo</a> •
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#environment-variables">Environment Variables</a> •
  <a href="#architecture">Architecture</a>
</div>

---

## 📖 About
Every year, millions of patients wait hours in crowded Outpatient Departments (OPDs) and Emergency Rooms, often struggling to communicate their symptoms due to language barriers. Triage nurses are overwhelmed, leading to delayed care for critical patients.

**PulseCheck** is an AI-powered, multilingual self-service intake kiosk designed for clinic and emergency waiting rooms. Patients can **speak or type** their symptoms in their native language. PulseCheck translates, extracts structured clinical summaries, assesses severity, and issues a **digital OPD token** delivered directly to the patient's phone via WhatsApp/SMS.

> 🏆 Built for the **Hack to Heal** Hackathon.

---

## ✨ Features

### 🧑‍⚕️ Patient-Facing Kiosk
* **Multilingual Support** — Native UI and voice input across 5 languages: English, Spanish, Hindi, Chinese, and French.
* **Voice-to-Text Recording** — Hands-free symptom entry with Web Speech API and multimodal Gemini audio transcription fallback for mobile browsers.
* **AI Clinical Analysis** — Auto-generates structured HPI summaries, detects clinical onset, maps affected anatomy, and locks objective pain severity scores.
* **Semantic Input Validation** — Rejects gibberish and non-medical keyboard mashing using dual-layer heuristics and AI verification.
* **Immediate Code-Red SOS** — One-touch emergency trigger that bypasses intake and broadcasts an urgent alarm to provider stations.
* **Dynamic Doctor Routing** — Live physician directory showing active On-Duty/Off-Duty statuses so patients are routed to available doctors.
* **Digital OPD Token System** — Daily-resetting sequential tokens (e.g., `#T-001`) with live wait-time estimates.
* **Formatted WhatsApp OPD Tokens** — One-click dispatch of clinical digital tokens formatted directly for WhatsApp.
* **Accessibility-First** — Integrated text-to-speech guidance and dark/light mode toggles.

### 👨‍⚕️ Doctor & Staff Portal
* **Authorized Access Control** — Protected registration using hospital admin master keys (`HOSP-PULSE-2026`) and role-based login.
* **Live Duty Management** — Single-click toggle between `🟢 On Duty` and `🔴 Off Duty` to manage queue availability in real time.
* **Urgency-Sorted Queue** — Patient queue prioritized dynamically by clinical triage level (Red, Yellow, Green).
* **Code-Red Emergency Banner** — Audible and visual alert banners for immediate waiting-room SOS interventions.
* **1-Click SOAP EHR Export** — Formatted subjective and objective clinical summaries ready for EHR transfer.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18 + TypeScript |
| **Build Tool** | Vite |
| **Styling & Icons** | Tailwind CSS, Lucide React |
| **Animations** | Framer Motion |
| **AI Engine** | Google Gemini API (`gemini-1.5-flash` / multimodal audio) |
| **Audio & Speech APIs** | Web Speech API (`SpeechRecognition`, `SpeechSynthesis`), MediaStream Recording API |
| **Hosting & Deployment** | Netlify |
| **Version Control** | Git + GitHub |

---

## 🔑 Environment Variables

Create a `.env` file in the project root:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
