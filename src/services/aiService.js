import { httpsCallable } from "firebase/functions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ref, get } from "firebase/database";
import { getIslamicSystemPrompt } from "../constants/ai";
import { BaseService } from "./baseService";
import { getFirebaseFunctions } from "./firebase";
import { AuthService } from "./authService";
import { DeviceIdentityService } from "./deviceIdentityService";
import { MessageUsageService } from "./messageUsageService";
import logger from "./logger";

const LOG_PREFIX = "[AI Service]";

class AIService extends BaseService {
    constructor() {
        super();
        this.initialize();
    }

    async callCloudFunction(name, data) {
        logger.debug(`${LOG_PREFIX} Calling Firebase function: ${name}`);
        try {
            await AuthService.ensureAuthenticated();
            const functions = getFirebaseFunctions();
            const callable = httpsCallable(functions, name);
            const result = await callable(data);
            const content = result.data?.content ?? "";
            logger.debug(`${LOG_PREFIX} Firebase response received (${name})`, {
                contentLength: content.length,
            });
            return result.data;
        } catch (error) {
            logger.warn(`${LOG_PREFIX} Firebase call failed (${name}):`, error);

            if (error?.code === "functions/resource-exhausted") {
                const quotaError = new Error(
                    "You have used all free messages. Upgrade to continue.",
                );
                quotaError.code = "free-limit-reached";
                throw quotaError;
            }

            if (error?.code === "functions/failed-precondition") {
                throw new Error(
                    error.message ||
                        "AI service is not configured on the server.",
                );
            }

            // Direct OpenAI fallback is only available in development builds.
            // EXPO_PUBLIC_OPENAI_API_KEY must never be set in production EAS secrets
            // — EXPO_PUBLIC_ variables are inlined into the JS bundle at build time
            // and are trivially extractable from any APK/AAB.
            if (__DEV__ && process.env.EXPO_PUBLIC_OPENAI_API_KEY) {
                logger.warn(
                    `${LOG_PREFIX} DEV fallback: calling OpenAI directly`,
                );
                return this._devCallOpenAIDirect(name, data);
            }

            throw error;
        }
    }

    /**
     * Direct OpenAI call used only in development when Cloud Functions are unavailable.
     * This method is unreachable in production builds because it is gated on __DEV__.
     */
    async _devCallOpenAIDirect(name, data) {
        if (!__DEV__) {
            throw new Error(
                "Direct OpenAI access is not available in production.",
            );
        }

        const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error("EXPO_PUBLIC_OPENAI_API_KEY not set in .env");
        }

        const makeRequest = async (body) => {
            const response = await fetch(
                "https://api.openai.com/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(body),
                },
            );
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`OpenAI API error ${response.status}: ${text}`);
            }
            return response.json();
        };

        if (name === "verseCategory") {
            const { translation, reference } = data;
            const completion = await makeRequest({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content:
                            "Categorize Quran verses with a short Islamic theme label (2-4 words). Examples: Trust in Allah, Patience, Gratitude, Mercy. Reply with only the label, no quotes or punctuation.",
                    },
                    {
                        role: "user",
                        content: `Verse translation: ${translation}\nReference: ${reference}`,
                    },
                ],
                max_tokens: 24,
                temperature: 0.3,
            });
            const content =
                completion.choices?.[0]?.message?.content?.trim() ||
                "Quranic Wisdom";
            return { content };
        }

        const completion = await makeRequest({
            model: data.model,
            messages: data.messages,
            max_tokens: data.max_tokens,
            temperature: data.temperature,
            presence_penalty: data.presence_penalty,
            frequency_penalty: data.frequency_penalty,
        });
        const content = completion.choices?.[0]?.message?.content?.trim() || "";
        return { content };
    }

    async getOnboardingData() {
        try {
            const stored = await AsyncStorage.getItem("onboarding_data");
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            logger.warn("Error reading local onboarding data:", error);
        }

        try {
            this.initialize();
            const user = AuthService.getCurrentUser();
            if (!user) return null;

            const onboardingRef = ref(
                this.database,
                `users/${user.uid}/profile/onboarding`,
            );
            const snapshot = await get(onboardingRef);
            return snapshot.exists() ? snapshot.val() : null;
        } catch (error) {
            logger.error("Error fetching onboarding data:", error);
            return null;
        }
    }

    async sendMessage(message) {
        try {
            const user = await AuthService.ensureAuthenticated();
            const userId = user.uid;
            const onboardingData = await this.getOnboardingData();
            const systemPrompt = getIslamicSystemPrompt({ onboardingData });
            const conversationHistory =
                await this.getConversationHistory(userId);

            const messages = [
                { role: "system", content: systemPrompt },
                ...conversationHistory,
                { role: "user", content: message },
            ];

            const deviceHash = await DeviceIdentityService.getDeviceHash();

            const { content: aiResponse, aiMessageCount } =
                await this.callCloudFunction("chatCompletion", {
                    messages,
                    deviceHash,
                    model: "gpt-4",
                    max_tokens: 800,
                    temperature: 0.7,
                    presence_penalty: 0.1,
                    frequency_penalty: 0.1,
                });

            if (typeof aiMessageCount === "number") {
                await MessageUsageService.applyServerCount(
                    userId,
                    aiMessageCount,
                );
            }

            await this.saveMessageToHistory(userId, message, aiResponse);
            return aiResponse;
        } catch (error) {
            if (error?.code === "free-limit-reached") {
                throw error;
            }
            logger.error("AI Service Error:", error);
            throw new Error("Failed to get AI response. Please try again.");
        }
    }

    async getConversationHistory(userId) {
        if (!userId) return [];

        try {
            const history = await AsyncStorage.getItem(
                `conversation_${userId}`,
            );
            return history ? JSON.parse(history) : [];
        } catch (error) {
            logger.error("Error loading conversation history:", error);
            return [];
        }
    }

    async saveMessageToHistory(userId, userMessage, aiResponse) {
        try {
            const history = await this.getConversationHistory(userId);
            const newHistory = [
                ...history.slice(-6),
                { role: "user", content: userMessage },
                { role: "assistant", content: aiResponse },
            ];
            await AsyncStorage.setItem(
                `conversation_${userId}`,
                JSON.stringify(newHistory),
            );
        } catch (error) {
            logger.error("Error saving conversation history:", error);
        }
    }

    async clearConversationHistory(userId) {
        try {
            await AsyncStorage.removeItem(`conversation_${userId}`);
        } catch (error) {
            logger.error("Error clearing conversation history:", error);
        }
    }

    async getVerseCategory(translation, reference) {
        try {
            const { content: label } = await this.callCloudFunction(
                "verseCategory",
                { translation, reference },
            );
            return label || "Quranic Wisdom";
        } catch (error) {
            logger.error("Verse category error:", error);
            return "Quranic Wisdom";
        }
    }
}

export const aiService = new AIService();
