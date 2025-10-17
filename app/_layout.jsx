import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { initializeFirebase } from "../src/services/firebase";
import { useAuthStore } from "../src/store/authStore";
import { NotificationService } from "../src/services/notificationService";
import { LocationService } from "../src/services/locationService";
import { PrayerNotificationService } from "../src/services/prayerNotificationService";
import { theme } from "../src/constants/theme";
import { LoadingScreen } from "../src/components/common/LoadingScreen";
import { DebugPanel } from "../src/components/debug/DebugPanel";

export default function RootLayout() {
    const { user, loading, initialize, isOnboarded } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        initializeApp();
    }, []);

    useEffect(() => {
        if (loading) return;

        // Add a small delay to ensure the component is mounted
        const navigationTimeout = setTimeout(() => {
            const inAuthGroup = segments[0] === "(auth)";
            const onboardingCompleted = isOnboarded;

            // Show onboarding first if not completed
            if (!onboardingCompleted) {
                router.replace("/(auth)/onboarding");
            }
            // If onboarding is completed but user is not authenticated, show welcome/login
            else if (onboardingCompleted && !user && !inAuthGroup) {
                router.replace("/(auth)/register");
            }
            // // If user is authenticated and onboarding is completed, show main app
            // else if (user && onboardingCompleted && !inAuthGroup) {
            //     router.replace("/(tabs)");
            // }
            // If user is authenticated but in auth group, redirect to main app
            else if (user && inAuthGroup && onboardingCompleted) {
                router.replace("/(tabs)");
            }
        }, 100);

        return () => clearTimeout(navigationTimeout);
    }, [user, loading, segments, isOnboarded]);

    const initializeApp = async () => {
        try {
            initializeFirebase();
            await initialize();
            await NotificationService.initialize();
            await LocationService.requestPermissions();
            await PrayerNotificationService.initialize();
        } catch (error) {
            console.error("App initialization error:", error);
        }
    };

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <PaperProvider theme={theme}>
                <Slot />
                <DebugPanel />
                <StatusBar style="auto" />
            </PaperProvider>
        </GestureHandlerRootView>
    );
}
