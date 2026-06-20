import { useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { GlassDashboardCard } from "../ui/GlassDashboardCard";
import { useFocusEffect } from "@react-navigation/native";
import { quizService } from "../../services/quizService";
import { theme } from "../../theme";
import { useRouter } from "expo-router";
import { AuthService } from "../../services/authService";
import logger from "../../services/logger";

export const QuizDashboard = ({ onQuizPress }) => {
    const router = useRouter();
    const [isCompleted, setIsCompleted] = useState(false);
    const [result, setResult] = useState(null);
    const [streak, setStreak] = useState({ current: 0, longest: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useFocusEffect(
        useCallback(() => {
            loadQuizStatus();
        }, []),
    );

    const loadQuizStatus = async () => {
        try {
            setLoading(true);
            setError(null);
            await AuthService.ensureAuthenticated();
            const userId = AuthService.getCurrentUser()?.uid;
            if (!userId) {
                throw new Error("Not signed in");
            }
            await quizService.ensureQuizData(userId);
            void quizService.ensureQuestionBank().catch((bankError) => {
                logger.warn(
                    "Quiz bank preload failed:",
                    bankError?.message ?? bankError,
                );
            });

            const [completed, todayResult, currentStreak] = await Promise.all([
                quizService.isTodayQuizCompleted(),
                quizService.getTodayResult(),
                quizService.getCurrentStreak(),
            ]);

            setIsCompleted(completed);
            setResult(todayResult);
            setStreak(currentStreak);
        } catch (error) {
            logger.error("Error loading quiz status:", error);
            setError("Failed to load quiz. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleQuizPress = () => {
        if (error) {
            loadQuizStatus();
            return;
        }

        if (isCompleted && result) {
            router.push("(tabs)/quiz/stats");
        } else {
            if (onQuizPress) {
                onQuizPress();
            } else {
                router.push("quiz");
            }
        }
    };

    const handleRetry = () => {
        loadQuizStatus();
    };

    if (loading) {
        return (
            <GlassDashboardCard disabled>
                <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.loadingText}>Loading quiz...</Text>
                </View>
            </GlassDashboardCard>
        );
    }

    if (error) {
        return (
            <GlassDashboardCard onPress={handleRetry}>
                <View style={styles.header}>
                    <Text style={styles.icon}>⚠️</Text>
                    <View style={styles.headerText}>
                        <Text style={styles.title}>Daily Islamic Quiz</Text>
                        <Text style={styles.subtitle}>Failed to load</Text>
                    </View>
                </View>
                <Text style={styles.bodyText}>{error}</Text>
                <Text style={styles.actionText}>Tap to retry →</Text>
            </GlassDashboardCard>
        );
    }

    return (
        <GlassDashboardCard onPress={handleQuizPress}>
            <View style={styles.header}>
                <Text style={styles.icon}>{isCompleted ? "✅" : "🧠"}</Text>
                <View style={styles.headerText}>
                    <Text style={styles.title}>Daily Islamic Quiz</Text>
                    <Text style={styles.subtitle}>
                        {isCompleted
                            ? "Completed for today!"
                            : "Test your knowledge"}
                    </Text>
                </View>
                <View style={styles.streakContainer}>
                    <Text style={styles.streakIcon}>🔥</Text>
                    <Text style={styles.streakText}>{streak.current}</Text>
                </View>
            </View>

            {isCompleted && result ? (
                <View style={styles.completedStats}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                            {result.score}/{result.totalQuestions}
                        </Text>
                        <Text style={styles.statLabel}>Score</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                            {result.percentage}%
                        </Text>
                        <Text style={styles.statLabel}>Accuracy</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                            {Math.round(result.timeSpent / 60)}m
                        </Text>
                        <Text style={styles.statLabel}>Time</Text>
                    </View>
                </View>
            ) : (
                <View style={styles.pendingBlock}>
                    <Text style={styles.bodyText}>
                        5 questions waiting for you
                    </Text>
                    <Text style={styles.subtitle}>
                        {streak.current > 0
                            ? `Keep your ${streak.current}-day streak!`
                            : "Start your learning streak!"}
                    </Text>
                </View>
            )}

            <Text style={styles.actionText}>
                {isCompleted ? "View stats →" : "Start Quiz →"}
            </Text>
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
    completedStats: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: theme.spacing.md,
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
    pendingBlock: { marginBottom: theme.spacing.md },
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
