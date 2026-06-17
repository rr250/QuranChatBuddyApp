import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { initializeFirebase } from "../src/services/firebase";
import { RemoteConfigService } from "../src/services/remoteConfigService";
import { NotificationService } from "../src/services/notificationService";
import { PrayerNotificationService } from "../src/services/prayerNotificationService";
import { useAuthStore } from "../src/store/authStore";
import { useSubscriptionStore } from "../src/store/subscriptionStore";
import { usePaywallStore } from "../src/store/paywallStore";
import { PaywallGate } from "../src/components/subscription/PaywallGate";
import { theme } from "../src/constants/theme";
import { LoadingScreen } from "../src/components/common/LoadingScreen";
import { DebugPanel } from "../src/components/debug/DebugPanel";

const AUTH_ROUTES_ALLOWED_WHEN_SIGNED_IN = new Set([
    "login",
    "register",
    "forgot-password",
]);

export default function RootLayout() {
    const {
        user,
        loading,
        initialize,
        isOnboarded,
        signInAnonymously,
        skipAnonymousSignIn,
        _hasHydrated,
    } = useAuthStore();
    const initializeSubscription = useSubscriptionStore((s) => s.initialize);
    const syncSubscriptionUser = useSubscriptionStore((s) => s.syncUser);
    const segments = useSegments();
    const router = useRouter();
    const [isSigningInAnonymously, setIsSigningInAnonymously] = useState(false);
    const hasAttemptedAnonymousSignIn = useRef(false);

    useEffect(() => {
        initializeApp();
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
        if (user?.uid) {
            initializeSubscription(user.uid);
        }
    }, [user?.uid]);

    useEffect(() => {
        if (loading || isSigningInAnonymously || !isOnboarded || !user?.uid) {
            return;
        }

        let cancelled = false;

        const prepareSession = async () => {
            await syncSubscriptionUser(user.uid);
            if (!cancelled) {
                await usePaywallStore.getState().showAppOpenPaywallIfNeeded();
            }
        };

        prepareSession();

        return () => {
            cancelled = true;
        };
    }, [user?.uid, isOnboarded, loading, isSigningInAnonymously]);

    useEffect(() => {
        if (loading || isSigningInAnonymously || !_hasHydrated) return;

        if (!isOnboarded) {
            hasAttemptedAnonymousSignIn.current = false;
        }

        const navigationTimeout = setTimeout(async () => {
            const inAuthGroup = segments[0] === "(auth)";
            const currentAuthRoute = segments[1];
            const isAllowedAuthRoute =
                AUTH_ROUTES_ALLOWED_WHEN_SIGNED_IN.has(currentAuthRoute);

            if (!isOnboarded) {
                router.replace("/(auth)/onboarding");
                return;
            }

            if (isOnboarded && !user && skipAnonymousSignIn && !inAuthGroup) {
                router.replace("/(auth)/login");
                return;
            }

            if (
                isOnboarded &&
                !user &&
                !skipAnonymousSignIn &&
                !hasAttemptedAnonymousSignIn.current
            ) {
                hasAttemptedAnonymousSignIn.current = true;
                setIsSigningInAnonymously(true);
                try {
                    const anonymousUser = await signInAnonymously();
                    setIsSigningInAnonymously(false);
                    await initializeSubscription(anonymousUser?.uid);
                    await syncSubscriptionUser(anonymousUser?.uid);
                    router.replace("/(tabs)");
                    return;
                } catch (error) {
                    console.error("Anonymous sign-in error:", error);
                    setIsSigningInAnonymously(false);
                    hasAttemptedAnonymousSignIn.current = false;
                    if (!inAuthGroup) {
                        router.replace("/(auth)/register");
                    }
                    return;
                }
            }

            if (
                user &&
                inAuthGroup &&
                isOnboarded &&
                !isAllowedAuthRoute
            ) {
                router.replace("/(tabs)");
            }
        }, 100);

        return () => clearTimeout(navigationTimeout);
    }, [
        user,
        loading,
        segments,
        isOnboarded,
        isSigningInAnonymously,
        skipAnonymousSignIn,
        _hasHydrated,
    ]);

    const initializeApp = async () => {
        try {
            initializeFirebase();
            await RemoteConfigService.initialize();
            await initialize();
            await NotificationService.initialize();
            await PrayerNotificationService.initialize();
            const { useSettingsStore } = await import("../src/store/settingsStore");
            await useSettingsStore.getState().hydrate();
        } catch (error) {
            console.error("App initialization error:", error);
        }
    };

    if (loading || isSigningInAnonymously || !_hasHydrated) {
        return <LoadingScreen />;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <PaperProvider theme={theme}>
                <Slot />
                <PaywallGate />
                {__DEV__ ? <DebugPanel /> : null}
                <StatusBar style="auto" />
            </PaperProvider>
        </GestureHandlerRootView>
    );
}
