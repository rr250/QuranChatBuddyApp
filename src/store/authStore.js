import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthService } from "../services/authService";
import { userSyncService } from "../services/userSyncService";

export const useAuthStore = create(
    persist(
        (set, get) => ({
            // State
            user: null,
            loading: true,
            error: null,
            isOnboarded: false,
            isAnonymous: false,

            // Actions
            setUser: (user) =>
                set({
                    user,
                    loading: false,
                    error: null,
                    isAnonymous: user?.isAnonymous || false,
                }),

            setLoading: (loading) => set({ loading }),

            setError: (error) => set({ error, loading: false }),

            clearError: () => set({ error: null }),

            setOnboarded: (isOnboarded) => set({ isOnboarded }),

            // Initialize auth state
            initialize: async () => {
                try {
                    set({ loading: true, error: null });

                    const user = await new Promise((resolve) => {
                        const unsubscribe = AuthService.onAuthStateChanged(
                            (authUser) => {
                                unsubscribe();
                                resolve(authUser);
                            },
                        );
                    });

                    if (user?.uid) {
                        await userSyncService.mergeOnLogin(user.uid);
                    }

                    set({
                        user,
                        loading: false,
                        isAnonymous: user?.isAnonymous ?? false,
                    });
                    return user;
                } catch (error) {
                    console.error("Auth initialization error:", error);
                    set({
                        error: error.message,
                        loading: false,
                        user: null,
                        isAnonymous: false,
                    });
                    throw error;
                }
            },

            // Sign in with email
            signInWithEmail: async (email, password) => {
                try {
                    set({ loading: true, error: null });
                    const user = await AuthService.signInWithEmail(
                        email,
                        password,
                    );
                    set({ user, loading: false, isAnonymous: false });
                    return user;
                } catch (error) {
                    set({ error: error.message, loading: false });
                    throw error;
                }
            },

            // Sign up with email
            signUpWithEmail: async (email, password, displayName) => {
                try {
                    set({ loading: true, error: null });
                    const user = await AuthService.signUpWithEmail(
                        email,
                        password,
                        displayName,
                    );
                    set({ user, loading: false, isAnonymous: false });
                    return user;
                } catch (error) {
                    set({ error: error.message, loading: false });
                    throw error;
                }
            },

            // Sign in anonymously
            signInAnonymously: async () => {
                try {
                    set({ loading: true, error: null });
                    const user = await AuthService.signInAnonymously();
                    set({ user, loading: false, isAnonymous: true });
                    return user;
                } catch (error) {
                    set({ error: error.message, loading: false });
                    throw error;
                }
            },

            // Link anonymous account with email/password
            linkWithEmailPassword: async (email, password, displayName) => {
                try {
                    set({ loading: true, error: null });
                    const user = await AuthService.linkWithEmailPassword(
                        email,
                        password,
                        displayName,
                    );
                    set({ user, loading: false, isAnonymous: false });
                    return user;
                } catch (error) {
                    set({ error: error.message, loading: false });
                    throw error;
                }
            },

            // Link anonymous account with Google
            linkWithGoogle: async (idToken) => {
                try {
                    set({ loading: true, error: null });
                    const user = await AuthService.linkWithGoogle(idToken);
                    set({ user, loading: false, isAnonymous: false });
                    return user;
                } catch (error) {
                    set({ error: error.message, loading: false });
                    throw error;
                }
            },

            // Link anonymous account with Apple
            linkWithApple: async () => {
                try {
                    set({ loading: true, error: null });
                    const user = await AuthService.linkWithApple();
                    set({ user, loading: false, isAnonymous: false });
                    return user;
                } catch (error) {
                    set({ error: error.message, loading: false });
                    throw error;
                }
            },

            // Process Google linking response
            processGoogleLinking: async (response) => {
                try {
                    set({ loading: true, error: null });
                    const user =
                        await AuthService.processGoogleLinking(response);
                    set({ user, loading: false, isAnonymous: false });
                    return user;
                } catch (error) {
                    set({ error: error.message, loading: false });
                    throw error;
                }
            },

            // Reset password
            resetPassword: async (email) => {
                try {
                    set({ loading: true, error: null });
                    await AuthService.resetPassword(email);
                    set({ loading: false });
                } catch (error) {
                    set({ error: error.message, loading: false });
                    throw error;
                }
            },

            // Sign out
            signOut: async () => {
                try {
                    set({ loading: true, error: null });
                    await AuthService.signOut();
                    set({ user: null, loading: false, isAnonymous: false });
                } catch (error) {
                    set({ error: error.message, loading: false });
                    throw error;
                }
            },
        }),
        {
            name: "auth-store",
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                isOnboarded: state.isOnboarded,
                isAnonymous: state.isAnonymous,
            }),
        },
    ),
);
