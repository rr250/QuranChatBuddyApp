// src/hooks/useQuiz.js - UPDATED for Firebase Realtime Database
import { useState, useEffect, useCallback } from "react";
import { quizService } from "../services/quizService";
import { useAuthStore } from "../store/authStore";

export const useQuiz = () => {
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [quizResult, setQuizResult] = useState(null);
    const [streak, setStreak] = useState({ current: 0, longest: 0 });
    const [startTime, setStartTime] = useState(null);
    const [error, setError] = useState(null);
    const { user } = useAuthStore();

    // Load today's quiz when user is authenticated
    const loadTodayQuiz = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            setError("Please sign in to access the quiz");
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Check if quiz is already completed today
            const isCompleted = await quizService.isTodayQuizCompleted();
            if (isCompleted) {
                const result = await quizService.getTodayResult();
                setQuizResult(result);
                setIsCompleted(true);
            } else {
                // Load today's questions
                const todayQuestions = await quizService.getTodayQuestions();
                setQuestions(todayQuestions);
                setCurrentQuestionIndex(0);
                setAnswers([]);
                setStartTime(new Date());
                setIsCompleted(false);
                setQuizResult(null);
            }

            // Load current streak
            const currentStreak = await quizService.getCurrentStreak();
            setStreak(currentStreak);
        } catch (error) {
            console.error("Error loading quiz:", error);
            setError(
                "Failed to load quiz. Please check your connection and try again."
            );
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Initialize quiz when user changes or hook mounts
    useEffect(() => {
        loadTodayQuiz();
    }, [loadTodayQuiz]);

    // Answer current question
    const answerQuestion = useCallback(
        (answerIndex) => {
            if (currentQuestionIndex >= questions.length || !user) return;

            const newAnswers = [...answers];
            newAnswers[currentQuestionIndex] = {
                questionId: questions[currentQuestionIndex].id,
                selectedAnswer: answerIndex,
                isCorrect:
                    answerIndex ===
                    questions[currentQuestionIndex].correctAnswer,
                timeSpent: Date.now() - (startTime?.getTime() || 0),
            };

            setAnswers(newAnswers);
        },
        [currentQuestionIndex, questions, answers, startTime, user]
    );

    // Move to next question
    const nextQuestion = useCallback(() => {
        if (!user) return;

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            // Quiz completed
            completeQuiz();
        }
    }, [currentQuestionIndex, questions.length, user]);

    // Go to previous question
    const previousQuestion = useCallback(() => {
        if (currentQuestionIndex > 0 && user) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    }, [currentQuestionIndex, user]);

    console.log("useQuiz state:", {
        questions,
        answersLength: answers.length,
        questionsLength: questions.length,
        error,
    });
    // Complete the quiz
    const completeQuiz = useCallback(async () => {
        console.log("Completing quiz...");
        if (!user) {
            setError("Please sign in to save your quiz results");
            return;
        }

        try {
            setIsLoading(true);
            const score = answers.filter((answer) => answer.isCorrect).length;
            const totalTimeSpent = Math.round(
                (Date.now() - startTime.getTime()) / 1000
            ); // in seconds

            console.log("Submitting quiz results:", {
                answers,
                score,
                totalTimeSpent,
            });

            const result = await quizService.saveQuizResult(
                answers,
                score,
                totalTimeSpent
            );
            const updatedStreak = await quizService.getCurrentStreak();

            setQuizResult(result);
            setStreak(updatedStreak);
            setIsCompleted(true);
        } catch (error) {
            console.error("Error completing quiz:", error);
            setError("Failed to save quiz results. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [answers, questions, startTime, user]);

    // Get current question
    const getCurrentQuestion = useCallback(() => {
        if (currentQuestionIndex >= questions.length) return null;
        return questions[currentQuestionIndex];
    }, [currentQuestionIndex, questions]);

    // Get current answer
    const getCurrentAnswer = useCallback(() => {
        return answers[currentQuestionIndex];
    }, [answers, currentQuestionIndex]);

    // Check if current question is answered
    const isCurrentQuestionAnswered = useCallback(() => {
        return answers[currentQuestionIndex] !== undefined;
    }, [answers, currentQuestionIndex]);

    // Get quiz progress
    const getProgress = useCallback(() => {
        if (questions.length === 0) return 0;
        return ((currentQuestionIndex + 1) / questions.length) * 100;
    }, [currentQuestionIndex, questions.length]);

    // Reset quiz (for new day or retry)
    const resetQuiz = useCallback(() => {
        setQuestions([]);
        setCurrentQuestionIndex(0);
        setAnswers([]);
        setIsCompleted(false);
        setQuizResult(null);
        setStartTime(null);
        setError(null);
        loadTodayQuiz();
    }, [loadTodayQuiz]);

    // Retry loading quiz if there was an error
    const retryLoading = useCallback(() => {
        setError(null);
        loadTodayQuiz();
    }, [loadTodayQuiz]);

    return {
        // Quiz state
        questions,
        currentQuestionIndex,
        answers,
        isCompleted,
        isLoading,
        quizResult,
        streak,
        error,
        user,

        // Current question data
        currentQuestion: getCurrentQuestion(),
        currentAnswer: getCurrentAnswer(),
        isCurrentQuestionAnswered: isCurrentQuestionAnswered(),
        progress: getProgress(),

        // Actions
        answerQuestion,
        nextQuestion,
        previousQuestion,
        completeQuiz,
        resetQuiz,
        retryLoading,

        // Computed values
        totalQuestions: questions.length,
        answeredCount: answers.length,
        canGoNext: isCurrentQuestionAnswered(),
        canGoPrevious: currentQuestionIndex > 0,
        isLastQuestion: currentQuestionIndex === questions.length - 1,

        // Authentication status
        isAuthenticated: !!user,
    };
};
