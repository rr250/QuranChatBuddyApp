import React, { useEffect, useState } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    RefreshControl,
    Dimensions,
} from "react-native";
import { Text, Card, FAB, Avatar } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuthStore } from "../../src/store/authStore";
import { theme } from "../../src/constants/theme";
import { PrayerTimesCard } from "../../src/components/prayer/PrayerTimesCard";
import { QuranVerseCard } from "../../src/components/quran/QuranVerseCard";
import { QuickActionsGrid } from "../../src/components/home/QuickActionsGrid";
import { StatisticsCard } from "../../src/components/home/StatisticsCard";
import { IslamicQuoteCard } from "../../src/components/home/IslamicQuoteCard";
import { QuizDashboard } from "../../src/components/quiz/QuizDashboard";
import { NotificationService } from "../../src/services/notificationService";
import { QuranDashboard } from "../../src/components/quran/QuranDashboard";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
    const { user } = useAuthStore();
    const [refreshing, setRefreshing] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute

        return () => clearInterval(timer);
    }, []);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        try {
            // Refresh data here
            await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
            console.error("Refresh error:", error);
        } finally {
            setRefreshing(false);
        }
    }, []);

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return "Assalamu Alaikum - Blessed Morning";
        if (hour < 17) return "Assalamu Alaikum - Peaceful Afternoon";
        if (hour < 20) return "Assalamu Alaikum - Blessed Evening";
        return "Assalamu Alaikum - Peaceful Night";
    };

    const handleQuickAction = (action) => {
        switch (action) {
            case "prayer":
                router.push("/(tabs)/prayer");
                break;
            case "quran":
                router.push("/(tabs)/quran");
                break;
            case "quiz":
                router.push("/(tabs)/quiz");
                break;
            case "chat":
                router.push("/(tabs)/chat");
                break;
            default:
                break;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View style={styles.userInfo}>
                        <Avatar.Text
                            size={50}
                            label={user?.displayName?.charAt(0) || "U"}
                            style={styles.avatar}
                        />
                        <View style={styles.greetingContainer}>
                            <Text style={styles.greeting}>{getGreeting()}</Text>
                            <Text style={styles.userName}>
                                {user?.displayName || "User"}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.timeContainer}>
                        <Text style={styles.currentTime}>
                            {currentTime.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </Text>
                        <Text style={styles.currentDate}>
                            {currentTime.toLocaleDateString()}
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Islamic Greeting Card */}
                <Card style={styles.greetingCard}>
                    <Card.Content style={styles.greetingContent}>
                        <Text style={styles.arabicGreeting}>
                            السَّلاَمُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ
                        </Text>
                        <Text style={styles.greetingTranslation}>
                            Peace be upon you and Allah's mercy and blessings
                        </Text>
                        <View style={styles.islamicPattern}>
                            <Text style={styles.pattern}>✦ ◈ ✧ ◈ ✦</Text>
                        </View>
                    </Card.Content>
                </Card>

                {/* Prayer Times Card */}
                <PrayerTimesCard />
                <QuizDashboard
                    onQuizPress={() => {
                        router.push("/quiz");
                    }}
                />
                <QuranDashboard
                    onQuranPress={() => {
                        router.push("/(tabs)/quran");
                    }}
                />

                {/* Quick Actions */}
                <QuickActionsGrid onAction={handleQuickAction} />

                {/* Statistics */}
                <StatisticsCard />

                {/* Quran Verse of the Day */}
                <QuranVerseCard />

                {/* Islamic Quote */}
                <IslamicQuoteCard />

                <View style={styles.bottomSpacing} />
            </ScrollView>

            {/* Floating Action Button */}
            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => {
                    // Show quick actions menu
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.md,
    },
    headerContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    userInfo: {
        flexDirection: "row",
        alignItems: "center",
    },
    avatar: {
        backgroundColor: "rgba(255,255,255,0.2)",
    },
    greetingContainer: {
        marginLeft: theme.spacing.md,
    },
    greeting: {
        fontSize: 14,
        color: "rgba(255,255,255,0.9)",
        marginBottom: 2,
    },
    userName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "white",
    },
    timeContainer: {
        alignItems: "flex-end",
    },
    currentTime: {
        fontSize: 20,
        fontWeight: "bold",
        color: "white",
    },
    currentDate: {
        fontSize: 12,
        color: "rgba(255,255,255,0.8)",
    },
    content: {
        flex: 1,
        padding: theme.spacing.md,
    },
    greetingCard: {
        marginBottom: theme.spacing.md,
        elevation: 2,
    },
    greetingContent: {
        alignItems: "center",
        paddingVertical: theme.spacing.lg,
    },
    arabicGreeting: {
        fontSize: 18,
        fontWeight: "bold",
        color: theme.colors.primary,
        textAlign: "center",
        marginBottom: theme.spacing.md,
        lineHeight: 28,
    },
    greetingTranslation: {
        fontSize: 14,
        color: theme.colors.onSurfaceVariant,
        textAlign: "center",
        fontStyle: "italic",
        marginBottom: theme.spacing.md,
    },
    islamicPattern: {
        paddingVertical: theme.spacing.sm,
    },
    pattern: {
        fontSize: 16,
        color: theme.colors.secondary,
        letterSpacing: 6,
    },
    bottomSpacing: {
        height: 80,
    },
    fab: {
        position: "absolute",
        right: theme.spacing.md,
        bottom: theme.spacing.xl,
        backgroundColor: theme.colors.primary,
    },
});
