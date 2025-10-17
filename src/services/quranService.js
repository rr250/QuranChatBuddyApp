// src/services/quranService.js - Complete Quran service with Firebase tracking
import { AuthService } from "./authService";
import { getFirebaseAuth, getFirebaseDatabase } from "./firebase";
import {
    ref,
    set,
    get,
    push,
    update,
    serverTimestamp,
} from "firebase/database";

class QuranService {
    constructor() {
        this.baseApiUrl = "https://api.alquran.cloud/v1";
        this.currentUserId = null;
        this.initialize();
    }

    initialize() {
        if (!this.auth) {
            this.auth = getFirebaseAuth();
            this.database = getFirebaseDatabase();
        }
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

    // Get Firebase path for user Quran data
    getUserQuranPath(path = "") {
        const userId = this.getCurrentUserId();
        return `users/${userId}/quranProgress/${path}`;
    }

    // Get all Surahs list with metadata
    async getAllSurahs() {
        try {
            console.log(
                "Fetching all Surahs from API",
                `${this.baseApiUrl}/surah`
            );
            const response = await fetch(`${this.baseApiUrl}/surah`);
            const data = await response.json();

            if (data.code === 200) {
                return data.data.map((surah) => ({
                    number: surah.number,
                    name: surah.name,
                    englishName: surah.englishName,
                    englishNameTranslation: surah.englishNameTranslation,
                    numberOfAyahs: surah.numberOfAyahs,
                    revelationType: surah.revelationType,
                }));
            }
            throw new Error("Failed to fetch Surahs");
        } catch (error) {
            console.error("Error fetching Surahs:", error);
            throw error;
        }
    }

    // Get specific Surah with Arabic and English
    async getSurah(surahNumber, edition = "quran-uthmani") {
        try {
            // Get Arabic text
            const arabicResponse = await fetch(
                `${this.baseApiUrl}/surah/${surahNumber}/${edition}`
            );
            const arabicData = await arabicResponse.json();

            // Get English translation
            const englishResponse = await fetch(
                `${this.baseApiUrl}/surah/${surahNumber}/en.asad`
            );
            const englishData = await englishResponse.json();

            if (arabicData.code === 200 && englishData.code === 200) {
                const surah = arabicData.data;
                const englishSurah = englishData.data;

                // Combine Arabic and English verses
                const verses = surah.ayahs.map((ayah, index) => ({
                    number: ayah.number,
                    numberInSurah: ayah.numberInSurah,
                    text: ayah.text, // Arabic text
                    translation: englishSurah.ayahs[index]?.text || "", // English translation
                    juz: ayah.juz,
                    page: ayah.page,
                    hizbQuarter: ayah.hizbQuarter,
                }));

                return {
                    number: surah.number,
                    name: surah.name,
                    englishName: surah.englishName,
                    englishNameTranslation: surah.englishNameTranslation,
                    numberOfAyahs: surah.numberOfAyahs,
                    revelationType: surah.revelationType,
                    verses: verses,
                };
            }
            throw new Error("Failed to fetch Surah data");
        } catch (error) {
            console.error("Error fetching Surah:", error);
            throw error;
        }
    }

    // Get specific verse with multiple translations
    async getVerse(surahNumber, verseNumber) {
        try {
            const response = await fetch(
                `${this.baseApiUrl}/ayah/${surahNumber}:${verseNumber}/editions/quran-uthmani,en.asad,en.pickthall`
            );
            const data = await response.json();

            if (data.code === 200) {
                const [arabic, asad, pickthall] = data.data;
                return {
                    number: arabic.number,
                    numberInSurah: arabic.numberInSurah,
                    surah: {
                        number: arabic.surah.number,
                        name: arabic.surah.name,
                        englishName: arabic.surah.englishName,
                    },
                    text: arabic.text,
                    translations: {
                        asad: asad.text,
                        pickthall: pickthall.text,
                    },
                    juz: arabic.juz,
                    page: arabic.page,
                };
            }
            throw new Error("Failed to fetch verse");
        } catch (error) {
            console.error("Error fetching verse:", error);
            throw error;
        }
    }

    // Search verses
    async searchVerses(query, language = "en") {
        try {
            const edition = language === "ar" ? "quran-uthmani" : "en.asad";
            const response = await fetch(
                `${this.baseApiUrl}/search/${encodeURIComponent(
                    query
                )}/${edition}`
            );
            const data = await response.json();

            if (data.code === 200) {
                return {
                    count: data.data.count,
                    matches: data.data.matches.map((match) => ({
                        number: match.number,
                        numberInSurah: match.numberInSurah,
                        text: match.text,
                        surah: {
                            number: match.surah.number,
                            name: match.surah.name,
                            englishName: match.surah.englishName,
                        },
                    })),
                };
            }
            throw new Error("Search failed");
        } catch (error) {
            console.error("Error searching verses:", error);
            throw error;
        }
    }

    // Firebase Progress Tracking

    // Initialize user Quran progress
    async initializeUserProgress() {
        try {
            const userId = this.getCurrentUserId();
            const progressRef = ref(
                this.database,
                this.getUserQuranPath("profile")
            );

            const snapshot = await get(progressRef);
            if (!snapshot.exists()) {
                const initialProgress = {
                    userId: userId,
                    createdAt: serverTimestamp(),
                    totalSurahsRead: 0,
                    totalVersesRead: 0,
                    favoriteVerses: [],
                    readingSessions: [],
                    currentSurah: 1,
                    currentVerse: 1,
                    completedSurahs: [],
                    readingStreak: {
                        current: 0,
                        longest: 0,
                        lastReadDate: null,
                    },
                };

                await set(progressRef, initialProgress);
                console.log("User Quran progress initialized");
            }
        } catch (error) {
            console.error("Error initializing user progress:", error);
        }
    }

    // Track verse read
    async markVerseAsRead(surahNumber, verseNumber) {
        try {
            const timestamp = serverTimestamp();
            const verseKey = `${surahNumber}:${verseNumber}`;

            // Record individual verse read
            const verseReadRef = ref(
                this.database,
                this.getUserQuranPath(`versesRead/${verseKey}`)
            );
            await set(verseReadRef, {
                surahNumber,
                verseNumber,
                readAt: timestamp,
                readCount: 1, // Can be incremented for re-reads
            });

            // Update daily reading session
            await this.updateDailySession(surahNumber, verseNumber);

            // Update overall progress
            await this.updateUserProgress();
        } catch (error) {
            console.error("Error marking verse as read:", error);
        }
    }

    // Mark entire Surah as completed
    async markSurahAsCompleted(surahNumber) {
        try {
            const timestamp = serverTimestamp();

            // Record Surah completion
            const surahCompletionRef = ref(
                this.database,
                this.getUserQuranPath(`completedSurahs/${surahNumber}`)
            );
            await set(surahCompletionRef, {
                surahNumber,
                completedAt: timestamp,
                readingTime: 0, // Can be calculated from session data
            });

            // Update progress summary
            await this.updateUserProgress();
        } catch (error) {
            console.error("Error marking Surah as completed:", error);
        }
    }

    // Update daily reading session
    async updateDailySession(surahNumber, verseNumber) {
        try {
            const today = new Date().toDateString();
            const sessionRef = ref(
                this.database,
                this.getUserQuranPath(`dailySessions/${today}`)
            );

            const snapshot = await get(sessionRef);
            let session = snapshot.exists()
                ? snapshot.val()
                : {
                      date: today,
                      startTime: serverTimestamp(),
                      versesRead: [],
                      totalTime: 0,
                  };

            // Add verse to session
            const verseKey = `${surahNumber}:${verseNumber}`;
            if (!session.versesRead.includes(verseKey)) {
                session.versesRead.push(verseKey);
                session.lastReadTime = serverTimestamp();

                await set(sessionRef, session);
            }
        } catch (error) {
            console.error("Error updating daily session:", error);
        }
    }

    // Update overall user progress
    async updateUserProgress() {
        try {
            // Get all user data
            const [versesSnapshot, surahsSnapshot, sessionsSnapshot] =
                await Promise.all([
                    get(
                        ref(this.database, this.getUserQuranPath("versesRead"))
                    ),
                    get(
                        ref(
                            this.database,
                            this.getUserQuranPath("completedSurahs")
                        )
                    ),
                    get(
                        ref(
                            this.database,
                            this.getUserQuranPath("dailySessions")
                        )
                    ),
                ]);

            const totalVersesRead = versesSnapshot.exists()
                ? Object.keys(versesSnapshot.val()).length
                : 0;
            const totalSurahsCompleted = surahsSnapshot.exists()
                ? Object.keys(surahsSnapshot.val()).length
                : 0;
            const totalSessions = sessionsSnapshot.exists()
                ? Object.keys(sessionsSnapshot.val()).length
                : 0;

            // Calculate reading streak
            const readingStreak = await this.calculateReadingStreak(
                sessionsSnapshot.val()
            );

            // Update progress summary
            const progressRef = ref(
                this.database,
                this.getUserQuranPath("profile")
            );
            await update(progressRef, {
                totalVersesRead,
                totalSurahsRead: totalSurahsCompleted,
                totalReadingSessions: totalSessions,
                readingStreak,
                lastUpdated: serverTimestamp(),
            });
        } catch (error) {
            console.error("Error updating user progress:", error);
        }
    }

    // Calculate reading streak
    async calculateReadingStreak(sessions) {
        if (!sessions) return { current: 0, longest: 0, lastReadDate: null };

        const dates = Object.keys(sessions).sort();
        if (dates.length === 0)
            return { current: 0, longest: 0, lastReadDate: null };

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        // Calculate streaks
        for (let i = dates.length - 1; i >= 0; i--) {
            const currentDate = dates[i];
            const previousDate = i > 0 ? dates[i - 1] : null;

            if (i === dates.length - 1) {
                // Start with the most recent date
                tempStreak = 1;
                if (currentDate === today || currentDate === yesterday) {
                    currentStreak = 1;
                }
            } else {
                // Check if dates are consecutive
                const current = new Date(currentDate);
                const previous = new Date(previousDate);
                const diffTime = Math.abs(previous - current);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    tempStreak++;
                    if (currentStreak > 0) currentStreak++;
                } else {
                    longestStreak = Math.max(longestStreak, tempStreak);
                    tempStreak = 1;
                    currentStreak = 0;
                }
            }
        }

        longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

        return {
            current: currentStreak,
            longest: longestStreak,
            lastReadDate: dates[dates.length - 1],
        };
    }

    // Get user's reading progress
    async getUserProgress() {
        try {
            const progressRef = ref(
                this.database,
                this.getUserQuranPath("profile")
            );
            const snapshot = await get(progressRef);

            if (snapshot.exists()) {
                return snapshot.val();
            } else {
                await this.initializeUserProgress();
                return await this.getUserProgress();
            }
        } catch (error) {
            console.error("Error getting user progress:", error);
            return null;
        }
    }

    // Get reading history
    async getReadingHistory(limit = 10) {
        try {
            const sessionsRef = ref(
                this.database,
                this.getUserQuranPath("dailySessions")
            );
            const snapshot = await get(sessionsRef);

            if (snapshot.exists()) {
                const sessions = snapshot.val();
                return Object.values(sessions)
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, limit);
            }
            return [];
        } catch (error) {
            console.error("Error getting reading history:", error);
            return [];
        }
    }

    // Bookmark/Favorite a verse
    async addToFavorites(surahNumber, verseNumber, text, translation) {
        try {
            const favoriteRef = ref(
                this.database,
                this.getUserQuranPath(`favorites/${surahNumber}_${verseNumber}`)
            );
            await set(favoriteRef, {
                surahNumber,
                verseNumber,
                text,
                translation,
                addedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error("Error adding to favorites:", error);
        }
    }

    // Remove from favorites
    async removeFromFavorites(surahNumber, verseNumber) {
        try {
            const favoriteRef = ref(
                this.database,
                this.getUserQuranPath(`favorites/${surahNumber}_${verseNumber}`)
            );
            await set(favoriteRef, null);
        } catch (error) {
            console.error("Error removing from favorites:", error);
        }
    }

    // Get favorite verses
    async getFavoriteVerses() {
        try {
            const favoritesRef = ref(
                this.database,
                this.getUserQuranPath("favorites")
            );
            const snapshot = await get(favoritesRef);

            if (snapshot.exists()) {
                return Object.values(snapshot.val()).sort(
                    (a, b) => new Date(b.addedAt) - new Date(a.addedAt)
                );
            }
            return [];
        } catch (error) {
            console.error("Error getting favorite verses:", error);
            return [];
        }
    }

    // Get reading statistics
    async getReadingStats() {
        try {
            const progress = await this.getUserProgress();
            const history = await this.getReadingHistory(30);

            return {
                totalVersesRead: progress?.totalVersesRead || 0,
                totalSurahsCompleted: progress?.totalSurahsRead || 0,
                currentStreak: progress?.readingStreak?.current || 0,
                longestStreak: progress?.readingStreak?.longest || 0,
                averageVersesPerDay:
                    history.length > 0
                        ? Math.round(
                              history.reduce(
                                  (sum, session) =>
                                      sum + (session.versesRead?.length || 0),
                                  0
                              ) / history.length
                          )
                        : 0,
                daysActive: history.length,
                completionPercentage: Math.round(
                    ((progress?.totalVersesRead || 0) / 6236) * 100
                ), // Total verses in Quran: 6236
            };
        } catch (error) {
            console.error("Error getting reading stats:", error);
            return {
                totalVersesRead: 0,
                totalSurahsCompleted: 0,
                currentStreak: 0,
                longestStreak: 0,
                averageVersesPerDay: 0,
                daysActive: 0,
                completionPercentage: 0,
            };
        }
    }

    // Check if verse is already read
    async isVerseRead(surahNumber, verseNumber) {
        try {
            const verseKey = `${surahNumber}:${verseNumber}`;
            const verseRef = ref(
                this.database,
                this.getUserQuranPath(`versesRead/${verseKey}`)
            );
            const snapshot = await get(verseRef);
            return snapshot.exists();
        } catch (error) {
            console.error("Error checking if verse is read:", error);
            return false;
        }
    }

    // Check if verse is favorited
    async isVerseFavorited(surahNumber, verseNumber) {
        try {
            const favoriteRef = ref(
                this.database,
                this.getUserQuranPath(`favorites/${surahNumber}_${verseNumber}`)
            );
            const snapshot = await get(favoriteRef);
            return snapshot.exists();
        } catch (error) {
            console.error("Error checking if verse is favorited:", error);
            return false;
        }
    }
}

export const quranService = new QuranService();
