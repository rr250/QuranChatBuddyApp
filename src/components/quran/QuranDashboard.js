// src/components/quran/QuranDashboard.js - Home page Quran widget
import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { GlassDashboardCard } from "../ui/GlassDashboardCard";
import { useFocusEffect } from "@react-navigation/native";
import { quranService } from "../../services/quranService";
import { theme } from "../../constants/theme";
import { glass } from "../../constants/glass";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";

export const QuranDashboard = ({ onQuranPress }) => {
    const router = useRouter();
    const [nextSurah, setNextSurah] = useState(null);
    const [readingStats, setReadingStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuthStore();

    useFocusEffect(
        React.useCallback(() => {
            if (user) {
                loadQuranData();
            } else {
                setLoading(false);
            }
        }, [user])
    );

    const loadQuranData = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            await quranService.initializeUserProgress();

            const [userProgress, stats] = await Promise.all([
                quranService.getUserProgress(),
                quranService.getReadingStats(),
            ]);

            setReadingStats(stats);
            await determineNextSurah(userProgress);
        } catch (err) {
            console.error("Error loading Quran data:", err);
            setError("Failed to load Quran progress. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const determineNextSurah = async (userProgress) => {
        try {
            const currentSurahNumber = userProgress?.currentSurah || 1;
            const completedSurahs = userProgress?.completedSurahs || [];
            let nextSurahNumber = currentSurahNumber;

            if (completedSurahs.includes(currentSurahNumber)) {
                for (let i = currentSurahNumber + 1; i <= 114; i++) {
                    if (!completedSurahs.includes(i)) {
                        nextSurahNumber = i;
                        break;
                    }
                }
                if (
                    nextSurahNumber === currentSurahNumber &&
                    completedSurahs.length === 114
                ) {
                    nextSurahNumber = 1;
                }
            }

            const next = await quranService.getSurah(nextSurahNumber);
            setNextSurah(next);
        } catch (err) {
            console.error("Error determining next Surah:", err);
        }
    };

    const handleQuranPress = () => {
        if (error) {
            loadQuranData();
            return;
        }
        if (onQuranPress) {
            onQuranPress();
        } else {
            router.push("/(tabs)/quran");
        }
    };

    const handleContinueReading = (e) => {
        e?.stopPropagation?.();
        if (!user || !nextSurah) {
            handleQuranPress();
            return;
        }
        router.push({
            pathname: "(tabs)/quran/reader",
            params: {
                surahNumber: nextSurah.number,
                surahName: nextSurah.englishName,
            },
        });
    };

    const getMotivationalMessage = () => {
        if (!readingStats) return "Start your Quran journey today";

        const { currentStreak, totalVersesRead, completionPercentage } =
            readingStats;

        if (currentStreak >= 7) {
            return `Amazing! ${currentStreak} day streak! 🔥`;
        }
        if (currentStreak >= 3) {
            return `Great progress! ${currentStreak} days strong! 💪`;
        }
        if (totalVersesRead > 100) {
            return `${totalVersesRead} verses read! Keep going! 📖`;
        }
        if (completionPercentage > 0) {
            return `${completionPercentage}% complete! Excellent! ⭐`;
        }
        return "Begin your blessed journey 🕌";
    };

    if (loading) {
        return (
            <GlassDashboardCard disabled>
                <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.loadingText}>Loading Quran...</Text>
                </View>
            </GlassDashboardCard>
        );
    }

    if (!user) {
        return (
            <GlassDashboardCard onPress={handleQuranPress}>
                <View style={styles.header}>
                    <Text style={styles.icon}>🔒</Text>
                    <View style={styles.headerText}>
                        <Text style={styles.title}>Holy Quran</Text>
                        <Text style={styles.subtitle}>Sign in to track progress</Text>
                    </View>
                </View>
                <Text style={styles.bodyText}>
                    Read all 114 surahs offline and track your reading streak.
                </Text>
                <Text style={styles.actionText}>Tap to explore →</Text>
            </GlassDashboardCard>
        );
    }

    if (error) {
        return (
            <GlassDashboardCard onPress={loadQuranData}>
                <View style={styles.header}>
                    <Text style={styles.icon}>⚠️</Text>
                    <View style={styles.headerText}>
                        <Text style={styles.title}>Holy Quran</Text>
                        <Text style={styles.subtitle}>Failed to load</Text>
                    </View>
                </View>
                <Text style={styles.bodyText}>{error}</Text>
                <Text style={styles.actionText}>Tap to retry →</Text>
            </GlassDashboardCard>
        );
    }

    return (
        <GlassDashboardCard onPress={handleQuranPress}>
            <View style={styles.header}>
                <Text style={styles.icon}>📖</Text>
                <View style={styles.headerText}>
                    <Text style={styles.title}>Holy Quran</Text>
                    <Text style={styles.subtitle}>{getMotivationalMessage()}</Text>
                </View>
                <View style={styles.streakContainer}>
                    <Text style={styles.streakIcon}>🔥</Text>
                    <Text style={styles.streakText}>
                        {readingStats?.currentStreak || 0}
                    </Text>
                </View>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                        {readingStats?.totalVersesRead || 0}
                    </Text>
                    <Text style={styles.statLabel}>Verses</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                        {readingStats?.totalSurahsCompleted || 0}/114
                    </Text>
                    <Text style={styles.statLabel}>Surahs</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                        {readingStats?.completionPercentage || 0}%
                    </Text>
                    <Text style={styles.statLabel}>Complete</Text>
                </View>
            </View>

            <View style={styles.progressBar}>
                <View
                    style={[
                        styles.progressFill,
                        {
                            width: `${Math.min(
                                readingStats?.completionPercentage || 0,
                                100
                            )}%`,
                        },
                    ]}
                />
            </View>

            {nextSurah ? (
                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleContinueReading}
                    activeOpacity={0.8}
                >
                    <View style={styles.continueContent}>
                        <Text style={styles.continueLabel}>Continue reading</Text>
                        <Text style={styles.continueName}>{nextSurah.englishName}</Text>
                        <Text style={styles.continueMeta}>
                            {nextSurah.name} · {nextSurah.numberOfAyahs} verses
                        </Text>
                    </View>
                    <Text style={styles.continueArrow}>→</Text>
                </TouchableOpacity>
            ) : null}

            <Text style={styles.actionText}>View all surahs →</Text>
        </GlassDashboardCard>
    );
};

const styles = StyleSheet.create({
    loadingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: "rgba(255,255,255,0.8)",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: theme.spacing.md,
        gap: theme.spacing.md,
    },
    icon: { fontSize: 28 },
    headerText: { flex: 1 },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#fff",
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: "rgba(255,255,255,0.85)",
    },
    streakContainer: { alignItems: "center" },
    streakIcon: { fontSize: 20 },
    streakText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#fff",
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: theme.spacing.sm,
    },
    statItem: { alignItems: "center" },
    statValue: {
        fontSize: 18,
        fontWeight: "700",
        color: "#fff",
    },
    statLabel: {
        fontSize: 12,
        color: "rgba(255,255,255,0.75)",
        marginTop: 2,
    },
    progressBar: {
        height: 6,
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 3,
        marginBottom: theme.spacing.md,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: theme.colors.secondary,
        borderRadius: 3,
    },
    continueButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.2)",
        borderRadius: 12,
        padding: 12,
        marginBottom: theme.spacing.sm,
        borderWidth: 1,
        borderColor: glass.cardBorder,
    },
    continueContent: { flex: 1 },
    continueLabel: {
        fontSize: 12,
        color: "rgba(255,255,255,0.75)",
        marginBottom: 2,
    },
    continueName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#fff",
    },
    continueMeta: {
        fontSize: 12,
        color: "rgba(255,255,255,0.75)",
        marginTop: 2,
    },
    continueArrow: {
        fontSize: 18,
        color: "#fff",
        fontWeight: "700",
    },
    bodyText: {
        fontSize: 15,
        color: "#fff",
        marginBottom: theme.spacing.sm,
    },
    actionText: {
        fontSize: 14,
        color: theme.colors.secondary,
        fontWeight: "600",
        textAlign: "right",
    },
});
