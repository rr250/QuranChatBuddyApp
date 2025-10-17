// src/components/quiz/QuizDashboard.js - UPDATED for Firebase
import { useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { quizService } from "../../services/quizService";
import { colors, spacing } from "../../constants/theme";
import { useAuthStore } from "../../store/authStore";
import { useRouter } from "expo-router";

export const QuizDashboard = ({ onQuizPress }) => {
    const router = useRouter();
    const [isCompleted, setIsCompleted] = useState(false);
    const [result, setResult] = useState(null);
    const [streak, setStreak] = useState({ current: 0, longest: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuthStore();

    useFocusEffect(
        useCallback(() => {
            if (user) {
                console.log("Dashboard focused - refreshing quiz status");
                loadQuizStatus();
            }
        }, [user])
    );

    const loadQuizStatus = async () => {
        if (!user) {
            setLoading(false);
            setError("Please sign in to access the quiz");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Initialize user data if needed
            await quizService.initializeUserData();

            const [completed, todayResult, currentStreak] = await Promise.all([
                quizService.isTodayQuizCompleted(),
                quizService.getTodayResult(),
                quizService.getCurrentStreak(),
            ]);

            setIsCompleted(completed);
            setResult(todayResult);
            setStreak(currentStreak);
        } catch (error) {
            console.error("Error loading quiz status:", error);
            setError("Failed to load quiz. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleQuizPress = () => {
        if (!user) {
            Alert.alert(
                "Sign In Required",
                "Please sign in to access the daily quiz and track your progress.",
                [{ text: "OK" }]
            );
            return;
        }

        if (error) {
            // Retry loading
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
            <View style={styles.loadingContainer}>
                <ActivityIndicator
                    size="small"
                    color={colors?.primary || "#2E8B57"}
                />
                <Text style={styles.loadingText}>Loading quiz...</Text>
            </View>
        );
    }

    // Show sign-in prompt if user is not authenticated
    if (!user) {
        return (
            <TouchableOpacity onPress={handleQuizPress} activeOpacity={0.8}>
                <LinearGradient
                    colors={["#9E9E9E", "#616161"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.container}
                >
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <View style={styles.iconContainer}>
                                <Text style={styles.icon}>🔒</Text>
                            </View>
                            <View style={styles.headerText}>
                                <Text style={styles.title}>
                                    Daily Islamic Quiz
                                </Text>
                                <Text style={styles.subtitle}>
                                    Sign in to start learning
                                </Text>
                            </View>
                        </View>

                        <View style={styles.signInPrompt}>
                            <Text style={styles.signInText}>
                                Track your Islamic knowledge progress with daily
                                quizzes and streaks
                            </Text>
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.actionText}>
                                Tap to sign in →
                            </Text>
                        </View>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    // Show error state with retry option
    if (error) {
        return (
            <TouchableOpacity onPress={handleRetry} activeOpacity={0.8}>
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
                                <Text style={styles.title}>
                                    Daily Islamic Quiz
                                </Text>
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

    // Show normal quiz dashboard
    return (
        <TouchableOpacity onPress={handleQuizPress} activeOpacity={0.8}>
            <LinearGradient
                colors={
                    isCompleted
                        ? ["#4CAF50", "#2E7D32"]
                        : [
                              colors?.primary || "#2E8B57",
                              colors?.primaryDark || "#1F5F3F",
                          ]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}
            >
                <View style={styles.content}>
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.icon}>
                                {isCompleted ? "✅" : "🧠"}
                            </Text>
                        </View>
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
                            <Text style={styles.streakText}>
                                {streak.current}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.stats}>
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
                                    <Text style={styles.statLabel}>
                                        Accuracy
                                    </Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>
                                        {Math.round(result.timeSpent / 60)}m
                                    </Text>
                                    <Text style={styles.statLabel}>Time</Text>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.pendingStats}>
                                <Text style={styles.pendingText}>
                                    5 questions waiting for you
                                </Text>
                                <Text style={styles.encouragementText}>
                                    {streak.current > 0
                                        ? `Keep your ${streak.current}-day streak!`
                                        : "Start your learning streak!"}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.actionText}>
                            {isCompleted
                                ? "Come back tomorrow →"
                                : "Start Quiz →"}
                        </Text>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        height: 120,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f0f0f0",
        borderRadius: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        flexDirection: "row",
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
    stats: {
        marginBottom: 12,
    },
    completedStats: {
        flexDirection: "row",
        justifyContent: "space-around",
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
    pendingStats: {
        alignItems: "center",
    },
    pendingText: {
        fontSize: 16,
        color: "white",
        fontWeight: "600",
        marginBottom: 4,
    },
    encouragementText: {
        fontSize: 14,
        color: "rgba(255,255,255,0.9)",
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
