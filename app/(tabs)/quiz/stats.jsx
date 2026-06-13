// src/screens/QuizStatsScreen.js
import React from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
} from "react-native";
import { ScreenShell, screenContentPadding } from "../../../src/components/navigation/ScreenShell";
import { GlassSection } from "../../../src/components/ui/GlassDashboardCard";
import { useQuizStats } from "../../../src/hooks/useQuizStats";
import { LoadingSpinner } from "../../../src/components/common/LoadingSpinner";
import { theme } from "../../../src/constants/theme";
import { glass } from "../../../src/constants/glass";

const QuizStatsScreen = ({}) => {
    const { stats, history, loading, refreshStats } = useQuizStats();

    if (loading) {
        return (
            <ScreenShell title="Quiz Stats" subtitle="Loading your progress...">
                <View style={styles.loadingContainer}>
                    <LoadingSpinner />
                    <Text style={styles.loadingText}>
                        Loading your stats...
                    </Text>
                </View>
            </ScreenShell>
        );
    }

    const renderHistoryItem = ({ item }) => (
        <View style={styles.historyItem}>
            <View style={styles.historyHeader}>
                <Text style={styles.historyDate}>
                    {new Date(item.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                    })}
                </Text>
                <Text
                    style={[
                        styles.historyScore,
                        {
                            color:
                                item.percentage >= 70
                                    ? "#4CAF50"
                                    : item.percentage >= 50
                                    ? "#FF9800"
                                    : "#f44336",
                        },
                    ]}
                >
                    {item.score}/{item.totalQuestions}
                </Text>
            </View>
            <View style={styles.historyDetails}>
                <Text style={styles.historyPercentage}>
                    {item.percentage}% accuracy
                </Text>
                <Text style={styles.historyTime}>
                    {Math.round(item.timeSpent / 60)} minutes
                </Text>
            </View>
            <View style={styles.progressBar}>
                <View
                    style={[
                        styles.progressFill,
                        {
                            width: `${item.percentage}%`,
                            backgroundColor:
                                item.percentage >= 70
                                    ? "#4CAF50"
                                    : item.percentage >= 50
                                    ? "#FF9800"
                                    : "#f44336",
                        },
                    ]}
                />
            </View>
        </View>
    );

    return (
        <ScreenShell title="Quiz Stats" subtitle="Your learning journey">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={screenContentPadding}
            >
                <GlassSection title="📊 Overall Statistics">
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>
                                {stats.currentStreak}
                            </Text>
                            <Text style={styles.statLabel}>Current Streak</Text>
                            <Text style={styles.statIcon}>🔥</Text>
                        </View>

                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>
                                {stats.longestStreak}
                            </Text>
                            <Text style={styles.statLabel}>Best Streak</Text>
                            <Text style={styles.statIcon}>⭐</Text>
                        </View>

                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>
                                {stats.totalQuizzes}
                            </Text>
                            <Text style={styles.statLabel}>Quizzes Taken</Text>
                            <Text style={styles.statIcon}>📝</Text>
                        </View>

                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>
                                {stats.averagePercentage}%
                            </Text>
                            <Text style={styles.statLabel}>Avg. Accuracy</Text>
                            <Text style={styles.statIcon}>🎯</Text>
                        </View>
                    </View>

                    {/* Achievement Badges */}
                    <View style={styles.achievementsContainer}>
                        <Text style={styles.achievementsTitle}>
                            🏆 Achievements
                        </Text>
                        <View style={styles.badgeGrid}>
                            {stats.currentStreak >= 7 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeIcon}>🔥</Text>
                                    <Text style={styles.badgeText}>
                                        Week Warrior
                                    </Text>
                                </View>
                            )}
                            {stats.longestStreak >= 30 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeIcon}>🌟</Text>
                                    <Text style={styles.badgeText}>
                                        Monthly Master
                                    </Text>
                                </View>
                            )}
                            {stats.averagePercentage >= 90 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeIcon}>🧠</Text>
                                    <Text style={styles.badgeText}>
                                        Scholar
                                    </Text>
                                </View>
                            )}
                            {stats.totalQuizzes >= 50 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeIcon}>📚</Text>
                                    <Text style={styles.badgeText}>
                                        Dedicated Learner
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </GlassSection>

                <GlassSection title="📅 Recent History">
                    {history.length > 0 ? (
                        <FlatList
                            data={history}
                            renderItem={renderHistoryItem}
                            keyExtractor={(item) => item.date}
                            scrollEnabled={false}
                            showsVerticalScrollIndicator={false}
                        />
                    ) : (
                        <View style={styles.noHistoryContainer}>
                            <Text style={styles.noHistoryIcon}>📝</Text>
                            <Text style={styles.noHistoryText}>
                                No quiz history yet
                            </Text>
                            <Text style={styles.noHistorySubtext}>
                                Complete your first daily quiz to see your
                                progress!
                            </Text>
                        </View>
                    )}
                </GlassSection>

                <GlassSection title="🕌 Keep Learning">
                    <Text style={styles.motivationText}>
                        "And say: My Lord, increase me in knowledge." - Quran
                        20:114
                    </Text>
                    <Text style={styles.motivationSubtext}>
                        Stay consistent with your daily learning to strengthen
                        your Islamic knowledge and build lasting habits.
                    </Text>
                </GlassSection>
            </ScrollView>
        </ScreenShell>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "rgba(255,255,255,0.8)",
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: theme.spacing.md,
    },
    statCard: {
        backgroundColor: glass.backgroundLight,
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
        width: "48%",
        marginBottom: 12,
        borderWidth: 1,
        borderColor: glass.borderSubtle,
    },
    statValue: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: "rgba(255,255,255,0.75)",
        textAlign: "center",
        marginBottom: 8,
    },
    statIcon: { fontSize: 20 },
    achievementsContainer: {
        marginTop: theme.spacing.sm,
    },
    achievementsTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 12,
    },
    badgeGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: glass.backgroundStrong,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: glass.borderSubtle,
    },
    badgeIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    badgeText: {
        fontSize: 12,
        color: theme.colors.secondary,
        fontWeight: "600",
    },
    historyItem: {
        backgroundColor: glass.backgroundLight,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: glass.borderSubtle,
    },
    historyHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    historyDate: {
        fontSize: 14,
        fontWeight: "600",
        color: "#fff",
    },
    historyScore: {
        fontSize: 16,
        fontWeight: "bold",
    },
    historyDetails: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    historyPercentage: {
        fontSize: 12,
        color: "rgba(255,255,255,0.75)",
    },
    historyTime: {
        fontSize: 12,
        color: "rgba(255,255,255,0.75)",
    },
    progressBar: {
        height: 4,
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 2,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: 2,
    },
    noHistoryContainer: {
        alignItems: "center",
        paddingVertical: theme.spacing.lg,
    },
    noHistoryIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    noHistoryText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#fff",
        marginBottom: 8,
    },
    noHistorySubtext: {
        fontSize: 14,
        color: "rgba(255,255,255,0.75)",
        textAlign: "center",
        lineHeight: 20,
    },
    motivationText: {
        fontSize: 14,
        color: theme.colors.secondary,
        fontStyle: "italic",
        textAlign: "center",
        marginBottom: 12,
        lineHeight: 20,
    },
    motivationSubtext: {
        fontSize: 12,
        color: "rgba(255,255,255,0.75)",
        textAlign: "center",
        lineHeight: 18,
    },
});

export default QuizStatsScreen;
