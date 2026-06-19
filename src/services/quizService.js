import { AuthService } from "./authService";
import { localDataStore } from "../storage/localDataStore";
import { userSyncService } from "./userSyncService";
import { quizQuestionBankService } from "./quizQuestionBankService";
import {
    shuffleQuestionOptions,
    pickUnseenQuestions,
    collectSeenIdsFromQuizResults,
} from "../utils/quizQuestions";
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
        this.questions = [];
    }

    async ensureQuestionBank() {
        this.questions = await quizQuestionBankService.ensureQuestionsLoaded();
        return this.questions;
    }

    async refreshQuestionBank() {
        this.questions = await quizQuestionBankService.ensureQuestionsLoaded({
            forceRefresh: true,
        });
        return this.questions;
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

    async getQuestionHistory(userId) {
        const stored =
            (await localDataStore.getNested(userId, "quiz", "questionHistory")) ??
            {};
        let seenIds = Array.isArray(stored.seenIds) ? stored.seenIds : [];

        if (!seenIds.length) {
            const quizResults =
                (await localDataStore.getNested(userId, "quiz", "quizResults")) ??
                {};
            seenIds = collectSeenIdsFromQuizResults(quizResults);
            if (seenIds.length) {
                await localDataStore.setNested(userId, "quiz", "questionHistory", {
                    seenIds,
                    backfilledAt: new Date().toISOString(),
                });
            }
        }

        return { seenIds };
    }

    async saveQuestionHistory(userId, seenIds) {
        await localDataStore.setNested(userId, "quiz", "questionHistory", {
            seenIds: [...new Set(seenIds)],
            updatedAt: new Date().toISOString(),
        });
    }

    async selectDailyQuestions(userId, seed) {
        await this.ensureQuestionBank();
        if (!this.questions.length) return [];

        const { seenIds } = await this.getQuestionHistory(userId);
        const { picked, nextSeenIds } = pickUnseenQuestions(
            this.questions,
            seenIds,
            this.DAILY_QUESTIONS_COUNT,
            seed,
        );

        if (!picked.length) return [];

        await this.saveQuestionHistory(userId, nextSeenIds);
        userSyncService.scheduleSync(userId);

        return picked.map((question, index) =>
            shuffleQuestionOptions(
                {
                    ...question,
                    questionNumber: index + 1,
                },
                `${seed}-q${index}`,
            ),
        );
    }

    async getTodayQuestions() {
        const userId = this.getUserId();
        const today = this.getTodayDateString();
        await this.ensureQuizData(userId);

        const cacheKey = `dailyQuestions_v3/${today}`;
        const cached = await localDataStore.getNested(
            userId,
            "quiz",
            cacheKey,
        );
        if (cached) return cached;

        const todayQuestions = await this.selectDailyQuestions(
            userId,
            `${userId}-${today}`,
        );
        await localDataStore.setNested(
            userId,
            "quiz",
            cacheKey,
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
        const normalizedAnswers = answers.filter(Boolean);
        const totalQuestions = normalizedAnswers.length || this.DAILY_QUESTIONS_COUNT;
        const finalScore =
            typeof score === "number"
                ? score
                : normalizedAnswers.filter((answer) => answer.isCorrect).length;

        const result = {
            date: today,
            timestamp: new Date().toISOString(),
            userId,
            answers: normalizedAnswers,
            score: finalScore,
            totalQuestions,
            timeSpent,
            percentage: Math.round((finalScore / totalQuestions) * 100),
        };

        await localDataStore.setNested(userId, "quiz", `quizResults/${today}`, result);
        await this.updateSeenIdsFromAnswers(userId, normalizedAnswers);
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

    async updateSeenIdsFromAnswers(userId, answers) {
        const questionIds = answers
            .map((answer) => answer?.questionId)
            .filter((id) => id != null);
        if (!questionIds.length) return;

        const { seenIds } = await this.getQuestionHistory(userId);
        await this.saveQuestionHistory(userId, [...seenIds, ...questionIds]);
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
        await AuthService.ensureAuthenticated();
        const userId = this.getUserId();
        await this.ensureQuizData(userId);
        try {
            await this.ensureQuestionBank();
        } catch (error) {
            console.warn(
                "Quiz question bank load failed, bundled fallback may be in use:",
                error?.message ?? error,
            );
        }
    }

    async getLeaderboard(type = "streak", limit = 10) {
        // Leaderboard requires a future cloud function; avoid scanning all users from the client.
        return [];
    }
}

export const quizService = new QuizService();
