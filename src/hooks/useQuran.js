// src/hooks/useQuran.js - React hooks for Quran functionality
import { useState, useEffect, useCallback } from "react";
import { quranService } from "../services/quranService";
import { useAuthStore } from "../store/authStore";

export const useQuran = () => {
    const [surahs, setSurahs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuthStore();
    const [progress, setProgress] = useState(null);

    // Monitor authentication state
    useEffect(() => {
        if (user) {
            quranService.initializeUserProgress().catch(console.error);
            loadUserProgress();
        }
    }, [user]);

    // Load all Surahs
    const loadSurahs = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const surahList = await quranService.getAllSurahs();
            console.log("Surah list loaded:", surahList);
            setSurahs(surahList);
        } catch (error) {
            console.error("Error loading Surahs:", error);
            setError("Failed to load Surahs. Please check your connection.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Load user progress
    const loadUserProgress = useCallback(async () => {
        if (!user) return;

        try {
            const userProgress = await quranService.getUserProgress();
            setProgress(userProgress);
        } catch (error) {
            console.error("Error loading user progress:", error);
        }
    }, [user]);

    // Initialize data
    useEffect(() => {
        loadSurahs();
    }, [loadSurahs]);

    useEffect(() => {
        if (user) {
            loadUserProgress();
        }
    }, [user, loadUserProgress]);

    return {
        surahs,
        loading,
        error,
        user,
        progress,
        refreshSurahs: loadSurahs,
        refreshProgress: loadUserProgress,
        isAuthenticated: !!user,
    };
};

// Hook for individual Surah
export const useSurah = (surahNumber) => {
    const [surah, setSurah] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [readVerses, setReadVerses] = useState(new Set());
    const [favoriteVerses, setFavoriteVerses] = useState(new Set());

    // Load Surah data
    const loadSurah = useCallback(async () => {
        if (!surahNumber) return;

        try {
            setLoading(true);
            setError(null);
            const surahData = await quranService.getSurah(surahNumber);
            setSurah(surahData);

            // Load user's read status for verses
            const readStatus = new Set();
            const favoriteStatus = new Set();

            for (const verse of surahData.verses) {
                const isRead = await quranService.isVerseRead(
                    surahNumber,
                    verse.numberInSurah
                );
                const isFavorited = await quranService.isVerseFavorited(
                    surahNumber,
                    verse.numberInSurah
                );

                if (isRead) readStatus.add(verse.numberInSurah);
                if (isFavorited) favoriteStatus.add(verse.numberInSurah);
            }

            setReadVerses(readStatus);
            setFavoriteVerses(favoriteStatus);
        } catch (error) {
            console.error("Error loading Surah:", error);
            setError("Failed to load Surah. Please check your connection.");
        } finally {
            setLoading(false);
        }
    }, [surahNumber]);

    // Mark verse as read
    const markVerseAsRead = useCallback(
        async (verseNumber) => {
            try {
                await quranService.markVerseAsRead(surahNumber, verseNumber);
                setReadVerses((prev) => new Set([...prev, verseNumber]));
            } catch (error) {
                console.error("Error marking verse as read:", error);
            }
        },
        [surahNumber]
    );

    // Toggle favorite verse
    const toggleFavoriteVerse = useCallback(
        async (verseNumber) => {
            try {
                const verse = surah?.verses.find(
                    (v) => v.numberInSurah === verseNumber
                );
                if (!verse) return;

                const isFavorited = favoriteVerses.has(verseNumber);

                if (isFavorited) {
                    await quranService.removeFromFavorites(
                        surahNumber,
                        verseNumber
                    );
                    setFavoriteVerses((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(verseNumber);
                        return newSet;
                    });
                } else {
                    await quranService.addToFavorites(
                        surahNumber,
                        verseNumber,
                        verse.text,
                        verse.translation
                    );
                    setFavoriteVerses(
                        (prev) => new Set([...prev, verseNumber])
                    );
                }
            } catch (error) {
                console.error("Error toggling favorite verse:", error);
            }
        },
        [surahNumber, surah, favoriteVerses]
    );

    // Mark entire Surah as completed
    const markSurahAsCompleted = useCallback(async () => {
        try {
            await quranService.markSurahAsCompleted(surahNumber);
            // Mark all verses as read
            const allVerses = new Set(
                surah?.verses.map((v) => v.numberInSurah) || []
            );
            setReadVerses(allVerses);
        } catch (error) {
            console.error("Error marking Surah as completed:", error);
        }
    }, [surahNumber, surah]);

    useEffect(() => {
        loadSurah();
    }, [loadSurah]);

    return {
        surah,
        loading,
        error,
        readVerses,
        favoriteVerses,
        markVerseAsRead,
        toggleFavoriteVerse,
        markSurahAsCompleted,
        refreshSurah: loadSurah,
        isVerseRead: (verseNumber) => readVerses.has(verseNumber),
        isVerseFavorited: (verseNumber) => favoriteVerses.has(verseNumber),
        completionPercentage: surah
            ? Math.round((readVerses.size / surah.verses.length) * 100)
            : 0,
    };
};

// Hook for reading statistics
export const useQuranStats = () => {
    const [stats, setStats] = useState({
        totalVersesRead: 0,
        totalSurahsCompleted: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageVersesPerDay: 0,
        daysActive: 0,
        completionPercentage: 0,
    });
    const [history, setHistory] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);

    // Monitor authentication state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });

        return () => unsubscribe();
    }, []);

    const loadStats = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const [statsData, historyData, favoritesData] = await Promise.all([
                quranService.getReadingStats(),
                quranService.getReadingHistory(15),
                quranService.getFavoriteVerses(),
            ]);

            setStats(statsData);
            setHistory(historyData);
            setFavorites(favoritesData);
        } catch (error) {
            console.error("Error loading Quran stats:", error);
            setError(
                "Failed to load statistics. Please check your connection."
            );
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    return {
        stats,
        history,
        favorites,
        loading,
        error,
        user,
        refreshStats: loadStats,
        isAuthenticated: !!user,
    };
};

// Hook for searching verses
export const useQuranSearch = () => {
    const [results, setResults] = useState({ count: 0, matches: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState("");

    const search = useCallback(async (searchQuery, language = "en") => {
        if (!searchQuery.trim()) {
            setResults({ count: 0, matches: [] });
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setQuery(searchQuery);

            const searchResults = await quranService.searchVerses(
                searchQuery,
                language
            );
            setResults(searchResults);
        } catch (error) {
            console.error("Error searching verses:", error);
            setError("Search failed. Please try again.");
            setResults({ count: 0, matches: [] });
        } finally {
            setLoading(false);
        }
    }, []);

    const clearSearch = useCallback(() => {
        setResults({ count: 0, matches: [] });
        setQuery("");
        setError(null);
    }, []);

    return {
        results,
        loading,
        error,
        query,
        search,
        clearSearch,
    };
};
