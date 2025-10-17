// src/services/quizService.js - UPDATED with Firebase Realtime Database
import { AuthService } from "./authService";
import { getFirebaseAuth, getFirebaseDatabase } from "./firebase";
import questionsData from "../constants/questions.json";
import {
    ref,
    set,
    get,
    push,
    query,
    orderByKey,
    limitToLast,
    serverTimestamp,
} from "firebase/database";

class QuizService {
    constructor() {
        try {
            this.questions = this.transformQuestions(questionsData);
            console.log(
                `Loaded ${this.questions.length} questions for quiz service`
            );
        } catch (error) {
            console.error("Error loading questions data:", error);
            this.questions = [];
        }
        this.DAILY_QUESTIONS_COUNT = 5;
        this.initialize();
    }

    initialize() {
        if (!this.auth) {
            this.auth = getFirebaseAuth();
            this.database = getFirebaseDatabase();
        }
    }

    // Transform questions from JSON format to internal format
    transformQuestions(questionsArray) {
        if (!Array.isArray(questionsArray)) {
            console.error("Questions data is not an array:", questionsArray);
            return [];
        }

        return questionsArray
            .map((q, index) => {
                if (!q || !q.options || !Array.isArray(q.options)) {
                    console.error(`Invalid question at index ${index}:`, q);
                    return null;
                }

                // Find the correct answer index
                const correctOptionIndex = q.options.findIndex(
                    (option) => option && option.id === q.correct_option_id
                );

                if (correctOptionIndex === -1) {
                    console.error(
                        `No matching correct option found for question ${q.id}:`,
                        q
                    );
                }

                return {
                    id: q.id || index + 1,
                    question: q.question_text || "Question text missing",
                    options: q.options.map(
                        (option) => option?.text || "Option missing"
                    ),
                    correctAnswer:
                        correctOptionIndex >= 0 ? correctOptionIndex : 0,
                    explanation:
                        q.explanation ||
                        `The correct answer is ${
                            q.options[correctOptionIndex]?.text || "Unknown"
                        }`,
                    difficulty: q.metadata?.difficulty || "medium",
                    category: q.metadata?.category?.toLowerCase() || "general",
                };
            })
            .filter(Boolean); // Remove null entries
    }

    // Get current user ID
    getCurrentUserId() {
        AuthService.initialize(); // Ensure AuthService is initialized
        const user = AuthService.getCurrentUser();
        if (!user) {
            throw new Error("User not authenticated");
        }
        console.log("Current User ID:", user.uid);
        return user.uid;
    }

    // Get Firebase path for user data
    getUserPath(path = "") {
        const userId = this.getCurrentUserId();
        return `users/${userId}/${path}`;
    }

    // Get today's date string
    getTodayDateString() {
        return new Date().toDateString();
    }

    // Get today's quiz questions
    async getTodayQuestions() {
        try {
            const today = this.getTodayDateString();
            const questionsRef = ref(
                this.database,
                this.getUserPath(`dailyQuestions/${today}`)
            );

            // Check if we already have today's questions in Firebase
            const snapshot = await get(questionsRef);
            if (snapshot.exists()) {
                return snapshot.val();
            }

            // Generate new questions for today
            const todayQuestions = this.selectDailyQuestions();

            // Save to Firebase for consistency
            await set(questionsRef, todayQuestions);

            return todayQuestions;
        } catch (error) {
            console.error("Error getting today questions:", error);
            // Fallback to random questions if Firebase fails
            return this.selectDailyQuestions();
        }
    }

    // Select 5 random questions for daily quiz
    selectDailyQuestions() {
        if (!this.questions || this.questions.length === 0) {
            console.error("No questions available for daily quiz");
            return [];
        }

        if (this.questions.length < this.DAILY_QUESTIONS_COUNT) {
            console.warn(
                `Only ${this.questions.length} questions available, using all of them`
            );
            return this.questions.map((q, index) => ({
                ...q,
                questionNumber: index + 1,
            }));
        }

        const shuffled = [...this.questions].sort(() => 0.5 - Math.random());
        return shuffled
            .slice(0, this.DAILY_QUESTIONS_COUNT)
            .map((q, index) => ({
                ...q,
                questionNumber: index + 1,
            }));
    }

    // Check if quiz is completed today
    async isTodayQuizCompleted() {
        try {
            const today = this.getTodayDateString();
            const resultRef = ref(
                this.database,
                this.getUserPath(`quizResults/${today}`)
            );
            const snapshot = await get(resultRef);
            return snapshot.exists();
        } catch (error) {
            console.error("Error checking quiz completion:", error);
            return false;
        }
    }

    // Save quiz result to Firebase
    async saveQuizResult(answers, score, timeSpent) {
        try {
            const today = this.getTodayDateString();
            const userId = this.getCurrentUserId();

            const result = {
                date: today,
                timestamp: serverTimestamp(),
                userId: userId,
                answers: answers,
                score: score,
                totalQuestions: this.DAILY_QUESTIONS_COUNT,
                timeSpent: timeSpent,
                percentage: Math.round(
                    (score / this.DAILY_QUESTIONS_COUNT) * 100
                ),
            };

            // Save today's result
            const resultRef = ref(
                this.database,
                this.getUserPath(`quizResults/${today}`)
            );
            await set(resultRef, result);

            // Update streak
            await this.updateStreak(score > 0); // Continue streak if got at least 1 correct

            // Update user stats
            await this.updateUserStats(result);

            return result;
        } catch (error) {
            console.error("Error saving quiz result:", error);
            throw error;
        }
    }

    // Get current streak from Firebase
    async getCurrentStreak() {
        try {
            const streakRef = ref(
                this.database,
                this.getUserPath("stats/streak")
            );
            const snapshot = await get(streakRef);

            if (snapshot.exists()) {
                return snapshot.val();
            } else {
                return { current: 0, longest: 0, lastDate: null };
            }
        } catch (error) {
            console.error("Error getting streak:", error);
            return { current: 0, longest: 0, lastDate: null };
        }
    }

    // Update streak based on quiz completion
    async updateStreak(quizPassed) {
        try {
            const today = this.getTodayDateString();
            const yesterday = new Date(Date.now() - 86400000).toDateString();

            const currentStreak = await this.getCurrentStreak();

            if (quizPassed) {
                // Check if this continues the streak
                if (
                    currentStreak.lastDate === yesterday ||
                    currentStreak.current === 0
                ) {
                    // Continue or start streak
                    currentStreak.current += 1;
                    currentStreak.longest = Math.max(
                        currentStreak.current,
                        currentStreak.longest
                    );
                } else if (currentStreak.lastDate !== today) {
                    // Streak was broken, start new one
                    currentStreak.current = 1;
                }
                // If lastDate === today, don't change anything (already completed today)

                currentStreak.lastDate = today;
            } else {
                // Quiz failed but still completed - depends on your streak rules
                if (currentStreak.lastDate !== yesterday) {
                    currentStreak.current = 0;
                }
            }

            // Save updated streak to Firebase
            const streakRef = ref(
                this.database,
                this.getUserPath("stats/streak")
            );
            await set(streakRef, currentStreak);

            return currentStreak;
        } catch (error) {
            console.error("Error updating streak:", error);
            return { current: 0, longest: 0, lastDate: null };
        }
    }

    // Update user statistics
    async updateUserStats(result) {
        try {
            const statsRef = ref(this.database, this.getUserPath("stats"));
            const snapshot = await get(statsRef);

            let stats = snapshot.exists()
                ? snapshot.val()
                : {
                      totalQuizzes: 0,
                      totalScore: 0,
                      totalTimeSpent: 0,
                      averageScore: 0,
                      averagePercentage: 0,
                      lastUpdated: null,
                  };

            // Update stats
            stats.totalQuizzes += 1;
            stats.totalScore += result.score;
            stats.totalTimeSpent += result.timeSpent;
            stats.averageScore = (
                stats.totalScore / stats.totalQuizzes
            ).toFixed(1);
            stats.averagePercentage = Math.round(
                (stats.totalScore /
                    (stats.totalQuizzes * this.DAILY_QUESTIONS_COUNT)) *
                    100
            );
            stats.lastUpdated = serverTimestamp();

            await set(statsRef, stats);
            return stats;
        } catch (error) {
            console.error("Error updating user stats:", error);
            throw error;
        }
    }

    // Get quiz history from Firebase
    async getQuizHistory(limit = 10) {
        try {
            const historyRef = ref(
                this.database,
                this.getUserPath("quizResults")
            );
            const historyQuery = query(
                historyRef,
                orderByKey(),
                limitToLast(limit)
            );

            const snapshot = await get(historyQuery);

            if (snapshot.exists()) {
                const data = snapshot.val();
                // Convert object to array and sort by date (newest first)
                return Object.values(data).sort(
                    (a, b) => new Date(b.date) - new Date(a.date)
                );
            } else {
                return [];
            }
        } catch (error) {
            console.error("Error getting quiz history:", error);
            return [];
        }
    }

    // Get quiz statistics from Firebase
    async getQuizStats() {
        try {
            const statsRef = ref(this.database, this.getUserPath("stats"));
            const snapshot = await get(statsRef);

            if (snapshot.exists()) {
                const stats = snapshot.val();
                return {
                    totalQuizzes: stats.totalQuizzes || 0,
                    averageScore: stats.averageScore || 0,
                    averagePercentage: stats.averagePercentage || 0,
                    currentStreak: stats.streak?.current || 0,
                    longestStreak: stats.streak?.longest || 0,
                    daysActive: stats.totalQuizzes || 0,
                    lastQuizDate: stats.streak?.lastDate || null,
                    totalTimeSpent: stats.totalTimeSpent || 0,
                };
            } else {
                return {
                    totalQuizzes: 0,
                    averageScore: 0,
                    averagePercentage: 0,
                    currentStreak: 0,
                    longestStreak: 0,
                    daysActive: 0,
                    lastQuizDate: null,
                    totalTimeSpent: 0,
                };
            }
        } catch (error) {
            console.error("Error getting quiz stats:", error);
            return {
                totalQuizzes: 0,
                averageScore: 0,
                averagePercentage: 0,
                currentStreak: 0,
                longestStreak: 0,
                daysActive: 0,
                lastQuizDate: null,
                totalTimeSpent: 0,
            };
        }
    }

    // Get today's quiz result if completed
    async getTodayResult() {
        try {
            const today = this.getTodayDateString();
            const resultRef = ref(
                this.database,
                this.getUserPath(`quizResults/${today}`)
            );
            const snapshot = await get(resultRef);

            return snapshot.exists() ? snapshot.val() : null;
        } catch (error) {
            console.error("Error getting today result:", error);
            return null;
        }
    }

    // Clear all user quiz data (for testing or reset)
    async clearUserData() {
        try {
            const userRef = ref(this.database, this.getUserPath());
            await set(userRef, null);
            console.log("User quiz data cleared");
        } catch (error) {
            console.error("Error clearing user data:", error);
            throw error;
        }
    }

    // Initialize user quiz data (verify structure exists)
    async initializeUserData() {
        try {
            const userId = this.getCurrentUserId();
            const userStatsRef = ref(this.database, this.getUserPath("stats"));

            const snapshot = await get(userStatsRef);
            if (!snapshot.exists()) {
                // Create minimal stats structure if it doesn't exist
                const initialStats = {
                    totalQuizzes: 0,
                    totalScore: 0,
                    totalTimeSpent: 0,
                    averageScore: 0,
                    averagePercentage: 0,
                    lastUpdated: serverTimestamp(),
                    streak: {
                        current: 0,
                        longest: 0,
                        lastDate: null,
                    },
                };

                await set(userStatsRef, initialStats);
                console.log("User quiz stats initialized");
            } else {
                console.log("User quiz data already exists");
            }
        } catch (error) {
            console.error("Error initializing user data:", error);
        }
    }

    // Get leaderboard data (top users by streak or average score)
    async getLeaderboard(type = "streak", limit = 10) {
        try {
            // Note: This requires appropriate Firebase security rules
            const leaderboardRef = ref(this.database, "users");
            const snapshot = await get(leaderboardRef);

            if (!snapshot.exists()) return [];

            const users = snapshot.val();
            const leaderboardData = [];

            Object.keys(users).forEach((userId) => {
                const userData = users[userId];
                if (userData.stats && userData.profile) {
                    leaderboardData.push({
                        userId: userId,
                        name: userData.profile.name || "Anonymous",
                        streak: userData.stats.streak?.current || 0,
                        longestStreak: userData.stats.streak?.longest || 0,
                        averagePercentage:
                            userData.stats.averagePercentage || 0,
                        totalQuizzes: userData.stats.totalQuizzes || 0,
                    });
                }
            });

            // Sort based on type
            if (type === "streak") {
                leaderboardData.sort((a, b) => b.streak - a.streak);
            } else if (type === "average") {
                leaderboardData.sort(
                    (a, b) => b.averagePercentage - a.averagePercentage
                );
            }

            return leaderboardData.slice(0, limit);
        } catch (error) {
            console.error("Error getting leaderboard:", error);
            return [];
        }
    }
}

export const quizService = new QuizService();
