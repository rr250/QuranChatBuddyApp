// src/screens/QuizScreen.js
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Animated,
    Dimensions,
} from "react-native";
import { ScreenShell, screenContentPadding } from "../../../src/components/navigation/ScreenShell";
import { GlassSurface } from "../../../src/components/ui/Glass";
import { useQuiz } from "../../../src/hooks/useQuiz";
import { LoadingSpinner } from "../../../src/components/common/LoadingSpinner";
import { theme } from "../../../src/constants/theme";
import { glass } from "../../../src/constants/glass";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

const QuizScreen = ({}) => {
    const {
        currentQuestion,
        currentAnswer,
        isCurrentQuestionAnswered,
        currentQuestionIndex,
        totalQuestions,
        progress,
        answerQuestion,
        nextQuestion,
        previousQuestion,
        canGoNext,
        canGoPrevious,
        isLastQuestion,
        isLoading,
        isCompleted,
        quizResult,
        streak,
    } = useQuiz();

    const router = useRouter();
    const [selectedOption, setSelectedOption] = useState(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const progressAnim = useState(new Animated.Value(0))[0];

    // Update progress animation
    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: progress,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [progress]);

    // Reset selected option when question changes
    useEffect(() => {
        if (currentAnswer) {
            setSelectedOption(currentAnswer.selectedAnswer);
            setShowExplanation(true);
        } else {
            setSelectedOption(null);
            setShowExplanation(false);
        }
    }, [currentQuestionIndex, currentAnswer]);

    if (isLoading) {
        return (
            <ScreenShell title="Daily Quiz" subtitle="Loading questions...">
                <View style={styles.loadingContainer}>
                    <LoadingSpinner />
                    <Text style={styles.loadingText}>
                        Loading today's quiz...
                    </Text>
                </View>
            </ScreenShell>
        );
    }

    if (isCompleted) {
        return (
            <QuizResultScreen
                result={quizResult}
                streak={streak}
                onReturnHome={() => router.back()}
            />
        );
    }

    if (!currentQuestion) {
        return (
            <ScreenShell title="Daily Quiz" subtitle="Unavailable">
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>
                        No questions available. Please try again later.
                    </Text>
                </View>
            </ScreenShell>
        );
    }

    const handleOptionSelect = (optionIndex) => {
        if (isCurrentQuestionAnswered) return; // Already answered

        setSelectedOption(optionIndex);
        answerQuestion(optionIndex);
        setShowExplanation(true);
    };

    const handleNext = () => {
        if (isLastQuestion) {
            Alert.alert(
                "Complete Quiz",
                "You have answered all questions. Ready to see your results?",
                [
                    { text: "Review Answers", style: "cancel" },
                    { text: "Complete Quiz", onPress: nextQuestion },
                ]
            );
        } else {
            nextQuestion();
        }
    };

    return (
        <ScreenShell
            title="Daily Islamic Quiz"
            subtitle={`Question ${currentQuestionIndex + 1} of ${totalQuestions} · 🔥 ${streak.current}`}
        >
            <View style={styles.progressBarContainer}>
                <Animated.View
                    style={[
                        styles.progressBar,
                        {
                            width: progressAnim.interpolate({
                                inputRange: [0, 100],
                                outputRange: ["0%", "100%"],
                            }),
                        },
                    ]}
                />
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={screenContentPadding}
                showsVerticalScrollIndicator={false}
            >
                <GlassSurface style={styles.questionCard}>
                    <View style={styles.questionHeader}>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>
                                {currentQuestion.category}
                            </Text>
                        </View>
                        <View style={styles.difficultyBadge}>
                            <Text style={styles.difficultyText}>
                                {currentQuestion.difficulty}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.questionText}>
                        {currentQuestion.question}
                    </Text>

                    <View style={styles.optionsContainer}>
                        {currentQuestion.options.map((option, index) => {
                            let optionStyle = styles.optionButton;
                            let optionTextStyle = styles.optionText;

                            if (showExplanation) {
                                if (index === currentQuestion.correctAnswer) {
                                    optionStyle = [
                                        styles.optionButton,
                                        styles.correctOption,
                                    ];
                                    optionTextStyle = [
                                        styles.optionText,
                                        styles.correctOptionText,
                                    ];
                                } else if (
                                    index === selectedOption &&
                                    index !== currentQuestion.correctAnswer
                                ) {
                                    optionStyle = [
                                        styles.optionButton,
                                        styles.wrongOption,
                                    ];
                                    optionTextStyle = [
                                        styles.optionText,
                                        styles.wrongOptionText,
                                    ];
                                }
                            } else if (selectedOption === index) {
                                optionStyle = [
                                    styles.optionButton,
                                    styles.selectedOption,
                                ];
                                optionTextStyle = [
                                    styles.optionText,
                                    styles.selectedOptionText,
                                ];
                            }

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={optionStyle}
                                    onPress={() => handleOptionSelect(index)}
                                    disabled={isCurrentQuestionAnswered}
                                >
                                    <View style={styles.optionContent}>
                                        <Text style={styles.optionLetter}>
                                            {String.fromCharCode(65 + index)}
                                        </Text>
                                        <Text style={optionTextStyle}>
                                            {option}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {showExplanation && (
                        <View style={styles.explanationContainer}>
                            <Text style={styles.explanationTitle}>
                                Explanation:
                            </Text>
                            <Text style={styles.explanationText}>
                                {currentQuestion.explanation}
                            </Text>
                        </View>
                    )}
                </GlassSurface>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.navButton,
                        !canGoPrevious && styles.navButtonDisabled,
                    ]}
                    onPress={previousQuestion}
                    disabled={!canGoPrevious}
                >
                    <Text
                        style={[
                            styles.navButtonText,
                            !canGoPrevious && styles.navButtonTextDisabled,
                        ]}
                    >
                        Previous
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.navButton,
                        styles.nextButton,
                        !canGoNext && styles.navButtonDisabled,
                    ]}
                    onPress={handleNext}
                    disabled={!canGoNext}
                >
                    <Text style={[styles.navButtonText, styles.nextButtonText]}>
                        {isLastQuestion ? "Complete Quiz" : "Next"}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScreenShell>
    );
};

// Quiz Result Screen Component
const QuizResultScreen = ({ result, streak, onReturnHome }) => {
    const getScoreEmoji = (percentage) => {
        if (percentage >= 90) return "🌟";
        if (percentage >= 80) return "🎉";
        if (percentage >= 70) return "👏";
        if (percentage >= 60) return "👍";
        return "💪";
    };

    const getScoreMessage = (percentage) => {
        if (percentage >= 90) return "Excellent! MashAllah!";
        if (percentage >= 80) return "Great job! Well done!";
        if (percentage >= 70) return "Good work! Keep it up!";
        if (percentage >= 60) return "Not bad! Practice more!";
        return "Keep learning! You can do better!";
    };

    return (
        <ScreenShell
            title="Quiz Complete!"
            subtitle={getScoreMessage(result.percentage)}
        >
            <View style={styles.resultHero}>
                <Text style={styles.resultEmoji}>
                    {getScoreEmoji(result.percentage)}
                </Text>
            </View>

            <ScrollView
                style={styles.resultContent}
                contentContainerStyle={screenContentPadding}
            >
                <GlassSurface style={styles.resultCard}>
                    <Text style={styles.scoreText}>
                        {result.score} / {result.totalQuestions}
                    </Text>
                    <Text style={styles.percentageText}>
                        {result.percentage}%
                    </Text>
                </GlassSurface>

                <GlassSurface style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{streak.current}</Text>
                        <Text style={styles.statLabel}>Current Streak</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{streak.longest}</Text>
                        <Text style={styles.statLabel}>Best Streak</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                            {Math.round(result.timeSpent / 60)}m
                        </Text>
                        <Text style={styles.statLabel}>Time Spent</Text>
                    </View>
                </GlassSurface>

                <GlassSurface style={styles.motivationCard}>
                    <Text style={styles.motivationTitle}>
                        🕌 Islamic Reminder
                    </Text>
                    <Text style={styles.motivationText}>
                        "And whoever relies upon Allah - then He is sufficient
                        for him. Indeed, Allah will accomplish His purpose." -
                        Quran 65:3
                    </Text>
                </GlassSurface>
            </ScrollView>

            <View style={styles.resultFooter}>
                <TouchableOpacity
                    style={styles.homeButton}
                    onPress={onReturnHome}
                >
                    <Text style={styles.homeButtonText}>Return to Home</Text>
                </TouchableOpacity>
            </View>
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
    errorContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: "rgba(255,255,255,0.8)",
        textAlign: "center",
    },
    progressBarContainer: {
        height: 4,
        backgroundColor: "rgba(255,255,255,0.2)",
        marginHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        borderRadius: 2,
        overflow: "hidden",
    },
    progressBar: {
        height: "100%",
        backgroundColor: theme.colors.secondary,
        borderRadius: 2,
    },
    content: { flex: 1 },
    questionCard: {
        padding: theme.spacing.lg,
        marginHorizontal: theme.spacing.md,
    },
    questionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    categoryBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: glass.backgroundStrong,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: glass.borderSubtle,
    },
    categoryText: {
        fontSize: 12,
        color: theme.colors.secondary,
        fontWeight: "600",
        textTransform: "capitalize",
    },
    difficultyBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: glass.backgroundStrong,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: glass.borderSubtle,
    },
    difficultyText: {
        fontSize: 12,
        color: "rgba(255,255,255,0.85)",
        fontWeight: "600",
        textTransform: "capitalize",
    },
    questionText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#fff",
        lineHeight: 26,
        marginBottom: 24,
    },
    optionsContainer: {
        marginBottom: 16,
    },
    optionButton: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        marginBottom: 12,
        backgroundColor: glass.backgroundLight,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: glass.borderSubtle,
    },
    selectedOption: {
        borderColor: theme.colors.primary,
        backgroundColor: glass.tint,
    },
    correctOption: {
        borderColor: "#4CAF50",
        backgroundColor: "rgba(76, 175, 80, 0.15)",
    },
    wrongOption: {
        borderColor: "#f44336",
        backgroundColor: "rgba(244, 67, 54, 0.12)",
    },
    optionContent: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    optionLetter: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: glass.backgroundStrong,
        color: "#fff",
        fontSize: 14,
        fontWeight: "bold",
        textAlign: "center",
        textAlignVertical: "center",
        marginRight: 12,
    },
    optionText: {
        fontSize: 16,
        color: "rgba(255,255,255,0.9)",
        flex: 1,
        lineHeight: 22,
    },
    selectedOptionText: {
        color: theme.colors.secondary,
        fontWeight: "600",
    },
    correctOptionText: {
        color: "#4CAF50",
        fontWeight: "600",
    },
    wrongOptionText: {
        color: "#f44336",
        fontWeight: "600",
    },
    explanationContainer: {
        marginTop: 16,
        padding: 16,
        backgroundColor: glass.backgroundLight,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.secondary,
    },
    explanationTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: theme.colors.secondary,
        marginBottom: 8,
    },
    explanationText: {
        fontSize: 14,
        color: "rgba(255,255,255,0.8)",
        lineHeight: 20,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: theme.spacing.md,
        paddingBottom: theme.spacing.lg,
    },
    navButton: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 24,
        backgroundColor: glass.backgroundStrong,
        borderRadius: 25,
        alignItems: "center",
        marginHorizontal: 8,
        borderWidth: 1,
        borderColor: glass.borderSubtle,
    },
    nextButton: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    navButtonDisabled: {
        opacity: 0.5,
    },
    navButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#fff",
    },
    nextButtonText: {
        color: "#fff",
    },
    navButtonTextDisabled: {
        color: "rgba(255,255,255,0.4)",
    },
    resultHero: {
        alignItems: "center",
        paddingVertical: theme.spacing.md,
    },
    resultEmoji: {
        fontSize: 64,
    },
    resultContent: {
        flex: 1,
    },
    resultCard: {
        padding: theme.spacing.xl,
        alignItems: "center",
        marginHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    scoreText: {
        fontSize: 48,
        fontWeight: "bold",
        color: "#fff",
    },
    percentageText: {
        fontSize: 24,
        fontWeight: "600",
        color: theme.colors.secondary,
        marginTop: 8,
    },
    statsGrid: {
        flexDirection: "row",
        padding: theme.spacing.lg,
        marginHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.md,
        justifyContent: "space-around",
    },
    statItem: {
        flex: 1,
        alignItems: "center",
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
    },
    motivationCard: {
        padding: theme.spacing.lg,
        marginHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    motivationTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 12,
        textAlign: "center",
    },
    motivationText: {
        fontSize: 14,
        color: "rgba(255,255,255,0.85)",
        lineHeight: 20,
        textAlign: "center",
        fontStyle: "italic",
    },
    resultFooter: {
        padding: theme.spacing.md,
    },
    homeButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 16,
        borderRadius: 25,
        alignItems: "center",
        marginHorizontal: theme.spacing.md,
    },
    homeButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "white",
    },
});

export default QuizScreen;
