import { QuranApi } from "./quranApi";
import { AuthService } from "./authService";
import { localDataStore } from "../storage/localDataStore";
import { userSyncService } from "./userSyncService";
import { getTodayDateString, sortByDateDesc } from "../utils/date";
import logger from "./logger";
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
            await localDataStore.set(
                userId,
                "quran",
                userSyncService.defaultQuranLocal(),
            );
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
            logger.error("Error initializing user progress:", error);
        }
    }

    async markVerseAsRead(surahNumber, verseNumber) {
        try {
            const userId = this.getUserId();
            const verseKey = `${surahNumber}:${verseNumber}`;

            await localDataStore.setNested(
                userId,
                "quran",
                `versesRead/${verseKey}`,
                {
                    surahNumber,
                    verseNumber,
                    readAt: new Date().toISOString(),
                },
            );

            await this.updateDailySession(userId, surahNumber, verseNumber);
            await this.updateReadingPosition(userId, surahNumber, verseNumber);
            await this.updateUserProgress(userId);
            userSyncService.scheduleSync(userId);
        } catch (error) {
            logger.error("Error marking verse as read:", error);
        }
    }

    async updateReadingPosition(userId, surahNumber, verseNumber) {
        const surah = await QuranApi.getSurah(surahNumber);
        let nextSurah = surahNumber;
        let nextVerse = verseNumber + 1;

        if (nextVerse > surah.numberOfAyahs) {
            nextSurah = surahNumber < 114 ? surahNumber + 1 : 1;
            nextVerse = 1;
        }

        const profile =
            (await localDataStore.getNested(userId, "quran", "profile")) ??
            createInitialProfile();

        await localDataStore.setNested(userId, "quran", "profile", {
            ...profile,
            currentSurah: nextSurah,
            currentVerse: nextVerse,
            lastUpdated: new Date().toISOString(),
        });
    }

    async getContinueReadingPosition() {
        try {
            const userId = this.getUserId();
            await this.ensureQuranData(userId);

            const profile =
                (await localDataStore.getNested(userId, "quran", "profile")) ??
                createInitialProfile();
            const versesRead =
                (await localDataStore.getNested(
                    userId,
                    "quran",
                    "versesRead",
                )) ?? {};

            const startSurah = profile.currentSurah ?? 1;
            const startVerse = profile.currentVerse ?? 1;

            for (
                let surahNumber = startSurah;
                surahNumber <= 114;
                surahNumber += 1
            ) {
                const surah = await QuranApi.getSurah(surahNumber);
                const firstVerse = surahNumber === startSurah ? startVerse : 1;

                for (
                    let verseNumber = firstVerse;
                    verseNumber <= surah.numberOfAyahs;
                    verseNumber += 1
                ) {
                    const verseKey = `${surahNumber}:${verseNumber}`;
                    if (!versesRead[verseKey]) {
                        return { surahNumber, verseNumber };
                    }
                }
            }

            return { surahNumber: 1, verseNumber: 1 };
        } catch (error) {
            logger.error("Error getting continue reading position:", error);
            return { surahNumber: 1, verseNumber: 1 };
        }
    }

    async markSurahAsCompleted(surahNumber) {
        try {
            const userId = this.getUserId();
            const surah = await QuranApi.getSurah(surahNumber);
            const readAt = new Date().toISOString();

            for (const verse of surah.verses) {
                const verseNumber = verse.numberInSurah;
                const verseKey = `${surahNumber}:${verseNumber}`;
                await localDataStore.setNested(
                    userId,
                    "quran",
                    `versesRead/${verseKey}`,
                    {
                        surahNumber,
                        verseNumber,
                        readAt,
                    },
                );
                await this.updateDailySession(userId, surahNumber, verseNumber);
            }

            await localDataStore.setNested(
                userId,
                "quran",
                `completedSurahs/${surahNumber}`,
                {
                    surahNumber,
                    completedAt: readAt,
                },
            );

            const nextSurah = surahNumber < 114 ? surahNumber + 1 : 1;
            const profile =
                (await localDataStore.getNested(userId, "quran", "profile")) ??
                createInitialProfile();

            await localDataStore.setNested(userId, "quran", "profile", {
                ...profile,
                currentSurah: nextSurah,
                currentVerse: 1,
                lastUpdated: readAt,
            });

            await this.updateUserProgress(userId);
            userSyncService.scheduleSync(userId);
        } catch (error) {
            logger.error("Error marking Surah as completed:", error);
        }
    }

    async updateDailySession(userId, surahNumber, verseNumber) {
        const today = getTodayDateString();
        const verseKey = `${surahNumber}:${verseNumber}`;
        const session = (await localDataStore.getNested(
            userId,
            "quran",
            `dailySessions/${today}`,
        )) ?? {
            date: today,
            startTime: new Date().toISOString(),
            versesRead: [],
            totalTime: 0,
        };

        if (session.versesRead.includes(verseKey)) return;

        await localDataStore.setNested(
            userId,
            "quran",
            `dailySessions/${today}`,
            {
                ...session,
                versesRead: [...session.versesRead, verseKey],
                lastReadTime: new Date().toISOString(),
            },
        );
    }

    async updateUserProgress(userId) {
        const versesRead =
            (await localDataStore.getNested(userId, "quran", "versesRead")) ??
            {};
        const completedSurahs =
            (await localDataStore.getNested(
                userId,
                "quran",
                "completedSurahs",
            )) ?? {};
        const sessions =
            (await localDataStore.getNested(
                userId,
                "quran",
                "dailySessions",
            )) ?? {};

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
            const progress = await localDataStore.getNested(
                userId,
                "quran",
                "profile",
            );
            return progress ?? createInitialProfile();
        } catch (error) {
            logger.error("Error getting user progress:", error);
            return null;
        }
    }

    async getReadingHistory(limit = 10) {
        try {
            const userId = this.getUserId();
            const sessions =
                (await localDataStore.getNested(
                    userId,
                    "quran",
                    "dailySessions",
                )) ?? {};
            return sortByDateDesc(Object.values(sessions)).slice(0, limit);
        } catch (error) {
            logger.error("Error getting reading history:", error);
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
            logger.error("Error adding to favorites:", error);
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
            logger.error("Error removing from favorites:", error);
        }
    }

    async getFavoriteVerses() {
        try {
            const userId = this.getUserId();
            const favorites =
                (await localDataStore.getNested(
                    userId,
                    "quran",
                    "favorites",
                )) ?? {};
            return sortByDateDesc(Object.values(favorites), "addedAt");
        } catch (error) {
            logger.error("Error getting favorite verses:", error);
            return [];
        }
    }

    async getReadingStats() {
        try {
            const userId = this.getUserId();
            const [progress, sessions] = await Promise.all([
                this.getUserProgress(),
                localDataStore.getNested(userId, "quran", "dailySessions"),
            ]);

            const sessionMap = sessions ?? {};
            const sessionDates = Object.keys(sessionMap);
            const totalVersesRead = progress?.totalVersesRead ?? 0;
            const totalVersesInSessions = sessionDates.reduce((sum, date) => {
                return sum + (sessionMap[date]?.versesRead?.length ?? 0);
            }, 0);

            return {
                totalVersesRead,
                totalSurahsCompleted: progress?.totalSurahsRead ?? 0,
                currentStreak: progress?.readingStreak?.current ?? 0,
                longestStreak: progress?.readingStreak?.longest ?? 0,
                averageVersesPerDay:
                    sessionDates.length > 0
                        ? Math.round(
                              totalVersesInSessions / sessionDates.length,
                          )
                        : 0,
                daysActive: sessionDates.length,
                completionPercentage: Math.round(
                    (totalVersesRead / TOTAL_QURAN_VERSES) * 100,
                ),
            };
        } catch (error) {
            logger.error("Error getting reading stats:", error);
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
            logger.error("Error loading surah verse status:", error);
            return { read: new Set(), favorited: new Set() };
        }
    }
}

export const quranService = new QuranService();
