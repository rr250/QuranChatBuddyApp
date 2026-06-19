import AsyncStorage from "@react-native-async-storage/async-storage";
import bundledQuestions from "../constants/islamic_quiz_500_real.json";
import {
    dedupeRawQuestions,
    normalizeQuizPayload,
    transformQuestions,
} from "../utils/quizQuestions";

const CACHE_KEY = "@qcb/quiz_question_bank_v1";
const CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const REMOTE_FETCH_TIMEOUT_MS = 12_000;

const QUIZ_STORAGE_PATH = "DailyQuiz/islamic_quiz_500_real.json";

const getStorageBucket = () =>
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ||
    "quran-chat-buddy-prayer-time.firebasestorage.app";

/** Stable tokenless URL — path + bucket only; no download token to rotate. */
const buildTokenlessDownloadUrl = (storagePath = QUIZ_STORAGE_PATH) => {
    const bucket = getStorageBucket();
    const encodedPath = encodeURIComponent(storagePath);
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;
};

const getQuizDownloadUrl = () =>
    process.env.EXPO_PUBLIC_QUIZ_QUESTIONS_URL?.trim() ||
    buildTokenlessDownloadUrl();

const LOG_PREFIX = "[Quiz Bank]";

const SOURCE_LABELS = {
    remote: "Firebase Storage (remote)",
    cache: "local cache (AsyncStorage)",
    "stale-cache": "local cache (stale — remote fetch failed)",
    bundled: "bundled JSON (shipped with app)",
    none: "not loaded",
};

const logQuizBankSource = (source, questionCount) => {
    const origin = SOURCE_LABELS[source] ?? source;
    const isRemote = source === "remote";
    console.log(
        `${LOG_PREFIX} Questions loaded from ${isRemote ? "remote" : "local"} — ${origin}`,
        { source, questionCount },
    );
};

const fetchWithTimeout = async (url, timeoutMs = REMOTE_FETCH_TIMEOUT_MS) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, { signal: controller.signal });
    } catch (error) {
        if (error?.name === "AbortError") {
            throw new Error(`Quiz download timed out after ${timeoutMs}ms`);
        }
        throw error;
    } finally {
        clearTimeout(timer);
    }
};

class QuizQuestionBankService {
    constructor() {
        this.questions = [];
        this.source = "none";
        this.loadPromise = null;
    }

    loadBundledFallback({ silent = false } = {}) {
        const raw = dedupeRawQuestions(normalizeQuizPayload(bundledQuestions));
        this.questions = transformQuestions(raw);
        this.source = "bundled";
        if (!silent) {
            logQuizBankSource(this.source, this.questions.length);
        }
        return this.questions;
    }

    async readCache() {
        try {
            const raw = await AsyncStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    async writeCache(rawQuestions) {
        try {
            await AsyncStorage.setItem(
                CACHE_KEY,
                JSON.stringify({
                    fetchedAt: Date.now(),
                    count: rawQuestions.length,
                    questions: rawQuestions,
                }),
            );
        } catch (error) {
            console.warn("Quiz question cache write failed:", error);
        }
    }

    applyRawQuestions(rawQuestions, source, { silent = false } = {}) {
        const deduped = dedupeRawQuestions(rawQuestions);
        this.questions = transformQuestions(deduped);
        this.source = source;
        if (!silent) {
            logQuizBankSource(this.source, this.questions.length);
        }
        return this.questions;
    }

    async parseQuizResponse(response) {
        if (!response.ok) {
            throw new Error(`Quiz download failed (${response.status})`);
        }

        const contentType = response.headers.get("content-type") ?? "";
        if (
            contentType.includes("text/html") ||
            contentType.includes("application/xml")
        ) {
            throw new Error("Quiz download returned non-JSON content");
        }

        const payload = await response.json();
        const raw = dedupeRawQuestions(normalizeQuizPayload(payload));
        if (!raw.length) {
            throw new Error("Remote quiz bank is empty");
        }
        return raw;
    }

    async fetchRemoteQuestions() {
        const response = await fetchWithTimeout(getQuizDownloadUrl());
        return this.parseQuizResponse(response);
    }

    async refreshFromRemote() {
        const raw = await this.fetchRemoteQuestions();
        await this.writeCache(raw);
        return this.applyRawQuestions(raw, "remote");
    }

    async safeRefreshFromRemote() {
        try {
            await this.refreshFromRemote();
        } catch (error) {
            console.warn(
                "Background quiz refresh skipped:",
                error?.message ?? error,
            );
        }
    }

    async ensureQuestionsLoaded({ forceRefresh = false } = {}) {
        if (this.questions.length && !forceRefresh) {
            return this.questions;
        }

        if (this.loadPromise && !forceRefresh) {
            return this.loadPromise;
        }

        this.loadPromise = this.loadQuestions({ forceRefresh }).finally(() => {
            this.loadPromise = null;
        });

        return this.loadPromise;
    }

    async loadQuestions({ forceRefresh = false } = {}) {
        if (!this.questions.length) {
            this.loadBundledFallback({ silent: true });
        }

        if (!forceRefresh) {
            const cache = await this.readCache();
            const cacheIsFresh =
                cache?.fetchedAt &&
                Date.now() - cache.fetchedAt < CACHE_MAX_AGE_MS;

            if (cache?.questions?.length && cacheIsFresh) {
                this.applyRawQuestions(cache.questions, "cache");
                void this.safeRefreshFromRemote();
                return this.questions;
            }
        }

        try {
            return await this.refreshFromRemote();
        } catch (remoteError) {
            console.warn(
                "Remote quiz bank unavailable, using fallback:",
                remoteError?.message ?? remoteError,
            );

            const cache = await this.readCache();
            if (cache?.questions?.length) {
                return this.applyRawQuestions(cache.questions, "stale-cache");
            }

            if (!this.questions.length) {
                return this.loadBundledFallback();
            }

            logQuizBankSource(this.source, this.questions.length);
            return this.questions;
        }
    }

    getQuestionCount() {
        return this.questions.length;
    }

    getSource() {
        return this.source;
    }
}

export const quizQuestionBankService = new QuizQuestionBankService();
