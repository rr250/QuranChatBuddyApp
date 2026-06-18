import { useState, useEffect, useCallback, useRef } from "react";
import { quizService } from "../services/quizService";
import { AuthService } from "../services/authService";

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

    const answersRef = useRef([]);
    const questionsRef = useRef([]);
    const startTimeRef = useRef(null);
    const completingRef = useRef(false);

    useEffect(() => {
        questionsRef.current = questions;
    }, [questions]);

    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    useEffect(() => {
        startTimeRef.current = startTime;
    }, [startTime]);

    const loadTodayQuiz = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            await AuthService.ensureAuthenticated();

            const completedToday = await quizService.isTodayQuizCompleted();
            if (completedToday) {
                const result = await quizService.getTodayResult();
                setQuizResult(result);
                setIsCompleted(true);
            } else {
                const todayQuestions = await quizService.getTodayQuestions();
                setQuestions(todayQuestions);
                setCurrentQuestionIndex(0);
                setAnswers([]);
                answersRef.current = [];
                const startedAt = new Date();
                startTimeRef.current = startedAt;
                setStartTime(startedAt);
                setIsCompleted(false);
                setQuizResult(null);
            }

            const currentStreak = await quizService.getCurrentStreak();
            setStreak(currentStreak);
        } catch (loadError) {
            console.error("Error loading quiz:", loadError);
            setError(
                "Failed to load quiz. Please check your connection and try again.",
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTodayQuiz();
    }, [loadTodayQuiz]);

    const buildAnswer = useCallback(
        (answerIndex, questionIndex = currentQuestionIndex) => {
            const question = questionsRef.current[questionIndex];
            if (!question) return null;

            return {
                questionId: question.id,
                selectedAnswer: answerIndex,
                isCorrect: answerIndex === question.correctAnswer,
                timeSpent:
                    Date.now() - (startTimeRef.current?.getTime() || Date.now()),
            };
        },
        [currentQuestionIndex],
    );

    const answerQuestion = useCallback(
        (answerIndex) => {
            if (currentQuestionIndex >= questionsRef.current.length) {
                return null;
            }

            const entry = buildAnswer(answerIndex, currentQuestionIndex);
            if (!entry) return null;

            const newAnswers = [...answersRef.current];
            while (newAnswers.length <= currentQuestionIndex) {
                newAnswers.push(undefined);
            }
            newAnswers[currentQuestionIndex] = entry;
            answersRef.current = newAnswers;
            setAnswers(newAnswers);
            return newAnswers;
        },
        [buildAnswer, currentQuestionIndex],
    );

    const completeQuiz = useCallback(
        async (submittedAnswers) => {
            if (completingRef.current) return;

            const finalAnswers = (submittedAnswers ?? answersRef.current).filter(
                Boolean,
            );
            const totalQuestions =
                questionsRef.current.length || finalAnswers.length;
            const score = finalAnswers.filter((answer) => answer.isCorrect).length;

            if (finalAnswers.length === 0) {
                setError("Please answer at least one question before submitting.");
                return;
            }

            try {
                completingRef.current = true;
                setIsLoading(true);

                const totalTimeSpent = Math.round(
                    (Date.now() - (startTimeRef.current?.getTime() || Date.now())) /
                        1000,
                );

                const result = await quizService.saveQuizResult(
                    finalAnswers,
                    score,
                    totalTimeSpent,
                );
                const updatedStreak = await quizService.getCurrentStreak();

                setAnswers(finalAnswers);
                answersRef.current = finalAnswers;
                setQuizResult({
                    ...result,
                    totalQuestions,
                });
                setStreak(updatedStreak);
                setIsCompleted(true);
            } catch (completeError) {
                console.error("Error completing quiz:", completeError);
                setError("Failed to save quiz results. Please try again.");
            } finally {
                completingRef.current = false;
                setIsLoading(false);
            }
        },
        [],
    );

    const nextQuestion = useCallback(() => {
        if (currentQuestionIndex < questionsRef.current.length - 1) {
            setCurrentQuestionIndex((index) => index + 1);
            return;
        }

        completeQuiz(answersRef.current);
    }, [completeQuiz, currentQuestionIndex]);

    const previousQuestion = useCallback(() => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex((index) => index - 1);
        }
    }, [currentQuestionIndex]);

    const getCurrentQuestion = useCallback(() => {
        if (currentQuestionIndex >= questions.length) return null;
        return questions[currentQuestionIndex];
    }, [currentQuestionIndex, questions]);

    const getCurrentAnswer = useCallback(
        () => answers[currentQuestionIndex],
        [answers, currentQuestionIndex],
    );

    const isCurrentQuestionAnswered = useCallback(
        () => answers[currentQuestionIndex] !== undefined,
        [answers, currentQuestionIndex],
    );

    const getProgress = useCallback(() => {
        if (questions.length === 0) return 0;
        return ((currentQuestionIndex + 1) / questions.length) * 100;
    }, [currentQuestionIndex, questions.length]);

    const resetQuiz = useCallback(() => {
        setQuestions([]);
        setCurrentQuestionIndex(0);
        setAnswers([]);
        answersRef.current = [];
        setIsCompleted(false);
        setQuizResult(null);
        setStartTime(null);
        startTimeRef.current = null;
        setError(null);
        loadTodayQuiz();
    }, [loadTodayQuiz]);

    const retryLoading = useCallback(() => {
        setError(null);
        loadTodayQuiz();
    }, [loadTodayQuiz]);

    return {
        questions,
        currentQuestionIndex,
        answers,
        isCompleted,
        isLoading,
        quizResult,
        streak,
        error,
        currentQuestion: getCurrentQuestion(),
        currentAnswer: getCurrentAnswer(),
        isCurrentQuestionAnswered: isCurrentQuestionAnswered(),
        progress: getProgress(),
        answerQuestion,
        nextQuestion,
        previousQuestion,
        completeQuiz,
        resetQuiz,
        retryLoading,
        totalQuestions: questions.length,
        answeredCount: answers.filter(Boolean).length,
        canGoNext: isCurrentQuestionAnswered(),
        canGoPrevious: currentQuestionIndex > 0,
        isLastQuestion: currentQuestionIndex === questions.length - 1,
        isAuthenticated: true,
    };
};
