import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
} from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme, glass } from "../../src/theme";
import { PrayerTimesCardMini } from "../../src/components/prayer/PrayerTimesCardMini";
import { QuizDashboard } from "../../src/components/quiz/QuizDashboard";
import { QuranDashboard } from "../../src/components/quran/QuranDashboard";
import { QuranVerseCard } from "../../src/components/quran/QuranVerseCard";
import { IslamicQuoteCard } from "../../src/components/home/IslamicQuoteCard";
import { AppBackground, GlassSurface } from "../../src/components/ui/Glass";
import { ScreenHeader } from "../../src/components/navigation/ScreenHeader";
import { usePaywallAction } from "../../src/hooks/usePaywallAction";
import { PAYWALL_PLACEMENTS } from "../../src/constants/paywallConfig";

export default function HomeScreen() {
    const { withPaywallCheck } = usePaywallAction();
    const [refreshing, setRefreshing] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60_000);
        return () => clearInterval(timer);
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 400));
        } finally {
            setRefreshing(false);
        }
    }, []);

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return "Blessed Morning";
        if (hour < 17) return "Peaceful Afternoon";
        if (hour < 20) return "Blessed Evening";
        return "Peaceful Night";
    };

    return (
        <AppBackground>
            <SafeAreaView style={styles.container} edges={["top"]}>
                <ScreenHeader
                    title="Quran Chat Buddy"
                    subtitle={`Assalamu Alaikum — ${getGreeting()}`}
                    showHome={false}
                    leftAction={
                        <TouchableOpacity
                            style={styles.quranButton}
                            onPress={() => router.push("/(tabs)/quran")}
                            accessibilityLabel="Open Quran"
                        >
                            <MaterialCommunityIcons
                                name="book-open-page-variant"
                                size={22}
                                color="#fff"
                            />
                        </TouchableOpacity>
                    }
                    rightAction={
                        <TouchableOpacity
                            style={styles.settingsButton}
                            onPress={() => router.push("/(tabs)/profile")}
                            accessibilityLabel="Open profile and settings"
                        >
                            <MaterialCommunityIcons
                                name="account-cog-outline"
                                size={22}
                                color="#fff"
                            />
                        </TouchableOpacity>
                    }
                />

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={{ paddingBottom: theme.spacing.lg }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {/* <GlassSurface style={styles.heroCard}>
                        <View style={styles.heroContent}>
                            <Text style={styles.heroEmoji}>🕌</Text>
                            <Text style={styles.heroTitle}>
                                {user?.displayName ?? (isAnonymous ? "Guest" : "Friend")}
                            </Text>
                            <Text style={styles.heroSubtitle}>
                                Ask anything below — prayer, Quran, or daily guidance.
                            </Text>
                            <Text style={styles.heroTime}>
                                {currentTime.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}{" "}
                                · {currentTime.toLocaleDateString()}
                            </Text>
                        </View>
                    </GlassSurface> */}
                    <GlassSurface style={styles.sectionCard}>
                        <View style={styles.sectionContent}>
                            <Text style={styles.arabicGreeting}>
                                السَّلاَمُ عَلَيْكُمْ وَرَحْمَةُ اللهِ
                                وَبَرَكَاتُهُ
                            </Text>
                            <Text style={styles.greetingTranslation}>
                                Peace be upon you and Allah&apos;s mercy and
                                blessings
                            </Text>
                        </View>
                    </GlassSurface>
                    <PrayerTimesCardMini />
                    <QuranVerseCard
                        placement={PAYWALL_PLACEMENTS.DAILY_VERSE_CLICK}
                    />
                    <QuizDashboard
                        onQuizPress={withPaywallCheck(
                            () => router.push("/(tabs)/quiz"),
                            { placement: PAYWALL_PLACEMENTS.QUIZ_START },
                        )}
                    />
                    <QuranDashboard
                        onQuranPress={() => router.push("/(tabs)/quran")}
                    />
                    <IslamicQuoteCard
                        placement={PAYWALL_PLACEMENTS.TODAYS_TOPIC_CLICK}
                    />
                </ScrollView>
            </SafeAreaView>
        </AppBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    settingsButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: glass.backgroundStrong,
        borderWidth: 1,
        borderColor: glass.border,
    },
    quranButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: glass.backgroundStrong,
        borderWidth: 1,
        borderColor: glass.border,
    },
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing.md,
    },
    heroCard: { marginBottom: theme.spacing.md },
    heroContent: {
        padding: theme.spacing.lg,
        alignItems: "center",
    },
    heroEmoji: { fontSize: 42, marginBottom: theme.spacing.sm },
    heroTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#fff",
        marginBottom: theme.spacing.xs,
    },
    heroSubtitle: {
        fontSize: 14,
        color: "rgba(255,255,255,0.8)",
        textAlign: "center",
        lineHeight: 20,
    },
    heroTime: {
        marginTop: theme.spacing.md,
        fontSize: 13,
        color: "rgba(255,255,255,0.65)",
    },
    sectionCard: { marginBottom: theme.spacing.md },
    sectionContent: {
        padding: theme.spacing.lg,
        alignItems: "center",
    },
    arabicGreeting: {
        fontSize: 18,
        fontWeight: "700",
        color: "#fff",
        textAlign: "center",
        marginBottom: theme.spacing.sm,
        lineHeight: 28,
    },
    greetingTranslation: {
        fontSize: 14,
        color: "rgba(255,255,255,0.75)",
        textAlign: "center",
        fontStyle: "italic",
    },
});
