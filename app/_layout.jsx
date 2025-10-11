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

export default function RootLayout() {
    const { user, loading, initialize } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        initializeApp();
    }, []);

    useEffect(() => {
        if (loading) return;

        const inAuthGroup = segments[0] === "(auth)";

        if (user && inAuthGroup) {
            router.replace("/(tabs)");
        } else if (!user && !inAuthGroup) {
            router.replace("/(auth)");
        }
    }, [user, loading, segments]);

    const initializeApp = async () => {
        try {
            // Initialize Firebase
            initializeFirebase();

            // Initialize auth state
            await initialize();

            // Initialize services
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
                <StatusBar style="auto" />
            </PaperProvider>
        </GestureHandlerRootView>
    );
}
