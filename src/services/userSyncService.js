import { ref, get, set } from "firebase/database";
import { getFirebaseDatabase } from "./firebase";
import { AuthService } from "./authService";
import { localDataStore } from "../storage/localDataStore";
import { EMPTY_STREAK } from "../utils/streak";

const SYNC_KEY = "sync";
const MAX_REMOTE_QUIZ_DAYS = 90;

let syncTimer = null;

const defaultQuizLocal = () => ({
    dailyQuestions: {},
    quizResults: {},
    questionHistory: { seenIds: [] },
    stats: {
        totalQuizzes: 0,
        totalScore: 0,
        totalTimeSpent: 0,
        averageScore: 0,
        averagePercentage: 0,
        lastUpdated: null,
        streak: { ...EMPTY_STREAK },
    },
});

const defaultQuranLocal = () => ({
    profile: {
        currentSurah: 1,
        currentVerse: 1,
        totalVersesRead: 0,
        totalSurahsRead: 0,
        readingStreak: { ...EMPTY_STREAK, lastReadDate: null },
        lastUpdated: null,
    },
    versesRead: {},
    completedSurahs: {},
    favorites: {},
    dailySessions: {},
});

const toStreakPayload = (streak) =>
    streak
        ? {
              current: streak.current ?? 0,
              longest: streak.longest ?? 0,
              lastDate: streak.lastDate ?? streak.lastReadDate ?? null,
          }
        : null;

const fromStreakPayload = (raw) => {
    if (!raw) return { ...EMPTY_STREAK };
    return {
        current: raw.current ?? raw.c ?? 0,
        longest: raw.longest ?? raw.l ?? 0,
        lastDate: raw.lastDate ?? raw.d ?? null,
        lastReadDate: raw.lastDate ?? raw.lastReadDate ?? raw.d ?? null,
    };
};

const toQuizResultsPayload = (quizResults = {}) => {
    const entries = Object.entries(quizResults)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, MAX_REMOTE_QUIZ_DAYS);
    const results = {};
    for (const [date, result] of entries) {
        results[date] = {
            score: result.score ?? 0,
            percentage: result.percentage ?? 0,
            timeSpent: result.timeSpent ?? 0,
        };
    }
    return results;
};

const fromQuizResultsPayload = (remoteResults = {}) => {
    const quizResults = {};
    for (const [date, row] of Object.entries(remoteResults)) {
        quizResults[date] = {
            date,
            score: row.score ?? row.s ?? 0,
            percentage: row.percentage ?? row.p ?? 0,
            timeSpent: row.timeSpent ?? row.t ?? 0,
            totalQuestions: 5,
            answers: [],
            timestamp: date,
        };
    }
    return quizResults;
};

export const buildCompactSync = (quiz, quran, user) => ({
    updatedAt: Date.now(),
    profile: user
        ? {
              name: (user.displayName || "User").slice(0, 48),
              email: user.email ? String(user.email).slice(0, 72) : null,
          }
        : null,
    quiz: {
        streak: toStreakPayload(quiz?.stats?.streak),
        totals: quiz?.stats
            ? {
                  totalQuizzes: quiz.stats.totalQuizzes ?? 0,
                  averagePercentage: Number(quiz.stats.averagePercentage ?? 0),
                  totalTimeSpent: quiz.stats.totalTimeSpent ?? 0,
              }
            : null,
        results: toQuizResultsPayload(quiz?.quizResults),
        seenIds: (quiz?.questionHistory?.seenIds ?? []).slice(0, 500),
    },
    quran: {
        versesReadCount: Object.keys(quran?.versesRead ?? {}).length,
        completedSurahs: Object.keys(quran?.completedSurahs ?? {}).map(Number),
        streak: toStreakPayload(quran?.profile?.readingStreak),
    },
});

/** Accept readable keys and legacy abbreviated keys from older app versions */
const normalizeRemoteSync = (remote) => {
    if (!remote) return null;

    const profile = remote.profile ?? remote.p;
    const quiz = remote.quiz ?? remote.q;
    const quran = remote.quran ?? remote.k;
    const totals = quiz?.totals ?? quiz?.t;

    return {
        updatedAt: remote.updatedAt ?? remote.u ?? null,
        profile: profile
            ? {
                  name: profile.name ?? profile.n ?? "User",
                  email: profile.email ?? profile.e ?? null,
              }
            : null,
        quiz: quiz
            ? {
                  streak: quiz.streak ?? quiz.sk,
                  totals: totals
                      ? {
                            totalQuizzes: totals.totalQuizzes ?? totals.n ?? 0,
                            averagePercentage:
                                totals.averagePercentage ?? totals.a ?? 0,
                            totalTimeSpent:
                                totals.totalTimeSpent ?? totals.ts ?? 0,
                        }
                      : null,
                  results: quiz.results ?? quiz.r ?? {},
                  seenIds: quiz.seenIds ?? quiz.sq ?? [],
              }
            : null,
        quran: quran
            ? {
                  versesReadCount: quran.versesReadCount ?? quran.v ?? 0,
                  completedSurahs: quran.completedSurahs ?? quran.cs ?? [],
                  streak: quran.streak ?? quran.sk,
              }
            : null,
    };
};

const expandRemoteSync = (remote) => {
    const normalized = normalizeRemoteSync(remote);
    if (!normalized) return { quiz: null, quran: null };

    const quizResults = fromQuizResultsPayload(normalized.quiz?.results);
    const streak = fromStreakPayload(normalized.quiz?.streak);
    const totals = normalized.quiz?.totals;

    const quiz = normalized.quiz
        ? {
              dailyQuestions: {},
              quizResults,
              questionHistory: {
                  seenIds: normalized.quiz.seenIds ?? [],
              },
              stats: {
                  totalQuizzes: totals?.totalQuizzes ?? Object.keys(quizResults).length,
                  totalScore: 0,
                  totalTimeSpent: totals?.totalTimeSpent ?? 0,
                  averageScore: 0,
                  averagePercentage: totals?.averagePercentage ?? 0,
                  lastUpdated: normalized.updatedAt ?? null,
                  streak,
              },
          }
        : null;

    const completedSurahs = {};
    (normalized.quran?.completedSurahs ?? []).forEach((n) => {
        completedSurahs[n] = { surahNumber: n };
    });

    const quran = normalized.quran
        ? {
              profile: {
                  currentSurah: 1,
                  currentVerse: 1,
                  totalVersesRead: normalized.quran.versesReadCount ?? 0,
                  totalSurahsRead: (normalized.quran.completedSurahs ?? []).length,
                  readingStreak: fromStreakPayload(normalized.quran.streak),
                  lastUpdated: normalized.updatedAt ?? null,
              },
              versesRead: {},
              completedSurahs,
              favorites: {},
              dailySessions: {},
          }
        : null;

    return { quiz, quran };
};

/** One-time import from legacy large user documents */
const expandLegacyUserDoc = (legacy) => {
    if (!legacy) return { quiz: null, quran: null };

    const legacyStats = legacy.stats;
    const legacyQuizResults = legacy.quizResults ?? {};
    const legacyQuran = legacy.quranProgress ?? legacy.quran;

    const quiz =
        legacyStats || Object.keys(legacyQuizResults).length
            ? {
                  dailyQuestions: {},
                  quizResults: legacyQuizResults,
                  stats: legacyStats ?? {
                      totalQuizzes: Object.keys(legacyQuizResults).length,
                      totalScore: 0,
                      totalTimeSpent: 0,
                      averageScore: 0,
                      averagePercentage: 0,
                      lastUpdated: null,
                      streak: legacyStats?.streak ?? { ...EMPTY_STREAK },
                  },
              }
            : null;

    let quran = null;
    if (legacyQuran) {
        quran = {
            profile: legacyQuran.profile ?? defaultQuranLocal().profile,
            versesRead: legacyQuran.versesRead ?? {},
            completedSurahs: legacyQuran.completedSurahs ?? {},
            favorites: legacyQuran.favorites ?? {},
            dailySessions: legacyQuran.dailySessions ?? {},
        };
    }

    return { quiz, quran };
};

/** Local wins on conflicts; remote fills gaps only */
const mergeQuizLocalWins = (local, remote) => {
    const base = local ?? defaultQuizLocal();
    if (!remote) return base;

    return {
        dailyQuestions: { ...remote.dailyQuestions, ...base.dailyQuestions },
        quizResults: { ...remote.quizResults, ...base.quizResults },
        questionHistory: {
            seenIds: [
                ...new Set([
                    ...(remote.questionHistory?.seenIds ?? []),
                    ...(base.questionHistory?.seenIds ?? []),
                ]),
            ].slice(0, 500),
        },
        stats: {
            ...remote.stats,
            ...base.stats,
            streak: {
                ...fromStreakPayload(null),
                ...remote.stats?.streak,
                ...base.stats?.streak,
                longest: Math.max(
                    remote.stats?.streak?.longest ?? 0,
                    base.stats?.streak?.longest ?? 0,
                ),
            },
        },
    };
};

const mergeQuranLocalWins = (local, remote) => {
    const base = local ?? defaultQuranLocal();
    if (!remote) return base;

    return {
        profile: {
            ...base.profile,
            ...remote.profile,
            totalVersesRead: Math.max(
                base.profile?.totalVersesRead ?? 0,
                remote.profile?.totalVersesRead ?? 0,
            ),
            totalSurahsRead: Math.max(
                base.profile?.totalSurahsRead ?? 0,
                remote.profile?.totalSurahsRead ?? 0,
            ),
            readingStreak: {
                ...fromStreakPayload(null),
                ...remote.profile?.readingStreak,
                ...base.profile?.readingStreak,
                longest: Math.max(
                    remote.profile?.readingStreak?.longest ?? 0,
                    base.profile?.readingStreak?.longest ?? 0,
                ),
            },
        },
        versesRead: { ...remote.versesRead, ...base.versesRead },
        completedSurahs: { ...remote.completedSurahs, ...base.completedSurahs },
        favorites: { ...remote.favorites, ...base.favorites },
        dailySessions: { ...remote.dailySessions, ...base.dailySessions },
    };
};

export const userSyncService = {
    defaultQuizLocal,
    defaultQuranLocal,

    scheduleSync(userId) {
        if (!userId) return;
        if (syncTimer) clearTimeout(syncTimer);
        syncTimer = setTimeout(() => {
            this.pushToFirebase(userId).catch(() => {});
        }, 2000);
    },

    async pushToFirebase(userId) {
        if (!userId) return;
        try {
            AuthService.initialize();
            const database = getFirebaseDatabase();
            const user = AuthService.getCurrentUser();
            const [quiz, quran] = await Promise.all([
                localDataStore.get(userId, "quiz"),
                localDataStore.get(userId, "quran"),
            ]);
            const payload = buildCompactSync(quiz, quran, user);
            await set(ref(database, `users/${userId}/${SYNC_KEY}`), payload);
        } catch {
            // silent — retried on next scheduleSync / login
        }
    },

    async mergeOnLogin(userId) {
        if (!userId) return;
        try {
            AuthService.initialize();
            const database = getFirebaseDatabase();
            const syncRef = ref(database, `users/${userId}/${SYNC_KEY}`);

            const [localQuiz, localQuran, remoteSnap, legacySnap] = await Promise.all([
                localDataStore.get(userId, "quiz"),
                localDataStore.get(userId, "quran"),
                get(syncRef).catch(() => null),
                get(ref(database, `users/${userId}`)).catch(() => null),
            ]);

            const remote = remoteSnap?.exists?.() ? remoteSnap.val() : null;
            const legacy = !remote && legacySnap?.exists?.() ? legacySnap.val() : null;
            const { quiz: remoteQuiz, quran: remoteQuran } = remote
                ? expandRemoteSync(remote)
                : expandLegacyUserDoc(legacy);

            const mergedQuiz = mergeQuizLocalWins(
                localQuiz ?? defaultQuizLocal(),
                remoteQuiz,
            );
            const mergedQuran = mergeQuranLocalWins(
                localQuran ?? defaultQuranLocal(),
                remoteQuran,
            );

            await Promise.all([
                localDataStore.set(userId, "quiz", mergedQuiz),
                localDataStore.set(userId, "quran", mergedQuran),
            ]);

            await this.pushToFirebase(userId);
        } catch {
            // silent
        }
    },
};
