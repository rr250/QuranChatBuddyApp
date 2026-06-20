# Technical Architecture — Quran Chat Buddy

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Expo (managed + bare hybrid) | 54 |
| UI Runtime | React Native | 0.81 |
| Navigation | Expo Router (file-based) | — |
| State management | Zustand | 4.4 |
| UI components | React Native Paper (MD3) | 5.14 |
| Backend | Firebase (Auth + RTDB + Storage + Functions) | 12.4 |
| AI | OpenAI GPT-4 via Firebase Cloud Functions | — |
| Subscriptions | RevenueCat | 10.2 |
| Prayer calc | Adhan | 4.4 |
| Build / OTA | EAS Build + EAS Update | — |

---

## Repository Structure

```
QuranChatBuddyApp/
├── app/                     # Expo Router screens
│   ├── _layout.jsx          # Root layout — bootstraps Firebase, auth, notifications
│   ├── (auth)/              # Login, register, forgot-password, onboarding, welcome
│   └── (tabs)/              # Main tabs: home, chat, prayer, quran, quiz, profile, settings
├── src/
│   ├── components/          # Reusable UI components, grouped by domain
│   ├── constants/           # theme.js, glass.js, layout.js, subscription.js, ai.js, ...
│   ├── hooks/               # Custom React hooks (useChat, useQuran, usePrayerTimes, ...)
│   ├── services/            # All business logic and external integrations
│   ├── store/               # Zustand stores (authStore, subscriptionStore, ...)
│   ├── utils/               # Pure utility functions
│   └── widgets/             # Android prayer widget renderer
├── functions/               # Firebase Cloud Functions (Gen 2, Node 20)
├── docs/                    # Project documentation
└── assets/                  # App icons, splash, images
```

---

## Theme System

All design tokens are exported from a single barrel at `src/theme/index.js`. Components import from there — never directly from the source files.

```js
// All imports come from one place
import { theme, colors, spacing, glass, gradients, borderRadius } from "../../theme";
```

The barrel re-exports from two source files that remain as the single source of truth:

| Source file | Contents |
|-------------|----------|
| `src/constants/theme.js` | MD3 Paper theme, `colors`, `spacing`, `typography`, `borderRadius`, `elevation` |
| `src/constants/glass.js` | Glassmorphism tokens: `glass`, `gradients` |

**Rule**: All `StyleSheet` color values must reference a token from `theme.colors.*` or `glass.*`. White text on dark glass uses `theme.colors.onPrimary`. Brand colors (`#2E8B57`, `#DAA520`) are never hardcoded in component files.

---

## Logging Architecture

All logging goes through `src/services/logger.js`.

```js
// Interface
logger.debug(...)  // DEV only
logger.info(...)   // DEV only
logger.warn(...)   // DEV only
logger.error(...)  // Always active (production-safe; Sentry hook-point)
```

**Production behavior**: `debug`, `info`, `warn` are no-ops in release builds (`__DEV__ === false`). Only `logger.error` emits output.

**Sentry migration path**: Replace the `logger.error` body with:
```js
import * as Sentry from '@sentry/react-native';
Sentry.captureException(args[0] instanceof Error ? args[0] : new Error(String(args[0])));
```

---

## Authentication & Device Identity Flow

```
App open
   │
   ├── Not onboarded → Onboarding screen → collect name/goals → anonymous sign-in
   │
   └── Onboarded
         │
         ├── No Firebase user → AuthService.signInAnonymously()
         │       │
         │       ├── DeviceIdentityService.getDeviceHash()
         │       │       └── resolveDeviceAuth(hash) ──► custom token? → restore existing UID
         │       │
         │       └── New device? → Firebase.signInAnonymously() → register device hash in RTDB
         │
         └── Firebase user exists → AuthService.ensureDeviceLinked()
                 └── registers device if not yet linked
```

**Key invariant**: One Firebase UID per physical device. The `device_accounts/{hash}` RTDB node is the source of truth. The `resolveDeviceAuth` Cloud Function issues custom tokens for reinstate across reinstalls.

Account upgrade (anonymous → email/Google/Apple) uses `linkWithCredential`, preserving the existing UID and all associated data.

---

## Chat Flow

```
User submits message
   │
   useChat.sendMessage(text)
   │
   aiService.sendMessage(text)
   │
   ├── AuthService.ensureAuthenticated()
   ├── DeviceIdentityService.getDeviceHash()
   ├── getConversationHistory(userId)  ← AsyncStorage, last 6 turns
   │
   └── callCloudFunction("chatCompletion", { messages, deviceHash, model, ... })
           │
           Firebase Cloud Function
           ├── Verify auth token
           ├── Check quota: device_usage/{hash}.count < FREE_MESSAGE_LIMIT || users/{uid}/subscription/isPremium
           ├── OpenAI API call (gpt-4)
           ├── Increment usage counter
           └── Return { content, aiMessageCount }
                   │
           MessageUsageService.applyServerCount(uid, aiMessageCount)
           saveMessageToHistory(userId, userMessage, aiResponse)
```

---

## Firebase Cloud Functions Inventory

| Function | Trigger | Purpose |
|----------|---------|---------|
| `chatCompletion` | `onCall` (auth) | AI chat; enforces free quota; returns `{content, aiMessageCount}` |
| `verseCategory` | `onCall` (auth) | Returns a 2–4 word Islamic theme label for a verse (gpt-4o-mini) |
| `sendDailyQuizNotification` | `onSchedule` 09:00 UTC | Sends FCM to topic `daily_quiz` |
| `checkDeviceRegistration` | `onCall` | Returns `{registered, linkedUid}` for a device hash |
| `resolveDeviceAuth` | `onCall` | Issues a custom token for device-linked UID (reinstall recovery) |
| `registerDeviceAccount` | `onCall` (auth) | Links device hash to authenticated UID (first install) |
| `getMessageUsage` | `onCall` | Returns `{count, limit, linkedUid, sessionMismatch}` per device |

**Secrets**: `OPENAI_API_KEY` is stored as a Firebase secret (`defineSecret`). Never referenced in client code.

---

## Environment Variables

All client secrets are in `.env` (not committed). See `.env.example` for the full list.

| Variable | Used in |
|----------|---------|
| `EXPO_PUBLIC_FIREBASE_*` | `src/services/firebase.js` |
| `EXPO_PUBLIC_OPENAI_API_KEY` | `src/services/aiService.js` (**dev fallback only** — gated by `__DEV__`; must never be set in production EAS secrets as `EXPO_PUBLIC_*` vars are inlined into the APK bundle) |
| `EXPO_PUBLIC_REVENUECAT_*` | `src/services/subscriptionService.js` |
| `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` | `src/hooks/useGoogleAuth.js` |
| `EXPO_PUBLIC_QUIZ_QUESTIONS_URL` | `src/services/quizQuestionBankService.js` |
