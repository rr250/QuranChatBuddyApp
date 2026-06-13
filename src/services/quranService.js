import { QuranApi } from "./quranApi";
import { AuthService } from "./authService";
import { localDataStore } from "../storage/localDataStore";
import { userSyncService } from "./userSyncService";
import { getTodayDateString, sortByDateDesc } from "../utils/date";
import { calculateConsecutiveDayStreak } from "../utils/streak";

const TOTAL_QURAN_VERSES = 6236;

const DEFAULT_READING_STATS = {
    totalVersesRead: 0,
    totalSurahsCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
    averageVersesPerDay: 0,
    daysActive: 0,
    completionPercentage: 0,
};

const createInitialProfile = () => ({
    currentSurah: 1,
    currentVerse: 1,
    totalVersesRead: 0,
    totalSurahsRead: 0,
    readingStreak: { current: 0, longest: 0, lastReadDate: null },
    lastUpdated: null,
});

class QuranService {
    getUserId() {
        AuthService.initialize();
        const user = AuthService.getCurrentUser();
        if (!user) throw new Error("User not authenticated");
        return user.uid;
    }

    async ensureQuranData(userId) {
        const existing = await localDataStore.get(userId, "quran");
        if (!existing) {
            await localDataStore.set(userId, "quran", userSyncService.defaultQuranLocal());
        }
    }

    getAllSurahs() {
        return QuranApi.getAllSurahs();
    }

    getSurah(surahNumber, edition) {
        return QuranApi.getSurah(surahNumber, edition);
    }

    getVerse(surahNumber, verseNumber) {
        return QuranApi.getVerse(surahNumber, verseNumber);
    }

    searchVerses(searchQuery, language) {
        return QuranApi.searchVerses(searchQuery, language);
    }

    async initializeUserProgress() {
        try {
            const userId = this.getUserId();
            await this.ensureQuranData(userId);
        } catch (error) {
            console.error("Error initializing user progress:", error);
        }
    }

    async markVerseAsRead(surahNumber, verseNumber) {
        try {
            const userId = this.getUserId();
            const verseKey = `${surahNumber}:${verseNumber}`;

            await localDataStore.setNested(userId, "quran", `versesRead/${verseKey}`, {
                surahNumber,
                verseNumber,
                readAt: new Date().toISOString(),
            });

            await this.updateDailySession(userId, surahNumber, verseNumber);
            await this.updateUserProgress(userId);
            userSyncService.scheduleSync(userId);
        } catch (error) {
            console.error("Error marking verse as read:", error);
        }
    }

    async markSurahAsCompleted(surahNumber) {
        try {
            const userId = this.getUserId();
            await localDataStore.setNested(
                userId,
                "quran",
                `completedSurahs/${surahNumber}`,
                {
                    surahNumber,
                    completedAt: new Date().toISOString(),
                },
            );
            await this.updateUserProgress(userId);
            userSyncService.scheduleSync(userId);
        } catch (error) {
            console.error("Error marking Surah as completed:", error);
        }
    }

    async updateDailySession(userId, surahNumber, verseNumber) {
        const today = getTodayDateString();
        const verseKey = `${surahNumber}:${verseNumber}`;
        const session =
            (await localDataStore.getNested(userId, "quran", `dailySessions/${today}`)) ?? {
                date: today,
                startTime: new Date().toISOString(),
                versesRead: [],
                totalTime: 0,
            };

        if (session.versesRead.includes(verseKey)) return;

        await localDataStore.setNested(userId, "quran", `dailySessions/${today}`, {
            ...session,
            versesRead: [...session.versesRead, verseKey],
            lastReadTime: new Date().toISOString(),
        });
    }

    async updateUserProgress(userId) {
        const versesRead =
            (await localDataStore.getNested(userId, "quran", "versesRead")) ?? {};
        const completedSurahs =
            (await localDataStore.getNested(userId, "quran", "completedSurahs")) ?? {};
        const sessions =
            (await localDataStore.getNested(userId, "quran", "dailySessions")) ?? {};

        const totalVersesRead = Object.keys(versesRead).length;
        const totalSurahsCompleted = Object.keys(completedSurahs).length;
        const sessionDates = Object.keys(sessions);
        const readingStreak = calculateConsecutiveDayStreak(sessionDates);

        const profile =
            (await localDataStore.getNested(userId, "quran", "profile")) ??
            createInitialProfile();

        await localDataStore.setNested(userId, "quran", "profile", {
            ...profile,
            totalVersesRead,
            totalSurahsRead: totalSurahsCompleted,
            totalReadingSessions: sessionDates.length,
            readingStreak,
            lastUpdated: new Date().toISOString(),
        });
    }

    async getUserProgress() {
        try {
            const userId = this.getUserId();
            await this.ensureQuranData(userId);
            const progress = await localDataStore.getNested(userId, "quran", "profile");
            return progress ?? createInitialProfile();
        } catch (error) {
            console.error("Error getting user progress:", error);
            return null;
        }
    }

    async getReadingHistory(limit = 10) {
        try {
            const userId = this.getUserId();
            const sessions =
                (await localDataStore.getNested(userId, "quran", "dailySessions")) ?? {};
            return sortByDateDesc(Object.values(sessions)).slice(0, limit);
        } catch (error) {
            console.error("Error getting reading history:", error);
            return [];
        }
    }

    async addToFavorites(surahNumber, verseNumber, text, translation) {
        try {
            const userId = this.getUserId();
            await localDataStore.setNested(
                userId,
                "quran",
                `favorites/${surahNumber}_${verseNumber}`,
                {
                    surahNumber,
                    verseNumber,
                    text,
                    translation,
                    addedAt: new Date().toISOString(),
                },
            );
        } catch (error) {
            console.error("Error adding to favorites:", error);
        }
    }

    async removeFromFavorites(surahNumber, verseNumber) {
        try {
            const userId = this.getUserId();
            await localDataStore.deleteNested(
                userId,
                "quran",
                `favorites/${surahNumber}_${verseNumber}`,
            );
        } catch (error) {
            console.error("Error removing from favorites:", error);
        }
    }

    async getFavoriteVerses() {
        try {
            const userId = this.getUserId();
            const favorites =
                (await localDataStore.getNested(userId, "quran", "favorites")) ?? {};
            return sortByDateDesc(Object.values(favorites), "addedAt");
        } catch (error) {
            console.error("Error getting favorite verses:", error);
            return [];
        }
    }

    async getReadingStats() {
        try {
            const userId = this.getUserId();
            const [progress, history] = await Promise.all([
                this.getUserProgress(),
                this.getReadingHistory(30),
            ]);

            const totalVersesRead = progress?.totalVersesRead ?? 0;
            const versesPerSession = history.map(
                (session) => session.versesRead?.length ?? 0,
            );

            return {
                totalVersesRead,
                totalSurahsCompleted: progress?.totalSurahsRead ?? 0,
                currentStreak: progress?.readingStreak?.current ?? 0,
                longestStreak: progress?.readingStreak?.longest ?? 0,
                averageVersesPerDay:
                    history.length > 0
                        ? Math.round(
                              versesPerSession.reduce((sum, count) => sum + count, 0) /
                                  history.length,
                          )
                        : 0,
                daysActive: history.length,
                completionPercentage: Math.round(
                    (totalVersesRead / TOTAL_QURAN_VERSES) * 100,
                ),
            };
        } catch (error) {
            console.error("Error getting reading stats:", error);
            return { ...DEFAULT_READING_STATS };
        }
    }

    async isVerseRead(surahNumber, verseNumber) {
        try {
            const userId = this.getUserId();
            const verseKey = `${surahNumber}:${verseNumber}`;
            const data = await localDataStore.getNested(
                userId,
                "quran",
                `versesRead/${verseKey}`,
            );
            return Boolean(data);
        } catch {
            return false;
        }
    }

    async isVerseFavorited(surahNumber, verseNumber) {
        try {
            const userId = this.getUserId();
            const data = await localDataStore.getNested(
                userId,
                "quran",
                `favorites/${surahNumber}_${verseNumber}`,
            );
            return Boolean(data);
        } catch {
            return false;
        }
    }

    async getSurahVerseStatus(surahNumber) {
        try {
            const userId = this.getUserId();
            const [versesRead, favorites] = await Promise.all([
                localDataStore.getNested(userId, "quran", "versesRead"),
                localDataStore.getNested(userId, "quran", "favorites"),
            ]);

            const read = new Set();
            const favorited = new Set();
            const prefix = `${surahNumber}:`;

            Object.keys(versesRead ?? {}).forEach((key) => {
                if (key.startsWith(prefix)) {
                    read.add(Number(key.split(":")[1]));
                }
            });

            Object.keys(favorites ?? {}).forEach((key) => {
                if (key.startsWith(`${surahNumber}_`)) {
                    favorited.add(Number(key.split("_")[1]));
                }
            });

            return { read, favorited };
        } catch (error) {
            console.error("Error loading surah verse status:", error);
            return { read: new Set(), favorited: new Set() };
        }
    }
}

export const quranService = new QuranService();
