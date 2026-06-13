import questionsData from "../constants/questions.json";
import { AuthService } from "./authService";
import { localDataStore } from "../storage/localDataStore";
import { userSyncService } from "./userSyncService";
import { transformQuestions } from "../utils/quizQuestions";
import { shuffleArray } from "../utils/array";
import { sortByDateDesc } from "../utils/date";
import { getTodayDateString } from "../utils/date";
import { EMPTY_STREAK, updateCompletionStreak } from "../utils/streak";

const DAILY_QUESTIONS_COUNT = 5;

const DEFAULT_STATS = {
    totalQuizzes: 0,
    totalScore: 0,
    totalTimeSpent: 0,
    averageScore: 0,
    averagePercentage: 0,
    lastUpdated: null,
    streak: { ...EMPTY_STREAK },
};

const DEFAULT_QUIZ_STATS = {
    totalQuizzes: 0,
    averageScore: 0,
    averagePercentage: 0,
    currentStreak: 0,
    longestStreak: 0,
    daysActive: 0,
    lastQuizDate: null,
    totalTimeSpent: 0,
};

class QuizService {
    constructor() {
        this.DAILY_QUESTIONS_COUNT = DAILY_QUESTIONS_COUNT;
        this.questions = transformQuestions(questionsData);
    }

    getUserId() {
        AuthService.initialize();
        const user = AuthService.getCurrentUser();
        if (!user) throw new Error("User not authenticated");
        return user.uid;
    }

    getTodayDateString() {
        return getTodayDateString();
    }

    async ensureQuizData(userId) {
        const existing = await localDataStore.get(userId, "quiz");
        if (!existing) {
            await localDataStore.set(userId, "quiz", userSyncService.defaultQuizLocal());
        }
    }

    selectDailyQuestions() {
        if (!this.questions.length) return [];

        const pool =
            this.questions.length < this.DAILY_QUESTIONS_COUNT
                ? this.questions
                : shuffleArray(this.questions).slice(0, this.DAILY_QUESTIONS_COUNT);

        return pool.map((question, index) => ({
            ...question,
            questionNumber: index + 1,
        }));
    }

    async getTodayQuestions() {
        const userId = this.getUserId();
        const today = this.getTodayDateString();
        await this.ensureQuizData(userId);

        const cached = await localDataStore.getNested(
            userId,
            "quiz",
            `dailyQuestions/${today}`,
        );
        if (cached) return cached;

        const todayQuestions = this.selectDailyQuestions();
        await localDataStore.setNested(
            userId,
            "quiz",
            `dailyQuestions/${today}`,
            todayQuestions,
        );
        return todayQuestions;
    }

    async isTodayQuizCompleted() {
        try {
            const userId = this.getUserId();
            const today = this.getTodayDateString();
            const result = await localDataStore.getNested(
                userId,
                "quiz",
                `quizResults/${today}`,
            );
            return Boolean(result);
        } catch {
            return false;
        }
    }

    async getTodayResult() {
        try {
            const userId = this.getUserId();
            return await localDataStore.getNested(
                userId,
                "quiz",
                `quizResults/${this.getTodayDateString()}`,
            );
        } catch {
            return null;
        }
    }

    async saveQuizResult(answers, score, timeSpent) {
        const userId = this.getUserId();
        const today = this.getTodayDateString();

        const result = {
            date: today,
            timestamp: new Date().toISOString(),
            userId,
            answers,
            score,
            totalQuestions: this.DAILY_QUESTIONS_COUNT,
            timeSpent,
            percentage: Math.round((score / this.DAILY_QUESTIONS_COUNT) * 100),
        };

        await localDataStore.setNested(userId, "quiz", `quizResults/${today}`, result);
        await this.updateStreak(score > 0);
        await this.updateUserStats(result);
        userSyncService.scheduleSync(userId);
        return result;
    }

    async getCurrentStreak() {
        try {
            const userId = this.getUserId();
            await this.ensureQuizData(userId);
            const streak = await localDataStore.getNested(userId, "quiz", "stats/streak");
            return streak ?? { ...EMPTY_STREAK };
        } catch {
            return { ...EMPTY_STREAK };
        }
    }

    async updateStreak(quizPassed) {
        try {
            const userId = this.getUserId();
            const currentStreak = await this.getCurrentStreak();
            const updatedStreak = updateCompletionStreak(
                currentStreak,
                quizPassed,
                this.getTodayDateString(),
            );
            await localDataStore.setNested(userId, "quiz", "stats/streak", updatedStreak);
            userSyncService.scheduleSync(userId);
            return updatedStreak;
        } catch {
            return { ...EMPTY_STREAK };
        }
    }

    async updateUserStats(result) {
        try {
            const userId = this.getUserId();
            const stats =
                (await localDataStore.getNested(userId, "quiz", "stats")) ?? {
                    ...DEFAULT_STATS,
                };

            stats.totalQuizzes += 1;
            stats.totalScore += result.score;
            stats.totalTimeSpent += result.timeSpent;
            stats.averageScore = (
                stats.totalScore / stats.totalQuizzes
            ).toFixed(1);
            stats.averagePercentage = Math.round(
                (stats.totalScore / (stats.totalQuizzes * this.DAILY_QUESTIONS_COUNT)) *
                    100,
            );
            stats.lastUpdated = new Date().toISOString();

            await localDataStore.setNested(userId, "quiz", "stats", stats);
            userSyncService.scheduleSync(userId);
            return stats;
        } catch (error) {
            console.error("Error updating user stats:", error);
            throw error;
        }
    }

    async getQuizHistory(limit = 10) {
        try {
            const userId = this.getUserId();
            const quizResults =
                (await localDataStore.getNested(userId, "quiz", "quizResults")) ?? {};
            return sortByDateDesc(Object.values(quizResults)).slice(0, limit);
        } catch {
            return [];
        }
    }

    async getQuizStats() {
        try {
            const userId = this.getUserId();
            await this.ensureQuizData(userId);
            const stats = await localDataStore.getNested(userId, "quiz", "stats");
            if (!stats) return { ...DEFAULT_QUIZ_STATS };

            return {
                totalQuizzes: stats.totalQuizzes ?? 0,
                averageScore: stats.averageScore ?? 0,
                averagePercentage: stats.averagePercentage ?? 0,
                currentStreak: stats.streak?.current ?? 0,
                longestStreak: stats.streak?.longest ?? 0,
                daysActive: stats.totalQuizzes ?? 0,
                lastQuizDate: stats.streak?.lastDate ?? null,
                totalTimeSpent: stats.totalTimeSpent ?? 0,
            };
        } catch {
            return { ...DEFAULT_QUIZ_STATS };
        }
    }

    async clearUserData() {
        try {
            const userId = this.getUserId();
            await localDataStore.set(userId, "quiz", userSyncService.defaultQuizLocal());
            userSyncService.scheduleSync(userId);
        } catch (error) {
            console.error("Error clearing user data:", error);
            throw error;
        }
    }

    async initializeUserData() {
        try {
            const userId = this.getUserId();
            await this.ensureQuizData(userId);
        } catch (error) {
            console.error("Error initializing user data:", error);
        }
    }

    async getLeaderboard(type = "streak", limit = 10) {
        // Leaderboard requires a future cloud function; avoid scanning all users from the client.
        return [];
    }
}

export const quizService = new QuizService();
