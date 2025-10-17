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
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useQuiz } from "../../../src/hooks/useQuiz";
import { LoadingSpinner } from "../../../src/components/common/LoadingSpinner";
import { colors, spacing } from "../../../src/constants/theme";
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
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <LoadingSpinner />
                    <Text style={styles.loadingText}>
                        Loading today's quiz...
                    </Text>
                </View>
            </SafeAreaView>
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
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>
                        No questions available. Please try again later.
                    </Text>
                </View>
            </SafeAreaView>
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
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={[
                    colors?.primary || "#2E8B57",
                    colors?.primaryDark || "#1F5F3F",
                ]}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <Text style={styles.backButtonText}>← Back</Text>
                        </TouchableOpacity>
                        <View style={styles.streakBadge}>
                            <Text style={styles.streakText}>
                                🔥 {streak.current}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.headerTitle}>Daily Islamic Quiz</Text>
                    <Text style={styles.questionCounter}>
                        Question {currentQuestionIndex + 1} of {totalQuestions}
                    </Text>
                </View>

                {/* Progress Bar */}
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
            </LinearGradient>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Question Card */}
                <View style={styles.questionCard}>
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

                    {/* Options */}
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

                    {/* Explanation */}
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
                </View>
            </ScrollView>

            {/* Navigation Footer */}
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
        </SafeAreaView>
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
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={[
                    colors?.primary || "#2E8B57",
                    colors?.primaryDark || "#1F5F3F",
                ]}
                style={styles.resultHeader}
            >
                <Text style={styles.resultTitle}>Quiz Complete!</Text>
                <Text style={styles.resultEmoji}>
                    {getScoreEmoji(result.percentage)}
                </Text>
            </LinearGradient>

            <ScrollView style={styles.resultContent}>
                <View style={styles.resultCard}>
                    <Text style={styles.scoreText}>
                        {result.score} / {result.totalQuestions}
                    </Text>
                    <Text style={styles.percentageText}>
                        {result.percentage}%
                    </Text>
                    <Text style={styles.scoreMessage}>
                        {getScoreMessage(result.percentage)}
                    </Text>
                </View>

                <View style={styles.statsGrid}>
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
                </View>

                <View style={styles.motivationCard}>
                    <Text style={styles.motivationTitle}>
                        🕌 Islamic Reminder
                    </Text>
                    <Text style={styles.motivationText}>
                        "And whoever relies upon Allah - then He is sufficient
                        for him. Indeed, Allah will accomplish His purpose." -
                        Quran 65:3
                    </Text>
                </View>
            </ScrollView>

            <View style={styles.resultFooter}>
                <TouchableOpacity
                    style={styles.homeButton}
                    onPress={onReturnHome}
                >
                    <Text style={styles.homeButtonText}>Return to Home</Text>
                </TouchableOpacity>
            </View>
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
    errorContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 12,
    },
    headerContent: {
        marginBottom: 12,
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
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
    streakBadge: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 20,
    },
    streakText: {
        color: "white",
        fontSize: 14,
        fontWeight: "600",
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "white",
        textAlign: "center",
        marginBottom: 4,
    },
    questionCounter: {
        fontSize: 16,
        color: "rgba(255,255,255,0.9)",
        textAlign: "center",
    },
    progressBarContainer: {
        height: 4,
        backgroundColor: "rgba(255,255,255,0.3)",
        borderRadius: 2,
        overflow: "hidden",
    },
    progressBar: {
        height: "100%",
        backgroundColor: "#DAA520",
        borderRadius: 2,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    questionCard: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 20,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    questionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    categoryBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: "#E3F2FD",
        borderRadius: 12,
    },
    categoryText: {
        fontSize: 12,
        color: "#1976D2",
        fontWeight: "600",
        textTransform: "capitalize",
    },
    difficultyBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: "#FFF3E0",
        borderRadius: 12,
    },
    difficultyText: {
        fontSize: 12,
        color: "#F57C00",
        fontWeight: "600",
        textTransform: "capitalize",
    },
    questionText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
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
        backgroundColor: "#f8f9fa",
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "transparent",
    },
    selectedOption: {
        borderColor: "#2E8B57",
        backgroundColor: "#f0f8f0",
    },
    correctOption: {
        borderColor: "#4CAF50",
        backgroundColor: "#E8F5E8",
    },
    wrongOption: {
        borderColor: "#f44336",
        backgroundColor: "#FFEBEE",
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
        backgroundColor: "#E0E0E0",
        color: "#666",
        fontSize: 14,
        fontWeight: "bold",
        textAlign: "center",
        textAlignVertical: "center",
        marginRight: 12,
    },
    optionText: {
        fontSize: 16,
        color: "#333",
        flex: 1,
        lineHeight: 22,
    },
    selectedOptionText: {
        color: "#2E8B57",
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
        backgroundColor: "#F5F5F5",
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: "#2E8B57",
    },
    explanationTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#2E8B57",
        marginBottom: 8,
    },
    explanationText: {
        fontSize: 14,
        color: "#666",
        lineHeight: 20,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 20,
        backgroundColor: "white",
        borderTopWidth: 1,
        borderTopColor: "#E0E0E0",
    },
    navButton: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 24,
        backgroundColor: "#f0f0f0",
        borderRadius: 25,
        alignItems: "center",
        marginHorizontal: 8,
    },
    nextButton: {
        backgroundColor: "#2E8B57",
    },
    navButtonDisabled: {
        opacity: 0.5,
    },
    navButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#666",
    },
    nextButtonText: {
        color: "white",
    },
    navButtonTextDisabled: {
        color: "#ccc",
    },
    // Result Screen Styles
    resultHeader: {
        paddingHorizontal: 20,
        paddingVertical: 40,
        alignItems: "center",
    },
    resultTitle: {
        fontSize: 28,
        fontWeight: "bold",
        color: "white",
        marginBottom: 16,
    },
    resultEmoji: {
        fontSize: 64,
    },
    resultContent: {
        flex: 1,
        padding: 20,
    },
    resultCard: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 32,
        alignItems: "center",
        marginBottom: 20,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    scoreText: {
        fontSize: 48,
        fontWeight: "bold",
        color: "#2E8B57",
    },
    percentageText: {
        fontSize: 24,
        fontWeight: "600",
        color: "#666",
        marginBottom: 12,
    },
    scoreMessage: {
        fontSize: 18,
        color: "#333",
        textAlign: "center",
        fontWeight: "600",
    },
    statsGrid: {
        flexDirection: "row",
        backgroundColor: "white",
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    statItem: {
        flex: 1,
        alignItems: "center",
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
    },
    motivationCard: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 20,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
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
        color: "#666",
        lineHeight: 20,
        textAlign: "center",
        fontStyle: "italic",
    },
    resultFooter: {
        padding: 20,
    },
    homeButton: {
        backgroundColor: "#2E8B57",
        paddingVertical: 16,
        borderRadius: 25,
        alignItems: "center",
    },
    homeButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "white",
    },
});

export default QuizScreen;
