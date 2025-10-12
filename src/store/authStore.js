import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthService } from "../services/authService";

export const useAuthStore = create(
    persist(
        (set, get) => ({
            // State
            user: null,
            loading: true,
            error: null,
            isOnboarded: false,

            // Actions
            setUser: (user) => set({ user, loading: false, error: null }),

            setLoading: (loading) => set({ loading }),

            setError: (error) => set({ error, loading: false }),

            clearError: () => set({ error: null }),

            setOnboarded: (isOnboarded) => set({ isOnboarded }),

            // Initialize auth state
            initialize: async () => {
                try {
                    set({ loading: true, error: null });

                    return new Promise((resolve) => {
                        const unsubscribe = AuthService.onAuthStateChanged(
                            (user) => {
                                unsubscribe();
                                set({ user, loading: false });
                                resolve(user);
                            }
                        );
                    });
                } catch (error) {
                    console.error("Auth initialization error:", error);
                    set({ error: error.message, loading: false, user: null });
                    throw error;
                }
            },

            // Sign in with email
            signInWithEmail: async (email, password) => {
                try {
                    set({ loading: true, error: null });
                    const user = await AuthService.signInWithEmail(
                        email,
                        password
                    );
                    set({ user, loading: false });
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
                        displayName
                    );
                    set({ user, loading: false });
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
                    set({ user: null, loading: false });
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
            }),
        }
    )
);
