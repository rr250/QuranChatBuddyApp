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
    signInAnonymously,
    linkWithCredential,
    EmailAuthProvider,
} from "firebase/auth";
import { ref, set, get, onDisconnect } from "firebase/database";
import { userSyncService } from "./userSyncService";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import { getGoogleRedirectUri } from "../utils/googleAuth";
import { getFirebaseAuth, getFirebaseDatabase } from "./firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeviceIdentityService } from "./deviceIdentityService";
import { DeviceAuthService } from "./deviceAuthService";

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
                password,
            );
            await this.updateUserPresence(userCredential.user);
            await this.syncOnboardingData(userCredential.user);
            await this.mergeUserData(userCredential.user);
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
                password,
            );
            const user = userCredential.user;

            // Update user profile
            await updateProfile(user, { displayName });

            // Create user document in Realtime Database
            await this.createUserDocument(user);

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

    static extractGoogleIdToken(response) {
        if (!response || response.type !== "success") return null;

        return (
            response.params?.id_token ??
            response.authentication?.idToken ??
            response.params?.idToken ??
            null
        );
    }

    // Process Google Sign-in Response
    static async processGoogleSignIn(response) {
        try {
            this.initialize();

            const idToken = this.extractGoogleIdToken(response);
            if (!idToken) {
                throw new Error("Google sign-in was cancelled");
            }

            const credential = GoogleAuthProvider.credential(idToken);
            const userCredential = await signInWithCredential(
                this.auth,
                credential,
            );

            await this.createUserDocument(userCredential.user);
            await this.updateUserPresence(userCredential.user);
            await this.syncOnboardingData(userCredential.user);
            await this.mergeUserData(userCredential.user);

            return userCredential.user;
        } catch (error) {
            console.error("Google sign-in error:", error);
            throw this.handleAuthError(error);
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
                credential,
            );

            // Update profile with Apple name if available
            if (fullName?.givenName) {
                const displayName =
                    `${fullName.givenName} ${fullName.familyName ?? ""}`.trim();
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

    static _ensureAuthPromise = null;
    static _ensureDevicePromise = null;

    static async ensureDeviceLinked() {
        this.initialize();
        const user = this.getCurrentUser();
        if (!user?.uid) return null;

        const deviceHash = await DeviceIdentityService.getDeviceHash();
        if (!deviceHash) return user;

        if (!this._ensureDevicePromise) {
            this._ensureDevicePromise = this.linkDeviceToCurrentUser(
                user,
                deviceHash,
            ).finally(() => {
                this._ensureDevicePromise = null;
            });
        }

        return this._ensureDevicePromise;
    }

    static async linkDeviceToCurrentUser(user, deviceHash) {
        try {
            await DeviceAuthService.registerDeviceAccount(deviceHash);
            return user;
        } catch (error) {
            const code = error?.code ?? "";
            if (code === "functions/already-exists") {
                const restored = await this.reconcileDeviceSession(
                    user,
                    deviceHash,
                );
                if (restored) return restored;

                const check =
                    await DeviceAuthService.checkDeviceRegistration(deviceHash);
                throw this.buildDeviceRestoreError({
                    linkedUid: check.linkedUid,
                    restoreUnavailable: true,
                    needsAnonymousSignIn: false,
                });
            }

            console.warn(
                "Device registration failed:",
                error?.message ?? error,
            );
            return user;
        }
    }

    static buildDeviceRestoreError(resolution) {
        const err = new Error(
            resolution?.restoreUnavailable
                ? "This device is already registered but sign-in could not be restored. Redeploy Cloud Functions, then fully restart the app."
                : "This device is already linked to an existing account.",
        );
        err.code = "device-restore-unavailable";
        err.linkedUid = resolution?.linkedUid ?? null;
        return err;
    }

    static async assertDeviceNotRegistered(deviceHash) {
        if (!deviceHash) return;

        const check = await DeviceAuthService.checkDeviceRegistration(deviceHash);
        if (check.registered) {
            throw this.buildDeviceRestoreError({
                linkedUid: check.linkedUid,
                restoreUnavailable: true,
                needsAnonymousSignIn: false,
            });
        }
    }

    static async reconcileDeviceSession(user, deviceHash) {
        if (!deviceHash) return user;

        try {
            const resolution = await DeviceAuthService.resolveDeviceAuth(
                deviceHash,
            );

            if (!DeviceAuthService.isDeviceClaimed(resolution)) {
                return user;
            }

            if (user?.uid === resolution.linkedUid) {
                return user;
            }

            console.warn(
                "Auth session mismatch; device linked to",
                resolution.linkedUid,
            );

            if (resolution.customToken) {
                const restored =
                    await DeviceAuthService.signInWithResolvedToken(
                        resolution.customToken,
                    );
                await this.createUserDocument(restored);
                await this.updateUserPresence(restored);
                return restored;
            }

            if (user) {
                await signOut(this.auth);
            }
            throw this.buildDeviceRestoreError(resolution);
        } catch (error) {
            if (error?.code === "device-restore-unavailable") {
                throw error;
            }
            console.warn(
                "Device reconcile failed:",
                error?.message ?? error,
            );
            return user;
        }
    }

    // Anonymous Authentication (one Firebase user per physical device)
    static async signInAnonymously() {
        try {
            this.initialize();
            const deviceHash = await DeviceIdentityService.getDeviceHash();

            if (deviceHash) {
                const resolution =
                    await DeviceAuthService.resolveDeviceAuth(deviceHash);

                if (resolution.customToken) {
                    const restored =
                        await DeviceAuthService.signInWithResolvedToken(
                            resolution.customToken,
                        );
                    await this.createUserDocument(restored);
                    await this.updateUserPresence(restored);
                    return restored;
                }

                if (DeviceAuthService.isDeviceClaimed(resolution)) {
                    const current = this.getCurrentUser();
                    if (current?.uid === resolution.linkedUid) {
                        return current;
                    }
                    if (current) {
                        await signOut(this.auth);
                    }
                    throw this.buildDeviceRestoreError(resolution);
                }
            }

            await this.assertDeviceNotRegistered(deviceHash);

            const userCredential = await signInAnonymously(this.auth);
            const user = userCredential.user;

            await this.createUserDocument(user);
            await this.updateUserPresence(user);

            return user;
        } catch (error) {
            if (error?.code === "device-restore-unavailable") {
                throw error;
            }
            console.error("Anonymous sign-in error:", error);
            throw this.handleAuthError(error);
        }
    }

    /** Ensures a Firebase user exists (anonymous) without blocking the UI on sign-in screens. */
    static async ensureAuthenticated() {
        this.initialize();
        let user = this.getCurrentUser();

        try {
            if (!user) {
                const { useAuthStore } = await import("../store/authStore");
                const { skipAnonymousSignIn, isOnboarded } =
                    useAuthStore.getState();

                if (skipAnonymousSignIn || !isOnboarded) {
                    return null;
                }

                if (!this._ensureAuthPromise) {
                    this._ensureAuthPromise = this.signInAnonymously().finally(
                        () => {
                            this._ensureAuthPromise = null;
                        },
                    );
                }
                user = await this._ensureAuthPromise;
            }

            if (!user) return null;

            const deviceHash = await DeviceIdentityService.getDeviceHash();
            if (deviceHash) {
                user = await this.reconcileDeviceSession(user, deviceHash);
            }

            return (await this.ensureDeviceLinked()) ?? user;
        } catch (error) {
            if (error?.code === "device-restore-unavailable") {
                await signOut(this.auth).catch(() => {});
            }
            throw error;
        }
    }

    static cancelPendingAuth() {
        this._ensureAuthPromise = null;
        this._ensureDevicePromise = null;
    }

    // Link Anonymous Account with Email/Password
    static async linkWithEmailPassword(email, password, displayName) {
        try {
            this.initialize();
            const currentUser = this.auth.currentUser;

            if (!currentUser) {
                throw new Error("No user is currently signed in");
            }

            if (!currentUser.isAnonymous) {
                throw new Error("Current user is not an anonymous account");
            }

            // Create email credential
            const credential = EmailAuthProvider.credential(email, password);

            // Link the credential to the anonymous account
            const userCredential = await linkWithCredential(
                currentUser,
                credential,
            );

            // Update user profile with display name
            if (displayName) {
                await updateProfile(userCredential.user, { displayName });
            }

            await this.syncOnboardingData(userCredential.user);
            await this.mergeUserData(userCredential.user);

            return userCredential.user;
        } catch (error) {
            console.error("Error linking with email/password:", error);
            throw this.handleAuthError(error);
        }
    }

    // Link Anonymous Account with Google
    static async linkWithGoogle(idToken) {
        try {
            this.initialize();
            const currentUser = this.auth.currentUser;

            if (!currentUser) {
                throw new Error("No user is currently signed in");
            }

            if (!currentUser.isAnonymous) {
                throw new Error("Current user is not an anonymous account");
            }

            // Create Google credential
            const credential = GoogleAuthProvider.credential(idToken);

            // Link the credential to the anonymous account
            const userCredential = await linkWithCredential(
                currentUser,
                credential,
            );

            await this.syncOnboardingData(userCredential.user);
            await this.mergeUserData(userCredential.user);

            return userCredential.user;
        } catch (error) {
            console.error("Error linking with Google:", error);
            throw this.handleAuthError(error);
        }
    }

    // Link Anonymous Account with Apple
    static async linkWithApple() {
        try {
            this.initialize();
            const currentUser = this.auth.currentUser;

            if (!currentUser) {
                throw new Error("No user is currently signed in");
            }

            if (!currentUser.isAnonymous) {
                throw new Error("Current user is not an anonymous account");
            }

            // Get Apple credentials
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

            // Link the credential to the anonymous account
            const userCredential = await linkWithCredential(
                currentUser,
                credential,
            );

            // Update profile with Apple name if available
            if (fullName?.givenName) {
                const displayName =
                    `${fullName.givenName} ${fullName.familyName ?? ""}`.trim();
                await updateProfile(userCredential.user, { displayName });
            }

            await this.syncOnboardingData(userCredential.user);
            await this.mergeUserData(userCredential.user);

            return userCredential.user;
        } catch (error) {
            console.error("Error linking with Apple:", error);
            throw this.handleAuthError(error);
        }
    }

    // Process Google Sign-in Response for Linking
    static async processGoogleLinking(response) {
        try {
            const idToken = this.extractGoogleIdToken(response);
            if (!idToken) {
                throw new Error("Google sign-in was cancelled");
            }
            return await this.linkWithGoogle(idToken);
        } catch (error) {
            console.error("Google linking error:", error);
            throw this.handleAuthError(error);
        }
    }

    static getGoogleOAuthSetupHint() {
        return `Add this redirect URI in Google Cloud Console (Web OAuth client):\n${getGoogleRedirectUri()}`;
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

    static async mergeUserData(user) {
        if (!user?.uid) return;
        await userSyncService.mergeOnLogin(user.uid);
    }

    // Ensures local data is merged with compact cloud sync blob only
    static async createUserDocument(user) {
        try {
            await this.mergeUserData(user);
            await this.syncOnboardingData(user);
        } catch (error) {
            console.error("Error syncing user data:", error);
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
                `users/${userId}/stats/${statType}`,
            );
            await set(statsRef, value);

            // Also update lastUpdated timestamp
            const lastUpdatedRef = ref(
                this.database,
                `users/${userId}/stats/lastUpdated`,
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

    static async syncOnboardingData(user, onboardingData = null) {
        try {
            if (!user?.uid) return;

            let userData = onboardingData;
            if (!userData) {
                const dataStr = await AsyncStorage.getItem("onboarding_data");
                if (!dataStr) return;
                userData = JSON.parse(dataStr);
            }

            const locationStr = await AsyncStorage.getItem("user_location");
            const notificationsEnabled = await AsyncStorage.getItem(
                "notifications_enabled",
            );
            const completedDate = await AsyncStorage.getItem(
                "onboarding_completed_date",
            );

            const onboardingPayload = {
                ...userData,
                location: locationStr ? JSON.parse(locationStr) : null,
                notificationsEnabled: notificationsEnabled === "true",
                completedAt: completedDate || new Date().toISOString(),
            };

            const profileRef = ref(
                this.database,
                `users/${user.uid}/profile`,
            );

            await set(profileRef, {
                name: userData.userName?.trim() || null,
                onboarding: onboardingPayload,
                updatedAt: Date.now(),
            });

            if (userData.userName?.trim()) {
                try {
                    await updateProfile(user, {
                        displayName: userData.userName.trim(),
                    });
                } catch (profileError) {
                    console.warn(
                        "Failed to update auth display name:",
                        profileError?.message ?? profileError,
                    );
                }
            }

            await userSyncService.pushToFirebase(user.uid);
            await AsyncStorage.setItem("onboarding_synced", "true");
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
