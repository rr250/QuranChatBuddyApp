# 🕌 Quran Chat Buddy

## 🎉 Features

### 🔐 **Complete Authentication System**
- Email/Password registration and login
- Google Sign-In integration
- Apple Sign-In for iOS
- Password reset functionality
- User profile management

### 🔥 **Firebase Integration**
- **Authentication**: Multi-provider auth with persistence
- **Firestore**: Quran verses, user data, settings
- **Realtime Database**: Live chat, prayer tracking, quiz results
- **Push Notifications**: Prayer reminders, daily quiz alerts
- **Cloud Functions**: Server-side logic (setup required)

### 📱 **Islamic Features**
- **Prayer Times**: Accurate calculation with location
- **Qibla Compass**: Direction to Mecca
- **Holy Quran**: Complete text with search
- **Daily Quiz**: Islamic knowledge testing
- **AI Chat**: Islamic guidance and questions
- **Dhikr Counter**: Digital prayer beads
- **Islamic Calendar**: Hijri dates

### 📊 **Advanced Functionality**
- Offline support for core features
- Background prayer notifications
- Progress tracking and statistics
- Dark/Light theme support
- Multiple languages support
- Social sharing capabilities

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
npx expo install
```

### 2. Firebase Configuration

#### Create Firebase Project:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project: `quran-chat-buddy`
3. Enable Authentication, Firestore, Realtime Database
4. Download config files

#### Update Config Files:
- Replace `src/services/firebase.js` with your Firebase config
- Add `google-services.json` (Android) to root
- Add `GoogleService-Info.plist` (iOS) to root

#### Firebase Security Rules:

**Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Quran data is read-only for authenticated users
    match /quran/{document=**} {
      allow read: if request.auth != null;
    }

    // Quiz questions are read-only
    match /quiz/{document=**} {
      allow read: if request.auth != null;
    }
  }
}
```

**Realtime Database Rules:**
```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "chat": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "quiz_results": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "prayer_tracking": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

### 3. Google OAuth Setup

#### Google Cloud Console:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google+ API
3. Create OAuth 2.0 credentials:

**Web Client ID:** (for Firebase Auth)
```
your-project-id.apps.googleusercontent.com
```

**Authorized Origins:**
```
http://localhost:19006
https://localhost:19006
https://your-project.firebaseapp.com
https://auth.expo.io
```

**Authorized Redirect URIs:**
```
http://localhost:19006
https://localhost:19006
https://your-project.firebaseapp.com/__/auth/handler
https://auth.expo.io/@your-username/your-app-slug
https://auth.expo.io/@rrrishabh7/quran-chat-buddy
```

#### Update Auth Service:
Replace client IDs in `src/components/auth/SocialLoginButtons.jsx`

### 4. Apple Sign-In Setup (iOS)

#### Apple Developer Console:
1. Create App ID with Sign In with Apple capability
2. Create Service ID for web authentication
3. Configure domains and return URLs
4. Generate private key for server communication

#### Update Bundle ID:
Update `app.json` with your Apple App ID

### 5. Push Notifications Setup

#### Firebase Console:
1. Go to Project Settings → Cloud Messaging
2. Upload APNs certificates (iOS)
3. Add FCM server key to app

#### Test Notifications:
```bash
npx expo start
# Open app on device
# Check logs for push token
```

## 📱 App Structure

```
QuranChatBuddy/
├── app/                          # Expo Router screens
│   ├── (auth)/                  # Authentication flow
│   │   ├── welcome.jsx          # Welcome screen
│   │   ├── login.jsx            # Login screen
│   │   ├── register.jsx         # Registration
│   │   └── forgot-password.jsx  # Password reset
│   ├── (tabs)/                  # Main app tabs
│   │   ├── index.jsx            # Home dashboard
│   │   ├── prayer.jsx           # Prayer times
│   │   ├── quran.jsx            # Quran reader
│   │   ├── quiz.jsx             # Daily quiz
│   │   ├── chat.jsx             # AI chat
│   │   └── profile.jsx          # User profile
│   └── _layout.jsx              # Root layout
├── src/
│   ├── components/              # Reusable components
│   │   ├── auth/               # Auth components
│   │   ├── common/             # Common UI
│   │   ├── home/               # Home components
│   │   ├── prayer/             # Prayer components
│   │   └── quran/              # Quran components
│   ├── constants/              # App constants
│   │   └── theme.js            # Theme configuration
│   ├── services/               # Business logic
│   │   ├── firebase.js         # Firebase setup
│   │   ├── authService.js      # Authentication
│   │   ├── prayerService.js    # Prayer calculations
│   │   ├── quranService.js     # Quran data
│   │   ├── notificationService.js # Push notifications
│   │   └── locationService.js  # Location handling
│   ├── store/                  # State management
│   │   └── authStore.js        # Auth store (Zustand)
│   └── utils/                  # Utility functions
├── assets/                     # App assets
├── app.json                    # Expo configuration
└── package.json               # Dependencies
```

## 🧪 Testing

### Run Development Server:
```bash
npx expo start
```

### Test Authentication:
1. Open app on device/simulator
2. Try registration with email
3. Test Google Sign-In
4. Test Apple Sign-In (iOS only)
5. Verify user data in Firebase Console

### Test Prayer Times:
1. Allow location permissions
2. Check prayer times accuracy
3. Test prayer notifications
4. Verify Qibla compass

### Test Offline Mode:
1. Disconnect internet
2. Navigate through app
3. Verify cached data works
4. Test offline prayer times

## 🚀 Production Deployment

### Build Commands:
```bash
# Android
npx expo build:android

# iOS
npx expo build:ios

# Web
npx expo export:web
```

### Environment Variables:
Create `.env` file:
```
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
GOOGLE_OAUTH_CLIENT_ID=your_client_id
```

### App Store Submission:
1. Update app metadata
2. Create app screenshots
3. Submit for review
4. Monitor crash reports

## 📚 Key Libraries Used

- **expo**: React Native framework
- **firebase**: Backend services
- **react-native-paper**: Material Design UI
- **zustand**: State management
- **adhan**: Prayer time calculations
- **moment**: Date/time handling
- **react-native-reanimated**: Animations
- **expo-notifications**: Push notifications
- **expo-location**: GPS services

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

## 🙏 Islamic Considerations

This app follows Islamic principles:
- Prayer time calculations use authentic methods
- Quranic content is sourced from verified translations
- Islamic calendar follows Hijri dates
- Respectful UI/UX design for Islamic content
- No inappropriate ads or content

## 📞 Support

- **Documentation**: Check Firebase docs for setup issues
- **Authentication**: Verify OAuth client IDs and redirect URIs
- **Notifications**: Check device settings and Firebase keys
- **Prayer Times**: Verify location permissions and calculation methods

## 🌟 Roadmap

### Upcoming Features:
- [ ] Audio Quran recitations with famous reciters
- [ ] Hadith collections with search
- [ ] Islamic learning courses
- [ ] Community features and forums
- [ ] Waqf and charity integrations
- [ ] Advanced analytics dashboard
- [ ] Wear OS / Apple Watch support

**May Allah accept this effort and make it beneficial for the Ummah. Ameen! 🤲**

---

**Built with ❤️ for the Muslim Community**
**بارك الله فيكم**