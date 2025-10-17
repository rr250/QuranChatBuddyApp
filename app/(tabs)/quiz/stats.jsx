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
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useQuizStats } from "../../../src/hooks/useQuizStats";
import { LoadingSpinner } from "../../../src/components/common/LoadingSpinner";
import { colors } from "../../../src/constants/theme";
import { useRouter } from "expo-router";

const QuizStatsScreen = ({}) => {
    const router = useRouter();
    const { stats, history, loading, refreshStats } = useQuizStats();

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <LoadingSpinner />
                    <Text style={styles.loadingText}>
                        Loading your stats...
                    </Text>
                </View>
            </SafeAreaView>
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
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Overall Stats */}
                <View style={styles.overallStatsContainer}>
                    <Text style={styles.sectionTitle}>
                        📊 Overall Statistics
                    </Text>

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
                </View>

                {/* Recent History */}
                <View style={styles.historyContainer}>
                    <Text style={styles.sectionTitle}>📅 Recent History</Text>

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
                </View>

                {/* Motivational Section */}
                <View style={styles.motivationContainer}>
                    <Text style={styles.motivationTitle}>🕌 Keep Learning</Text>
                    <Text style={styles.motivationText}>
                        "And say: My Lord, increase me in knowledge." - Quran
                        20:114
                    </Text>
                    <Text style={styles.motivationSubtext}>
                        Stay consistent with your daily learning to strengthen
                        your Islamic knowledge and build lasting habits.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "#666",
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    headerContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    backButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 20,
    },
    backButtonText: {
        color: "white",
        fontSize: 14,
        fontWeight: "600",
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "white",
    },
    refreshButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 20,
    },
    refreshButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
    content: {
        flex: 1,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 16,
    },
    overallStatsContainer: {
        marginBottom: 24,
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    statCard: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
        width: "48%",
        marginBottom: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#2E8B57",
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: "#666",
        textAlign: "center",
        marginBottom: 8,
    },
    statIcon: {
        fontSize: 20,
    },
    achievementsContainer: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    achievementsTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 12,
    },
    badgeGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f0f8f0",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
        marginBottom: 8,
    },
    badgeIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    badgeText: {
        fontSize: 12,
        color: "#2E8B57",
        fontWeight: "600",
    },
    historyContainer: {
        marginBottom: 24,
    },
    historyItem: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
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
        color: "#333",
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
        color: "#666",
    },
    historyTime: {
        fontSize: 12,
        color: "#666",
    },
    progressBar: {
        height: 4,
        backgroundColor: "#f0f0f0",
        borderRadius: 2,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: 2,
    },
    noHistoryContainer: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 32,
        alignItems: "center",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    noHistoryIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    noHistoryText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 8,
    },
    noHistorySubtext: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        lineHeight: 20,
    },
    motivationContainer: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 20,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    motivationTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 12,
        textAlign: "center",
    },
    motivationText: {
        fontSize: 14,
        color: "#2E8B57",
        fontStyle: "italic",
        textAlign: "center",
        marginBottom: 12,
        lineHeight: 20,
    },
    motivationSubtext: {
        fontSize: 12,
        color: "#666",
        textAlign: "center",
        lineHeight: 18,
    },
});

export default QuizStatsScreen;
