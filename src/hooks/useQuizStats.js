// src/hooks/useQuizStats.js - UPDATED for Firebase Realtime Database
import { useState, useEffect, useCallback } from "react";
import { quizService } from "../services/quizService";
import { auth } from "../services/firebase";
import { AuthService } from "../services/authService";
import { useAuthStore } from "../store/authStore";

export const useQuizStats = () => {
    const [stats, setStats] = useState({
        totalQuizzes: 0,
        averageScore: 0,
        averagePercentage: 0,
        currentStreak: 0,
        longestStreak: 0,
        daysActive: 0,
        totalTimeSpent: 0,
    });
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuthStore();

    const loadStats = useCallback(async () => {
        if (!user) {
            setLoading(false);
            setError("Please sign in to view your statistics");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const [statsData, historyData] = await Promise.all([
                quizService.getQuizStats(),
                quizService.getQuizHistory(15), // Last 15 days
            ]);

            setStats(statsData);
            setHistory(historyData);
        } catch (error) {
            console.error("Error loading quiz stats:", error);
            setError(
                "Failed to load statistics. Please check your connection and try again."
            );
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    // Get stats for specific timeframe
    const getStatsForPeriod = useCallback(
        (days) => {
            const cutoffDate = new Date(
                Date.now() - days * 24 * 60 * 60 * 1000
            );
            const periodHistory = history.filter((result) => {
                const resultDate = new Date(result.date);
                return resultDate >= cutoffDate;
            });

            if (periodHistory.length === 0) {
                return {
                    totalQuizzes: 0,
                    averageScore: 0,
                    averagePercentage: 0,
                };
            }

            const totalScore = periodHistory.reduce(
                (sum, result) => sum + result.score,
                0
            );
            const totalPercentage = periodHistory.reduce(
                (sum, result) => sum + result.percentage,
                0
            );

            return {
                totalQuizzes: periodHistory.length,
                averageScore: (totalScore / periodHistory.length).toFixed(1),
                averagePercentage: Math.round(
                    totalPercentage / periodHistory.length
                ),
            };
        },
        [history]
    );

    // Get weekly statistics
    const getWeeklyStats = useCallback(() => {
        return getStatsForPeriod(7);
    }, [getStatsForPeriod]);

    // Get monthly statistics
    const getMonthlyStats = useCallback(() => {
        return getStatsForPeriod(30);
    }, [getStatsForPeriod]);

    // Get performance trend
    const getPerformanceTrend = useCallback(() => {
        if (history.length < 2) return "stable";

        const recent5 = history.slice(0, 5);
        const previous5 = history.slice(5, 10);

        if (recent5.length < 3 || previous5.length < 3) return "stable";

        const recentAvg =
            recent5.reduce((sum, result) => sum + result.percentage, 0) /
            recent5.length;
        const previousAvg =
            previous5.reduce((sum, result) => sum + result.percentage, 0) /
            previous5.length;

        const difference = recentAvg - previousAvg;

        if (difference > 5) return "improving";
        if (difference < -5) return "declining";
        return "stable";
    }, [history]);

    // Retry loading if there was an error
    const retryLoading = useCallback(() => {
        setError(null);
        loadStats();
    }, [loadStats]);

    return {
        stats,
        history,
        loading,
        error,
        user,
        refreshStats: loadStats,
        getStatsForPeriod,
        getWeeklyStats,
        getMonthlyStats,
        getPerformanceTrend,
        retryLoading,
        isAuthenticated: !!user,
    };
};
