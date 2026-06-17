import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthService } from "../services/authService";
import { userSyncService } from "../services/userSyncService";

let authUnsubscribe = null;

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            loading: true,
            error: null,
            isOnboarded: false,
            isAnonymous: false,
            skipAnonymousSignIn: false,
            _hasHydrated: false,

            setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),

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

            syncOnboardingFlag: async () => {
                const completed = await AsyncStorage.getItem(
                    "onboarding_completed",
                );
                if (completed !== "true" && get().isOnboarded) {
                    set({ isOnboarded: false });
                }
            },

            resetForFreshStart: async () => {
                try {
                    if (authUnsubscribe) {
                        authUnsubscribe();
                        authUnsubscribe = null;
                    }
                    await AuthService.signOut().catch(() => {});
                    await AsyncStorage.clear();
                    set({
                        user: null,
                        loading: false,
                        error: null,
                        isOnboarded: false,
                        isAnonymous: false,
                        skipAnonymousSignIn: false,
                    });
                    await get().initialize();
                } catch (error) {
                    console.error("Reset for fresh start error:", error);
                    throw error;
                }
            },

            initialize: async () => {
                try {
                    set({ loading: true, error: null });

                    if (authUnsubscribe) {
                        authUnsubscribe();
                    }

                    const user = await new Promise((resolve) => {
                        let resolved = false;
                        authUnsubscribe = AuthService.onAuthStateChanged(
                            async (authUser) => {
                                if (!resolved) {
                                    resolved = true;
                                    resolve(authUser);
                                    return;
                                }

                                if (authUser?.uid) {
                                    await userSyncService
                                        .mergeOnLogin(authUser.uid)
                                        .catch(() => {});
                                }

                                set({
                                    user: authUser,
                                    loading: false,
                                    isAnonymous: authUser?.isAnonymous ?? false,
                                    ...(authUser
                                        ? { skipAnonymousSignIn: false }
                                        : {}),
                                });
                            },
                        );
                    });

                    if (user?.uid) {
                        await userSyncService.mergeOnLogin(user.uid);
                    }

                    await get().syncOnboardingFlag();

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

            signInWithEmail: async (email, password) => {
                try {
                    set({ loading: true, error: null, skipAnonymousSignIn: false });
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

            signUpWithEmail: async (email, password, displayName) => {
                try {
                    set({ loading: true, error: null, skipAnonymousSignIn: false });
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

            signInAnonymously: async () => {
                try {
                    set({ loading: true, error: null, skipAnonymousSignIn: false });
                    const user = await AuthService.signInAnonymously();
                    set({ user, loading: false, isAnonymous: true });
                    return user;
                } catch (error) {
                    set({ error: error.message, loading: false });
                    throw error;
                }
            },

            linkWithEmailPassword: async (email, password, displayName) => {
                try {
                    set({ loading: true, error: null, skipAnonymousSignIn: false });
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

            linkWithGoogle: async (idToken) => {
                try {
                    set({ loading: true, error: null, skipAnonymousSignIn: false });
                    const user = await AuthService.linkWithGoogle(idToken);
                    set({ user, loading: false, isAnonymous: false });
                    return user;
                } catch (error) {
                    set({ error: error.message, loading: false });
                    throw error;
                }
            },

            linkWithApple: async () => {
                try {
                    set({ loading: true, error: null, skipAnonymousSignIn: false });
                    const user = await AuthService.linkWithApple();
                    set({ user, loading: false, isAnonymous: false });
                    return user;
                } catch (error) {
                    set({ error: error.message, loading: false });
                    throw error;
                }
            },

            processGoogleLinking: async (response) => {
                try {
                    set({ loading: true, error: null, skipAnonymousSignIn: false });
                    const user =
                        await AuthService.processGoogleLinking(response);
                    set({ user, loading: false, isAnonymous: false });
                    return user;
                } catch (error) {
                    set({ error: error.message, loading: false });
                    throw error;
                }
            },

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

            signOut: async () => {
                try {
                    set({ loading: true, error: null });
                    const { useSubscriptionStore } = await import(
                        "./subscriptionStore"
                    );
                    await useSubscriptionStore.getState().reset();
                    await AuthService.signOut();
                    set({
                        user: null,
                        loading: false,
                        isAnonymous: false,
                        skipAnonymousSignIn: true,
                    });
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
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        },
    ),
);
