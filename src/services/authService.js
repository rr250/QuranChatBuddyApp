import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile,
    GoogleAuthProvider,
    signInWithCredential,
    OAuthProvider,
} from "firebase/auth";
import {
    ref,
    set,
    get,
    update,
    onDisconnect,
    push,
    child,
} from "firebase/database";
import * as Google from "expo-auth-session/providers/google";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import { getFirebaseAuth, getFirebaseDatabase } from "./firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";

WebBrowser.maybeCompleteAuthSession();

export class AuthService {
    static auth = null;
    static database = null;

    static initialize() {
        if (!this.auth) {
            this.auth = getFirebaseAuth();
            this.database = getFirebaseDatabase();
        }
    }

    // Email/Password Authentication
    static async signInWithEmail(email, password) {
        try {
            this.initialize();
            const userCredential = await signInWithEmailAndPassword(
                this.auth,
                email,
                password
            );
            await this.updateUserPresence(userCredential.user);
            await this.syncOnboardingData(userCredential.user);
            return userCredential.user;
        } catch (error) {
            console.error("Email sign-in error:", error);
            throw this.handleAuthError(error);
        }
    }

    static async signUpWithEmail(email, password, displayName) {
        try {
            this.initialize();
            const userCredential = await createUserWithEmailAndPassword(
                this.auth,
                email,
                password
            );
            const user = userCredential.user;

            // Update user profile
            await updateProfile(user, { displayName });

            // Create user document in Realtime Database
            await this.createUserDocument(user, { displayName });

            // Update presence
            await this.updateUserPresence(user);

            // Sync onboarding data
            await this.syncOnboardingData(user);

            return user;
        } catch (error) {
            console.error("Email sign-up error:", error);
            throw this.handleAuthError(error);
        }
    }

    // Google Authentication Hook - to be used in React components
    static useGoogleAuth() {
        const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
            clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
            androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
            iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        });

        return { request, response, promptAsync };
    }

    // Process Google Sign-in Response
    static async processGoogleSignIn(response) {
        try {
            this.initialize();

            if (response?.type === "success") {
                const { id_token } = response.params;
                const credential = GoogleAuthProvider.credential(id_token);
                const userCredential = await signInWithCredential(
                    this.auth,
                    credential
                );

                await this.createUserDocument(userCredential.user);
                await this.updateUserPresence(userCredential.user);
                await this.syncOnboardingData(userCredential.user);

                return userCredential.user;
            }

            throw new Error("Google sign-in was cancelled");
        } catch (error) {
            console.error("Google sign-in error:", error);
            throw error;
        }
    }

    // Apple Authentication
    static async signInWithApple() {
        try {
            this.initialize();

            const appleCredential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            const { identityToken, fullName } = appleCredential;
            const provider = new OAuthProvider("apple.com");
            const credential = provider.credential({
                idToken: identityToken,
            });

            const userCredential = await signInWithCredential(
                this.auth,
                credential
            );

            // Update profile with Apple name if available
            if (fullName?.givenName) {
                const displayName =
                    `\${fullName.givenName} \${fullName.familyName || ''}`.trim();
                await updateProfile(userCredential.user, { displayName });
            }

            await this.createUserDocument(userCredential.user);
            await this.updateUserPresence(userCredential.user);
            await this.syncOnboardingData(userCredential.user);

            return userCredential.user;
        } catch (error) {
            console.error("Apple sign-in error:", error);
            throw error;
        }
    }

    // Password Reset
    static async resetPassword(email) {
        try {
            this.initialize();
            await sendPasswordResetEmail(this.auth, email);
        } catch (error) {
            console.error("Password reset error:", error);
            throw this.handleAuthError(error);
        }
    }

    // Sign Out
    static async signOut() {
        try {
            this.initialize();
            const user = this.auth.currentUser;

            if (user) {
                await this.updateUserPresence(user, false);
            }

            await signOut(this.auth);
        } catch (error) {
            console.error("Sign-out error:", error);
            throw error;
        }
    }

    // Auth State Observer
    static onAuthStateChanged(callback) {
        this.initialize();
        return onAuthStateChanged(this.auth, callback);
    }

    // User Document Management - Realtime Database
    static async createUserDocument(user, additionalData = {}) {
        try {
            const userRef = ref(this.database, `users/${user.uid}`);
            const userSnapshot = await get(userRef);

            if (!userSnapshot.exists()) {
                // Create the complete user data structure according to the guide
                const userData = {
                    profile: {
                        userId: user.uid,
                        createdAt: new Date().toISOString(),
                        name:
                            user.displayName ||
                            additionalData.displayName ||
                            "User",
                        email: user.email,
                        photoURL: user.photoURL || null,
                        lastLoginAt: new Date().toISOString(),
                        settings: {
                            notifications: true,
                            prayerReminders: true,
                            language: "en",
                            theme: "light",
                        },
                    },
                    stats: {
                        totalQuizzes: 0,
                        totalScore: 0,
                        totalTimeSpent: 0,
                        averageScore: 0,
                        averagePercentage: 0,
                        lastUpdated: new Date().toISOString(),
                        streak: {
                            current: 0,
                            longest: 0,
                            lastDate: null,
                        },
                        // Legacy stats for compatibility
                        prayersCompleted: 0,
                        quranPagesRead: 0,
                        quizzesTaken: 0,
                        currentStreak: 0,
                    },
                    quizResults: {}, // Will store daily quiz results by date
                    dailyQuestions: {}, // Will store daily questions by date
                    ...additionalData,
                };

                await set(userRef, userData);
                console.log(
                    "User document created successfully in Realtime Database with proper structure"
                );
            } else {
                // Update last login and ensure structure is complete
                const updates = {
                    "profile/lastLoginAt": new Date().toISOString(),
                };

                // Check if stats structure exists, if not create it
                const statsSnapshot = await get(
                    ref(this.database, `users/${user.uid}/stats`)
                );
                if (!statsSnapshot.exists()) {
                    updates["stats"] = {
                        totalQuizzes: 0,
                        totalScore: 0,
                        totalTimeSpent: 0,
                        averageScore: 0,
                        averagePercentage: 0,
                        lastUpdated: new Date().toISOString(),
                        streak: {
                            current: 0,
                            longest: 0,
                            lastDate: null,
                        },
                    };
                }

                await update(userRef, updates);
                console.log("User login updated and structure verified");
            }
        } catch (error) {
            console.error("Error creating user document:", error);
        }
    }

    // User Presence Management
    static async updateUserPresence(user, isOnline = true) {
        try {
            if (!user) return;

            const presenceRef = ref(this.database, `presence/${user.uid}`);
            const presenceData = {
                online: isOnline,
                lastSeen: Date.now(),
            };

            if (isOnline) {
                // Set user as online
                await set(presenceRef, presenceData);

                // Set user as offline when they disconnect
                onDisconnect(presenceRef).set({
                    online: false,
                    lastSeen: Date.now(),
                });
            } else {
                // Manually set user as offline
                await set(presenceRef, presenceData);
            }
        } catch (error) {
            console.error("Error updating user presence:", error);
        }
    }

    // Update user statistics
    static async updateUserStats(userId, statType, value) {
        try {
            const statsRef = ref(
                this.database,
                `users/${userId}/stats/${statType}`
            );
            await set(statsRef, value);

            // Also update lastUpdated timestamp
            const lastUpdatedRef = ref(
                this.database,
                `users/${userId}/stats/lastUpdated`
            );
            await set(lastUpdatedRef, new Date().toISOString());
        } catch (error) {
            console.error("Error updating user stats:", error);
        }
    }

    // Get user data
    static async getUserData(userId) {
        try {
            const userRef = ref(this.database, `users/${userId}`);
            const snapshot = await get(userRef);
            return snapshot.exists() ? snapshot.val() : null;
        } catch (error) {
            console.error("Error getting user data:", error);
            return null;
        }
    }

    static async syncOnboardingData(user) {
        try {
            const dataStr = await AsyncStorage.getItem("onboarding_data");
            const locationStr = await AsyncStorage.getItem("user_location");
            const notificationsEnabled = await AsyncStorage.getItem(
                "notifications_enabled"
            );

            if (dataStr) {
                const userData = JSON.parse(dataStr);
                const onboardingRef = ref(
                    this.database,
                    `users/${user.uid}/profile/onboarding`
                );

                await set(onboardingRef, {
                    ...userData,
                    location: locationStr ? JSON.parse(locationStr) : null,
                    notificationsEnabled: notificationsEnabled === "true",
                    completedAt: new Date().toISOString(),
                });

                await AsyncStorage.setItem("onboarding_synced", "true");
            }
        } catch (error) {
            console.error("Error syncing onboarding data:", error);
        }
    }

    // Error Handling
    static handleAuthError(error) {
        const errorMessages = {
            "auth/user-not-found": "No account found with this email address.",
            "auth/wrong-password": "Incorrect password. Please try again.",
            "auth/email-already-in-use":
                "This email address is already registered.",
            "auth/weak-password":
                "Password should be at least 6 characters long.",
            "auth/invalid-email": "Please enter a valid email address.",
            "auth/user-disabled": "This account has been disabled.",
            "auth/too-many-requests":
                "Too many failed attempts. Please try again later.",
            "auth/network-request-failed":
                "Network error. Please check your connection.",
            "auth/invalid-credential": "Invalid authentication credentials.",
            "auth/popup-closed-by-user": "Authentication popup was closed.",
            "auth/cancelled-popup-request": "Authentication was cancelled.",
            "auth/operation-not-allowed":
                "This sign-in method is not enabled. Please contact support.",
        };

        const message = errorMessages[error.code] || error.message;
        return new Error(message);
    }

    // Get Current User
    static getCurrentUser() {
        this.initialize();
        return this.auth.currentUser;
    }

    // Check if user is authenticated
    static isAuthenticated() {
        this.initialize();
        return !!this.auth.currentUser;
    }
}
