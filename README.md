# Quran Chat Buddy

An AI-powered Islamic companion app for iOS and Android. Ask questions about the Quran, get accurate prayer times, track your reading progress, take daily Islamic knowledge quizzes, and receive personalized faith reminders — all in one place.

---

## Features

- **AI Chat** — GPT-4 powered conversation about Quran, hadith, prayer, and Islamic guidance
- **Quran Reader** — Full Arabic text with translation, per-verse tracking, favorites, and reading streaks
- **Prayer Times** — Accurate Adhan calculations with Qibla compass and Android home-screen widget
- **Daily Quiz** — 500+ Islamic knowledge questions with streak tracking
- **Faith Reminders** — Scheduled daily verse and prayer notifications
- **Subscriptions** — Free tier (10 AI messages/device) with unlimited premium via RevenueCat

---

## Quick Start

```bash
git clone <repo-url>
cd QuranChatBuddyApp
npm install
cp .env.example .env   # fill in Firebase + RevenueCat keys
npx expo start
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/PRD.md](docs/PRD.md) | Product requirements, feature scope, free vs premium tiers |
| [docs/TECHNICAL_ARCHITECTURE.md](docs/TECHNICAL_ARCHITECTURE.md) | Tech stack, theme system, auth flow, Firebase architecture, logging |
| [docs/SETUP.md](docs/SETUP.md) | Step-by-step developer setup, environment variables, EAS build |

---

## Tech Stack

Expo 54 · React Native 0.81 · Firebase 12 (Auth + RTDB + Functions) · Zustand · React Native Paper · RevenueCat · OpenAI GPT-4
