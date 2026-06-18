import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { initializeFirebase } from "../src/services/firebase";
import { RemoteConfigService } from "../src/services/remoteConfigService";
import { NotificationService } from "../src/services/notificationService";
import { useAuthStore } from "../src/store/authStore";
import { useSubscriptionStore } from "../src/store/subscriptionStore";
import { usePaywallStore } from "../src/store/paywallStore";
import { PaywallGate } from "../src/components/subscription/PaywallGate";
import { theme } from "../src/constants/theme";
import { LoadingScreen } from "../src/components/common/LoadingScreen";
import { DebugPanel } from "../src/components/debug/DebugPanel";

SplashScreen.preventAutoHideAsync().catch(() => {});

const AUTH_ROUTES_ALLOWED_WHEN_SIGNED_IN = new Set([
    "login",
    "register",
    "forgot-password",
]);

export default function RootLayout() {
    const user = useAuthStore((s) => s.user);
    const isOnboarded = useAuthStore((s) => s.isOnboarded);
    const _hasHydrated = useAuthStore((s) => s._hasHydrated);
    const segments = useSegments();
    const router = useRouter();

    const [isAppInitialized, setIsAppInitialized] = useState(false);
    const [isNavigationReady, setIsNavigationReady] = useState(false);
    const [isSigningInAnonymously, setIsSigningInAnonymously] = useState(false);
    const hasBootstrappedNavigation = useRef(false);

    const showLoadingScreen =
        !isAppInitialized ||
        !_hasHydrated ||
        isSigningInAnonymously ||
        !isNavigationReady;

    useEffect(() => {
        SplashScreen.hideAsync().catch(() => {});
    }, []);

    useEffect(() => {
        let alive = true;

        const initializeApp = async () => {
            try {
                initializeFirebase();
                await RemoteConfigService.initialize();
                await useAuthStore.getState().initialize();
                await NotificationService.initialize({
                    requestPermissions: false,
                });
                const { useSettingsStore } = await import(
                    "../src/store/settingsStore"
                );
                await useSettingsStore.getState().hydrate();
            } catch (error) {
                console.error("App initialization error:", error);
            } finally {
                if (alive) {
                    setIsAppInitialized(true);
                }
            }
        };

        initializeApp();

        return () => {
            alive = false;
        };
    }, []);

    useEffect(() => {
        if (useAuthStore.persist.hasHydrated()) {
            useAuthStore.getState().setHasHydrated(true);
        }
        return useAuthStore.persist.onFinishHydration(() => {
            useAuthStore.getState().setHasHydrated(true);
        });
    }, []);

    useEffect(() => {
        if (!isAppInitialized || !_hasHydrated || hasBootstrappedNavigation.current) {
            return;
        }

        hasBootstrappedNavigation.current = true;

        const bootstrapNavigation = async () => {
            try {
                const state = useAuthStore.getState();

                if (!state.isOnboarded) {
                    router.replace("/(auth)/onboarding");
                    return;
                }

                if (!state.user && !state.skipAnonymousSignIn) {
                    setIsSigningInAnonymously(true);
                    try {
                        const anonymousUser =
                            await useAuthStore.getState().signInAnonymously();
                        if (anonymousUser?.uid) {
                            await useSubscriptionStore
                                .getState()
                                .initialize(anonymousUser.uid);
                            await useSubscriptionStore
                                .getState()
                                .syncUser(anonymousUser.uid);
                        }
                        router.replace("/(tabs)");
                    } catch (error) {
                        console.error("Anonymous sign-in error:", error);
                        router.replace("/(tabs)");
                    } finally {
                        setIsSigningInAnonymously(false);
                    }
                    return;
                }

                if (state.user || state.isOnboarded) {
                    router.replace("/(tabs)");
                }
            } finally {
                setIsNavigationReady(true);
            }
        };

        bootstrapNavigation();
    }, [isAppInitialized, _hasHydrated, router]);

    useEffect(() => {
        if (!isNavigationReady || isSigningInAnonymously) return;

        const inAuthGroup = segments[0] === "(auth)";
        const currentAuthRoute = segments[1];
        const isAllowedAuthRoute =
            AUTH_ROUTES_ALLOWED_WHEN_SIGNED_IN.has(currentAuthRoute);

        if (!isOnboarded && !(inAuthGroup && currentAuthRoute === "onboarding")) {
            router.replace("/(auth)/onboarding");
            return;
        }

        if (user && inAuthGroup && isOnboarded && !isAllowedAuthRoute) {
            router.replace("/(tabs)");
        }
    }, [
        user,
        segments,
        isOnboarded,
        isSigningInAnonymously,
        isNavigationReady,
        router,
    ]);

    useEffect(() => {
        if (!isOnboarded || !isNavigationReady || user?.uid) return;

        let cancelled = false;

        const ensureGuestSession = async () => {
            try {
                const { AuthService } = await import(
                    "../src/services/authService"
                );
                const authUser = await AuthService.ensureAuthenticated();
                if (cancelled || !authUser?.uid) return;

                useAuthStore.getState().setUser(authUser);
                await useSubscriptionStore.getState().initialize(authUser.uid);
                await useSubscriptionStore.getState().syncUser(authUser.uid);
            } catch (error) {
                console.error("Background guest session error:", error);
            }
        };

        ensureGuestSession();

        return () => {
            cancelled = true;
        };
    }, [isOnboarded, isNavigationReady, user?.uid]);

    useEffect(() => {
        if (!user?.uid) return;
        useSubscriptionStore.getState().initialize(user.uid);
    }, [user?.uid]);

    useEffect(() => {
        if (!isNavigationReady || isSigningInAnonymously || !isOnboarded || !user?.uid) {
            return;
        }

        let cancelled = false;

        const prepareSession = async () => {
            await useSubscriptionStore.getState().syncUser(user.uid);
            if (!cancelled) {
                await usePaywallStore.getState().showAppOpenPaywallIfNeeded();
            }
        };

        prepareSession();

        return () => {
            cancelled = true;
        };
    }, [user?.uid, isOnboarded, isNavigationReady, isSigningInAnonymously]);

    useEffect(() => {
        if (!isNavigationReady) return;

        import("../src/store/settingsStore")
            .then(({ useSettingsStore }) =>
                useSettingsStore
                    .getState()
                    .syncDetectedCity({ silent: true }),
            )
            .catch(() => {});
    }, [isNavigationReady]);

    useEffect(() => {
        if (!isNavigationReady || !isOnboarded) return;

        let cancelled = false;

        const refreshFaithReminders = async () => {
            try {
                const { status } = await Notifications.getPermissionsAsync();
                const notificationsEnabled = await AsyncStorage.getItem(
                    "notifications_enabled",
                );

                if (cancelled || status !== "granted") {
                    return;
                }

                if (notificationsEnabled === "false") {
                    return;
                }

                if (notificationsEnabled !== "true") {
                    await AsyncStorage.setItem("notifications_enabled", "true");
                    await AsyncStorage.setItem(
                        "prayerNotificationsEnabled",
                        "true",
                    );
                    await AsyncStorage.setItem(
                        "verseNotificationsEnabled",
                        "true",
                    );
                }

                const { PrayerNotificationService } = await import(
                    "../src/services/prayerNotificationService"
                );
                await PrayerNotificationService.setupFaithReminders();

                const { NotificationService } = await import(
                    "../src/services/notificationService"
                );
                const pending =
                    await NotificationService.getPendingNotifications();
                console.log(
                    `Faith reminders refreshed (${pending.length} scheduled)`,
                );
            } catch (error) {
                console.warn("Failed to refresh faith reminders:", error);
            }
        };

        refreshFaithReminders();

        return () => {
            cancelled = true;
        };
    }, [isNavigationReady, isOnboarded]);

    return (
        <GestureHandlerRootView style={styles.root}>
            <PaperProvider theme={theme}>
                <Slot />
                <PaywallGate />
                {__DEV__ ? <DebugPanel /> : null}
                <StatusBar style="auto" />
                {showLoadingScreen ? (
                    <View style={styles.loadingOverlay} pointerEvents="auto">
                        <LoadingScreen />
                    </View>
                ) : null}
            </PaperProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        elevation: 9999,
    },
});
