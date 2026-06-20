# Developer Setup Guide — Quran Chat Buddy

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20 LTS | https://nodejs.org |
| npm | 10+ | bundled with Node |
| Expo CLI | latest | `npm install -g expo` |
| EAS CLI | latest | `npm install -g eas-cli` |
| Firebase CLI | latest | `npm install -g firebase-tools` |

---

## 1. Clone and Install

```bash
git clone <repo-url>
cd QuranChatBuddyApp
npm install
```

---

## 2. Configure Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and populate every variable. The minimum set required to run the app:

```env
# Firebase (from Firebase Console → Project Settings → Your apps)
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_DATABASE_URL=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=

# RevenueCat (from RevenueCat Dashboard → API keys)
EXPO_PUBLIC_REVENUECAT_TEST_API_KEY=   # used in __DEV__ mode
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=

# Google OAuth (from Google Cloud Console → Credentials)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=

# Optional: enables direct OpenAI calls in dev, bypassing Cloud Functions
EXPO_PUBLIC_OPENAI_API_KEY=
```

See `.env.example` for the full list including measurement IDs and platform client IDs.

---

## 3. Firebase Project Setup

### 3a. Enable Services

In the [Firebase Console](https://console.firebase.google.com):

1. **Authentication** → Sign-in methods → Enable: Anonymous, Email/Password, Google, Apple
2. **Realtime Database** → Create database → Start in **test mode** (tighten rules before production)
3. **Storage** → Create bucket (needed for quiz question bank)
4. **Functions** → Will be deployed in step 5

### 3b. Realtime Database Rules

Paste the following minimal rules to get started (refine for production):

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "presence": {
      "$uid": {
        ".read": "auth != null",
        ".write": "$uid === auth.uid"
      }
    },
    "device_accounts": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "device_usage": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

### 3c. Firebase CLI Login

```bash
firebase login
firebase use <your-project-id>
```

---

## 4. Cloud Functions Setup

### 4a. Set the OpenAI Secret

```bash
firebase functions:secrets:set OPENAI_API_KEY
# Enter your OpenAI API key when prompted
```

### 4b. Configure Functions Environment

```bash
cd functions
cp .env.quran-chat-buddy-prayer-time.example .env.quran-chat-buddy-prayer-time  # if exists
```

### 4c. Deploy Functions

```bash
npm run deploy:functions
# or manually:
firebase deploy --only functions
```

---

## 5. EAS Build Secrets

For EAS production builds, store secrets via EAS (do not commit `.env` to git):

```bash
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "your-value"
# Repeat for each EXPO_PUBLIC_* variable
```

Reference: `eas.json` defines `development`, `preview`, and `production` build profiles.

---

## 6. Running the App Locally

```bash
# Start Metro bundler
npx expo start

# Run on Android emulator
npx expo run:android

# Run on iOS simulator
npx expo run:ios
```

> **Note**: Push notifications require a development build (`eas build --profile development`). Local notifications work in Expo Go.

---

## 7. Building for Distribution

```bash
# Android APK/AAB
npm run build:android

# iOS IPA
npm run build:ios
```

Both commands use EAS Build. Ensure all EAS secrets are set before running.

---

## 8. Useful Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Metro bundler |
| `npm run android` | Run on connected Android device |
| `npm run ios` | Run on iOS simulator |
| `npm run deploy:functions` | Deploy Firebase Cloud Functions |
| `npm run build:android` | EAS production Android build |
| `npm run build:ios` | EAS production iOS build |
