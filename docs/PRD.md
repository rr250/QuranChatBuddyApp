# Product Requirements Document — Quran Chat Buddy

## Overview

Quran Chat Buddy (QCB) is a mobile application for iOS and Android that serves as an AI-powered Islamic companion. It combines conversational AI, a Quran reader, daily prayer times, a quiz system, and faith-reminder notifications into a single, cohesive experience.

**Target audience**: Muslim users of all knowledge levels who want a private, always-available tool for Quranic study, prayer scheduling, and spiritual growth.

---

## Feature Scope

### 1. AI Chat (QCB Chat)
- Conversational interface powered by OpenAI GPT-4 via Firebase Cloud Functions.
- System prompt is personalized with the user's onboarding data (name, goals, location).
- Conversation history is persisted in AsyncStorage (last 6 assistant turns) and used as context for follow-up messages.
- **Free tier**: 10 messages per device (authoritative count tracked server-side via `getMessageUsage` Cloud Function).
- **Premium tier**: unlimited messages.
- Quick-question prompts shown when the chat is empty.

### 2. Quran Reader
- Full Quran with Arabic text and English translation.
- Per-verse read/unread tracking, favorites, and Surah completion.
- "Continue reading" position is persisted and surfaced on the home screen.
- Reading streak and statistics (surahs read, verses read, daily streak).
- Verse search across all 114 surahs.

### 3. Prayer Times
- Calculated locally using the Adhan library (no server dependency).
- Supports all major calculation methods and Madhabs (configurable in settings).
- Location detection via GPS (with manual city override).
- Qibla compass using device magnetometer.
- Android home-screen widget showing today's prayer schedule.

### 4. Daily Quiz
- 500+ bundled Islamic knowledge questions (loaded from local JSON).
- Remote question bank refreshed from Firebase Storage (6-hour cache with stale-fallback).
- Daily streak tracking, score history, leaderboard placeholder.
- Scheduled FCM push notification at 09:00 UTC via Cloud Function (`sendDailyQuizNotification`).

### 5. Faith Reminder Notifications
- Daily Quran verse notification (configurable time, default 08:00).
- Prayer time notifications for all 5 daily prayers (today + tomorrow scheduled on app open).
- All notifications are local (scheduled on-device); no push required for basic reminders.

### 6. Subscriptions (RevenueCat)
- Single premium entitlement: `premium`.
- Offerings fetched from RevenueCat; packages displayed in a paywall modal.
- Purchase, restore, and user-ID sync all handled through `SubscriptionService`.
- Premium status mirrored to Firebase RTDB (`users/{uid}/subscription/isPremium`) for Cloud Function access.

### 7. Authentication & User Identity
- **Anonymous sign-in** is the default flow after onboarding — no account required.
- **Device identity system**: each device gets a stable hash. The first anonymous sign-in registers the device in RTDB (`device_accounts/{deviceHash}`). On reinstall, the `resolveDeviceAuth` Cloud Function issues a custom token to restore the same Firebase UID.
- **Account linking**: anonymous users can upgrade to email/password, Google, or Apple accounts without losing their data.
- **Onboarding**: collects user name, spiritual goals, and notification preferences. Data is synced to RTDB on completion.

---

## Free vs Premium Tier

| Feature | Free | Premium |
|---------|------|---------|
| AI chat messages | 10 per device | Unlimited |
| Quran reader | Full | Full |
| Prayer times | Full | Full |
| Daily quiz | Full | Full |
| Notifications | Full | Full |

---

## Out of Scope (Current Release)

- Leaderboard (placeholder exists, requires Cloud Function)
- Audio recitation
- Community features
- Web app
