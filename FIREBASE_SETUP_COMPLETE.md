# 🔥 Complete Firebase Setup Guide

## Step-by-Step Firebase Configuration

### 1. Create Firebase Project
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project
firebase init
```

### 2. Enable Required Services
- Authentication (Email/Password, Google, Apple)
- Firestore Database
- Realtime Database  
- Cloud Storage
- Cloud Functions
- Cloud Messaging (FCM)

### 3. Security Rules Setup

#### Firestore Security Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User documents
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // User settings
      match /settings/{document} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // User statistics
      match /stats/{document} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    // Quran data (read-only for authenticated users)
    match /quran/{document=**} {
      allow read: if request.auth != null;
    }

    // Quiz questions and answers (read-only)
    match /quiz/{document=**} {
      allow read: if request.auth != null;
    }

    // Islamic content (read-only)
    match /islamic_content/{document=**} {
      allow read: if request.auth != null;
    }

    // Prayer times cache
    match /prayer_times/{document=**} {
      allow read: if request.auth != null;
      allow write: if false; // Only server can write
    }
  }
}
```

#### Realtime Database Rules:
```json
{
  "rules": {
    ".read": false,
    ".write": false,

    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid",
        ".validate": "auth != null"
      }
    },

    "chat_sessions": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },

    "quiz_results": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid",
        "$quiz_id": {
          ".validate": "newData.hasChildren(['score', 'totalQuestions', 'completedAt'])"
        }
      }
    },

    "prayer_tracking": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },

    "dhikr_counters": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },

    "presence": {
      "$uid": {
        ".read": true,
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

### 4. Cloud Functions Setup
```bash
# Initialize Cloud Functions
firebase init functions

# Install dependencies
cd functions
npm install
```

#### Essential Cloud Functions:
```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Send daily quiz notification
exports.sendDailyQuizNotification = functions.pubsub
  .schedule('0 9 * * *') // Daily at 9 AM
  .onRun(async (context) => {
    const message = {
      notification: {
        title: '🧠 Daily Islamic Quiz',
        body: 'Test your Islamic knowledge with today's quiz!'
      },
      topic: 'daily_quiz'
    };

    return admin.messaging().send(message);
  });

// Update user statistics
exports.updateUserStats = functions.firestore
  .document('quiz_results/{userId}/{quizId}')
  .onCreate(async (snap, context) => {
    const result = snap.data();
    const userId = context.params.userId;

    const userStatsRef = admin.firestore()
      .doc(`users/${userId}/stats/quiz`);

    return userStatsRef.set({
      totalQuizzes: admin.firestore.FieldValue.increment(1),
      totalScore: admin.firestore.FieldValue.increment(result.score),
      lastQuizDate: result.completedAt
    }, { merge: true });
  });
```

### 5. Data Population Scripts

#### Seed Quran Data:
```javascript
// scripts/seedQuran.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

// Quran data would be populated here
// This is a sample structure
const quranData = {
  surahs: [
    {
      id: 1,
      name: 'Al-Fatihah',
      arabicName: 'الفاتحة',
      englishName: 'The Opening',
      numberOfAyahs: 7,
      revelationType: 'Meccan',
      ayahs: [
        {
          number: 1,
          text: 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ',
          translation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.'
        }
        // ... more ayahs
      ]
    }
    // ... more surahs
  ]
};

async function seedQuranData() {
  try {
    const batch = firestore.batch();

    quranData.surahs.forEach(surah => {
      const surahRef = firestore.collection('quran').doc(surah.id.toString());
      batch.set(surahRef, surah);
    });

    await batch.commit();
    console.log('Quran data seeded successfully');
  } catch (error) {
    console.error('Error seeding Quran data:', error);
  }
}

seedQuranData();
```

### 6. Push Notification Setup

#### FCM Server Key Configuration:
1. Go to Firebase Console → Project Settings
2. Cloud Messaging tab
3. Copy Server Key
4. Add to app configuration

#### Test Notification:
```bash
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "DEVICE_TOKEN",
    "notification": {
      "title": "Test Notification",
      "body": "This is a test from Firebase!"
    }
  }'
```

### 7. Production Checklist

#### Security:
- [ ] Enable App Check
- [ ] Review security rules
- [ ] Enable audit logging
- [ ] Set up monitoring alerts

#### Performance:
- [ ] Enable offline persistence
- [ ] Optimize Firestore queries
- [ ] Implement data caching
- [ ] Minimize bundle size

#### Monitoring:
- [ ] Set up Crashlytics
- [ ] Enable Performance Monitoring
- [ ] Configure Analytics
- [ ] Set up alerting

### 8. Deployment Commands

#### Deploy Functions:
```bash
firebase deploy --only functions
```

#### Deploy Security Rules:
```bash
firebase deploy --only firestore:rules
firebase deploy --only database:rules
```

#### Deploy Hosting (if using):
```bash
firebase deploy --only hosting
```

### 9. Environment Management

#### Development:
```bash
firebase use development
firebase deploy
```

#### Production:
```bash
firebase use production
firebase deploy
```

This complete setup ensures your Quran Chat Buddy app has a robust, scalable Firebase backend with proper security and monitoring in place.
