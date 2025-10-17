// src/components/quran/QuranDashboard.js - Home page Quran widget
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { quranService } from "../../services/quranService";
import { colors, spacing } from "../../constants/theme";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";

export const QuranDashboard = ({ onQuranPress }) => {
    const router = useRouter();
    const [progress, setProgress] = useState(null);
    const [currentSurah, setCurrentSurah] = useState(null);
    const [nextSurah, setNextSurah] = useState(null);
    const [readingStats, setReadingStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuthStore();

    // Refresh data when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            if (user) {
                loadQuranData();
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

            // Initialize user progress if needed
            await quranService.initializeUserProgress();

            // Load user progress and stats
            const [userProgress, stats] = await Promise.all([
                quranService.getUserProgress(),
                quranService.getReadingStats(),
            ]);
            console.log("User Quran progress:", userProgress, stats);

            setProgress(userProgress);
            setReadingStats(stats);

            // Determine current and next Surah
            await determineCurrentSurah(userProgress);
        } catch (error) {
            console.error("Error loading Quran data:", error);
            setError("Failed to load Quran progress. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const determineCurrentSurah = async (userProgress) => {
        try {
            // Get the current Surah user is reading (from progress or default to 1)
            const currentSurahNumber = userProgress?.currentSurah || 1;

            // Get current Surah info
            const current = await quranService.getSurah(currentSurahNumber);
            setCurrentSurah(current);

            // Determine next Surah to read
            let nextSurahNumber = currentSurahNumber;

            // Check if current Surah is completed
            const completedSurahs = userProgress?.completedSurahs || [];
            if (completedSurahs.includes(currentSurahNumber)) {
                // Find next incomplete Surah
                for (let i = currentSurahNumber + 1; i <= 114; i++) {
                    if (!completedSurahs.includes(i)) {
                        nextSurahNumber = i;
                        break;
                    }
                }

                // If all Surahs completed, restart from 1
                if (
                    nextSurahNumber === currentSurahNumber &&
                    completedSurahs.length === 114
                ) {
                    nextSurahNumber = 1;
                }
            }

            const next = await quranService.getSurah(nextSurahNumber);
            setNextSurah(next);
        } catch (error) {
            console.error("Error determining current Surah:", error);
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

    const handleContinueReading = () => {
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
        } else if (currentStreak >= 3) {
            return `Great progress! ${currentStreak} days strong! 💪`;
        } else if (totalVersesRead > 100) {
            return `${totalVersesRead} verses read! Keep going! 📖`;
        } else if (completionPercentage > 0) {
            return `${completionPercentage}% complete! Excellent! ⭐`;
        } else {
            return "Begin your blessed journey 🕌";
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator
                    size="small"
                    color={colors?.primary || "#2E8B57"}
                />
                <Text style={styles.loadingText}>Loading Quran...</Text>
            </View>
        );
    }

    // Show error state with retry option
    if (error) {
        return (
            <TouchableOpacity onPress={loadQuranData} activeOpacity={0.8}>
                <LinearGradient
                    colors={["#FF6B6B", "#E85A4F"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.container}
                >
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <View style={styles.iconContainer}>
                                <Text style={styles.icon}>⚠️</Text>
                            </View>
                            <View style={styles.headerText}>
                                <Text style={styles.title}>Holy Quran</Text>
                                <Text style={styles.subtitle}>
                                    Failed to load
                                </Text>
                            </View>
                        </View>

                        <View style={styles.errorPrompt}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.actionText}>
                                Tap to retry →
                            </Text>
                        </View>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    // Show normal Quran dashboard
    return (
        <TouchableOpacity onPress={handleQuranPress} activeOpacity={0.8}>
            <LinearGradient
                colors={[
                    colors?.primary || "#2E8B57",
                    colors?.primaryDark || "#1F5F3F",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}
            >
                <View style={styles.content}>
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.icon}>📖</Text>
                        </View>
                        <View style={styles.headerText}>
                            <Text style={styles.title}>Holy Quran</Text>
                            <Text style={styles.subtitle}>
                                {getMotivationalMessage()}
                            </Text>
                        </View>
                        <View style={styles.streakContainer}>
                            <Text style={styles.streakIcon}>🔥</Text>
                            <Text style={styles.streakText}>
                                {readingStats?.currentStreak || 0}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.progressSection}>
                        <View style={styles.progressStats}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>
                                    {readingStats?.totalVersesRead || 0}
                                </Text>
                                <Text style={styles.statLabel}>Verses</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>
                                    {readingStats?.totalSurahsCompleted || 0}
                                    /114
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

                        <View style={styles.progressBarContainer}>
                            <View style={styles.progressBar}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        {
                                            width: `${Math.min(
                                                readingStats?.completionPercentage ||
                                                    0,
                                                100
                                            )}%`,
                                        },
                                    ]}
                                />
                            </View>
                        </View>
                    </View>

                    {nextSurah && (
                        <View style={styles.nextSurahSection}>
                            <Text style={styles.nextSurahLabel}>
                                Continue Reading:
                            </Text>
                            <TouchableOpacity
                                style={styles.nextSurahButton}
                                onPress={handleContinueReading}
                                activeOpacity={0.8}
                            >
                                <View style={styles.nextSurahContent}>
                                    <Text style={styles.nextSurahName}>
                                        {nextSurah.englishName}
                                    </Text>
                                    <Text style={styles.nextSurahDetails}>
                                        {nextSurah.name} •{" "}
                                        {nextSurah.numberOfAyahs} verses
                                    </Text>
                                </View>
                                <Text style={styles.nextSurahArrow}>→</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.footer}>
                        <Text style={styles.actionText}>View all Surahs →</Text>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        height: 160,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f0f0f0",
        borderRadius: 16,
        marginHorizontal: 16,
        marginVertical: 8,
    },
    loadingText: {
        marginLeft: 12,
        fontSize: 14,
        color: "#666",
    },
    container: {
        borderRadius: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    content: {
        padding: 20,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    icon: {
        fontSize: 24,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: "white",
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: "rgba(255,255,255,0.9)",
    },
    streakContainer: {
        alignItems: "center",
    },
    streakIcon: {
        fontSize: 20,
    },
    streakText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "white",
        marginTop: 2,
    },
    progressSection: {
        marginBottom: 16,
    },
    progressStats: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 12,
    },
    statItem: {
        alignItems: "center",
    },
    statValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: "white",
    },
    statLabel: {
        fontSize: 12,
        color: "rgba(255,255,255,0.8)",
        marginTop: 2,
    },
    progressBarContainer: {
        marginTop: 8,
    },
    progressBar: {
        height: 6,
        backgroundColor: "rgba(255,255,255,0.3)",
        borderRadius: 3,
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#DAA520",
        borderRadius: 3,
    },
    nextSurahSection: {
        marginBottom: 12,
    },
    nextSurahLabel: {
        fontSize: 14,
        color: "rgba(255,255,255,0.9)",
        marginBottom: 8,
        fontWeight: "600",
    },
    nextSurahButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.15)",
        borderRadius: 12,
        padding: 12,
    },
    nextSurahContent: {
        flex: 1,
    },
    nextSurahName: {
        fontSize: 16,
        fontWeight: "bold",
        color: "white",
        marginBottom: 2,
    },
    nextSurahDetails: {
        fontSize: 12,
        color: "rgba(255,255,255,0.8)",
    },
    nextSurahArrow: {
        fontSize: 18,
        color: "white",
        fontWeight: "bold",
    },
    signInPrompt: {
        alignItems: "center",
        marginBottom: 12,
    },
    signInText: {
        fontSize: 14,
        color: "rgba(255,255,255,0.9)",
        textAlign: "center",
        lineHeight: 20,
    },
    errorPrompt: {
        alignItems: "center",
        marginBottom: 12,
    },
    errorText: {
        fontSize: 14,
        color: "rgba(255,255,255,0.9)",
        textAlign: "center",
        lineHeight: 20,
    },
    footer: {
        alignItems: "flex-end",
    },
    actionText: {
        fontSize: 14,
        color: "rgba(255,255,255,0.9)",
        fontWeight: "600",
    },
});
